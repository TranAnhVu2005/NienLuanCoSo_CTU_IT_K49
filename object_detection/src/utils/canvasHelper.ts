import type { Detection } from '../services/aiService';

export interface ClassInfo {
    labelVi: string;
    labelEn: string;
    color: string;
    bgColor: string;
}

export const CLASS_MAP: Record<string, ClassInfo> = {
    'fresh_capsicum': { labelVi: 'Ớt chuông tươi', labelEn: 'Fresh Capsicum', color: '#10B981', bgColor: 'rgba(16, 185, 129, 0.08)' },
    'rotten_capsicum': { labelVi: 'Ớt chuông hỏng', labelEn: 'Rotten Capsicum', color: '#EF4444', bgColor: 'rgba(239, 68, 68, 0.08)' },
    'fresh_orange': { labelVi: 'Cam tươi', labelEn: 'Fresh Orange', color: '#10B981', bgColor: 'rgba(16, 185, 129, 0.08)' },
    'rotten_orange': { labelVi: 'Cam hỏng', labelEn: 'Rotten Orange', color: '#EF4444', bgColor: 'rgba(239, 68, 68, 0.08)' }
};

export const getInfoForLabel = (label: string): ClassInfo => {
    const cleanLabel = label.toLowerCase().trim();
    if (CLASS_MAP[cleanLabel]) return CLASS_MAP[cleanLabel];
    
    // Dự phòng khi gặp các lớp khác ngoài 4 lớp chính
    const isRotten = cleanLabel.includes('rotten') || cleanLabel.includes('damaged') || cleanLabel.includes('bad') || cleanLabel.includes('hỏng');
    const capitalized = label.charAt(0).toUpperCase() + label.slice(1);
    return {
        labelVi: isRotten ? `${capitalized} (Hỏng)` : `${capitalized} (Tươi)`,
        labelEn: capitalized,
        color: isRotten ? '#EF4444' : '#10B981',
        bgColor: isRotten ? 'rgba(239, 68, 68, 0.08)' : 'rgba(16, 185, 129, 0.08)'
    };
};

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

export const drawBoundingBoxes = (
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    detections: Detection[]
) => {
    detections.forEach(det => {
        const [x1, y1, x2, y2] = det.box;
        const width = x2 - x1;
        const height = y2 - y1;
        
        // Lấy thông tin hiển thị của lớp tương ứng
        const info = getInfoForLabel(det.label.toString());
        const text = `${info.labelVi} ${Math.round(det.confidence * 100)}%`;
        const scale = canvas.width / 640;

        // 1. Vẽ khung viền Bounding Box sắc nét (có bo góc nhẹ cho hiện đại)
        ctx.strokeStyle = info.color;
        ctx.lineWidth = Math.max(2, 3 * scale);
        drawRoundedRect(ctx, x1, y1, width, height, 4 * scale);
        ctx.stroke();

        // 2. Phủ lớp màu nền mờ nhạt bên trong hộp để định hình vật thể
        ctx.fillStyle = info.bgColor;
        ctx.fill();

        // 3. Vẽ nhãn dạng viên thuốc (pill badge) phía trên (hoặc thụt xuống nếu chạm viền trên)
        ctx.font = `bold ${Math.max(12, 13 * scale)}px system-ui, sans-serif`;
        const textWidth = ctx.measureText(text).width;
        
        const pillHPadding = 10 * scale;
        const pillWidth = textWidth + pillHPadding * 2;
        const pillHeight = Math.max(22, 26 * scale);
        
        // Xác định vị trí Y của nhãn nhắm không bị tràn lên mép trên màn hình
        const labelY = (y1 - pillHeight - 4 * scale) > 0 ? (y1 - pillHeight - 4 * scale) : (y1 + 4 * scale);
        const labelX = x1;

        // Vẽ nền nhãn
        ctx.fillStyle = info.color;
        drawRoundedRect(ctx, labelX, labelY, pillWidth, pillHeight, 6 * scale);
        ctx.fill();

        // Vẽ chữ nhãn màu trắng nổi bật
        ctx.fillStyle = '#FFFFFF';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, labelX + pillHPadding, labelY + pillHeight / 2);
    });
};