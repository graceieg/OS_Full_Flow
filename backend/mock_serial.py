"""
Mock serial layer — simulates the Arduino NMR spectrometer.
Returns realistic Earth's-field NMR FID data without real hardware.
Swap this module for a real pyserial implementation when firmware is ready.
"""

import asyncio
import math
import random
from models import ExperimentParams, RunResult

# Proton gyromagnetic ratio (rad/s/T) and Earth's field (~50 µT)
_GAMMA_H = 2.675e8
_EARTH_FIELD_T = 50.33e-6  # ~2083 Hz Larmor


def _generate_fid(params: ExperimentParams) -> list[float]:
    """
    Generate a synthetic FID (free induction decay) signal.
    Models a damped sinusoid at the Larmor frequency with added noise.
    """
    sample_rate = 10_000  # Hz — matches Arduino ADC rate
    duration_s  = params.echo_spacing_ms * params.n_shots / 1000 + 0.5

    n_samples = int(sample_rate * duration_s)
    t2_s = _estimate_t2(params)
    larmor = params.pulse_frequency_hz

    # SNR depends on polarization time (longer = better)
    signal_amplitude = 150 * (1 - math.exp(-params.polarization_time_s / 2.5))
    noise_rms = 7.5  # LSB — matches paper's measured noise floor

    fid = []
    for i in range(n_samples):
        t = i / sample_rate
        signal = signal_amplitude * math.exp(-t / t2_s) * math.cos(2 * math.pi * larmor * t)
        noise  = random.gauss(0, noise_rms)
        fid.append(round(signal + noise, 3))

    return fid


def _estimate_t2(params: ExperimentParams) -> float:
    """Rough T2 estimate based on echo spacing (shorter spacing → less decay)."""
    base_t2 = 1.8  # seconds — typical for protons in water at Earth's field
    spacing_factor = min(1.0, 50 / params.echo_spacing_ms)
    return base_t2 * spacing_factor


def _compute_snr(fid: list[float], params: ExperimentParams) -> float:
    sample_rate = 10_000
    signal_window = fid[:int(0.1 * sample_rate)]
    noise_window  = fid[int(0.8 * len(fid)):]

    if not signal_window or not noise_window:
        return 0.0

    signal_rms = math.sqrt(sum(x**2 for x in signal_window) / len(signal_window))
    noise_rms  = math.sqrt(sum(x**2 for x in noise_window)  / len(noise_window)) or 1.0
    return round(signal_rms / noise_rms, 1)


async def run_experiment(
    params: ExperimentParams,
    on_progress,   # async callback(shot: int, total: int, status: str)
) -> RunResult:
    """
    Simulate an NMR acquisition.
    Yields progress callbacks then returns the full result.
    """
    total = params.n_shots

    # Arming phase (~0.5 s)
    await on_progress(0, total, "arming", "Compiling sequence…")
    await asyncio.sleep(0.5)

    # Running phase — simulate shot-by-shot acquisition
    for shot in range(1, total + 1):
        await on_progress(shot, total, "running", f"Acquiring shot {shot} / {total}")
        # Each shot takes echo_spacing_ms * n_echoes, compressed for simulation
        await asyncio.sleep(0.02)

    # Generate result
    fid = _generate_fid(params)
    t2  = round(_estimate_t2(params) * 1000, 1)  # convert to ms
    snr = _compute_snr(fid, params)
    larmor = round(params.pulse_frequency_hz, 1)

    await on_progress(total, total, "complete", "Acquisition complete")

    return RunResult(
        fid        = fid,
        t2_ms      = t2,
        snr        = snr,
        larmor_hz  = larmor,
        echo_count = total,
    )
