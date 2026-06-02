import React from 'react';

// Định nghĩa những Props mà App.tsx bắt buộc phải truyền vào
interface ControlPanelProps {
    status: string;
    mode: string;
    onStart: () => void;
    onStop: () => void;
    onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onVideoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
    status, mode, onStart, onStop, onImageUpload, onVideoUpload
}) => {
    return (
        <div className="flex flex-col gap-6">
            <div className={`p-4 rounded-xl font-bold flex items-center justify-center text-center transition-colors shadow-inner border 
                ${status.includes('🔴') ? 'bg-red-50 text-red-600 border-red-200' :
                    status.includes('✅') ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                        'bg-gray-100 text-gray-600 border-gray-200'}`}>
                {status}
            </div>

            <div className="space-y-4">
                {mode === "idle" ? (
                    <button onClick={onStart} className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white py-3.5 rounded-xl font-bold shadow-md transition-all active:scale-95">
                        <span>📷</span> Bật Camera
                    </button>
                ) : (
                    <button onClick={onStop} className="w-full flex items-center justify-center gap-2 bg-rose-500 hover:bg-rose-600 text-white py-3.5 rounded-xl font-bold shadow-md transition-all active:scale-95">
                        <span>🛑</span> Tắt Camera/Video
                    </button>
                )}

                <label className="w-full flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white py-3.5 rounded-xl font-bold shadow-md transition-all cursor-pointer active:scale-95">
                    <span>🖼️</span> Tải Ảnh Lên
                    <input type="file" accept="image/*" className="hidden" onChange={onImageUpload} />
                </label>

                <label className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white py-3.5 rounded-xl font-bold shadow-md transition-all cursor-pointer active:scale-95">
                    <span>🎬</span> Tải Video Lên
                    <input type="file" accept="video/*" className="hidden" onChange={onVideoUpload} />
                </label>
            </div>
        </div>
    );
};

export default ControlPanel;