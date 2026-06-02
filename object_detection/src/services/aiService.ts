// Định nghĩa cấu trúc của 1 khung nhận diện
export interface Detection {
    label: String;
    confidence: number;
    box: [number, number, number, number];
}

//Định nghĩa json trả về
export interface AIResponse {
    status: string;
    detections: Detection[];
    message?: string;
}

const API_URL = 'http://localhost:8000/predict';

export const analyzeImageAI = async (base64Image: string): Promise<AIResponse> => {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image_base64: base64Image })
        });
        return await response.json();
    } catch (error) {
        console.error("Lỗi kết nối Backend:", error);
        return { status: "error", detections: [] };
    }
};
