import React from 'react';

interface ControlPanelProps {
    status: string;
    mode: string;
    onStart: () => void;
    onStop: () => void;
    onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onVideoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    confidence: number;
    onConfidenceChange: (val: number) => void;
    apiUrl: string;
    onApiUrlChange: (url: string) => void;
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
    apiUrl,
    onApiUrlChange
}) => {
    return (
        <div className="flex flex-col gap-6 text-white bg-gray-800/80 backdrop-blur-md p-5 rounded-2xl border border-gray-700 shadow-lg">
            
            {/* 1. Trạng thái hoạt động */}
            <div>
                <h3 className="text-xs font-bold text-gray-400 tracking-wider uppercase mb-2">Trạng thái hệ thống</h3>
                <div className={`p-3.5 rounded-xl font-bold flex items-center justify-center gap-2 text-center transition-all border shadow-inner text-sm
                    ${status.includes('🔴') || status.includes('quét') ? 'bg-red-500/10 text-red-400 border-red-500/30' :
                        status.includes('✅') || status.includes('tất') ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                            'bg-gray-900/60 text-gray-400 border-gray-800'}`}>
                    <span className={`w-2 h-2 rounded-full ${
                        status.includes('🔴') || status.includes('quét') ? 'bg-red-400 animate-pulse' :
                        status.includes('✅') || status.includes('tất') ? 'bg-emerald-400' : 'bg-gray-500'
                    }`}></span>
                    {status}
                </div>
            </div>

            {/* 2. Nguồn dữ liệu đầu vào */}
            <div>
                <h3 className="text-xs font-bold text-gray-400 tracking-wider uppercase mb-3">Nguồn đầu vào</h3>
                <div className="space-y-3">
                    {mode === "idle" ? (
                        <div className="grid grid-cols-1 gap-2.5">
                            <button 
                                onClick={onStart} 
                                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white py-3 rounded-xl font-bold shadow-md transition-all active:scale-95 cursor-pointer text-sm"
                            >
                                <span>📷</span> Bật Camera Trực Tiếp
                            </button>
                            
                            <div className="grid grid-cols-2 gap-2">
                                <label className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-bold shadow-md transition-all cursor-pointer active:scale-95 text-xs text-center">
                                    <span>🖼️</span> Tải Ảnh
                                    <input type="file" accept="image/*" className="hidden" onChange={onImageUpload} />
                                </label>

                                <label className="flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-500 text-white py-3 rounded-xl font-bold shadow-md transition-all cursor-pointer active:scale-95 text-xs text-center">
                                    <span>🎬</span> Tải Video
                                    <input type="file" accept="video/*" className="hidden" onChange={onVideoUpload} />
                                </label>
                            </div>
                        </div>
                    ) : (
                        <button 
                            onClick={onStop} 
                            className="w-full flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-500 text-white py-3 rounded-xl font-bold shadow-lg transition-all active:scale-95 cursor-pointer text-sm animate-pulse"
                        >
                            <span>🛑</span> Ngắt Kết Nối & Dừng Quét
                        </button>
                    )}
                </div>
            </div>

            {/* 3. Cấu hình tham số */}
            <div className="border-t border-gray-700/50 pt-5 space-y-4">
                <h3 className="text-xs font-bold text-gray-400 tracking-wider uppercase mb-1">Cấu hình tham số AI</h3>
                
                {/* Confidence Threshold */}
                <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-300 font-medium">Ngưỡng tin cậy (Confidence)</span>
                        <span className="font-mono font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                            {Math.round(confidence * 100)}%
                        </span>
                    </div>
                    <input 
                        type="range" 
                        min="0.1" 
                        max="0.9" 
                        step="0.05"
                        value={confidence}
                        onChange={(e) => onConfidenceChange(parseFloat(e.target.value))}
                        className="w-full h-1.5 bg-gray-900 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                    <p className="text-[10px] text-gray-500">Giảm ngưỡng để nhận diện nhạy hơn (bắt được nhiều quả hơn) hoặc tăng lên để tránh nhận diện sai.</p>
                </div>

                {/* API Path URL */}
                <div className="space-y-1.5">
                    <label className="text-xs text-gray-300 font-medium block">Endpoint API YOLOv8</label>
                    <input 
                        type="text" 
                        value={apiUrl}
                        onChange={(e) => onApiUrlChange(e.target.value)}
                        className="w-full bg-gray-900/80 border border-gray-700 rounded-xl px-3 py-2 text-xs font-mono text-gray-300 focus:outline-none focus:border-emerald-500 transition-colors"
                        placeholder="http://localhost:8000/predict"
                    />
                </div>
            </div>

            {/* 4. Danh mục chú giải */}
            <div className="border-t border-gray-700/50 pt-5">
                <h3 className="text-xs font-bold text-gray-400 tracking-wider uppercase mb-3">Đối tượng nhận diện</h3>
                <div className="grid grid-cols-2 gap-2">
                    <div className="bg-gray-900/40 p-2.5 rounded-xl border border-gray-800 flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981]"></span>
                        <div className="flex flex-col">
                            <span className="text-[11px] font-bold text-gray-300">Cam tươi</span>
                            <span className="text-[9px] text-gray-500 font-mono">Fresh Orange</span>
                        </div>
                    </div>
                    <div className="bg-gray-900/40 p-2.5 rounded-xl border border-gray-800 flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_6px_#ef4444]"></span>
                        <div className="flex flex-col">
                            <span className="text-[11px] font-bold text-gray-300">Cam hỏng</span>
                            <span className="text-[9px] text-gray-500 font-mono">Rotten Orange</span>
                        </div>
                    </div>
                    <div className="bg-gray-900/40 p-2.5 rounded-xl border border-gray-800 flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981]"></span>
                        <div className="flex flex-col">
                            <span className="text-[11px] font-bold text-gray-300">Ớt chuông tươi</span>
                            <span className="text-[9px] text-gray-500 font-mono">Fresh Capsicum</span>
                        </div>
                    </div>
                    <div className="bg-gray-900/40 p-2.5 rounded-xl border border-gray-800 flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_6px_#ef4444]"></span>
                        <div className="flex flex-col">
                            <span className="text-[11px] font-bold text-gray-300">Ớt chuông hỏng</span>
                            <span className="text-[9px] text-gray-500 font-mono">Rotten Capsicum</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ControlPanel;