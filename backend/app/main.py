from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from . import models, database
from .services.ai_service import AIService, SummaryLength, ContentType, WritingStyle
from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime

app = FastAPI(title="AI Productivity Assistant")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite's default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add these new models
class SummaryRequest(BaseModel):
    text: str
    length: SummaryLength = SummaryLength.MEDIUM

class SummaryResponse(BaseModel):
    original_text: str
    summary: str
    id: int
    length: SummaryLength

class QuestionRequest(BaseModel):
    context: str
    question: str
    summary: Optional[str] = None
    summary_id: Optional[int] = None

class QuestionResponse(BaseModel):
    answer: str

class QuestionHistoryResponse(BaseModel):
    id: int
    question_text: str
    answer_text: str
    created_at: datetime

class GenerateContentRequest(BaseModel):
    prompt: str
    content_type: ContentType
    style: WritingStyle
    additional_context: Optional[Dict] = None

class GenerateContentResponse(BaseModel):
    content: str

class GenerationResponse(BaseModel):
    id: int
    content: str
    content_type: str
    writing_style: str
    prompt: str
    created_at: datetime

class TemplateBase(BaseModel):
    title: str
    description: str
    content_type: ContentType
    writing_style: WritingStyle
    prompt: str

class TemplateResponse(TemplateBase):
    id: int
    created_at: datetime

# Initialize AI Service
ai_service = AIService()

@app.on_event("startup")
async def startup():
    models.Base.metadata.create_all(bind=database.engine)

@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}

@app.get("/api/test-db")
def test_db(db: Session = Depends(database.get_db)):
    try:
        # Try to create a test summary
        test_summary = models.Summary(
            original_text="Test text",
            summarized_text="Test summary"
        )
        db.add(test_summary)
        db.commit()
        db.refresh(test_summary)
        return {"status": "Database is working", "test_id": test_summary.id}
    except Exception as e:
        return {"status": "Database error", "error": str(e)}

@app.post("/api/summarise", response_model=SummaryResponse)
async def summarize_text(
    request: SummaryRequest,
    db: Session = Depends(database.get_db)
):
    if not request.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")
        
    if len(request.text) > 10000:  # Add reasonable limit
        raise HTTPException(status_code=400, detail="Text is too long (max 10000 characters)")

    try:
        # Generate summary
        summary = await ai_service.generate_summary(request.text, request.length)
        
        # Save to database
        db_summary = models.Summary(
            original_text=request.text,
            summarized_text=summary
        )
        db.add(db_summary)
        db.commit()
        db.refresh(db_summary)
        
        return SummaryResponse(
            original_text=request.text,
            summary=summary,
            id=db_summary.id,
            length=request.length
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/ask", response_model=QuestionResponse)
async def answer_question(
    request: QuestionRequest,
    db: Session = Depends(database.get_db)
):
    if not request.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty")
        
    if not request.context.strip():
        raise HTTPException(status_code=400, detail="Context cannot be empty")

    try:
        # Generate answer
        answer = await ai_service.answer_question(
            context=request.context,
            question=request.question,
            summary=request.summary
        )
        
        # Save question and answer to database
        db_question = models.Question(
            question_text=request.question,
            answer_text=answer,
            summary_id=request.summary_id
        )
        db.add(db_question)
        db.commit()
        
        return QuestionResponse(answer=answer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/questions/{summary_id}", response_model=List[QuestionHistoryResponse])
async def get_question_history(
    summary_id: int,
    db: Session = Depends(database.get_db)
):
    questions = db.query(models.Question)\
        .filter(models.Question.summary_id == summary_id)\
        .order_by(models.Question.created_at.desc())\
        .all()
    return questions

@app.post("/api/generate", response_model=GenerationResponse)
async def generate_content(
    request: GenerateContentRequest,
    db: Session = Depends(database.get_db)
):
    try:
        content = await ai_service.generate_content(
            prompt=request.prompt,
            content_type=request.content_type,
            style=request.style,
            additional_context=request.additional_context
        )
        
        # Save to database
        db_generation = models.Generation(
            content=content,
            content_type=request.content_type,
            writing_style=request.style,
            prompt=request.prompt
        )
        db.add(db_generation)
        db.commit()
        db.refresh(db_generation)
        
        return db_generation
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/history", response_model=List[GenerationResponse])
async def get_generation_history(
    skip: int = 0,
    limit: int = 10,
    db: Session = Depends(database.get_db)
):
    generations = db.query(models.Generation)\
        .order_by(models.Generation.created_at.desc())\
        .offset(skip)\
        .limit(limit)\
        .all()
    return generations

@app.get("/api/templates", response_model=List[TemplateResponse])
async def get_templates(
    db: Session = Depends(database.get_db)
):
    templates = db.query(models.Template).all()
    return templates

# Fix the startup event handler
@app.on_event("startup")
async def create_default_templates():
    db = next(database.get_db())
    try:
        if db.query(models.Template).count() == 0:
            default_templates = [
                {
                    "title": "Professional Email",
                    "description": "Clear and concise business email template",
                    "content_type": ContentType.EMAIL,
                    "writing_style": WritingStyle.PROFESSIONAL,
                    "prompt": "Write a professional email about [topic] to [recipient]"
                },
                {
                    "title": "Meeting Notes",
                    "description": "Structured summary of meeting discussions",
                    "content_type": ContentType.REPORT,
                    "writing_style": WritingStyle.PROFESSIONAL,
                    "prompt": "Create detailed meeting notes covering: [agenda items]"
                },
                {
                    "title": "Project Proposal",
                    "description": "Comprehensive project outline and plan",
                    "content_type": ContentType.REPORT,
                    "writing_style": WritingStyle.PROFESSIONAL,
                    "prompt": "Write a project proposal for [project name] including objectives, timeline, and resources"
                },
                {
                    "title": "Research Summary",
                    "description": "Academic research summary with key findings",
                    "content_type": ContentType.REPORT,
                    "writing_style": WritingStyle.ACADEMIC,
                    "prompt": "Summarize research findings on [topic] including methodology and conclusions"
                },
                {
                    "title": "Technical Guide",
                    "description": "Clear technical documentation template",
                    "content_type": ContentType.REPORT,
                    "writing_style": WritingStyle.PROFESSIONAL,
                    "prompt": "Create technical documentation for [feature/system] including setup and usage"
                }
            ]
            
            for template in default_templates:
                db_template = models.Template(**template)
                db.add(db_template)
            
            db.commit()
    finally:
        db.close()

@app.delete("/api/history/{generation_id}")
async def delete_generation(
    generation_id: int,
    db: Session = Depends(database.get_db)
):
    generation = db.query(models.Generation).filter(models.Generation.id == generation_id).first()
    if not generation:
        raise HTTPException(status_code=404, detail="Generation not found")
    
    db.delete(generation)
    db.commit()
    return {"message": "Generation deleted successfully"}

@app.delete("/api/history")
async def delete_all_history(
    db: Session = Depends(database.get_db)
):
    db.query(models.Generation).delete()
    db.commit()
    return {"message": "All history deleted successfully"} 