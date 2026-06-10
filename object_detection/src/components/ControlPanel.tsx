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
            <div className="bg-bg-surface border border-border-color rounded-lg p-[1.25rem] shadow-card transition-colors duration-300">
                <h3 className="flex items-center font-display text-base font-bold text-text-primary pl-[0.65rem] border-l-3 border-accent mb-4">System Controls</h3>
                
                <div className={`px-4 py-3 rounded-md text-[0.85rem] font-semibold flex items-center gap-[0.65rem] leading-snug border mb-4 transition-all duration-200 ${statusClass}`}>
                    {status.type === 'loading' && (
                        <svg className="animate-spin h-4 w-4 text-current flex-shrink-0" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                    )}
                    {status.type === 'active' && (
                        <span className="w-2.5 h-2.5 bg-danger rounded-full animate-pulse-ring flex-shrink-0" />
                    )}
                    {status.type === 'success' && (
                        <svg className="h-4 w-4 text-accent flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                    )}
                    {status.type === 'error' && (
                        <svg className="h-4 w-4 text-danger flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    )}
                    {status.type === 'idle' && (
                        <svg className="h-4 w-4 text-text-muted flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    )}
                    <span className="flex-1">{status.text}</span>
                </div>

                <div className="flex flex-col gap-3">
                    {mode === "idle" ? (
                        <>
                            <button onClick={onStart} className="inline-flex items-center justify-center gap-2 w-full py-[0.7rem] px-5 rounded-md font-semibold text-[0.88rem] cursor-pointer border border-transparent transition-all duration-200 bg-accent text-text-inverse hover:bg-accent-hover">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                                    <circle cx="12" cy="13" r="4"/>
                                </svg>
                                Start Camera
                            </button>
                            
                            <div className="grid grid-cols-2 gap-[0.65rem]">
                                <label className="inline-flex items-center justify-center gap-2 w-full py-[0.7rem] px-5 rounded-md font-semibold text-[0.88rem] cursor-pointer border transition-all duration-200 bg-bg-surface text-text-secondary border-border-color hover:bg-bg-muted hover:text-text-primary hover:border-border-accent">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="3" y="3" width="18" height="18" rx="2"/>
                                        <circle cx="8.5" cy="8.5" r="1.5"/>
                                        <path d="M21 15l-5-5L5 21"/>
                                    </svg>
                                    Photo
                                    <input type="file" accept="image/*" className="hidden" onChange={onImageUpload} />
                                </label>
                                <label className="inline-flex items-center justify-center gap-2 w-full py-[0.7rem] px-5 rounded-md font-semibold text-[0.88rem] cursor-pointer border transition-all duration-200 bg-bg-surface text-text-secondary border-border-color hover:bg-bg-muted hover:text-text-primary hover:border-border-accent">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <polygon points="23 7 16 12 23 17 23 7"/>
                                        <rect x="1" y="5" width="15" height="14" rx="2"/>
                                    </svg>
                                    Video
                                    <input type="file" accept="video/*" className="hidden" onChange={onVideoUpload} />
                                </label>
                            </div>
                        </>
                    ) : (
                        <button onClick={onStop} className="inline-flex items-center justify-center gap-2 w-full py-[0.7rem] px-5 rounded-md font-semibold text-[0.88rem] cursor-pointer border border-transparent transition-all duration-200 bg-danger text-text-inverse hover:opacity-90">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="3" width="18" height="18" rx="2"/>
                                <rect x="9" y="9" width="6" height="6" fill="currentColor"/>
                            </svg>
                            Stop Scanning
                        </button>
                    )}
                </div>

                <div className="border-none border-t border-dashed border-border-color my-4" />

                {/* Auto Scan Toggle */}
                <div className="flex items-center justify-between mt-4">
                    <div className="flex flex-col">
                        <span className="font-semibold text-[0.88rem] text-text-primary">Auto Scan</span>
                        <span className="text-[0.75rem] text-text-muted mt-[0.1rem]">Trực tiếp quét khi phát hiện</span>
                    </div>
                    <label className="relative inline-block w-[42px] h-[22px] flex-shrink-0 cursor-pointer">
                        <input 
                            type="checkbox" 
                            checked={autoScan} 
                            onChange={(e) => setAutoScan(e.target.checked)} 
                            className="sr-only peer"
                        />
                        <span className="absolute inset-0 bg-border-color rounded-full transition-colors duration-300 peer-checked:bg-accent peer-focus:ring-1 peer-focus:ring-accent"></span>
                        <span className="absolute left-[3px] bottom-[3px] w-4 h-4 bg-bg-surface rounded-full transition-transform duration-300 peer-checked:translate-x-5"></span>
                    </label>
                </div>

                {/* Object Counting Toggle */}
                <div className="flex items-center justify-between mt-4">
                    <div className="flex flex-col">
                        <span className="font-semibold text-[0.88rem] text-text-primary">Object Counting</span>
                        <span className="text-[0.65rem] font-bold text-accent bg-accent-soft px-[0.25rem] py-[0.05rem] rounded-sm mt-[0.15rem] self-start">BETA</span>
                    </div>
                    <label className="relative inline-block w-[42px] h-[22px] flex-shrink-0 cursor-pointer">
                        <input 
                            type="checkbox" 
                            checked={objectCounting} 
                            onChange={(e) => setObjectCounting(e.target.checked)} 
                            className="sr-only peer"
                        />
                        <span className="absolute inset-0 bg-border-color rounded-full transition-colors duration-300 peer-checked:bg-accent peer-focus:ring-1 peer-focus:ring-accent"></span>
                        <span className="absolute left-[3px] bottom-[3px] w-4 h-4 bg-bg-surface rounded-full transition-transform duration-300 peer-checked:translate-x-5"></span>
                    </label>
                </div>

                <div className="border-none border-t border-dashed border-border-color my-4" />

                {/* AI / Conveyor Settings */}
                {activeTab === 'static' ? (
                    <div className="mt-5">
                        <div className="flex justify-between items-center text-[0.84rem] font-semibold mb-2">
                            <span>AI Sensitivity</span>
                            <span className="text-accent font-bold">{sensitivityVal}%</span>
                        </div>
                        <input
                            type="range"
                            min="10"
                            max="90"
                            step="5"
                            value={sensitivityVal}
                            onChange={handleSensitivityChange}
                            className="w-full h-1.5 appearance-none bg-bg-muted rounded-full outline-none my-2 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-[18px] [&::-webkit-slider-thumb]:h-[18px] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-bg-surface [&::-webkit-slider-thumb]:shadow-sm [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:duration-100 [&::-webkit-slider-thumb]:hover:scale-115"
                        />
                        <p className="text-[0.75rem] text-text-muted leading-relaxed mt-1">
                            Tăng độ nhạy để nhận diện dễ hơn; giảm để tránh phát hiện sai.
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        <div className="mt-5" style={{ marginTop: 0 }}>
                            <div className="flex justify-between items-center text-[0.84rem] font-semibold mb-2">
                                <span>Sensor Line Y</span>
                                <span className="text-accent font-bold">{sensorLineY}%</span>
                            </div>
                            <input
                                type="range"
                                min="10"
                                max="90"
                                step="1"
                                value={sensorLineY}
                                onChange={(e) => onSensorLineYChange(parseInt(e.target.value))}
                                className="w-full h-1.5 appearance-none bg-bg-muted rounded-full outline-none my-2 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-[18px] [&::-webkit-slider-thumb]:h-[18px] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-bg-surface [&::-webkit-slider-thumb]:shadow-sm [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:duration-100 [&::-webkit-slider-thumb]:hover:scale-115"
                            />
                            <p className="text-[0.75rem] text-text-muted leading-relaxed mt-1">Điều chỉnh vạch cảm biến ảo trên màn hình.</p>
                        </div>
                        <div className="mt-5" style={{ marginTop: 0 }}>
                            <div className="flex justify-between items-center text-[0.84rem] font-semibold mb-2">
                                <span>Conveyor Speed</span>
                                <span className="text-accent font-bold">{conveyorSpeed.toFixed(1)} m/s</span>
                            </div>
                            <input
                                type="range"
                                min="0.1"
                                max="2.0"
                                step="0.1"
                                value={conveyorSpeed}
                                onChange={(e) => onConveyorSpeedChange(parseFloat(e.target.value))}
                                className="w-full h-1.5 appearance-none bg-bg-muted rounded-full outline-none my-2 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-[18px] [&::-webkit-slider-thumb]:h-[18px] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-bg-surface [&::-webkit-slider-thumb]:shadow-sm [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:duration-100 [&::-webkit-slider-thumb]:hover:scale-115"
                            />
                            <p className="text-[0.75rem] text-text-muted leading-relaxed mt-1">Tốc độ ảnh hưởng tới tần suất quả chạy qua vạch.</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Recognition Categories Panel */}
            <div className="bg-bg-surface border border-border-color rounded-lg p-[1.25rem] shadow-card transition-colors duration-300">
                <h3 className="flex items-center font-display text-base font-bold text-text-primary pl-[0.65rem] border-l-3 border-accent mb-4">Recognition Categories</h3>
                <div className="flex flex-col gap-[0.65rem] mt-3">
                    <div className="flex items-center gap-3 py-[0.65rem] px-[0.85rem] rounded-md border border-border-color bg-bg-surface transition-all duration-200 hover:-translate-y-[1px] hover:shadow-sm">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 bg-accent" />
                        <div className="flex flex-col">
                            <span className="font-semibold text-[0.88rem] text-text-primary">Fresh Tomato</span>
                            <span className="text-[0.75rem] text-text-muted font-mono">tomato_fresh_v1</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 py-[0.65rem] px-[0.85rem] rounded-md border border-danger/25 bg-danger-soft transition-all duration-200 hover:-translate-y-[1px] hover:shadow-sm">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 bg-danger" />
                        <div className="flex flex-col">
                            <span className="font-semibold text-[0.88rem] text-danger">Rotten Apple</span>
                            <span className="text-[0.75rem] text-danger/80 font-mono">apple_rotten_v2</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 py-[0.65rem] px-[0.85rem] rounded-md border border-border-color bg-bg-surface transition-all duration-200 hover:-translate-y-[1px] hover:shadow-sm">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 bg-accent" />
                        <div className="flex flex-col">
                            <span className="font-semibold text-[0.88rem] text-text-primary">Fresh Orange</span>
                            <span className="text-[0.75rem] text-text-muted font-mono">orange_fresh_v1</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 py-[0.65rem] px-[0.85rem] rounded-md border border-border-color bg-bg-surface transition-all duration-200 hover:-translate-y-[1px] hover:shadow-sm">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 bg-accent" />
                        <div className="flex flex-col">
                            <span className="font-semibold text-[0.88rem] text-text-primary">Fresh Capsicum</span>
                            <span className="text-[0.75rem] text-text-muted font-mono">capsicum_fresh_v1</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ControlPanel;
