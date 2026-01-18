from fastapi import FastAPI
app = FastAPI(title="Quantora API")

@app.get("/health")
async def health():
    return {"status": "ok"}
