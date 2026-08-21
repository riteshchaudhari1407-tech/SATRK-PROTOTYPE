from pydantic import BaseModel, Field

class MessageScanRequest(BaseModel):
    message: str = Field(..., description="The suspicious text message or chat content to be analyzed.")

class ImageScanRequest(BaseModel):
    image_path: str = Field(..., description="Path or filename of the uploaded screenshot.")