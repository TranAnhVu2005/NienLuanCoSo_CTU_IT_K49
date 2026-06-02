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

export const analyzeImageAI = async (
    base64Image: string,
    apiUrl: string = 'http://localhost:8000/predict',
    confidence: number = 0.25
): Promise<AIResponse> => {
    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                image_base64: base64Image,
                confidence: confidence
            })
        });
        return await response.json();
    } catch (error) {
        console.error("Lỗi kết nối Backend:", error);
        return { status: "error", detections: [] };
    }
};
