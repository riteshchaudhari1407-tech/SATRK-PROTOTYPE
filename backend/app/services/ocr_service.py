import cv2
import numpy as np
import pytesseract
from PIL import Image
import io


pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

def extract_text_from_image(image_bytes: bytes) -> str:
    """
    Given image bytes (from a FastAPI UploadFile), preprocess it 
    and extract text using Tesseract OCR.
    """
    try:
        
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            raise ValueError("Invalid image file or unable to decode.")

        
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        
        _, thresh = cv2.threshold(gray, 150, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

        
        extracted_text = pytesseract.image_to_string(thresh)
        
        
        if not extracted_text.strip():
            extracted_text = pytesseract.image_to_string(gray)

        return extracted_text.strip()
    
    except Exception as e:
        print(f"Error during OCR processing: {str(e)}")
        return ""



if __name__ == "__main__":
    print("OCR Service loaded successfully!")
    try:
        version = pytesseract.get_tesseract_version()
        print(f"Tesseract OCR Engine Version: {version} (Installed & Working!)")
    except Exception as e:
        print(f"Tesseract engine error: {str(e)}")