"""
OCR Service
-------------
Extracts text from an uploaded screenshot using Tesseract OCR via
pytesseract. Requires the Tesseract binary on the host system (see
backend/README.md). Fails loudly and clearly rather than returning a
fake/empty result.
"""

import io
import logging

from PIL import Image, ImageOps

logger = logging.getLogger("satrk.ocr")


class OCRError(Exception):
    """Raised when OCR extraction cannot be performed or yields nothing
    meaningful."""


class OCRService:
    def __init__(self):
        self.available = False

        try:
            import pytesseract  # noqa: F401

            self.available = True
        except ImportError:
            logger.warning(
                "pytesseract is not installed — screenshot scanning is "
                "disabled until it is installed."
            )

    def _preprocess(self, image: Image.Image) -> Image.Image:
        image = image.convert("L")
        image = ImageOps.autocontrast(image)

        if image.width < 900:
            scale = 900 / image.width
            image = image.resize(
                (int(image.width * scale), int(image.height * scale)),
                Image.LANCZOS,
            )

        return image

    def extract_text(self, image_bytes: bytes) -> str:
        if not self.available:
            raise OCRError(
                "OCR is not available on this server. Install pytesseract "
                "and the Tesseract binary, then restart the backend."
            )

        import pytesseract

        try:
            image = Image.open(io.BytesIO(image_bytes))
        except Exception as exc:
            raise OCRError(
                f"Could not read the uploaded image: {exc}"
            ) from exc

        processed = self._preprocess(image)

        try:
            text = pytesseract.image_to_string(processed)
        except pytesseract.TesseractNotFoundError as exc:
            raise OCRError(
                "Tesseract binary not found on this system. Install it "
                "(`sudo apt install tesseract-ocr` on Linux, or the "
                "UB-Mannheim build on Windows) and ensure it is on PATH."
            ) from exc

        cleaned = text.strip()

        if not cleaned or len(cleaned) < 3:
            raise OCRError(
                "No meaningful text could be extracted from this "
                "screenshot. Try a clearer or higher-resolution image."
            )

        return cleaned

    def check_available(self) -> dict:
        if not self.available:
            return {
                "connected": False,
                "detail": "pytesseract package not installed.",
            }

        try:
            import pytesseract

            version = str(pytesseract.get_tesseract_version())
            return {
                "connected": True,
                "detail": f"Tesseract {version} available.",
            }
        except Exception as exc:  # noqa: BLE001
            return {
                "connected": False,
                "detail": f"Tesseract binary not reachable: {exc}",
            }
