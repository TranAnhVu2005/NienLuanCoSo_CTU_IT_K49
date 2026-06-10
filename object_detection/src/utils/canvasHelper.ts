import type { Detection } from '../services/aiService';

// Định nghĩa cấu trúc thông tin trực quan hiển thị trên Canvas của từng nhãn nông sản
export interface ClassInfo {
    labelVi: string; // Tên hiển thị bằng Tiếng Việt (ví dụ: 'Táo hỏng')
    labelEn: string; // Tên hiển thị bằng Tiếng Anh (ví dụ: 'Rotten Apple')
    color: string; // Mã màu hex tương ứng (đỏ cho quả hỏng, xanh cho quả tươi)
    bgColor: string; // Màu nền phủ trong khung Bounding Box (sử dụng độ mờ alpha)
}

// Bảng ánh xạ nhãn do mô hình YOLO trả về sang thông tin hiển thị UI
export const CLASS_MAP: Record<string, ClassInfo> = {
    'fresh_capsicum': { labelVi: 'Ớt chuông tươi', labelEn: 'Fresh Capsicum', color: '#10B981', bgColor: 'rgba(16, 185, 129, 0.08)' },
    'rotten_capsicum': { labelVi: 'Ớt chuông hỏng', labelEn: 'Rotten Capsicum', color: '#EF4444', bgColor: 'rgba(239, 68, 68, 0.08)' },
    'fresh_orange': { labelVi: 'Cam tươi', labelEn: 'Fresh Orange', color: '#10B981', bgColor: 'rgba(16, 185, 129, 0.08)' },
    'rotten_orange': { labelVi: 'Cam hỏng', labelEn: 'Rotten Orange', color: '#EF4444', bgColor: 'rgba(239, 68, 68, 0.08)' },
    'fresh_apple': { labelVi: 'Táo tươi', labelEn: 'Fresh Apple', color: '#10B981', bgColor: 'rgba(16, 185, 129, 0.08)' },
    'rotten_apple': { labelVi: 'Táo hỏng', labelEn: 'Rotten Apple', color: '#EF4444', bgColor: 'rgba(239, 68, 68, 0.08)' }
};

/**
 * Hàm hỗ trợ lấy thông tin hiển thị của một lớp dựa vào nhãn text trả về từ server
 * @param label Nhãn text từ mô hình (ví dụ: 'fresh_apple')
 * @returns Trả về đối tượng ClassInfo chứa tên dịch nghĩa và mã màu hiển thị
 */
export const getInfoForLabel = (label: string): ClassInfo => {
    const cleanLabel = label.toLowerCase().trim();
    // Nếu nhãn nằm trong bảng ánh xạ cố định CLASS_MAP thì trả về luôn
    if (CLASS_MAP[cleanLabel]) return CLASS_MAP[cleanLabel];
    
    // Phương án dự phòng (Fallback) nếu mô hình nhận diện nhãn lạ chưa có trong CLASS_MAP
    // Tự động phân tích xem nhãn có từ khóa 'rotten', 'damaged', 'bad' hoặc 'hỏng' để tô màu đỏ (lỗi), ngược lại màu xanh
    const isRotten = cleanLabel.includes('rotten') || cleanLabel.includes('damaged') || cleanLabel.includes('bad') || cleanLabel.includes('hỏng');
    const capitalized = label.charAt(0).toUpperCase() + label.slice(1);
    return {
        labelVi: isRotten ? `${capitalized} (Hỏng)` : `${capitalized} (Tươi)`,
        labelEn: capitalized,
        color: isRotten ? '#EF4444' : '#10B981',
        bgColor: isRotten ? 'rgba(239, 68, 68, 0.08)' : 'rgba(16, 185, 129, 0.08)'
    };
};

/**
 * Hàm vẽ hình chữ nhật bo góc (Rounded Rectangle) trên Canvas 2D
 */
const drawRoundedRect = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
) => {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
};

/**
 * Hàm vẽ đè tất cả khung Bounding Box và tên nhãn tương ứng lên Canvas hiển thị
 * @param ctx Context 2D của thẻ Canvas
 * @param canvas Đối tượng canvas gốc để lấy tỉ lệ kích thước thực tế
 * @param detections Danh sách các vật thể phát hiện từ AI
 */
export const drawBoundingBoxes = (
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    detections: Detection[]
) => {
    detections.forEach(det => {
        const [x1, y1, x2, y2] = det.box; // Lấy tọa độ hộp bounding box
        const width = x2 - x1; // Tính chiều rộng hộp
        const height = y2 - y1; // Tính chiều cao hộp
        
        // Lấy thông tin hiển thị của lớp tương ứng (màu sắc, nhãn Tiếng Anh/Tiếng Việt)
        const info = getInfoForLabel(det.label);
        // Nhãn văn bản hiển thị trên màn hình: Tên vật thể + Tỉ lệ tin cậy %
        const text = `${info.labelEn} ${Math.round(det.confidence * 100)}%`;
        // Tính tỉ lệ co giãn scale của canvas so với kích thước gốc 640 từ server để vẽ đúng vị trí tỷ lệ
        const scale = canvas.width / 640;

        // 1. Vẽ khung viền Bounding Box sắc nét (bo góc nhẹ 4px để giao diện nhìn hiện đại hơn)
        ctx.strokeStyle = info.color;
        ctx.lineWidth = Math.max(2, 3 * scale);
        drawRoundedRect(ctx, x1, y1, width, height, 4 * scale);
        ctx.stroke();

        // 2. Phủ một lớp màu nền mờ nhạt (opacity thấp) bên trong hộp để tạo chiều sâu định vị vật thể
        ctx.fillStyle = info.bgColor;
        ctx.fill();

        // 3. Thiết lập font chữ nhãn và tính toán kích thước của nhãn dạng viên thuốc (pill badge)
        ctx.font = `bold ${Math.max(12, 13 * scale)}px system-ui, sans-serif`;
        const textWidth = ctx.measureText(text).width;
        
        const pillHPadding = 10 * scale; // Đệm chiều ngang nhãn
        const pillWidth = textWidth + pillHPadding * 2; // Tổng chiều rộng viên thuốc nhãn
        const pillHeight = Math.max(22, 26 * scale); // Chiều cao viên thuốc nhãn
        
        // Xác định vị trí Y vẽ nhãn (Nếu hộp nằm quá sát mép trên màn hình, đẩy nhãn xuống dưới để không bị mất chữ)
        const labelY = (y1 - pillHeight - 4 * scale) > 0 ? (y1 - pillHeight - 4 * scale) : (y1 + 4 * scale);
        const labelX = x1;

        // Vẽ nền cho viên thuốc nhãn bằng màu của lớp tương ứng (xanh hoặc đỏ)
        ctx.fillStyle = info.color;
        drawRoundedRect(ctx, labelX, labelY, pillWidth, pillHeight, 6 * scale);
        ctx.fill();

        // Vẽ văn bản chữ trắng nổi bật lên trên nền nhãn
        ctx.fillStyle = '#FFFFFF';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, labelX + pillHPadding, labelY + pillHeight / 2);
    });
};