import os
from google import genai
from dotenv import load_dotenv

load_dotenv()

class ExplanationAgent:
    def __init__(self):
        api_key = os.getenv("GEMINI_API_KEY")
        self.client = genai.Client(api_key=api_key) if api_key else None

    def run(self, scam_text: str, signals: list, risk_level: str) -> dict:
        if not self.client:
            return {
                "status": "Fallback",
                "risk_level": risk_level,
                "detailed_explanation": "Gemini API key not found. Please configure .env file."
            }

        prompt = f"""
        Analyze this suspicious message:
        "{scam_text}"

        Detected Threat Signals: {signals}
        Risk Level: {risk_level}

        Provide a clear, strict cybersecurity explanation in simple English and give safety instructions (like calling 1930).
        """

        try:
            response = self.client.models.generate_content(
                model='gemini-3.5-flash',
                contents=prompt
            )
            return {
                "status": "Threat Explained",
                "risk_level": risk_level,
                "detailed_explanation": response.text.strip()
            }
        except Exception as e:
            return {
                "status": "Error",
                "risk_level": risk_level,
                "detailed_explanation": f"AI generation failed: {str(e)}"
            }