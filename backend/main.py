from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class SummariseRequest(BaseModel):
    text: str
    max_length: int = 150
    min_length: int = 50

class SummariseResponse(BaseModel):
    summary: str

@app.post("/api/summarise", response_model=SummariseResponse)
async def summarise_text(request: SummariseRequest):
    try:
        # Here you would typically call your AI model/service
        # For now, let's return a simple summary
        summary = request.text[:request.max_length] + "..."
        
        return SummariseResponse(summary=summary)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
        

# Your existing generate endpoint
@app.post("/api/generate")
async def generate_text():
    # Your existing code
    pass 