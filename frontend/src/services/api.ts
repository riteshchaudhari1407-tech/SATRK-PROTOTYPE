import axios from 'axios';

const API_BASE_URL = "http://127.0.0.1:8000/api/v1";

export const scanTextMessage = async (message: string) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/scan`, { message });
        return response.data;
    } catch (error: any) {
        return { success: false, error: error.message || "Failed to connect to backend" };
    }
};

export const scanImageMessage = async (file: File) => {
    try {
        const formData = new FormData();
        formData.append("file", file);
        const response = await axios.post(`${API_BASE_URL}/scan-image`, formData, {
            headers: { "Content-Type": "multipart/form-data" }
        });
        return response.data;
    } catch (error: any) {
        return { success: false, error: error.message || "Image upload failed" };
    }
};