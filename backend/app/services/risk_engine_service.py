class RiskEngineService:
    @staticmethod
    def calculate_risk_level(score: float) -> str:
        if score >= 70:
            return "HIGH"
        elif score >= 40:
            return "MEDIUM"
        else:
            return "LOW"

    def evaluate(self, rule_score: float, keyword_matches_count: int) -> dict:
        final_score = min(float(rule_score) + (keyword_matches_count * 5), 100.0)
        risk_level = self.calculate_risk_level(final_score)
        
        return {
            "final_score": round(final_score, 2),
            "risk_level": risk_level,
            "is_threat": risk_level in ["HIGH", "MEDIUM"]
        }

if __name__ == "__main__":
    engine = RiskEngineService()
    print(engine.evaluate(85.0, 3))