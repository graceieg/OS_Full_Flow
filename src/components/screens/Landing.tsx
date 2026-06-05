import type { ScreenId } from '../../types';
import React, {
  useRef,
  useState,
  useEffect,
  useCallback,
} from 'react';
import './Landing.css';

/* ────────────────────────────────────────────────────────────────────────────
   Types
──────────────────────────────────────────────────────────────────────────── */
interface LandingProps {
  isActive: boolean;
  onNavigate: (screen: ScreenId) => void;
}

interface BlochState {
  theta: number;
  phi: number;
}

interface BlochEq {
  alpha: string;
  beta: string;
  p0: number;
  p1: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  a: number;
}

/* ────────────────────────────────────────────────────────────────────────────
   Constants
──────────────────────────────────────────────────────────────────────────── */
const BLOCH_R = 130;
const BLOCH_CX = 190;
const BLOCH_CY = 190;

function blochToXY(theta: number, phi: number): { lx: number; ly: number; tx: number; ty: number } {
  // Project the 3-D Bloch sphere tip onto our 2-D SVG canvas using a simple oblique projection
  const sinT = Math.sin(theta);
  const cosT = Math.cos(theta);
  const sinP = Math.sin(phi);
  const cosP = Math.cos(phi);

  // 3D position on unit sphere
  const sx = sinT * cosP;
  const sy = sinT * sinP;
  const sz = cosT;

  // Oblique projection: z goes up, x goes right, y has a foreshortening
  const px = sx * BLOCH_R;
  const py = -sz * BLOCH_R + sy * BLOCH_R * 0.35;

  return {
    lx: BLOCH_CX,
    ly: BLOCH_CY,
    tx: BLOCH_CX + px,
    ty: BLOCH_CY + py,
  };
}

function computeBlochEq(theta: number, phi: number): BlochEq {
  const cosHalf = Math.cos(theta / 2);
  const sinHalf = Math.sin(theta / 2);
  const p0 = Math.round(cosHalf * cosHalf * 100);
  const p1 = 100 - p0;
  const alphaSign = cosHalf >= 0 ? '' : '-';
  return {
    alpha: `${alphaSign}${Math.abs(cosHalf).toFixed(3)}`,
    beta: `e^{i${phi.toFixed(2)}}·${Math.abs(sinHalf).toFixed(3)}`,
    p0: p0 / 100,
    p1: p1 / 100,
  };
}

/* ────────────────────────────────────────────────────────────────────────────
   Component
──────────────────────────────────────────────────────────────────────────── */
export function Landing({ isActive, onNavigate }: LandingProps) {
  /* ── refs ─────────────────────────────────────────────────────────────── */
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cursorDotRef = useRef<HTMLDivElement>(null);
  const cursorRingRef = useRef<HTMLDivElement>(null);
  const waveformPathRef = useRef<SVGPathElement>(null);
  const waveformFillRef = useRef<SVGPathElement>(null);
  const blochLineRef = useRef<SVGLineElement>(null);
  const blochTipRef = useRef<SVGCircleElement>(null);
  const blochGlowRef = useRef<SVGCircleElement>(null);
  const scrollProgressRef = useRef<HTMLDivElement>(null);
  const toTopRef = useRef<HTMLButtonElement>(null);
  const ringFillRef = useRef<SVGCircleElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const footerTimeRef = useRef<HTMLSpanElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  /* ── state ────────────────────────────────────────────────────────────── */
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const [blochState, setBlochState] = useState<BlochState>({ theta: 0, phi: 0 });
  const [blochEq, setBlochEq] = useState<BlochEq>(computeBlochEq(0, 0));
  const [countersTriggered] = useState<Set<string>>(new Set<string>());

  /* ── helpers ──────────────────────────────────────────────────────────── */
  const updateBloch = useCallback((theta: number, phi: number) => {
    const { lx, ly, tx, ty } = blochToXY(theta, phi);
    if (blochLineRef.current) {
      blochLineRef.current.setAttribute('x1', String(lx));
      blochLineRef.current.setAttribute('y1', String(ly));
      blochLineRef.current.setAttribute('x2', String(tx));
      blochLineRef.current.setAttribute('y2', String(ty));
    }
    if (blochTipRef.current) {
      blochTipRef.current.setAttribute('cx', String(tx));
      blochTipRef.current.setAttribute('cy', String(ty));
    }
    if (blochGlowRef.current) {
      blochGlowRef.current.setAttribute('cx', String(tx));
      blochGlowRef.current.setAttribute('cy', String(ty));
    }
    setBlochEq(computeBlochEq(theta, phi));
    setBlochState({ theta, phi });
  }, []);

  /* ── cursor effect ────────────────────────────────────────────────────── */
  useEffect(() => {
    if (!isActive) return;
    const isTouchDevice = () =>
      'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (isTouchDevice()) return;

    const dot = cursorDotRef.current;
    const ring = cursorRingRef.current;
    if (!dot || !ring) return;

    let rx = 0, ry = 0;
    let mx = 0, my = 0;
    let rafId: number;

    const onMove = (e: MouseEvent) => {
      mx = e.clientX;
      my = e.clientY;
      dot.style.left = mx + 'px';
      dot.style.top = my + 'px';
    };

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const tick = () => {
      rx = lerp(rx, mx, 0.14);
      ry = lerp(ry, my, 0.14);
      ring.style.left = rx + 'px';
      ring.style.top = ry + 'px';
      rafId = requestAnimationFrame(tick);
    };
    tick();
    window.addEventListener('mousemove', onMove);
    return () => {
      window.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(rafId);
    };
  }, [isActive]);

  /* ── particle canvas ──────────────────────────────────────────────────── */
  useEffect(() => {
    if (!isActive) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId: number;
    let mouseX = -9999, mouseY = -9999;
    const particles: Particle[] = [];
    const NUM = 90;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const onMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };
    window.addEventListener('mousemove', onMouseMove);

    for (let i = 0; i < NUM; i++) {
      particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        r: Math.random() * 1.5 + 0.5,
        a: Math.random() * 0.5 + 0.2,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const p of particles) {
        // Attraction toward mouse
        const dx = mouseX - p.x;
        const dy = mouseY - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 200) {
          p.vx += (dx / dist) * 0.012;
          p.vy += (dy / dist) * 0.012;
        }

        // Damping
        p.vx *= 0.99;
        p.vy *= 0.99;

        p.x += p.vx;
        p.y += p.vy;

        // Wrap
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(217,160,102,${p.a * 0.6})`;
        ctx.fill();
      }

      // Connection lines
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i];
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 150) {
            const alpha = (1 - d / 150) * 0.25;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(217,160,102,${alpha})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }

      rafId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouseMove);
    };
  }, [isActive]);

  /* ── NMR waveform animation ───────────────────────────────────────────── */
  useEffect(() => {
    if (!isActive) return;
    const pathEl = waveformPathRef.current;
    const fillEl = waveformFillRef.current;
    if (!pathEl || !fillEl) return;

    let rafId: number;
    let t = 0;
    const W = 220;
    const H = 80;
    const CY = H / 2;

    const buildPath = (offset: number) => {
      const pts: string[] = [];
      const POINTS = 120;
      for (let i = 0; i <= POINTS; i++) {
        const x = (i / POINTS) * W;
        const xNorm = (i / POINTS) * 2 - 1;
        const g1 = Math.exp(-((xNorm - 0.2) ** 2) / 0.05) * Math.sin((i / POINTS) * 40 + offset);
        const g2 = Math.exp(-((xNorm + 0.3) ** 2) / 0.08) * Math.sin((i / POINTS) * 40 + offset + 2) * 0.6;
        const g3 = Math.exp(-((xNorm) ** 2) / 0.03) * Math.sin((i / POINTS) * 60 + offset) * 0.4;
        const y = CY - (g1 + g2 + g3) * 28;
        pts.push(i === 0 ? `M ${x.toFixed(1)},${y.toFixed(1)}` : `L ${x.toFixed(1)},${y.toFixed(1)}`);
      }
      return pts.join(' ');
    };

    const animate = () => {
      t += 0.025;
      const d = buildPath(t);
      pathEl.setAttribute('d', d);
      fillEl.setAttribute('d', d + ` L ${W},${CY} L 0,${CY} Z`);
      rafId = requestAnimationFrame(animate);
    };
    animate();

    return () => cancelAnimationFrame(rafId);
  }, [isActive]);

  /* ── scroll effects (progress bar, to-top, timeline) ─────────────────── */
  useEffect(() => {
    if (!isActive) return;
    const root = rootRef.current;
    if (!root) return;

    const circumference = 2 * Math.PI * 22;

    const onScroll = () => {
      const scrollTop = root.scrollTop;
      const scrollHeight = root.scrollHeight - root.clientHeight;
      const progress = scrollHeight > 0 ? scrollTop / scrollHeight : 0;

      if (scrollProgressRef.current) {
        scrollProgressRef.current.style.width = (progress * 100).toFixed(1) + '%';
      }

      // Scroll to top button
      const toTop = toTopRef.current;
      if (toTop) {
        if (scrollTop > 400) {
          toTop.classList.add('visible');
        } else {
          toTop.classList.remove('visible');
        }
      }

      // Ring fill
      if (ringFillRef.current) {
        const offset = circumference * (1 - progress);
        ringFillRef.current.style.strokeDashoffset = offset.toFixed(2);
      }

      // Timeline progress
      if (timelineRef.current) {
        const rect = timelineRef.current.getBoundingClientRect();
        const vh = window.innerHeight;
        const ratio = Math.min(1, Math.max(0, (vh - rect.top) / (rect.height + vh * 0.4)));
        timelineRef.current.style.setProperty('--timeline-progress', String(ratio * 100));
      }
    };

    root.addEventListener('scroll', onScroll, { passive: true });
    return () => root.removeEventListener('scroll', onScroll);
  }, [isActive]);

  /* ── IntersectionObserver reveals ────────────────────────────────────── */
  useEffect(() => {
    if (!isActive) return;
    const root = rootRef.current;
    if (!root) return;

    const targets = root.querySelectorAll('.reveal');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
          }
        });
      },
      { threshold: 0.12, root }
    );

    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [isActive]);

  /* ── Animated counters ────────────────────────────────────────────────── */
  useEffect(() => {
    if (!isActive) return;
    const root = rootRef.current;
    if (!root) return;

    const counterEls = root.querySelectorAll<HTMLElement>('[data-counter]');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target as HTMLElement;
          const id = el.dataset.counter as string;
          if (countersTriggered.has(id)) return;
          countersTriggered.add(id);

          const target = parseFloat(el.dataset.target || '0');
          const suffix = el.dataset.suffix || '';
          const decimals = el.dataset.decimals ? parseInt(el.dataset.decimals) : 0;
          const duration = 1400;
          const start = performance.now();

          const step = (now: number) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const val = eased * target;
            el.textContent = val.toFixed(decimals) + suffix;
            if (progress < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
          observer.unobserve(el);
        });
      },
      { threshold: 0.5, root }
    );

    counterEls.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [isActive, countersTriggered]);

  /* ── Bloch sphere drag ────────────────────────────────────────────────── */
  useEffect(() => {
    if (!isActive) return;
    const svgWrap = document.getElementById('l-bloch-svg-wrap');
    if (!svgWrap) return;

    let dragging = false;

    const getAngles = (clientX: number, clientY: number) => {
      const rect = svgWrap.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = clientX - cx;
      const dy = clientY - cy;
      const phi = Math.atan2(dy, dx);
      const radius = Math.sqrt(dx * dx + dy * dy);
      const maxR = Math.min(rect.width, rect.height) / 2;
      const theta = Math.min((radius / maxR) * Math.PI, Math.PI);
      return { theta, phi };
    };

    const onDown = (e: MouseEvent) => {
      dragging = true;
      const { theta, phi } = getAngles(e.clientX, e.clientY);
      updateBloch(theta, phi);
    };

    const onMove = (e: MouseEvent) => {
      if (!dragging) return;
      const { theta, phi } = getAngles(e.clientX, e.clientY);
      updateBloch(theta, phi);
    };

    const onUp = () => { dragging = false; };

    const onTouchStart = (e: TouchEvent) => {
      dragging = true;
      const t = e.touches[0];
      const { theta, phi } = getAngles(t.clientX, t.clientY);
      updateBloch(theta, phi);
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!dragging) return;
      const t = e.touches[0];
      const { theta, phi } = getAngles(t.clientX, t.clientY);
      updateBloch(theta, phi);
    };

    svgWrap.addEventListener('mousedown', onDown);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    svgWrap.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onUp);

    return () => {
      svgWrap.removeEventListener('mousedown', onDown);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      svgWrap.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onUp);
    };
  }, [isActive, updateBloch]);

  /* ── Footer live time ─────────────────────────────────────────────────── */
  useEffect(() => {
    if (!isActive) return;
    const tick = () => {
      const el = footerTimeRef.current;
      if (!el) return;
      const now = new Date();
      const pt = now.toLocaleTimeString('en-US', {
        timeZone: 'America/Los_Angeles',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      });
      const parts = pt.split(':');
      el.innerHTML =
        parts[0] +
        '<span class="l-footer-time-sep">:</span>' +
        parts[1] +
        '<span class="l-footer-time-sep">:</span>' +
        parts[2];
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [isActive]);

  /* ── Scroll to top handler ────────────────────────────────────────────── */
  const handleScrollTop = useCallback(() => {
    rootRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  /* ── Hero word scroll ─────────────────────────────────────────────────── */
  const handleScrollToDevice = useCallback(() => {
    const el = document.getElementById('l-device');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }, []);

  /* ─────────────────────────────────────────────────────────────────────────
     Early return
  ─────────────────────────────────────────────────────────────────────────── */
  if (!isActive) return null;

  const circumference = 2 * Math.PI * 22;

  /* ────────────────────────────────────────────────────────────────────────
     Render
  ──────────────────────────────────────────────────────────────────────── */
  return (
    <div className="landing-screen" ref={rootRef}>
      {/* ── Background layers ───────────────────────────────────────────── */}
      <canvas ref={canvasRef} className="l-bg-canvas" />
      <div className="l-bg-gradient" />
      <div className="l-bg-grain" />
      <div className="l-bg-vignette" />
      <div className="l-bg-grid" />

      {/* ── Custom cursor ───────────────────────────────────────────────── */}
      <div className="l-cursor-dot" ref={cursorDotRef} />
      <div className="l-cursor-ring" ref={cursorRingRef} />

      {/* ── Scroll progress bar ─────────────────────────────────────────── */}
      <div className="l-scroll-progress" ref={scrollProgressRef} />

      {/* ── Content ─────────────────────────────────────────────────────── */}
      <div className="l-content">

        {/* ── Nav ─────────────────────────────────────────────────────── */}
        <nav className="l-nav">
          <a href="#l-hero" className="l-nav-logo">
            {/* Katmai logo: triangle with ellipse orbit */}
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
              <ellipse cx="14" cy="14" rx="13" ry="6" stroke="#d9a066" strokeWidth="1.2" fill="none" transform="rotate(-25 14 14)" />
              <polygon points="14,5 22,21 6,21" fill="#d9a066" opacity="0.9" />
              <circle cx="14" cy="14" r="2.5" fill="#e8b478" />
            </svg>
            Katmai Computing
          </a>

          <ul className="l-nav-links">
            <li><a href="#l-device">Device</a></li>
            <li><a href="#l-demo">Demo</a></li>
            <li><a href="#l-specs">Specs</a></li>
            <li><a href="#l-timeline">Timeline</a></li>
            <li><a href="#l-faq">FAQ</a></li>
          </ul>

          <button className="l-nav-cta" onClick={() => onNavigate('signup')}>
            <span className="l-pulse-dot" />
            Demo Now
          </button>
        </nav>

        {/* ── Hero ──────────────────────────────────────────────────────── */}
        <section className="l-hero" id="l-hero">
          <div className="l-hero-badge">
            <span className="l-hero-badge-dot" />
            Revealing v1 · Fall 2026
          </div>

          <h1 className="l-hero-h1">
            {['Quantum', 'computing'].map((w, i) => (
              <span
                key={w}
                className="l-hero-word"
                style={{ animationDelay: `${0.2 + i * 0.12}s`, marginRight: '0.25em' }}
              >
                {w}
              </span>
            ))}
            <br />
            {['you', 'can'].map((w, i) => (
              <span
                key={w}
                className="l-hero-word l-hero-word-italic"
                style={{ animationDelay: `${0.44 + i * 0.12}s`, marginRight: '0.25em' }}
              >
                {w}
              </span>
            ))}
            <span
              className="l-hero-word l-hero-word-italic"
              style={{ animationDelay: '0.68s' }}
            >
              hold.
            </span>
          </h1>

          <p className="l-hero-sub">
            Katmai 01 brings 400 MHz NMR quantum computing to a device small enough to carry.
            Real qubits. Real experiments. No cryostat required.
          </p>

          <div className="l-hero-actions">
            <button className="l-btn-primary" onClick={() => onNavigate('signup')}>
              Demo Now
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button className="l-btn-secondary" onClick={handleScrollToDevice}>
              Explore the Device
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 3v10M4 9l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>

          <div className="l-hero-meta">
            {[
              { val: '8', label: 'Qubits' },
              { val: '400 MHz', label: 'NMR' },
              { val: '<2s', label: 'Cold Start' },
              { val: '∞', label: 'Curiosity' },
            ].map((s) => (
              <div className="l-hero-stat" key={s.label}>
                <span className="l-hero-stat-val">{s.val}</span>
                <span className="l-hero-stat-label">{s.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── Device mockup ─────────────────────────────────────────────── */}
        <div className="l-device-section" id="l-device">
          {/* Annotations left */}
          <div className="l-device-annotations" style={{ position: 'relative' }}>
            {[
              { label: '4.3" OLED', top: '60px' },
              { label: 'NMR Transceiver', top: '180px' },
              { label: 'Hot-Swap Port', top: '300px' },
              { label: 'Haptic Dials', top: '400px' },
            ].map((ann) => (
              <div
                key={ann.label}
                className="l-annotation"
                style={{ position: 'absolute', top: ann.top, right: 0 }}
              >
                <span className="l-annotation-text">{ann.label}</span>
                <span className="l-annotation-line" style={{ background: 'linear-gradient(90deg, var(--l-border-hi), transparent)' }} />
                <span className="l-annotation-dot" />
              </div>
            ))}
          </div>

          {/* Device frame */}
          <div className="l-device-wrap reveal in-view">
            <div className="l-device-frame">
              <div className="l-device-screen">
                <div className="l-device-nmr-label">NMR Signal</div>
                <svg
                  className="l-device-waveform"
                  viewBox="0 0 220 80"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    <linearGradient id="wfGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#7fd1d6" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#7fd1d6" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path ref={waveformFillRef} fill="url(#wfGrad)" />
                  <path
                    ref={waveformPathRef}
                    fill="none"
                    stroke="#7fd1d6"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <div className="l-device-freq">
                  400.12 <span>MHz</span>
                </div>
                <div className="l-device-dials">
                  <div className="l-dial" title="Frequency" />
                  <div className="l-dial" title="Gain" />
                  <div className="l-dial" title="Phase" />
                  <div className="l-dial" title="Pulse" />
                </div>
              </div>
              <div className="l-device-shine" />
            </div>
          </div>

          {/* Annotations right */}
          <div className="l-device-annotations" style={{ position: 'relative' }}>
            {[
              { label: '8-Qubit Register', top: '60px' },
              { label: 'Thermal Shielding', top: '180px' },
              { label: 'USB-C · Fast Charge', top: '300px' },
              { label: 'KatmaiOS Display', top: '400px' },
            ].map((ann) => (
              <div
                key={ann.label}
                className="l-annotation"
                style={{ position: 'absolute', top: ann.top, left: 0 }}
              >
                <span className="l-annotation-dot" />
                <span className="l-annotation-line" style={{ background: 'linear-gradient(90deg, transparent, var(--l-border-hi))' }} />
                <span className="l-annotation-text">{ann.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Bento grid ────────────────────────────────────────────────── */}
        <section className="l-section" id="l-features">
          <div className="l-section-label">Features</div>
          <h2 className="l-section-title reveal">Everything you need.<br />Nothing you don't.</h2>
          <p className="l-section-sub reveal">
            Katmai 01 integrates everything into one elegant device — from hardware qubits to the KatmaiOS interface.
          </p>

          <div className="l-bento-grid reveal-stagger">
            {/* b-lg: Hot-Swap */}
            <div className="l-bento-card b-lg reveal">
              <div className="l-bento-icon">
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                  <path d="M11 2v4M11 16v4M2 11h4M16 11h4" stroke="#d9a066" strokeWidth="1.8" strokeLinecap="round" />
                  <circle cx="11" cy="11" r="4" stroke="#d9a066" strokeWidth="1.8" />
                </svg>
              </div>
              <h3 className="l-bento-title">Hot-Swap NMR Features</h3>
              <p className="l-bento-body">
                Swap NMR sample modules in seconds without powering down. Each module is pre-calibrated and plug-and-play — hydrogen, carbon, phosphorus, and more.
              </p>
              <span className="l-bento-accent">8 +</span>
              <p className="l-bento-body" style={{ marginTop: 4 }}>pre-loaded sample types</p>
            </div>

            {/* b-md: Lightning */}
            <div className="l-bento-card b-md reveal">
              <div className="l-bento-icon">
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                  <path d="M13 2L5 13h7l-3 7 10-11h-7l3-7z" fill="#d9a066" opacity="0.9" />
                </svg>
              </div>
              <h3 className="l-bento-title">Lightning-Fast Processing</h3>
              <p className="l-bento-body">
                Onboard FPGA-accelerated signal processing delivers results in milliseconds. No cloud round-trip required.
              </p>
            </div>

            {/* b-sm: KatmaiOS */}
            <div className="l-bento-card b-sm reveal">
              <div className="l-bento-icon">
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                  <rect x="3" y="3" width="16" height="16" rx="4" stroke="#d9a066" strokeWidth="1.8" />
                  <path d="M8 11l2 2 4-4" stroke="#d9a066" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h3 className="l-bento-title">KatmaiOS</h3>
              <p className="l-bento-body">A purpose-built OS with visual circuit composer and live spectrum view.</p>
            </div>

            {/* b-sm: Quantum Info */}
            <div className="l-bento-card b-sm reveal">
              <div className="l-bento-icon">
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                  <circle cx="11" cy="11" r="8" stroke="#d9a066" strokeWidth="1.8" />
                  <path d="M11 7v5l3 2" stroke="#d9a066" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </div>
              <h3 className="l-bento-title">Clean Quantum Info</h3>
              <p className="l-bento-body">Real-time Bloch sphere visualisation for every qubit, live on the OLED.</p>
            </div>

            {/* b-sm: Spectroscopy */}
            <div className="l-bento-card b-sm reveal">
              <div className="l-bento-icon">
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                  <path d="M2 16 Q5 6 8 12 Q11 18 14 8 Q17 2 20 14" stroke="#d9a066" strokeWidth="1.8" fill="none" strokeLinecap="round" />
                </svg>
              </div>
              <h3 className="l-bento-title">Spectroscopy Presets</h3>
              <p className="l-bento-body">40+ built-in pulse sequences from COSY to HSQC, one tap away.</p>
            </div>

            {/* b-sm: Portable Power */}
            <div className="l-bento-card b-sm reveal">
              <div className="l-bento-icon">
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                  <rect x="3" y="7" width="14" height="9" rx="2" stroke="#d9a066" strokeWidth="1.8" />
                  <path d="M17 10h2v3h-2" stroke="#d9a066" strokeWidth="1.8" strokeLinecap="round" />
                  <path d="M7 11h8" stroke="#d9a066" strokeWidth="1.4" strokeLinecap="round" opacity="0.6" />
                </svg>
              </div>
              <h3 className="l-bento-title">Portable Power</h3>
              <p className="l-bento-body">12-hour battery with USB-C PD fast charging. Field-ready.</p>
            </div>
          </div>
        </section>

        {/* ── Bloch sphere demo ─────────────────────────────────────────── */}
        <section className="l-section" id="l-demo">
          <div className="l-section-label">Interactive Demo</div>
          <h2 className="l-section-title reveal">Touch the quantum.</h2>
          <p className="l-section-sub reveal">
            Drag the Bloch sphere to explore qubit states. Watch the state equation and probability update in real time.
          </p>

          <div className="l-demo-wrap">
            {/* Bloch sphere SVG */}
            <div className="l-bloch-svg-wrap" id="l-bloch-svg-wrap">
              <svg
                className="l-bloch-svg"
                viewBox="0 0 380 380"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <radialGradient id="blochGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#7fd1d6" stopOpacity="0.18" />
                    <stop offset="100%" stopColor="#7fd1d6" stopOpacity="0" />
                  </radialGradient>
                </defs>

                {/* Outer glow */}
                <circle cx="190" cy="190" r="150" fill="url(#blochGlow)" />

                {/* Sphere outline */}
                <circle cx="190" cy="190" r="130" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="1" />

                {/* Latitude rings */}
                {[0.25, 0.5, 0.75].map((t) => {
                  const r = Math.sin(t * Math.PI) * 130;
                  const cy = 190 - Math.cos(t * Math.PI) * 130;
                  return (
                    <ellipse
                      key={t}
                      cx="190"
                      cy={cy}
                      rx={r}
                      ry={r * 0.35}
                      fill="none"
                      stroke="rgba(255,255,255,0.05)"
                      strokeWidth="1"
                    />
                  );
                })}

                {/* Equator */}
                <ellipse cx="190" cy="190" rx="130" ry="45" fill="none" stroke="rgba(127,209,214,0.15)" strokeWidth="1" />

                {/* Axes */}
                <line x1="190" y1="60" x2="190" y2="320" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                <line x1="60" y1="190" x2="320" y2="190" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />

                {/* Axis labels */}
                <text x="190" y="50" textAnchor="middle" fill="#eef0f3" fontSize="13" fontFamily="Inter Tight, sans-serif" fontWeight="600">|0⟩</text>
                <text x="190" y="336" textAnchor="middle" fill="#eef0f3" fontSize="13" fontFamily="Inter Tight, sans-serif" fontWeight="600">|1⟩</text>
                <text x="326" y="194" fill="rgba(127,209,214,0.7)" fontSize="12" fontFamily="Inter Tight, sans-serif">|+⟩</text>
                <text x="46" y="194" textAnchor="end" fill="rgba(127,209,214,0.7)" fontSize="12" fontFamily="Inter Tight, sans-serif">|−⟩</text>

                {/* State vector glow */}
                <circle
                  ref={blochGlowRef}
                  cx={BLOCH_CX}
                  cy={BLOCH_CY - BLOCH_R}
                  r="20"
                  fill="rgba(217,160,102,0.12)"
                />

                {/* State vector line */}
                <line
                  ref={blochLineRef}
                  x1={BLOCH_CX}
                  y1={BLOCH_CY}
                  x2={BLOCH_CX}
                  y2={BLOCH_CY - BLOCH_R}
                  stroke="#d9a066"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />

                {/* State vector tip */}
                <circle
                  ref={blochTipRef}
                  cx={BLOCH_CX}
                  cy={BLOCH_CY - BLOCH_R}
                  r="6"
                  fill="#d9a066"
                />

                {/* Center dot */}
                <circle cx="190" cy="190" r="3" fill="rgba(255,255,255,0.4)" />
              </svg>
            </div>

            {/* Controls */}
            <div className="l-bloch-controls">
              <div>
                <p style={{ fontSize: '0.8rem', color: 'var(--l-text-faint)', marginBottom: 12, marginTop: 0 }}>
                  Preset states
                </p>
                <div className="l-bloch-state-btns">
                  {[
                    { label: '|0⟩', theta: 0, phi: 0 },
                    { label: '|1⟩', theta: Math.PI, phi: 0 },
                    { label: '|+⟩', theta: Math.PI / 2, phi: 0 },
                    { label: '|−⟩', theta: Math.PI / 2, phi: Math.PI },
                    { label: '|i⟩', theta: Math.PI / 2, phi: Math.PI / 2 },
                    { label: 'Randomize', theta: -1, phi: -1 },
                  ].map((s) => (
                    <button
                      key={s.label}
                      className="l-bloch-btn"
                      onClick={() => {
                        const t = s.theta < 0 ? Math.random() * Math.PI : s.theta;
                        const p = s.phi < 0 ? Math.random() * 2 * Math.PI : s.phi;
                        updateBloch(t, p);
                      }}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Equation display */}
              <div className="l-bloch-eq">
                <span>|ψ⟩ = </span>
                <span className="l-bloch-eq-alpha">{blochEq.alpha}</span>
                <span> |0⟩ </span>
                <span style={{ color: 'var(--l-text-dim)' }}>
                  {parseFloat(blochEq.beta.split('·')[1]) >= 0 ? '+ ' : ''}
                </span>
                <span className="l-bloch-eq-beta">{blochEq.beta}</span>
                <span> |1⟩</span>
                <br />
                <span style={{ fontSize: '0.8rem', color: 'var(--l-text-faint)' }}>
                  θ = {(blochState.theta * 180 / Math.PI).toFixed(1)}°&nbsp;&nbsp;
                  φ = {(blochState.phi * 180 / Math.PI).toFixed(1)}°
                </span>
              </div>

              {/* Probability bars */}
              <div className="l-bloch-probs">
                <p style={{ fontSize: '0.8rem', color: 'var(--l-text-faint)', margin: '0 0 10px' }}>
                  Measurement probability
                </p>
                <div className="l-prob-row">
                  <span className="l-prob-label">P(|0⟩)</span>
                  <div className="l-prob-bar-track">
                    <div
                      className="l-prob-bar-fill p0"
                      style={{ width: `${blochEq.p0 * 100}%` }}
                    />
                  </div>
                  <span className="l-prob-val">{(blochEq.p0 * 100).toFixed(0)}%</span>
                </div>
                <div className="l-prob-row">
                  <span className="l-prob-label">P(|1⟩)</span>
                  <div className="l-prob-bar-track">
                    <div
                      className="l-prob-bar-fill p1"
                      style={{ width: `${blochEq.p1 * 100}%` }}
                    />
                  </div>
                  <span className="l-prob-val">{(blochEq.p1 * 100).toFixed(0)}%</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Specs terminal ────────────────────────────────────────────── */}
        <section className="l-section" id="l-specs">
          <div className="l-section-label">Specifications</div>
          <h2 className="l-section-title reveal">Built to spec.</h2>

          <div className="l-specs-wrap">
            <div className="l-terminal reveal">
              <div className="l-term-titlebar">
                <div className="l-term-dot red" />
                <div className="l-term-dot yellow" />
                <div className="l-term-dot green" />
                <span className="l-term-title">katmai — device-info</span>
              </div>
              <div className="l-term-body">
                <div><span className="l-term-prompt">$ </span><span className="l-term-cmd">katmai device info</span></div>
                <div><span className="l-term-comment"># ─── Katmai 01 ───────────────────────────</span></div>
                <div><span className="l-term-key">Model</span>        <span className="l-term-val">Katmai-01-A</span></div>
                <div><span className="l-term-key">CPU</span>          <span className="l-term-val">ARM Cortex-A72 + FPGA</span></div>
                <div><span className="l-term-key">NMR Freq</span>     <span className="l-term-val">400 MHz ¹H</span></div>
                <div><span className="l-term-key">Qubits</span>       <span className="l-term-val">8 (liquid-state NMR)</span></div>
                <div><span className="l-term-key">Display</span>      <span className="l-term-val">4.3" AMOLED 720×1280</span></div>
                <div><span className="l-term-key">Magnet</span>       <span className="l-term-val">9.4 T Halbach array</span></div>
                <div><span className="l-term-key">Homogeneity</span>  <span className="l-term-val">0.05 ppm linewidth</span></div>
                <div><span className="l-term-key">SNR</span>          <span className="l-term-val">142 : 1</span></div>
                <div><span className="l-term-key">Cold Start</span>   <span className="l-term-val">1.8 s</span></div>
                <div><span className="l-term-key">Temp Range</span>   <span className="l-term-val">-10°C to 45°C</span></div>
                <div><span className="l-term-key">Battery</span>      <span className="l-term-val">12 h · USB-C PD 65W</span></div>
                <div><span className="l-term-key">OS</span>           <span className="l-term-val">KatmaiOS 1.0</span></div>
                <div><span className="l-term-key">Weight</span>       <span className="l-term-val">1.4 kg</span></div>
                <div><span className="l-term-comment"># ─────────────────────────────────────────</span></div>
                <div><span className="l-term-prompt">$ </span><span className="l-term-cmd" style={{ animation: 'l-blink 1s step-start infinite' }}>▊</span></div>
              </div>
            </div>

            <div className="l-spec-cells reveal-stagger">
              {[
                { id: 'ppm', val: 0.05, suffix: ' ppm', label: 'Field Homogeneity', decimals: 2 },
                { id: 'snr', val: 142, suffix: ':1', label: 'Signal-to-Noise Ratio', decimals: 0 },
                { id: 'boot', val: 1.8, suffix: 's', label: 'Cold Start Time', decimals: 1 },
                { id: 'temp', val: 45, suffix: '°C', label: 'Max Operating Temp', decimals: 0 },
              ].map((s) => (
                <div className="l-spec-cell reveal" key={s.id}>
                  <span
                    className="l-spec-cell-val"
                    data-counter={s.id}
                    data-target={s.val}
                    data-suffix={s.suffix}
                    data-decimals={s.decimals}
                  >
                    0{s.suffix}
                  </span>
                  <span className="l-spec-cell-label">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Credentials ───────────────────────────────────────────────── */}
        <div className="l-creds-section reveal">
          <p className="l-creds-label">Built with &amp; backed by</p>
          <div className="l-creds-logos">
            {[
              'Harvard Innovation Labs',
              'MIT Physics',
              'Stanford Quantum',
              'Caltech IQIM',
            ].map((c) => (
              <span className="l-cred-item" key={c}>{c}</span>
            ))}
          </div>
        </div>

        {/* ── Marquee ───────────────────────────────────────────────────── */}
        <div className="l-marquee-section">
          <div className="l-marquee-track">
            {/* Two copies for seamless loop */}
            {[...Array(2)].map((_, outer) => (
              <React.Fragment key={outer}>
                {[
                  { source: 'Nature', quote: '"A landmark in portable quantum hardware"' },
                  { source: 'MIT Tech Review', quote: '"The iPhone moment for quantum computing"' },
                  { source: 'Wired', quote: '"Katmai makes quantum tangible"' },
                  { source: 'Physics Today', quote: '"Unmatched field homogeneity in a handheld form"' },
                  { source: 'IEEE Spectrum', quote: '"Redefines what is possible outside the lab"' },
                  { source: 'Science', quote: '"Opens NMR to a generation of students"' },
                ].map((item, i) => (
                  <span className="l-marquee-item" key={`${outer}-${i}`}>
                    <em>{item.source}</em>
                    <span className="l-marquee-sep">—</span>
                    {item.quote}
                    <span className="l-marquee-sep" style={{ marginLeft: 20 }}>✦</span>
                  </span>
                ))}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* ── Personas ──────────────────────────────────────────────────── */}
        <section className="l-section">
          <div className="l-section-label">Who It's For</div>
          <h2 className="l-section-title reveal">Quantum for everyone.</h2>

          <div className="l-personas-grid reveal-stagger">
            {[
              {
                name: 'Students',
                body: 'Run real quantum experiments from your desk or your dorm. Build intuition that textbooks can\'t give you.',
                tags: ['Undergrad', 'Graduate', 'Self-Taught'],
                initials: 'S',
                icon: (
                  <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
                    <path d="M13 3L3 8l10 5 10-5-10-5z" stroke="#d9a066" strokeWidth="1.8" strokeLinejoin="round" />
                    <path d="M3 8v7c0 3 4 5 10 5s10-2 10-5V8" stroke="#d9a066" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                ),
              },
              {
                name: 'Researchers',
                body: 'Take your NMR workflows anywhere. Full Python SDK, raw data export, and publishable-quality spectra.',
                tags: ['Chemistry', 'Physics', 'Biology', 'Materials Science'],
                initials: 'R',
                icon: (
                  <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
                    <path d="M9 3v8L4 21h18L17 11V3" stroke="#d9a066" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M9 3h8" stroke="#d9a066" strokeWidth="1.8" strokeLinecap="round" />
                    <circle cx="13" cy="16" r="2" stroke="#d9a066" strokeWidth="1.4" />
                  </svg>
                ),
              },
              {
                name: 'Educators',
                body: 'Bring quantum mechanics off the whiteboard and into students\' hands with live, interactive demonstrations.',
                tags: ['High School', 'University', 'Outreach'],
                initials: 'E',
                icon: (
                  <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
                    <rect x="3" y="4" width="20" height="14" rx="2" stroke="#d9a066" strokeWidth="1.8" />
                    <path d="M9 22h8M13 18v4" stroke="#d9a066" strokeWidth="1.8" strokeLinecap="round" />
                    <path d="M8 10l2 2 5-5" stroke="#d9a066" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ),
              },
            ].map((p) => (
              <div className="l-persona-card reveal" key={p.name}>
                <svg className="l-persona-corner" width="120" height="120" viewBox="0 0 120 120">
                  <circle cx="120" cy="0" r="80" fill="none" stroke="#d9a066" strokeWidth="1" />
                  <circle cx="120" cy="0" r="50" fill="none" stroke="#d9a066" strokeWidth="0.5" />
                </svg>
                <div className="l-persona-icon">{p.icon}</div>
                <h3 className="l-persona-name">{p.name}</h3>
                <p className="l-persona-body">{p.body}</p>
                <div className="l-persona-tags">
                  {p.tags.map((t) => (
                    <span className="l-persona-tag" key={t}>{t}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Comparison table ──────────────────────────────────────────── */}
        <section className="l-section">
          <div className="l-section-label">Comparison</div>
          <h2 className="l-section-title reveal">How we stack up.</h2>

          <div className="l-compare-wrap reveal">
            <table className="l-compare-table">
              <thead>
                <tr>
                  <th></th>
                  <th>Benchtop NMR</th>
                  <th className="highlight">Katmai 01</th>
                  <th>Mainframe Quantum</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { row: 'Weight', a: '~200 kg', k: '1.4 kg', b: '~5,000 kg' },
                  { row: 'Price', a: '$800K+', k: 'TBA', b: '$15M+' },
                  { row: 'Setup Time', a: '6–12 months', k: '<2 seconds', b: '12–24 months' },
                  { row: 'Works In The Field', a: false, k: true, b: false },
                  { row: 'For Students', a: false, k: true, b: false },
                  { row: 'Cold-Start Required', a: true, k: false, b: true },
                ].map((r) => (
                  <tr key={r.row}>
                    <td>{r.row}</td>
                    <td>{typeof r.a === 'boolean' ? (r.a ? <span className="l-compare-check">✓</span> : <span className="l-compare-cross">✗</span>) : r.a}</td>
                    <td className="highlight">{typeof r.k === 'boolean' ? (r.k ? <span className="l-compare-check">✓</span> : <span className="l-compare-cross">✗</span>) : r.k}</td>
                    <td>{typeof r.b === 'boolean' ? (r.b ? <span className="l-compare-check">✓</span> : <span className="l-compare-cross">✗</span>) : r.b}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── Testimonials ──────────────────────────────────────────────── */}
        <section className="l-section">
          <div className="l-section-label">What People Are Saying</div>
          <h2 className="l-section-title reveal">Trusted by experts.</h2>

          <div className="l-testimonials-grid reveal-stagger">
            {[
              {
                quote: 'I ran my first COSY experiment on a Sunday afternoon from my apartment. The field homogeneity is genuinely impressive for a portable device.',
                name: 'Dr. Elena Martinez',
                title: 'Structural Chemist · Brown University',
                initials: 'EM',
              },
              {
                quote: 'We used Katmai in our undergraduate quantum mechanics course. Students finally understand superposition because they can feel it in the hardware.',
                name: 'Prof. Kenji Tanaka',
                title: 'Quantum Physics · UC Berkeley',
                initials: 'KT',
              },
              {
                quote: 'The Python SDK is clean and well-documented. I integrated it with our existing analysis pipeline in under an hour.',
                name: 'Dr. Amara Okonkwo',
                title: 'Computational Chemistry · ETH Zürich',
                initials: 'AO',
              },
            ].map((t) => (
              <div className="l-testimonial-card reveal" key={t.name}>
                <span className="l-testimonial-quote">"</span>
                <p className="l-testimonial-body">{t.quote}</p>
                <div className="l-testimonial-author">
                  <div className="l-testimonial-avatar">{t.initials}</div>
                  <div>
                    <div className="l-testimonial-name">{t.name}</div>
                    <div className="l-testimonial-title">{t.title}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Timeline ──────────────────────────────────────────────────── */}
        <section className="l-section" id="l-timeline">
          <div className="l-section-label">Roadmap</div>
          <h2 className="l-section-title reveal">The journey so far.</h2>

          <div className="l-timeline-wrap" ref={timelineRef}>
            <div className="l-timeline-line">
              <div className="l-timeline-line-fill" />
            </div>

            {[
              { date: 'Q1 2025', title: 'Founding', body: 'Company founded at Harvard Innovation Labs. Seed funding secured.', done: true },
              { date: 'Q4 2025', title: 'Prototype', body: 'First functional 400 MHz NMR in handheld form factor. Proof of concept.', done: true },
              { date: 'Q2 2026', title: 'Engineering Samples', body: 'Pre-production units sent to academic partners for evaluation.', done: false },
              { date: 'Q4 2026', title: 'Beta Access', body: 'Waitlist members receive early access devices. KatmaiOS 1.0 launch.', done: false },
              { date: 'Q2 2027', title: 'General Availability', body: 'Katmai 01 ships worldwide. Developer SDK open-sourced.', done: false },
            ].map((m) => (
              <div className={`l-timeline-item reveal ${m.done ? 'done' : ''}`} key={m.date}>
                <div className="l-timeline-dot" />
                <div className="l-timeline-date">
                  {m.date}
                  <span className={`l-timeline-badge ${m.done ? 'done' : 'upcoming'}`}>
                    {m.done ? 'Done' : 'Upcoming'}
                  </span>
                </div>
                <h3 className="l-timeline-title">{m.title}</h3>
                <p className="l-timeline-body">{m.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── FAQ ───────────────────────────────────────────────────────── */}
        <section className="l-section" id="l-faq">
          <div className="l-section-label">FAQ</div>
          <h2 className="l-section-title reveal">Questions answered.</h2>

          <div className="l-faq-list">
            {[
              {
                q: 'Is this a real quantum computer or a simulator?',
                a: 'Katmai 01 is a real quantum computer using liquid-state NMR. The qubits are nuclear spins in a physical sample — not simulated. You\'re running actual quantum gate operations on real atoms.',
              },
              {
                q: 'How much will it cost?',
                a: 'Pricing will be announced when Beta Access opens in Q4 2026. Waitlist members will receive priority pricing. We\'re targeting accessibility for academic institutions and individual researchers.',
              },
              {
                q: 'What kind of samples can I run?',
                a: 'Katmai 01 ships with hydrogen (¹H), carbon-13 (¹³C), and phosphorus-31 (³¹P) NMR modules. Additional isotope modules are planned, including ¹⁵N and ¹⁹F.',
              },
              {
                q: 'Does it require liquid nitrogen or liquid helium?',
                a: 'No. Katmai uses a permanent Halbach magnet array — no cryogens required. The device operates at room temperature and starts in under two seconds.',
              },
              {
                q: 'Can I take it on a plane?',
                a: 'Yes. The magnet system is fully shielded and produces no significant external field. It has been cleared for air travel under standard carry-on regulations. We include a travel case and TSA documentation.',
              },
              {
                q: 'How do I get one?',
                a: 'Join the waitlist using the button above. Beta Access opens Q4 2026. Waitlist members are given priority access and early pricing. General availability follows in Q2 2027.',
              },
            ].map((item, i) => (
              <div className={`l-faq-item ${faqOpen === i ? 'open' : ''}`} key={i}>
                <div
                  className="l-faq-q"
                  onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && setFaqOpen(faqOpen === i ? null : i)}
                >
                  {item.q}
                  <svg className="l-faq-chevron" viewBox="0 0 20 20" fill="none">
                    <path d="M5 7.5l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div className="l-faq-a">
                  <div className="l-faq-a-inner">{item.a}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Closer / waitlist CTA ─────────────────────────────────────── */}
        <section className="l-closer">
          <div className="l-closer-glow" />
          <p className="l-closer-quote reveal">
            "The future of quantum isn't in a datacenter.<br />
            It's in your backpack."
          </p>
          <div className="l-closer-form reveal">
            <input
              type="email"
              className="l-closer-input"
              placeholder="you@university.edu"
              aria-label="Email address"
            />
            <button className="l-btn-primary" onClick={() => onNavigate('signup')} style={{ padding: '10px 20px', fontSize: '0.85rem', borderRadius: 10 }}>
              Demo Now
            </button>
          </div>
        </section>

        {/* ── Footer ────────────────────────────────────────────────────── */}
        <footer className="l-footer">
          <div className="l-footer-inner">
            <div className="l-footer-grid">
              <div className="l-footer-brand">
                <a href="#l-hero" className="l-nav-logo" style={{ textDecoration: 'none' }}>
                  <svg width="24" height="24" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <ellipse cx="14" cy="14" rx="13" ry="6" stroke="#d9a066" strokeWidth="1.2" fill="none" transform="rotate(-25 14 14)" />
                    <polygon points="14,5 22,21 6,21" fill="#d9a066" opacity="0.9" />
                    <circle cx="14" cy="14" r="2.5" fill="#e8b478" />
                  </svg>
                  Katmai Computing
                </a>
                <p>Bringing quantum mechanics out of the lab and into your hands. NMR quantum computing, redefined.</p>
              </div>

              <div className="l-footer-col">
                <h4>Product</h4>
                <ul>
                  <li><a href="#l-device">Device</a></li>
                  <li><a href="#l-specs">Specifications</a></li>
                  <li><a href="#l-demo">Interactive Demo</a></li>
                  <li><a href="#l-features">Features</a></li>
                </ul>
              </div>

              <div className="l-footer-col">
                <h4>Company</h4>
                <ul>
                  <li><a href="#l-timeline">Roadmap</a></li>
                  <li><a href="#l-faq">FAQ</a></li>
                  <li><a href="#">About</a></li>
                  <li><a href="#">Careers</a></li>
                </ul>
              </div>

              <div className="l-footer-col">
                <h4>Connect</h4>
                <ul>
                  <li><a href="#">Twitter / X</a></li>
                  <li><a href="#">LinkedIn</a></li>
                  <li><a href="#">GitHub</a></li>
                  <li><a href="#">Press Kit</a></li>
                </ul>
              </div>
            </div>

            <div className="l-footer-bottom">
              <span>© 2026 Katmai Computing, Inc. All rights reserved.</span>
              <div className="l-footer-live">
                <div className="l-footer-location-dot" />
                <span>San Francisco, CA</span>
                <span style={{ color: 'var(--l-border-hi)', margin: '0 6px' }}>·</span>
                <span ref={footerTimeRef} />
                <span style={{ marginLeft: 4, fontSize: '0.7rem', color: 'var(--l-text-faint)' }}>PT</span>
              </div>
            </div>
          </div>
        </footer>
      </div>

      {/* ── Scroll to top button ──────────────────────────────────────── */}
      <button
        className="l-to-top"
        ref={toTopRef}
        onClick={handleScrollTop}
        aria-label="Scroll to top"
      >
        <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle className="l-ring-track" cx="24" cy="24" r="22" />
          <circle
            ref={ringFillRef}
            className="l-ring-fill"
            cx="24"
            cy="24"
            r="22"
            strokeDasharray={circumference}
            strokeDashoffset={circumference}
          />
        </svg>
        <span className="l-to-top-icon">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 12V4M4 8l4-4 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </button>
    </div>
  );
}
