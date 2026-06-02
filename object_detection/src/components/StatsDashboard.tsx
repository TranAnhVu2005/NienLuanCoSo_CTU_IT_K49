import React from 'react';
import type { Detection } from '../services/aiService';
import { getInfoForLabel } from '../utils/canvasHelper';

interface HistoryItem {
    id: string;
    timestamp: string;
    label: string;
    confidence: number;
    type: 'fresh' | 'rotten';
    labelVi: string;
}

interface StatsDashboardProps {
    detections: Detection[];
    history: HistoryItem[];
    onClearHistory: () => void;
    onExportCSV: () => void;
    onTakeSnapshot: () => void;
    mode: string;
}

const StatsDashboard: React.FC<StatsDashboardProps> = ({
    detections,
    history,
    onClearHistory,
    onExportCSV,
    onTakeSnapshot,
    mode
}) => {
    // Phân tích thống kê cho khung hình hiện tại
    const totalCurrent = detections.length;
    const freshCurrent = detections.filter(d => {
        const info = getInfoForLabel(d.label.toString());
        return !info.labelVi.includes('hỏng') && !d.label.toString().toLowerCase().includes('rotten');
    }).length;
    const rottenCurrent = totalCurrent - freshCurrent;

    // Tính điểm chất lượng nông sản trong khung hình hiện tại
    let qualityScore = 100;
    if (totalCurrent > 0) {
        qualityScore = Math.round((freshCurrent / totalCurrent) * 100);
    }

    return (
        <div className="flex flex-col gap-6 w-full text-white">
            {/* 1. Điểm số chất lượng & Thống kê số lượng */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4">
                
                {/* Vòng quay chất lượng */}
                <div className="bg-gray-800/80 backdrop-blur-md rounded-2xl p-5 border border-gray-700 flex flex-col items-center justify-center text-center shadow-lg">
                    <span className="text-gray-400 text-sm font-semibold tracking-wide uppercase mb-3">Điểm Chất Lượng Hiện Tại</span>
                    
                    <div className="relative flex items-center justify-center w-28 h-28">
                        {/* SVG vòng tròn SVG */}
                        <svg className="w-full h-full transform -rotate-90">
                            <circle
                                cx="56"
                                cy="56"
                                r="48"
                                className="stroke-gray-700"
                                strokeWidth="8"
                                fill="transparent"
                            />
                            <circle
                                cx="56"
                                cy="56"
                                r="48"
                                className={`transition-all duration-500 ${
                                    qualityScore >= 80 ? 'stroke-emerald-500' :
                                    qualityScore >= 50 ? 'stroke-amber-500' : 'stroke-rose-500'
                                }`}
                                strokeWidth="8"
                                fill="transparent"
                                strokeDasharray={2 * Math.PI * 48}
                                strokeDashoffset={2 * Math.PI * 48 * (1 - (totalCurrent > 0 ? qualityScore : 100) / 100)}
                                strokeLinecap="round"
                            />
                        </svg>
                        <div className="absolute flex flex-col items-center justify-center">
                            <span className="text-3xl font-extrabold tracking-tight">
                                {totalCurrent > 0 ? `${qualityScore}%` : 'N/A'}
                            </span>
                            {totalCurrent > 0 && (
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 ${
                                    qualityScore >= 80 ? 'bg-emerald-500/20 text-emerald-400' :
                                    qualityScore >= 50 ? 'bg-amber-500/20 text-amber-400' : 'bg-rose-500/20 text-rose-400'
                                }`}>
                                    {qualityScore >= 80 ? 'TỐT' : qualityScore >= 50 ? 'TRUNG BÌNH' : 'KÉM'}
                                </span>
                            )}
                        </div>
                    </div>
                    <p className="text-gray-400 text-xs mt-3 leading-relaxed">
                        {totalCurrent > 0 
                            ? `Phát hiện ${totalCurrent} vật thể (${freshCurrent} tốt, ${rottenCurrent} hỏng)`
                            : 'Chưa phát hiện vật thể nào trong khung hình.'}
                    </p>
                </div>

                {/* Các thẻ chỉ số chi tiết */}
                <div className="grid grid-cols-3 md:grid-cols-3 lg:grid-cols-3 gap-3">
                    <div className="bg-gray-800/80 backdrop-blur-md rounded-2xl p-4 border border-gray-700 flex flex-col items-center justify-center shadow-md">
                        <span className="text-gray-400 text-xs font-medium">Tổng số</span>
                        <span className="text-2xl font-black text-blue-400 mt-1">{totalCurrent}</span>
                    </div>
                    
                    <div className="bg-gray-800/80 backdrop-blur-md rounded-2xl p-4 border border-gray-700 flex flex-col items-center justify-center shadow-md border-b-4 border-b-emerald-500">
                        <span className="text-emerald-400 text-xs font-medium">Tươi tốt</span>
                        <span className="text-2xl font-black text-emerald-400 mt-1">{freshCurrent}</span>
                    </div>

                    <div className="bg-gray-800/80 backdrop-blur-md rounded-2xl p-4 border border-gray-700 flex flex-col items-center justify-center shadow-md border-b-4 border-b-rose-500">
                        <span className="text-rose-400 text-xs font-medium">Hư hỏng</span>
                        <span className="text-2xl font-black text-rose-400 mt-1">{rottenCurrent}</span>
                    </div>
                </div>
            </div>

            {/* 2. Danh sách vật thể trong khung hình hiện tại */}
            <div className="bg-gray-800/80 backdrop-blur-md rounded-2xl p-5 border border-gray-700 flex flex-col shadow-lg">
                <h3 className="text-sm font-semibold tracking-wider text-gray-300 uppercase mb-3 flex items-center justify-between">
                    <span>Vật Thể Trong Khung Hình</span>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                </h3>

                <div className="max-h-[160px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                    {totalCurrent === 0 ? (
                        <div className="text-center py-6 text-gray-500 text-sm italic">
                            Chưa quét được vật thể...
                        </div>
                    ) : (
                        detections.map((det, index) => {
                            const info = getInfoForLabel(det.label.toString());
                            const isRotten = info.labelVi.includes('hỏng');
                            return (
                                <div key={index} className="bg-gray-900/60 rounded-xl p-3 border border-gray-800 flex items-center justify-between hover:bg-gray-900 transition-colors">
                                    <div className="flex flex-col gap-1 w-2/3">
                                        <div className="flex items-center gap-1.5">
                                            <span className={`w-2 h-2 rounded-full ${isRotten ? 'bg-rose-500' : 'bg-emerald-500'}`}></span>
                                            <span className="font-bold text-sm text-gray-200">{info.labelVi}</span>
                                        </div>
                                        {/* Progress bar hiển thị độ tin cậy */}
                                        <div className="w-full bg-gray-800 rounded-full h-1.5 mt-1 overflow-hidden">
                                            <div 
                                                className={`h-full rounded-full transition-all duration-300 ${isRotten ? 'bg-rose-500' : 'bg-emerald-500'}`}
                                                style={{ width: `${det.confidence * 100}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                    <span className={`text-xs font-mono font-bold px-2 py-1 rounded ${
                                        isRotten ? 'text-rose-400 bg-rose-400/10' : 'text-emerald-400 bg-emerald-400/10'
                                    }`}>
                                        {Math.round(det.confidence * 100)}%
                                    </span>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* 3. Nhật ký phân tích hệ thống (Lịch sử) */}
            <div className="bg-gray-800/80 backdrop-blur-md rounded-2xl p-5 border border-gray-700 flex flex-col shadow-lg flex-1 min-h-[180px]">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold tracking-wider text-gray-300 uppercase">Nhật Ký Phân Tích</h3>
                    <span className="text-xs text-gray-500 font-mono">Đã lưu: {history.length}</span>
                </div>

                <div className="flex-1 max-h-[220px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                    {history.length === 0 ? (
                        <div className="text-center py-8 text-gray-500 text-sm italic">
                            Chưa có lịch sử phát hiện...
                        </div>
                    ) : (
                        history.map((item) => (
                            <div key={item.id} className="text-xs font-mono bg-gray-950/40 border border-gray-900/50 rounded-lg p-2.5 flex items-center justify-between text-gray-400 hover:text-gray-200 transition-colors">
                                <div className="flex items-center gap-2">
                                    <span className="text-gray-600 text-[10px]">{item.timestamp}</span>
                                    <span className={`font-semibold ${item.type === 'rotten' ? 'text-rose-400' : 'text-emerald-400'}`}>
                                        {item.labelVi}
                                    </span>
                                </div>
                                <span className="text-gray-500">Conf: {Math.round(item.confidence * 100)}%</span>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* 4. Hộp công cụ thao tác */}
            <div className="grid grid-cols-3 gap-2">
                <button
                    onClick={onTakeSnapshot}
                    disabled={mode === 'idle'}
                    className="flex flex-col items-center justify-center gap-1.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-40 disabled:hover:bg-sky-600 text-white p-3 rounded-xl font-bold shadow-md transition-all active:scale-95 text-xs cursor-pointer"
                    title="Chụp lại ảnh màn hình và khung nhận diện hiện tại"
                >
                    <span>📸 Snapshot</span>
                </button>

                <button
                    onClick={onExportCSV}
                    disabled={history.length === 0}
                    className="flex flex-col items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:hover:bg-emerald-600 text-white p-3 rounded-xl font-bold shadow-md transition-all active:scale-95 text-xs cursor-pointer"
                    title="Tải lịch sử nhận dạng về máy dưới dạng file CSV"
                >
                    <span>📊 Xuất CSV</span>
                </button>

                <button
                    onClick={onClearHistory}
                    disabled={history.length === 0}
                    className="flex flex-col items-center justify-center gap-1.5 bg-rose-600/80 hover:bg-rose-600 disabled:opacity-40 disabled:hover:bg-rose-600/80 text-white p-3 rounded-xl font-bold shadow-md transition-all active:scale-95 text-xs cursor-pointer"
                    title="Xóa toàn bộ dữ liệu thống kê tích lũy"
                >
                    <span>🗑️ Xóa Nhật Ký</span>
                </button>
            </div>
        </div>
    );
};

export default StatsDashboard;
