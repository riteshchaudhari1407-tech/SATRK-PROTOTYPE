import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

class RAGService:
    def __init__(self):
        api_key = os.getenv("GEMINI_API_KEY")
        if api_key:
            genai.configure(api_key=api_key)
            # Using the exact model name available from your API key list
            self.model = genai.GenerativeModel("models/gemini-3.5-flash")
        else:
            self.model = None

    def generate_explanation(self, scam_text: str, signals: list) -> str:
        if not self.model:
            return "Gemini API key not configured. Please check your .env file."

        prompt = f"""
        You are an expert AI Cyber Security Assistant for India's National Cyber Crime reporting portal.
        A suspicious message was flagged by our rule engine.
        
        Suspicious Message: "{scam_text}"
        Detected Threat Signals: {signals}

        Task:
        1. Explain clearly in 2-3 short sentences why this is a scam (reference Indian contexts like Digital Arrest, CBI/Police impersonation, or fake parcel customs).
        2. Give a strict safety instruction to the user (e.g., Do not transfer money, do not share OTP, disconnect the call).
        
        Keep the tone urgent, professional, and reassuring. Do not use complex jargon.
        """

        try:
            response = self.model.generate_content(prompt)
            return response.text.strip()
        except Exception as e:
            return f"Error generating explanation from AI: {str(e)}"

if __name__ == "__main__":
    rag = RAGService()
    sample_text = "CBI alert! You are under digital arrest. Transfer the money immediately to avoid FIR."
    sample_signals = ["authority_impersonation: 'cbi'", "threat_and_arrest: 'digital arrest'"]
    
    print("Generating AI Explanation using RAG Service...\n")
    explanation = rag.generate_explanation(sample_text, sample_signals)
    print(explanation)