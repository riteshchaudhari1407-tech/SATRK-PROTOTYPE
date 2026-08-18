import re

class TextProcessingService:
    @staticmethod
    def clean_and_normalize_text(text: str) -> str:
        """
        Cleans and normalizes the input text for scam detection.
        - Removes extra whitespaces, newlines, and tabs
        """
        if not text or not isinstance(text, str):
            return ""
        
        
        cleaned_text = re.sub(r'\s+', ' ', text)
        return cleaned_text.strip()

    @staticmethod
    def extract_key_tokens(text: str) -> list:
        """
        Extracts words/tokens from the text for quick heuristic checks.
        """
        cleaned = TextProcessingService.clean_and_normalize_text(text).lower()
        return re.findall(r'\b\w+\b', cleaned)

if __name__ == "__main__":
    sample = "   Hello   World! This is an   urgent message.   "
    print("Cleaned:", repr(TextProcessingService.clean_and_normalize_text(sample)))