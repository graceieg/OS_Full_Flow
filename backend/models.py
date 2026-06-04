from pydantic import BaseModel, Field

class ExperimentParams(BaseModel):
    pulse_frequency_hz: float = Field(2083.0, ge=2000.0, le=2200.0)
    pulse_duration_us: float  = Field(120.0,  ge=10.0,   le=500.0)
    echo_spacing_ms:   float  = Field(50.0,   ge=5.0,    le=500.0)
    polarization_time_s: float = Field(3.0,   ge=0.5,    le=30.0)
    n_shots:           int    = Field(100,    ge=1,      le=1000)

class RunProgress(BaseModel):
    shot:    int
    total:   int
    status:  str   # "arming" | "running" | "complete" | "error"
    message: str = ""

class RunResult(BaseModel):
    fid:        list[float]   # raw FID time-series
    t2_ms:      float
    snr:        float
    larmor_hz:  float
    echo_count: int
    sample_rate_hz: int = 10000
