import os
import google.generativeai as genai
from dotenv import load_dotenv


load_dotenv()


api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)

def generate_llm_response(prompt: str) -> str:
    """
    Calls Gemini model to generate a response based on the provided prompt.
    """
    try:
        if not api_key:
            return "Error: GEMINI_API_KEY is missing in environment variables."
        
        
        model = genai.GenerativeModel('gemini-1.5-flash')
        response = model.generate_content(prompt)
        
        return response.text.strip()
    except Exception as e:
        return f"Error communicating with LLM service: {str(e)}"


if __name__ == "__main__":
    print("Testing LLM Service...")
    if api_key:
        test_prompt = "Say 'LLM Service is working perfectly!' in one short line."
        print("Prompt:", test_prompt)
        print("Response:", generate_llm_response(test_prompt))
    else:
        print("API Key not found. Please add GEMINI_API_KEY in your .env file to test LLM.")