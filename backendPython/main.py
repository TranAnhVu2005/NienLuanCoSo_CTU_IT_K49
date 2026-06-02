from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from ultralytics import YOLO
import cv2
import numpy as np
import base64

# ==========================================
# 1. KHỞI TẠO SERVER & CẤU HÌNH BẢO MẬT
# ==========================================
app = FastAPI(title="YOLOv8 Detection API")

# Cấu hình CORS: Cho phép Frontend (HTML/React) gọi API từ mọi nguồn (localhost, IP LAN)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================
# 2. KHỞI TẠO MÔ HÌNH TRÍ TUỆ NHÂN TẠO
# ==========================================
print("⏳ Đang nạp bộ não AI...")
# MẸO: Hiện tại đang dùng 'yolov8n.pt' để test hệ thống chung.
# Khi bạn làm dữ liệu xong, chỉ cần đổi thành 'best.pt' để nhận diện trái cây của đồ án.
model = YOLO('yolov8n.pt')
print("✅ Mô hình đã sẵn sàng nhận lệnh!")

# Định nghĩa khuôn mẫu dữ liệu hứng từ Client gửi lên


class ImageData(BaseModel):
    image_base64: str

# ==========================================
# 3. CÁC ĐIỂM CẦU (ENDPOINTS)
# ==========================================

# Cổng chào hỏi (Dùng để gõ http://localhost:8000 vào trình duyệt test xem server có sống không)


@app.get("/")
def read_root():
    return {"status": "online", "message": "Server API YOLOv8 đang hoạt động cực kỳ mượt mà!"}

# Cổng tiếp nhận ảnh và xử lý AI


@app.post("/predict")
async def predict_image(data: ImageData):
    try:
        # Bước 1: Làm sạch chuỗi Base64 (Cắt bỏ đoạn 'data:image/jpeg;base64,' nếu có)
        encoded_data = data.image_base64.split(
            ',')[1] if ',' in data.image_base64 else data.image_base64

        # Bước 2: Dịch ngược Base64 thành ma trận pixel cho thư viện OpenCV hiểu
        nparr = np.frombuffer(base64.b64decode(encoded_data), np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        # Bước 3: Đưa ảnh cho YOLO quét
        # - imgsz=640: Ép ảnh về kích thước chuẩn để tính toán nhanh
        # - conf=0.25: Hạ ngưỡng tự tin xuống 25% để dễ dàng bắt dính vật thể trong video (chống motion blur)
        results = model.predict(source=img, imgsz=640,
                                conf=0.25, verbose=False)

        # Bước 4: Khai thác kết quả (Lấy tọa độ, độ tự tin, tên vật thể)
        detections = []
        for box in results[0].boxes:
            # Tọa độ 4 góc của Bounding Box
            x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
            conf = float(box.conf[0])                       # Tỷ lệ % chắc chắn
            cls = int(box.cls[0])                           # Mã số ID của nhãn
            # Tên nhãn (người, điện thoại, quả cam...)
            name = results[0].names[cls]

            # Đóng gói dữ liệu lại
            detections.append({
                "label": name,
                "confidence": round(conf, 2),
                "box": [x1, y1, x2, y2]
            })

        # Trả phong bì JSON về cho Frontend
        return {"status": "success", "detections": detections}

    except Exception as e:
        # Bắt mọi lỗi sập server và báo về cho web biết thay vì tự crash
        return {"status": "error", "message": str(e)}

# Hướng dẫn chạy server trên Terminal:
# uvicorn main:app --reload
