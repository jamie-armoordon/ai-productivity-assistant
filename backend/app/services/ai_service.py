from google import genai
import os
from dotenv import load_dotenv
from enum import Enum
from typing import Optional, Dict, List
from fastapi import HTTPException

load_dotenv()

class SummaryLength(str, Enum):
    SHORT = "short"
    MEDIUM = "medium"
    LONG = "long"

class ContentType(str, Enum):
    EMAIL = "email"
    REPORT = "report"
    ARTICLE = "article"
    OUTLINE = "outline"

class WritingStyle(str, Enum):
    PROFESSIONAL = "professional"
    CASUAL = "casual"
    ACADEMIC = "academic"
    TECHNICAL = "technical"
    CREATIVE = "creative"

class AIService:
    def __init__(self):
        api_key = os.getenv("GOOGLE_API_KEY")
        if not api_key:
            raise ValueError("GOOGLE_API_KEY not found in environment variables")
        self.client = genai.Client(api_key=api_key)

    async def generate_summary(self, text: str, length: SummaryLength = SummaryLength.MEDIUM) -> str:
        try:
            length_instructions = {
                SummaryLength.SHORT: "Provide a very concise summary in 2-3 sentences.",
                SummaryLength.MEDIUM: "Provide a balanced summary in 4-5 sentences.",
                SummaryLength.LONG: "Provide a detailed summary in 6-8 sentences."
            }

            prompt = f"""Please summarize the following text. {length_instructions[length]}
            
            Text to summarize:
            {text}
            
            Additional instructions:
            - Maintain the key points and main ideas
            - Use clear and professional language
            - Ensure the summary is coherent and well-structured"""

            response = self.client.models.generate_content(
                model='gemini-2.0-flash-exp',
                contents=prompt
            )
            
            if not response.text:
                raise Exception("Empty response from AI model")
                
            return response.text
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error generating summary: {str(e)}")

    async def answer_question(self, context: str, question: str, summary: Optional[str] = None) -> str:
        try:
            context_prompt = f"""Context:
            Original Text: {context}
            {f'Summary: {summary}' if summary else ''}
            
            Question: {question}
            
            Instructions:
            - Answer the question based on the provided context
            - Be specific and accurate
            - If the answer cannot be derived from the context, say so
            - Use clear and professional language"""

            response = self.client.models.generate_content(
                model='gemini-2.0-flash-exp',
                contents=context_prompt
            )
            
            if not response.text:
                raise Exception("Empty response from AI model")
                
            return response.text
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error answering question: {str(e)}")

    def generate_email_content(self, prompt: str, style: str, additional_context: str = "") -> str:
        # Removed async since generate_content is synchronous
        email_template = f"""
Please generate a professional email with the following HTML structure:
<email>
    <header>
        <title>Generated Content</title>
        <subject>Subject: [Email Subject]</subject>
    </header>
    <body>
        <greeting>Dear [Recipient],</greeting>
        <opening>I hope this email finds you well.</opening>
        <content>
            [Main content paragraphs]
        </content>
        <closing>
            <signature>Best regards,</signature>
            <name>[Sender Name]</name>
            <position>[Position]</position>
        </closing>
    </body>
</email>

Style: {style}
Context: {additional_context}
Prompt: {prompt}
"""

        try:
            response = self.client.models.generate_content(
                model='gemini-2.0-flash-exp',
                contents=email_template
            )
            return response.text
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error generating email: {str(e)}")

    async def generate_content(
        self,
        prompt: str,
        content_type: ContentType,
        style: WritingStyle,
        additional_context: Optional[Dict] = None
    ) -> str:
        try:
            if content_type == ContentType.EMAIL:
                return self.generate_email_content(
                    prompt, 
                    style.value, 
                    "\n".join(f"{key}: {value}" for key, value in (additional_context or {}).items())
                )

            type_instructions = {
                ContentType.EMAIL: """Format this as a professional email with:
                    - Clear subject line
                    - Professional greeting
                    - Well-structured body
                    - Appropriate closing""",
                ContentType.REPORT: """Create a structured report with:
                    - Executive summary
                    - Key findings
                    - Detailed analysis
                    - Recommendations""",
                ContentType.ARTICLE: """Write an engaging article with:
                    - Attention-grabbing introduction
                    - Well-developed paragraphs
                    - Clear topic transitions
                    - Strong conclusion""",
                ContentType.OUTLINE: """Generate a detailed outline with:
                    - Main topics
                    - Subtopics
                    - Key points under each section"""
            }

            style_instructions = {
                WritingStyle.PROFESSIONAL: "Use formal language, clear structure, and business-appropriate terminology.",
                WritingStyle.CASUAL: "Use conversational tone, simple language, and relatable examples.",
                WritingStyle.ACADEMIC: "Use scholarly language, cite sources where relevant, and maintain academic rigor.",
                WritingStyle.TECHNICAL: "Use precise technical terminology and clear explanations of complex concepts.",
                WritingStyle.CREATIVE: "Use descriptive language, engaging narrative, and creative expressions."
            }

            context_prompt = ""
            if additional_context:
                context_prompt = "\nAdditional Context:\n" + "\n".join(
                    f"- {key}: {value}" for key, value in additional_context.items()
                )

            full_prompt = f"""Task: Generate {content_type.value} content based on the following prompt:

            {prompt}

            Style Instructions: {style_instructions[style]}

            Format Instructions: {type_instructions[content_type]}
            {context_prompt}

            Please ensure the output is well-structured and follows all specified guidelines."""

            response = self.client.models.generate_content(
                model='gemini-2.0-flash-exp',
                contents=full_prompt
            )
            
            if not response.text:
                raise Exception("Empty response from AI model")
                
            return response.text
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error generating content: {str(e)}")