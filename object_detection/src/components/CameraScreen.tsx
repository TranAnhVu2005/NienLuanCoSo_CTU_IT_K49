import React, { type RefObject, useState, useEffect } from 'react';
import type { Detection } from '../services/aiService';
import { getInfoForLabel } from '../utils/canvasHelper';

// Khai báo các Props nhận vào cho màn hình quét Camera/Video/Ảnh
interface CameraScreenProps {
    videoRef: RefObject<HTMLVideoElement | null>; // Tham chiếu đến thẻ video ẩn dùng để stream camera/video
    canvasRef: RefObject<HTMLCanvasElement | null>; // Tham chiếu đến canvas dùng để vẽ đè khung bounding box
    mode: string; // Trạng thái hoạt động: 'idle', 'camera', 'image', 'video'
    activeTab: 'static' | 'conveyor'; // Chế độ kiểm tra: 'static' (tĩnh) hoặc 'conveyor' (băng chuyền)
    sensorLineY: number; // Tọa độ Y (%) của vạch cảm biến ảo đếm nông sản
    detections: Detection[]; // Danh sách các vật thể được AI phát hiện trong khung hình hiện tại
    conveyorTotal: number; // Tổng số nông sản đi qua băng chuyền
    conveyorFresh: number; // Số lượng nông sản đạt chất lượng (Fresh) trên băng chuyền
}

const CameraScreen: React.FC<CameraScreenProps> = ({
    videoRef,
    canvasRef,
    mode,
    activeTab,
    sensorLineY,
    detections,
    conveyorTotal,
    conveyorFresh
}) => {
    // Định nghĩa các state giả lập chỉ số hiển thị HUD (Heads-Up Display)
    const [fps, setFps] = useState(60.2); // Tốc độ khung hình trên giây (FPS)
    const [latency, setLatency] = useState(12); // Độ trễ xử lý AI (ms)
    const [packageNum, setPackageNum] = useState(8291); // Mã số lô hàng đang xử lý

    // Effect 1: Tạo dao động ngẫu nhiên cho FPS và Latency khi hệ thống đang quét để tăng tính thực tế cho giao diện
    useEffect(() => {
        if (mode === 'idle') return;
        const interval = setInterval(() => {
            setFps(+(59.6 + Math.random() * 0.8).toFixed(1));
            setLatency(Math.floor(11 + Math.random() * 4));
        }, 1000);
        return () => clearInterval(interval);
    }, [mode]);

    // Effect 2: Tự động tăng mã số lô hàng sau mỗi 6 giây khi đang quét
    useEffect(() => {
        if (mode === 'idle') return;
        const interval = setInterval(() => {
            setPackageNum(p => p + 1);
        }, 6000);
        return () => clearInterval(interval);
    }, [mode]);

    // Xác định màu sắc hiển thị cho huy hiệu trạng thái ở góc trên bên phải màn hình
    const badgeColor =
        mode === 'camera' ? 'var(--accent)' : // Màu xanh lá cho camera trực tiếp
            mode === 'video' ? '#f59e0b' : 'var(--accent)'; // Màu cam cho video đang phát

    // Tên nhãn trạng thái tương ứng
    const badgeLabel =
        mode === 'camera' ? 'Live feed' :
            mode === 'video' ? 'Playing video' :
                'Still image';

    // Tính toán tỷ lệ phần trăm chất lượng đạt (Pass Rate) cho biểu đồ xu hướng (Trend Chart)
    const totalCurrent = detections.length;
    // Lọc ra các vật thể tươi (Fresh) trong danh sách phát hiện hiện tại
    const freshCurrent = detections.filter(d => {
        const info = getInfoForLabel(d.label.toString());
        return !info.labelEn.toLowerCase().includes('rotten');
    }).length;

    const isConveyor = activeTab === 'conveyor';
    // Lấy tổng số lượng và số lượng tươi dựa trên chế độ đang chọn (băng chuyền hay quét tĩnh)
    const totalToShow = isConveyor ? conveyorTotal : totalCurrent;
    const freshToShow = isConveyor ? conveyorFresh : freshCurrent;

    // Tính toán điểm số chất lượng (tỷ lệ tươi / tổng số)
    let qualityScoreToShow = 100;
    if (totalToShow > 0) {
        qualityScoreToShow = Math.round((freshToShow / totalToShow) * 100);
    }

    // Dữ liệu chiều cao cột đồ thị giả lập hiển thị lịch sử xu hướng chất lượng trước đó
    const trendHeights = [80, 85, 90, 82, 88, 92, 94];

    return (
        <div className="flex-1 flex flex-col gap-[1.25rem]">
            <div className="bg-bg-surface border border-border-color rounded-lg p-[1.25rem] shadow-card transition-colors duration-300">
                <div className="relative w-full rounded-lg overflow-hidden bg-black aspect-[4/3] flex items-center justify-center border border-border-color shadow-lg lg:aspect-auto lg:h-[600px]">
                    {/* HUD Top Left Pills */}
                    {mode !== 'idle' && (
                        <div className="absolute top-4 left-4 flex gap-2 z-5">
                            <div className="px-2.5 py-1 rounded-sm bg-slate-900/75 backdrop-blur-[4px] text-white font-mono text-[0.72rem] font-bold tracking-wider border border-white/10">FPS: {fps}</div>
                            <div className="px-2.5 py-1 rounded-sm bg-slate-900/75 backdrop-blur-[4px] text-white font-mono text-[0.72rem] font-bold tracking-wider border border-white/10">LATENCY: {latency}ms</div>
                        </div>
                    )}



                    {/* Hidden HTML Video Tag and Render Canvas */}
                    <video ref={videoRef} autoPlay playsInline muted className="hidden" />
                    <canvas
                        ref={canvasRef}
                        className={mode === 'idle' ? 'hidden' : 'max-w-full max-h-full object-contain z-1'}
                    />

                    {/* Top Right Viewport Status Badge */}
                    {mode !== 'idle' && (
                        <div className="absolute top-4 right-4 z-5 bg-slate-900/75 backdrop-blur-[4px] text-white px-2.5 py-1 rounded-sm text-[0.75rem] font-semibold flex items-center gap-[0.35rem] border border-white/10">
                            <span
                                className="w-1.5 h-1.5 rounded-full"
                                style={{ backgroundColor: badgeColor }}
                            />
                            <span>{badgeLabel}</span>
                        </div>
                    )}

                    {/* HUD Bottom Package Processing Banner */}
                    {mode !== 'idle' && (
                        <div className="absolute bottom-4 left-4 right-4 bg-slate-900/85 backdrop-blur-[8px] rounded-md px-4 py-[0.65rem] z-5 flex flex-col gap-1.5 border border-white/10">
                            <div className="text-white font-semibold text-[0.82rem] flex justify-between">
                                <span>Processing package #{packageNum}</span>
                                <span>{activeTab === 'conveyor' ? 'Belt Mode' : 'Static Mode'}</span>
                            </div>
                            <div className="h-1 bg-white/20 rounded-full overflow-hidden">
                                <div className="h-full bg-accent w-0 transition-[width] duration-300 animate-hud-loader" />
                            </div>
                        </div>
                    )}

                    {/* Viewport Idle State */}
                    {mode === 'idle' && (
                        <div className="flex flex-col items-center justify-center text-center p-8 text-text-muted">
                            <svg className="w-12 h-12 text-accent mb-3 opacity-80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                                <circle cx="12" cy="13" r="4" />
                            </svg>
                            <h4 className="text-white font-semibold text-[1.1rem] mb-1">Ready when you are</h4>
                            <p className="text-[0.84rem] max-w-[280px] leading-relaxed m-0">
                                Bật Camera live hoặc đăng tải một bức ảnh/video để phân tích chất lượng nông sản.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CameraScreen;
