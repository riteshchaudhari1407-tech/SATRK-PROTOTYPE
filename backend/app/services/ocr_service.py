"""
OCR Service using Groq Vision API
--------------------------------
Extracts text from an uploaded screenshot using Groq's multimodal vision model 
(llama-3.2-11b-vision-preview). Requires zero local software installation!
"""

import base64
import logging
import os

logger = logging.getLogger("satrk.ocr")


class OCRError(Exception):
    """Raised when OCR extraction cannot be performed."""


class OCRService:
    def __init__(self, settings=None):
        self.available = True
        self.settings = settings

    def extract_text(self, image_bytes: bytes) -> str:
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise OCRError("GROQ_API_KEY not found in environment variables.")

        try:
            from groq import Groq
            client = Groq(api_key=api_key)

            # Convert image bytes to base64 data URL
            base64_image = base64.b64encode(image_bytes).decode("utf-8")

            
            # Call Groq Vision Model to extract text from screenshot
            response = client.chat.completions.create(
                model="qwen/qwen3.6-27b",
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": "Extract all the text visible in this screenshot accurately and cleanly. Return ONLY the exact text found in the image, without any extra conversation."
                            },
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{base64_image}"
                                }
                            }
                        ]
                    }
                ],
                max_tokens=500
            )

            extracted_text = response.choices[0].message.content.strip()

            if not extracted_text or len(extracted_text) < 2:
                raise OCRError("No meaningful text could be extracted from this screenshot.")

            return extracted_text

        except Exception as exc:
            logger.error("Groq Vision OCR failed: %s", exc)
            raise OCRError(f"OCR failed via AI Vision: {exc}") from exc

    def check_available(self) -> dict:
        return {
            "connected": True,
            "detail": "Groq Vision AI OCR active and ready.",
        }