from app.services.text_processing_service import TextProcessingService
from app.services.rule_engine_service import RuleEngine
from app.services.ml_detection_service import MLDetectionService
from app.services.risk_engine_service import RiskEngineService
from app.agents.explanation_agent import ExplanationAgent

class ScamDetectionAgent:
    def __init__(self):
        self.text_processor = TextProcessingService()
        self.rule_engine = RuleEngine()
        self.ml_service = MLDetectionService()
        self.risk_engine = RiskEngineService()
        self.explanation_agent = ExplanationAgent()

    def run_pipeline(self, raw_text: str) -> dict:
        """
        Orchestrates the entire scam detection and explanation workflow.
        """
        
        cleaned_text = self.text_processor.clean_and_normalize_text(raw_text)
        if not cleaned_text:
            return {"error": "Invalid or empty message provided."}
        
        rule_res = self.rule_engine.analyze_text(cleaned_text)
        
        
        ml_res = self.ml_service.analyze_text(cleaned_text)
        
        
        risk_res = self.risk_engine.evaluate(
            rule_score=rule_res["rule_score"],
            keyword_matches_count=len(rule_res["signals"])
        )
        
        
        agent_res = self.explanation_agent.run(
            scam_text=cleaned_text,
            signals=rule_res["signals"],
            risk_level=risk_res["risk_level"]
        )
        
        
        return {
            "success": True,
            "original_message": raw_text,
            "cleaned_message": cleaned_text,
            "risk_assessment": risk_res,
            "rule_details": rule_res,
            "ml_details": ml_res,
            "ai_explanation": agent_res
        }


if __name__ == "__main__":
    print("Testing Scam Detection Agent Pipeline...")
    agent = ScamDetectionAgent()
    
    test_msg = "CBI alert! You are under digital arrest. Transfer the money immediately to avoid FIR."
    result = agent.run_pipeline(test_msg)
    
    import json
    print(json.dumps(result, indent=4))