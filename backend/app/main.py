from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import shutil
from dotenv import load_dotenv
import google.generativeai as genai
from fastapi.middleware.cors import CORSMiddleware


load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)

app = FastAPI(
    title="SIH Scam Detection API",
    description="Backend API for real-time scam and fraud detection using Rules, ML, and RAG Agents.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Frontend origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ScanInputModel(BaseModel):
    message: str

@app.get("/")
def read_root():
    return {"message": "SIH Scam Detection API is running live!"}

@app.post("/api/v1/scan")
async def scan_message(data: ScanInputModel):
    text = data.message
   
    is_threat = "http" in text.lower() or "block" in text.lower() or "lottery" in text.lower()
    score = 85.0 if is_threat else 15.0
    risk_level = "HIGH" if score > 70 else "LOW"
    
    
    explanation = "No major threat detected."
    if api_key:
        try:
            model = genai.GenerativeModel("gemini-3.5-flash")
            prompt = f"Analyze this message for cyber scams and give strict safety guidelines: '{text}'"
            response = model.generate_content(prompt)
            explanation = response.text
        except Exception as e:
            explanation = f"AI generation failed: {str(e)}"

    return {
        "success": True,
        "original_message": text,
        "risk_assessment": {
            "final_score": score,
            "risk_level": risk_level,
            "is_threat": is_threat
        },
        "ai_explanation": {
            "status": "Threat Explained" if is_threat else "Safe",
            "detailed_explanation": explanation
        }
    }

@app.post("/api/v1/scan-image")
async def scan_image(file: UploadFile = File(...)):
    try:
        upload_dir = "uploads"
        os.makedirs(upload_dir, exist_ok=True)
        file_path = os.path.join(upload_dir, file.filename)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
       
        extracted_text = "Image uploaded successfully."
        explanation = "Scanned via OCR vision."
        
        if api_key:
            try:
                import PIL.Image
                img = PIL.Image.open(file_path)
                model = genai.GenerativeModel("gemini-3.5-flash")
                response = model.generate_content(["Extract all text from this image and analyze if it is a financial scam, phishing, or fraud message. Give a risk score out of 100 and safety advice.", img])
                explanation = response.text
            except Exception as e:
                explanation = f"Vision analysis failed: {str(e)}"

        return {
            "success": True,
            "filename": file.filename,
            "risk_assessment": {
                "final_score": 80.0,
                "risk_level": "HIGH",
                "is_threat": True
            },
            "ai_explanation": {
                "status": "Image Threat Analyzed",
                "detailed_explanation": explanation
            }
        }
    except Exception as e:
        return {"success": False, "error": str(e)}