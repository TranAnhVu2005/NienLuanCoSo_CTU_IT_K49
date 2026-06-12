// Định nghĩa cấu trúc thông tin của 1 đối tượng phát hiện được từ AI (YOLOv11)
export interface Detection {
    id?: number | null; // ID theo vết đối tượng (YOLOv11 tracking), có thể là null hoặc undefined nếu ở chế độ quét thường
    label: string; // Tên nhãn của vật thể phát hiện được (ví dụ: 'fresh_apple', 'rotten_orange')
    confidence: number; // Độ tự tin/chắc chắn của AI đối với vật thể này (giá trị từ 0 đến 1)
    box: [number, number, number, number]; // Tọa độ hộp bao quanh vật thể dạng Bounding Box [x_min, y_min, x_max, y_max]
}

// Định nghĩa cấu trúc phản hồi JSON từ FastAPI Server
export interface AIResponse {
    status: string; // Trạng thái kết quả: "success" hoặc "error"
    detections: Detection[]; // Danh sách các vật thể được phát hiện thành công
    message?: string; // Thông báo lỗi đi kèm nếu status là "error"
}

/**
 * Hàm gửi dữ liệu ảnh Base64 lên Server FastAPI chứa mô hình YOLOv11 để phân tích
 * @param base64Image Chuỗi ảnh đã được mã hóa dưới dạng Base64
 * @param apiUrl Đường dẫn API xử lý của Server Python (mặc định chạy ở cổng 8000)
 * @param confidence Ngưỡng tin cậy tối thiểu để nhận dạng vật thể (mặc định 0.25)
 * @param track Cờ xác định xem có sử dụng thuật toán theo dõi đối tượng (tracking) hay không
 * @returns Trả về Promise chứa kết quả nhận diện từ AI
 */
export const analyzeImageAI = async (
    base64Image: string,
    apiUrl: string = 'http://localhost:8000/predict',
    confidence: number = 0.25,
    track: boolean = false
): Promise<AIResponse> => {
    try {
        // Gửi yêu cầu HTTP POST đến endpoint /predict của FastAPI
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                image_base64: base64Image, // Dữ liệu ảnh mã hóa base64
                confidence: confidence, // Truyền kèm ngưỡng confidence để AI lọc kết quả trực tiếp từ server
                track: track // Truyền kèm cờ track để backend quyết định chạy model.track hay model.predict
            })
        });
        
        // Chuyển kết quả phản hồi từ Server thành đối tượng JSON
        return await response.json();
    } catch (error) {
        // Ghi lại lỗi ra console trình duyệt trong trường hợp mất kết nối mạng hoặc server sập
        console.error("Lỗi kết nối Backend:", error);
        return { status: "error", detections: [] };
    }
};
