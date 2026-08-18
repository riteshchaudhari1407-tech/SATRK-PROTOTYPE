import json
from pathlib import Path

class RuleEngine:
    def __init__(self):
        
        self.rules_path = Path(__file__).resolve().parent.parent.parent.parent / "data" / "scam_rules" / "scam_keywords.json"
        self.rules = self.load_rules()

    def load_rules(self):
        if self.rules_path.exists():
            with open(self.rules_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                return data.get("categories", {})
        else:
            print(f"Warning: Rules file not found at {self.rules_path}")
        return {}

    def analyze_text(self, text: str) -> dict:
        text_lower = text.lower()
        total_score = 0
        detected_signals = []

        for category, details in self.rules.items():
            weight = details.get("weight", 10)
            keywords = details.get("keywords", [])
            
            for keyword in keywords:
                if keyword in text_lower:
                    total_score += weight
                    detected_signals.append(f"{category}: '{keyword}'")
                    break 

        final_score = min(total_score, 100)
        
        return {
            "rule_score": final_score,
            "risk_level": "HIGH" if final_score >= 50 else "LOW",
            "signals": detected_signals
        }

if __name__ == "__main__":
    engine = RuleEngine()
    test_message = "CBI alert! You are under digital arrest. Transfer the money immediately to avoid FIR."
    print(f"Testing Message: '{test_message}'\n")
    result = engine.analyze_text(test_message)
    print(f"Result: {result}")