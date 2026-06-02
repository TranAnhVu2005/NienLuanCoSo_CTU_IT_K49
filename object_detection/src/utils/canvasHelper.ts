import type { Detection } from '../services/aiService';

export const drawBoundingBoxes = (
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    detections: Detection[]
) => {
    detections.forEach(det => {
        const [x1, y1, x2, y2] = det.box;
        const text = `${det.label} ${Math.round(det.confidence * 100)}%`;
        const scale = canvas.width / 640;

        ctx.strokeStyle = '#00FF00';
        ctx.lineWidth = Math.max(2, 3 * scale);
        ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);

        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.font = `bold ${Math.max(14, 16 * scale)}px Arial`;
        const textWidth = ctx.measureText(text).width;
        ctx.fillRect(x1, y1 - (25 * scale), textWidth + (10 * scale), 25 * scale);

        ctx.fillStyle = '#00FF00';
        ctx.fillText(text, x1 + (5 * scale), y1 - (5 * scale));
    });
};