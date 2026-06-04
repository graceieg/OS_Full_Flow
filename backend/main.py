import json
import asyncio
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from models import ExperimentParams
from mock_serial import run_experiment

app = FastAPI(title="CatMayOS NMR Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # tighten to your Vercel URL in production
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok", "mode": "mock"}


@app.websocket("/ws/experiment")
async def experiment_ws(ws: WebSocket):
    """
    WebSocket protocol:
      client → { type: "run", params: ExperimentParams }
      server → { type: "progress", shot, total, status, message }
      server → { type: "result",   fid, t2_ms, snr, larmor_hz, echo_count }
      server → { type: "error",    message }
    """
    await ws.accept()
    try:
        raw = await ws.receive_text()
        msg = json.loads(raw)

        if msg.get("type") != "run":
            await ws.send_json({"type": "error", "message": "Expected {type: 'run', params: {...}}"})
            return

        params = ExperimentParams(**msg["params"])

        async def on_progress(shot: int, total: int, status: str, message: str = ""):
            await ws.send_json({
                "type":    "progress",
                "shot":    shot,
                "total":   total,
                "status":  status,
                "message": message,
            })

        result = await run_experiment(params, on_progress)

        await ws.send_json({
            "type":        "result",
            "fid":         result.fid[:500],   # send first 500 samples for display
            "t2_ms":       result.t2_ms,
            "snr":         result.snr,
            "larmor_hz":   result.larmor_hz,
            "echo_count":  result.echo_count,
        })

    except WebSocketDisconnect:
        pass
    except Exception as e:
        try:
            await ws.send_json({"type": "error", "message": str(e)})
        except Exception:
            pass
