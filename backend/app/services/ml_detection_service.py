class MLDetectionService:
    def __init__(self):
        self.scam_indicators = ["digital arrest", "cbi", "customs", "trai", "rbi", "arrest warrant", "otp", "block"]

    def analyze_text(self, text: str) -> dict:
        """
        Analyzes text using pattern matching to simulate ML classification probability.
        """
        if not text or not isinstance(text, str):
            return {"ml_score": 0.0, "prediction": "Normal"}
        
        text_lower = text.lower()
        matches = sum(1 for word in self.scam_indicators if word in text_lower)
        
        ml_score = min(float(matches * 25), 95.0) if matches > 0 else 5.0
        prediction = "Scam" if ml_score >= 50.0 else "Normal"
        
        return {
            "ml_score": ml_score,
            "prediction": prediction
        }

if __name__ == "__main__":
    ml = MLDetectionService()
    print(ml.analyze_text("This is CBI. You are under digital arrest."))