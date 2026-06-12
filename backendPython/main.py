from fastapi import FastAPI #Framewok tạo api
from fastapi.middleware.cors import CORSMiddleware #Cho phép ứng dụng frontend từ cổng khác gọi api
from pydantic import BaseModel #Định nghĩa cấu trúc dữ liệu đầu vào và kiểm tra tính hợp lệ của dữ liệu gửi lên API
from ultralytics import YOLO #Thư viện YOLO dùng để phát hiện vật thể
import cv2 #Thư viện xử lý ảnh 
import numpy as np #Thư viện tính toán ma trận
import base64 #Thư viện mã hóa/giải mã base64

# ==========================================
# 1. KHỞI TẠO SERVER & CẤU HÌNH BẢO MẬT
# ==========================================
app = FastAPI(title="YOLOv8 Detection API")

# Cấu hình CORS: Cho phép Frontend (HTML/React) gọi API từ mọi nguồn (localhost, IP LAN)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], #Cho phép mọi trang web bất kì có thể gửi yêu cầu đến api này
    allow_credentials=True, #Cho phép frontend gửi các thông tin nhạy cảm như cookie, authorization headers
    allow_methods=["*"], #Cho phép các phương thức http như GET, POST, PUT, DELETE, ...
    allow_headers=["*"], #Cho phép các headers tùy chỉnh
)

# ==========================================
# 2. KHỞI TẠO MÔ HÌNH TRÍ TUỆ NHÂN TẠO
# ==========================================
import os

# Đường dẫn tuyệt đối động đến file yolo26n.pt
current_dir = os.path.dirname(os.path.abspath(__file__)) #Lấy đường dẫn thư mục đang chạy file main.py
model_path = os.path.join(current_dir, 'best.pt')

print(f"Đang nạp mô hình: {model_path}")
model = YOLO(model_path)
print("Mô hình đã sẵn sàng nhận lệnh!")

# Định nghĩa khuôn mẫu dữ liệu hứng từ Client gửi lên
class ImageData(BaseModel):
    image_base64: str
    confidence: float = 0.25
    track: bool = False # Thêm tùy chọn theo vết đối tượng (YOLOv11 tracking)

# ==========================================
# 3. CÁC ĐIỂM CẦU (ENDPOINTS)
# ==========================================


@app.get("/")
def read_root():
    return {"status": "online", "message": "Server API YOLOv8/v11 đang hoạt động cực kỳ mượt mà!"}

# Cổng tiếp nhận ảnh và xử lý AI


@app.post("/predict")
async def predict_image(data: ImageData):
    try:
        # Bước 1: Làm sạch chuỗi Base64 (Cắt bỏ đoạn 'data:image/jpeg;base64,' nếu có)
        encoded_data = data.image_base64.split(',')[1] if ',' in data.image_base64 else data.image_base64

        # Bước 2: Dịch ngược Base64 thành ma trận pixel cho thư viện OpenCV hiểu
        nparr = np.frombuffer(base64.b64decode(encoded_data), np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        # Bước 3: Đưa ảnh cho YOLO quét
        # - imgsz=640: Ép ảnh về kích thước chuẩn để tính toán nhanh
        # - conf=data.confidence: Sử dụng ngưỡng tự tin động từ client
        # - Nếu data.track=True: Gọi model.track để theo vết đối tượng qua từng khung hình (YOLOv11)
        # - Nếu data.track=False: Gọi model.predict thông thường
        if data.track:
            results = model.track(source=img, imgsz=640,
                                  conf=data.confidence, persist=True, verbose=False)
        else:
            results = model.predict(source=img, imgsz=640,
                                    conf=data.confidence, verbose=False)

        # Bước 4: Khai thác kết quả (Lấy tọa độ, độ tự tin, tên vật thể)
        detections = []
        for box in results[0].boxes:
            # Tọa độ 4 góc của Bounding Box
            x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
            conf = float(box.conf[0])                       # Tỷ lệ % chắc chắn
            cls = int(box.cls[0])                           # Mã số ID của nhãn
            # Tên nhãn (người, điện thoại, quả cam...)
            name = results[0].names[cls]
            
            # Lấy track_id của đối tượng khi sử dụng model.track (YOLOv11 tracking)
            track_id = int(box.id[0].item()) if (box.id is not None) else None

            # Đóng gói dữ liệu lại
            detections.append({
                "id": track_id,
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
