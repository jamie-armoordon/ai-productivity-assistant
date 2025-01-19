from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from .database import Base
from datetime import datetime, UTC

class Summary(Base):
    __tablename__ = "summaries"

    id = Column(Integer, primary_key=True, index=True)
    original_text = Column(Text)
    summarized_text = Column(Text)
    created_at = Column(DateTime, default=lambda: datetime.now(UTC))
    
    # Add relationship to questions
    questions = relationship("Question", back_populates="summary")

class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    summary_id = Column(Integer, ForeignKey("summaries.id"))
    question_text = Column(Text)
    answer_text = Column(Text)
    created_at = Column(DateTime, default=lambda: datetime.now(UTC))
    
    # Add relationship to summary
    summary = relationship("Summary", back_populates="questions")

class Generation(Base):
    __tablename__ = "generations"

    id = Column(Integer, primary_key=True, index=True)
    content = Column(Text, nullable=False)
    content_type = Column(String, nullable=False)
    writing_style = Column(String, nullable=False)
    prompt = Column(Text, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(UTC))

class Template(Base):
    __tablename__ = "templates"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=False)
    content_type = Column(String, nullable=False)
    writing_style = Column(String, nullable=False)
    prompt = Column(Text, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(UTC)) 