import axios from 'axios';

// Base URL ko sirf http://127.0.0.1:8000 rakho
const API_BASE_URL = "http://127.0.0.1:8000";

export const scanTextMessage = async (message: string) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/api/analyze`, { message, text: message });
        return response.data;
    } catch (error: any) {
        return { success: false, error: error.response?.data?.detail || error.message || "Failed to connect to backend" };
    }
};

export const scanImageMessage = async (file: File) => {
    try {
        const formData = new FormData();
        formData.append("file", file);
        const response = await axios.post(`${API_BASE_URL}/api/analyze-image`, formData, {
            headers: { "Content-Type": "multipart/form-data" }
        });
        return response.data;
    } catch (error: any) {
        return { success: false, error: error.response?.data?.detail || error.message || "Image upload failed" };
    }
};