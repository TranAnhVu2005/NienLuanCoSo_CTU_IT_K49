import React from 'react';

interface HeaderProps {
    pingStatus: 'online' | 'offline' | 'checking';
    onCheckPing: () => void;
}

const Header: React.FC<HeaderProps> = ({ pingStatus, onCheckPing }) => {
    return (
        <div className="bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-700 px-6 py-5 md:px-8 shadow-md relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-emerald-500/20">
            <div className="flex flex-col text-left">
                <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2">
                    🍎 HỆ THỐNG PHÂN TÍCH CHẤT LƯỢNG NÔNG SẢN AI
                </h1>
                <p className="text-emerald-100 text-xs md:text-sm font-medium opacity-90 tracking-wide mt-1">
                    Hỗ trợ phân loại Cam và Ớt chuông trực tiếp bằng YOLOv8 & Computer Vision
                </p>
            </div>

            {/* Trạng thái kết nối API */}
            <div className="flex items-center gap-3 bg-black/25 backdrop-blur-sm px-4 py-2 rounded-2xl border border-white/10 self-start md:self-auto">
                <span className="text-[11px] font-bold text-emerald-200 tracking-wider uppercase">API Backend:</span>
                
                <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${
                        pingStatus === 'online' ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' :
                        pingStatus === 'offline' ? 'bg-rose-500 shadow-[0_0_8px_#f43f5e]' :
                        'bg-amber-400 animate-pulse'
                    }`}></span>
                    <span className={`text-xs font-bold font-mono tracking-wide ${
                        pingStatus === 'online' ? 'text-emerald-400' :
                        pingStatus === 'offline' ? 'text-rose-400' :
                        'text-amber-400'
                    }`}>
                        {pingStatus === 'online' ? 'CONNECTED' :
                         pingStatus === 'offline' ? 'DISCONNECTED' :
                         'CHECKING...'}
                    </span>
                </div>

                <button 
                    onClick={onCheckPing}
                    className="p-1 rounded-lg text-emerald-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                    title="Kiểm tra lại kết nối"
                >
                    🔄
                </button>
            </div>
        </div>
    );
};

export default Header;