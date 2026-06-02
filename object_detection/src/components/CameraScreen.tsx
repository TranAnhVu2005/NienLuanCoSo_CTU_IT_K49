import React, { type RefObject } from 'react';

interface CameraScreenProps {
    videoRef: RefObject<HTMLVideoElement | null>;
    canvasRef: RefObject<HTMLCanvasElement | null>;
    mode: string;
}

const CameraScreen: React.FC<CameraScreenProps> = ({ videoRef, canvasRef, mode }) => {
    return (
        <div className="flex flex-col items-center justify-center bg-slate-950 rounded-2xl overflow-hidden min-h-[440px] border-4 border-gray-800 shadow-2xl relative w-full group">
            
            {/* Lớp phủ lưới công nghệ cao (HUD Grid overlay) */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(18,24,38,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(18,24,38,0.1)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none z-20"></div>

            {/* Khung góc HUD trang trí công nghệ cao */}
            <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-emerald-500/60 pointer-events-none z-20"></div>
            <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-emerald-500/60 pointer-events-none z-20"></div>
            <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-emerald-500/60 pointer-events-none z-20"></div>
            <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-emerald-500/60 pointer-events-none z-20"></div>

            {/* Video gốc chạy ngầm, luôn bị ẩn */}
            <video ref={videoRef} autoPlay playsInline muted className="hidden" />

            {/* Canvas đè lên trên để vẽ đồ họa */}
            <canvas ref={canvasRef} className="max-w-full max-h-[560px] object-contain z-10 block" />

            {/* Nhãn trạng thái hiển thị góc màn hình (HUD Status) */}
            {mode !== 'idle' && (
                <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                    <span className={`w-2.5 h-2.5 rounded-full animate-ping ${
                        mode === 'camera' ? 'bg-rose-500' :
                        mode === 'video' ? 'bg-amber-500' : 'bg-blue-500'
                    }`}></span>
                    <span className={`w-2.5 h-2.5 rounded-full absolute ${
                        mode === 'camera' ? 'bg-rose-500' :
                        mode === 'video' ? 'bg-amber-500' : 'bg-blue-500'
                    }`}></span>
                    <span className="text-[10px] font-bold font-mono tracking-wider text-gray-200 uppercase">
                        {mode === 'camera' ? 'LIVE CAMERA' :
                         mode === 'video' ? 'PROCESSING VIDEO' :
                         'IMAGE ANALYZED'}
                    </span>
                </div>
            )}

            {/* Lớp phủ màn hình chờ khi hệ thống chưa bật */}
            {mode === 'idle' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-950/95 z-30 px-6 text-center">
                    {/* Biểu tượng ống kính Camera kết hợp vòng quét radar */}
                    <div className="relative flex items-center justify-center w-20 h-20 rounded-full border-2 border-dashed border-gray-700 mb-5 text-gray-600">
                        <div className="absolute inset-2 rounded-full bg-gray-900 border border-gray-800 flex items-center justify-center">
                            <span className="text-3xl">📹</span>
                        </div>
                    </div>
                    
                    <h4 className="text-gray-300 font-extrabold tracking-wide uppercase text-sm">
                        Màn Hình Giám Sát AI
                    </h4>
                    <p className="text-gray-500 text-xs mt-2 max-w-sm leading-relaxed">
                        Vui lòng kích hoạt camera trực tiếp hoặc tải lên tập tin (ảnh/video) ở bảng điều khiển để bắt đầu quét nông sản.
                    </p>
                </div>
            )}
        </div>
    );
};

export default CameraScreen;