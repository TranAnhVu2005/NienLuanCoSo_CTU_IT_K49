import React, { type RefObject } from 'react';

// Định nghĩa kiểu cho các Ref được truyền từ App.tsx xuống
interface CameraScreenProps {
    videoRef: RefObject<HTMLVideoElement | null>;
    canvasRef: RefObject<HTMLCanvasElement | null>;
    mode: string;
}

const CameraScreen: React.FC<CameraScreenProps> = ({ videoRef, canvasRef, mode }) => {
    return (
        <div className="flex flex-col items-center justify-center bg-gray-900 rounded-2xl overflow-hidden min-h-[400px] border-[4px] border-gray-800 shadow-2xl relative w-full">

            {/* Video gốc chạy ngầm, luôn bị ẩn */}
            <video ref={videoRef} autoPlay playsInline muted className="hidden" />

            {/* Canvas đè lên trên để vẽ đồ họa */}
            <canvas ref={canvasRef} className="max-w-full max-h-[600px] object-contain z-10 block" />

            {/* Lớp phủ màn hình chờ khi hệ thống chưa bật */}
            {mode === 'idle' && (
                <div className="absolute inset-0 flex items-center justify-center bg-black">
                    <span className="text-gray-500 font-medium tracking-widest uppercase opacity-50">
                        [ Màn hình tắt ]
                    </span>
                </div>
            )}
        </div>
    );
};

export default CameraScreen;