import React, { useState } from 'react';

// Khai báo các Props nhận vào cho bộ điều khiển
interface ControlPanelProps {
    status: {
        text: string;
        type: 'idle' | 'loading' | 'active' | 'success' | 'error';
    };
    mode: string; // Chế độ hoạt động hiện tại ('idle', 'camera', 'image', 'video')
    onStart: () => void; // Hàm kích hoạt luồng live camera
    onStop: () => void; // Hàm dừng quét toàn bộ thiết bị đầu vào
    onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void; // Hàm xử lý tải lên ảnh tĩnh
    onVideoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void; // Hàm xử lý tải lên file video
    confidence: number; // Độ tự tin hiện tại của AI (YOLO confidence threshold)
    onConfidenceChange: (val: number) => void; // Hàm cập nhật độ tự tin
    activeTab: 'static' | 'conveyor'; // Tab hiển thị ('static': Quét tĩnh, 'conveyor': Băng chuyền)
    sensorLineY: number; // Vị trí vạch ảo đếm nông sản (%)
    onSensorLineYChange: (val: number) => void; // Hàm cập nhật vị trí vạch ảo
    conveyorSpeed: number; // Tốc độ băng chuyền m/s
    onConveyorSpeedChange: (val: number) => void; // Hàm cập nhật tốc độ băng chuyền
}

const ControlPanel: React.FC<ControlPanelProps> = ({
    status,
    mode,
    onStart,
    onStop,
    onImageUpload,
    onVideoUpload,
    confidence,
    onConfidenceChange,
    activeTab,
    sensorLineY,
    onSensorLineYChange,
    conveyorSpeed,
    onConveyorSpeedChange
}) => {
    // Các state cục bộ phục vụ các nút gạt hiển thị trên giao diện (Tự động quét & Đếm nông sản)
    const [autoScan, setAutoScan] = useState(true);
    const [objectCounting, setObjectCounting] = useState(true);

    // Xác định hệ thống đang quét hoạt động dựa vào kiểu trạng thái status.type
    const isActive = status.type === 'active' || status.type === 'loading';
    const isSuccess = status.type === 'success';

    // Phân loại CSS class phù hợp để hiển thị màu hộp thông báo trạng thái
    const statusClass =
        status.type === 'active' || status.type === 'loading' ? 'bg-danger-soft text-danger border-danger' :
            status.type === 'success' ? 'bg-accent-soft text-accent border-accent' :
                status.type === 'error' ? 'bg-danger-soft text-danger border-danger' :
                    'bg-bg-muted text-text-secondary';

    // Chuyển đổi công thức Slider Sensitivity hiển thị sang Confidence Threshold của YOLO
    // Độ nhạy Sensitivity = 100 - (Confidence * 100)
    // Ví dụ: Confidence mặc định 0.25 (25%) tương đương Độ nhạy hiển thị là 75%
    const sensitivityVal = Math.round((1 - confidence) * 100);
    const handleSensitivityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const sens = parseInt(e.target.value);
        const conf = 1 - (sens / 100);
        // Giới hạn ngưỡng confidence nằm trong khoảng an toàn từ 0.1 (nhạy nhất) đến 0.9 (chặt chẽ nhất)
        onConfidenceChange(Math.max(0.1, Math.min(0.9, conf)));
    };

    return (
        <div className="flex flex-col gap-5">
            {/* System Status Panel */}
            <div className="bg-bg-surface border border-border-color rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 p-5 md:p-6 flex flex-col gap-6">

                {/* --- HEADER --- */}
                <div className="flex items-center gap-3">
                    <div className="w-1.5 h-6 bg-accent rounded-full"></div>
                    <h3 className="font-display text-lg font-bold text-text-primary tracking-tight m-0">
                        System Controls
                    </h3>
                </div>

                {/* --- STATUS BANNER --- */}
                <div className={`px-4 py-3.5 rounded-xl text-sm font-semibold flex items-center gap-3 border transition-all duration-300 ${statusClass}`}>
                    {status.type === 'loading' && (
                        <svg className="animate-spin h-5 w-5 text-current" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                    )}
                    {status.type === 'active' && (
                        <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-danger opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-danger"></span>
                        </span>
                    )}
                    {status.type === 'success' && (
                        <svg className="h-5 w-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                    )}
                    {status.type === 'error' && (
                        <svg className="h-5 w-5 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    )}
                    {status.type === 'idle' && (
                        <svg className="h-5 w-5 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    )}
                    <span className="flex-1 tracking-wide">{status.text}</span>
                </div>

                {/* --- PRIMARY ACTIONS (CAMERA/MEDIA) --- */}
                <div className="flex flex-col gap-3">
                    {mode === "idle" ? (
                        <>
                            <button onClick={onStart} className="group relative inline-flex items-center justify-center gap-2 w-full py-3 px-5 rounded-xl font-bold text-[0.9rem] cursor-pointer bg-accent text-text-inverse overflow-hidden transition-all duration-300 hover:shadow-[0_8px_20px_-6px_rgba(var(--color-accent),0.5)] hover:-translate-y-0.5">
                                <svg className="w-5 h-5 transition-transform group-hover:scale-110" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                                    <circle cx="12" cy="13" r="4" />
                                </svg>
                                Start Camera
                            </button>

                            <div className="grid grid-cols-2 gap-3">
                                <label className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl font-semibold text-[0.88rem] cursor-pointer border border-border-color bg-bg-surface text-text-secondary transition-all duration-200 hover:bg-bg-muted hover:text-accent hover:border-accent/50">
                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="3" y="3" width="18" height="18" rx="2" />
                                        <circle cx="8.5" cy="8.5" r="1.5" />
                                        <path d="M21 15l-5-5L5 21" />
                                    </svg>
                                    Upload Photo
                                    <input type="file" accept="image/*" className="hidden" onChange={onImageUpload} />
                                </label>
                                <label className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl font-semibold text-[0.88rem] cursor-pointer border border-border-color bg-bg-surface text-text-secondary transition-all duration-200 hover:bg-bg-muted hover:text-accent hover:border-accent/50">
                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <polygon points="23 7 16 12 23 17 23 7" />
                                        <rect x="1" y="5" width="15" height="14" rx="2" />
                                    </svg>
                                    Upload Video
                                    <input type="file" accept="video/*" className="hidden" onChange={onVideoUpload} />
                                </label>
                            </div>
                        </>
                    ) : (
                        <button onClick={onStop} className="group inline-flex items-center justify-center gap-2 w-full py-3 px-5 rounded-xl font-bold text-[0.9rem] cursor-pointer bg-danger text-text-inverse transition-all duration-300 hover:shadow-[0_8px_20px_-6px_rgba(var(--color-danger),0.5)] hover:-translate-y-0.5">
                            <svg className="w-5 h-5 transition-transform group-hover:scale-110" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="3" width="18" height="18" rx="2" />
                                <rect x="9" y="9" width="6" height="6" fill="currentColor" />
                            </svg>
                            Stop Scanning
                        </button>
                    )}
                </div>

                {/* --- FEATURE TOGGLES (CARD-IN-CARD UI) --- */}
                <div className="flex flex-col gap-3">
                    {/* Auto Scan */}
                    <div className="flex items-center justify-between p-3.5 rounded-xl border border-border-color/60 bg-bg-surface/50 hover:bg-bg-muted transition-colors">
                        <div className="flex flex-col">
                            <span className="font-bold text-[0.9rem] text-text-primary">Auto Scan</span>
                            <span className="text-[0.75rem] text-text-muted mt-0.5">Trực tiếp quét khi phát hiện</span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" checked={autoScan} onChange={(e) => setAutoScan(e.target.checked)} className="sr-only peer" />
                            <div className="w-11 h-6 bg-border-color peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
                        </label>
                    </div>

                    {/* Object Counting */}
                    <div className="flex items-center justify-between p-3.5 rounded-xl border border-border-color/60 bg-bg-surface/50 hover:bg-bg-muted transition-colors">
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-[0.9rem] text-text-primary">Object Counting</span>
                                <span className="text-[0.6rem] font-bold text-accent bg-accent/10 px-1.5 py-0.5 rounded uppercase tracking-wider">Beta</span>
                            </div>
                            <span className="text-[0.75rem] text-text-muted mt-0.5">Đếm số lượng trên băng chuyền</span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" checked={objectCounting} onChange={(e) => setObjectCounting(e.target.checked)} className="sr-only peer" />
                            <div className="w-11 h-6 bg-border-color peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
                        </label>
                    </div>
                </div>

                {/* --- CONFIGURATION SLIDERS --- */}
                <div className="p-4 rounded-xl bg-bg-muted/30 border border-border-color/30">
                    {activeTab === 'static' ? (
                        <div className="flex flex-col gap-2">
                            <div className="flex justify-between items-end">
                                <span className="text-sm font-semibold text-text-primary">AI Sensitivity</span>
                                <span className="text-sm font-bold text-accent bg-accent/10 px-2 py-0.5 rounded-md">{sensitivityVal}%</span>
                            </div>
                            <input
                                type="range" min="10" max="90" step="5" value={sensitivityVal} onChange={handleSensitivityChange}
                                className="w-full h-2 appearance-none bg-border-color rounded-full outline-none mt-2 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:hover:scale-125 [&::-webkit-slider-thumb]:transition-transform"
                            />
                            <p className="text-xs text-text-muted mt-2">Tăng độ nhạy để dễ nhận diện; giảm để tránh nhiễu.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-6">
                            <div className="flex flex-col gap-2">
                                <div className="flex justify-between items-end">
                                    <span className="text-sm font-semibold text-text-primary">Sensor Line Y</span>
                                    <span className="text-sm font-bold text-accent bg-accent/10 px-2 py-0.5 rounded-md">{sensorLineY}%</span>
                                </div>
                                <input
                                    type="range" min="10" max="90" step="1" value={sensorLineY} onChange={(e) => onSensorLineYChange(parseInt(e.target.value))}
                                    className="w-full h-2 appearance-none bg-border-color rounded-full outline-none mt-2 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:hover:scale-125 [&::-webkit-slider-thumb]:transition-transform"
                                />
                                <p className="text-xs text-text-muted mt-1">Điều chỉnh cao độ vạch đếm ảo.</p>
                            </div>

                            <div className="flex flex-col gap-2">
                                <div className="flex justify-between items-end">
                                    <span className="text-sm font-semibold text-text-primary">Conveyor Speed</span>
                                    <span className="text-sm font-bold text-accent bg-accent/10 px-2 py-0.5 rounded-md">{conveyorSpeed.toFixed(1)} m/s</span>
                                </div>
                                <input
                                    type="range" min="0.1" max="2.0" step="0.1" value={conveyorSpeed} onChange={(e) => onConveyorSpeedChange(parseFloat(e.target.value))}
                                    className="w-full h-2 appearance-none bg-border-color rounded-full outline-none mt-2 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:hover:scale-125 [&::-webkit-slider-thumb]:transition-transform"
                                />
                                <p className="text-xs text-text-muted mt-1">Khớp với tốc độ chạy của băng chuyền thực.</p>
                            </div>
                        </div>
                    )}
                </div>

            </div>

         
        </div>
    );
};

export default ControlPanel;
