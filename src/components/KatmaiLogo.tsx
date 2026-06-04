export function KatmaiLogo({ size = 20 }: { size?: number }) {
  const h = Math.round(size * 16 / 22);
  return (
    <svg width={size} height={h} viewBox="0 0 22 16" fill="none">
      <path d="M7 1 L1 8 L7 15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15 1 L21 8 L15 15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="11" y1="1" x2="11" y2="15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
