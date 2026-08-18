from app.services.rag_service import RAGService

class ExplanationAgent:
    def __init__(self):
        self.rag_service = RAGService()

    def run(self, scam_text: str, signals: list, risk_level: str) -> dict:
        """
        Orchestrates the explanation generation using RAGService.
        """
        if risk_level == "LOW":
            return {
                "status": "Safe",
                "explanation": "No significant threat signals detected."
            }
        
    
        explanation = self.rag_service.generate_explanation(scam_text, signals)
        
        return {
            "status": "Threat Explained",
            "risk_level": risk_level,
            "detailed_explanation": explanation
        }

if __name__ == "__main__":
    print("Testing Explanation Agent...")
    agent = ExplanationAgent()
    
    sample_text = "CBI alert! You are under digital arrest. Transfer the money immediately to avoid FIR."
    sample_signals = ["authority_impersonation: 'cbi'", "threat_and_arrest: 'digital arrest'"]
    
    result = agent.run(sample_text, sample_signals, "HIGH")
    print("\nAgent Result:\n", result)