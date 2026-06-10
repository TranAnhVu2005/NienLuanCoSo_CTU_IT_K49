import React from 'react';
import type { Detection } from '../services/aiService';
import { getInfoForLabel } from '../utils/canvasHelper';



// Khai báo các Props nhận vào cho dashboard thống kê ở cột bên phải
interface StatsDashboardProps {
    detections: Detection[]; // Các đối tượng phát hiện từ AI trong khung hình hiện tại
    onTakeSnapshot: () => void; // Hàm chụp ảnh màn hình lưu lại
    mode: string; // Chế độ quét ('idle', 'camera', 'image', 'video')
    activeTab: 'static' | 'conveyor'; // Tab hoạt động ('static': tĩnh, 'conveyor': băng chuyền)
    conveyorTotal: number; // Tổng số lượng nông sản chạy qua băng chuyền
    conveyorFresh: number; // Số lượng nông sản tươi trên băng chuyền
    conveyorRotten: number; // Số lượng nông sản hỏng trên băng chuyền
    onResetConveyor: () => void; // Hàm reset bộ đếm băng chuyền về 0
}

const StatsDashboard: React.FC<StatsDashboardProps> = ({
    detections,
    onTakeSnapshot,
    mode,
    activeTab,
    conveyorTotal,
    conveyorFresh,
    conveyorRotten,
    onResetConveyor,
}) => {
    // 1. Tính toán thống kê từ dữ liệu khung hình tĩnh hiện tại
    const totalCurrent = detections.length;
    // Lọc ra số quả đạt chất lượng bằng cách kiểm tra tên nhãn không chứa từ khóa 'rotten' (hỏng)
    const freshCurrent = detections.filter(d => {
        const info = getInfoForLabel(d.label);
        return !info.labelEn.toLowerCase().includes('rotten');
    }).length;
    const rottenCurrent = totalCurrent - freshCurrent;

    // 2. Lựa chọn giá trị hiển thị lên màn hình tùy thuộc vào Tab đang kích hoạt
    const isConveyor = activeTab === 'conveyor';
    // Nếu là băng chuyền: Lấy giá trị đếm tích lũy. Nếu là tĩnh: Lấy số lượng của khung hình hiện tại.
    const totalToShow = isConveyor ? conveyorTotal : totalCurrent;
    const freshToShow = isConveyor ? conveyorFresh : freshCurrent;
    const rottenToShow = isConveyor ? conveyorRotten : rottenCurrent;

    return (
        <div className="flex flex-col gap-4">
            {/* THREE LARGE METRICS CARDS */}
            <div className="flex items-center gap-4 p-[1.1rem] rounded-lg border border-border-color bg-bg-surface transition-all duration-200 hover:-translate-y-[2px] hover:shadow-md border-l-4 border-l-info">
                <div className="w-11 h-11 rounded-md flex items-center justify-center flex-shrink-0 bg-info-soft text-info">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                    </svg>
                </div>
                <div className="flex flex-col">
                    <span className="text-[0.78rem] font-bold text-text-muted uppercase tracking-wider">Total Detected</span>
                    <span className="font-display text-[1.75rem] font-bold text-text-primary leading-[1.1] mt-[0.15rem]">
                        {totalToShow.toLocaleString()}
                    </span>
                </div>
            </div>

            <div className="flex items-center gap-4 p-[1.1rem] rounded-lg border border-border-color bg-bg-surface transition-all duration-200 hover:-translate-y-[2px] hover:shadow-md border-l-4 border-l-accent">
                <div className="w-11 h-11 rounded-md flex items-center justify-center flex-shrink-0 bg-accent-soft text-accent">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                </div>
                <div className="flex flex-col">
                    <span className="text-[0.78rem] font-bold text-text-muted uppercase tracking-wider">Qualified Count</span>
                    <span className="font-display text-[1.75rem] font-bold text-accent leading-[1.1] mt-[0.15rem]">
                        {freshToShow.toLocaleString()}
                    </span>
                </div>
            </div>

            <div className="flex items-center gap-4 p-[1.1rem] rounded-lg border border-border-color bg-bg-surface transition-all duration-200 hover:-translate-y-[2px] hover:shadow-md border-l-4 border-l-danger">
                <div className="w-11 h-11 rounded-md flex items-center justify-center flex-shrink-0 bg-danger-soft text-danger">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="15" y1="9" x2="9" y2="15" />
                        <line x1="9" y1="9" x2="15" y2="15" />
                    </svg>
                </div>
                <div className="flex flex-col">
                    <span className="text-[0.78rem] font-bold text-text-muted uppercase tracking-wider">Defect Count</span>
                    <span className="font-display text-[1.75rem] font-bold text-danger leading-[1.1] mt-[0.15rem]">
                        {rottenToShow.toLocaleString()}
                    </span>
                </div>
            </div>


            {/* ACTIONS */}
            <div className="flex gap-[0.65rem] mt-1">
                {isConveyor && (
                    <button
                        onClick={onResetConveyor}
                        className="inline-flex items-center justify-center gap-2 w-full py-[0.7rem] px-5 rounded-md font-semibold text-[0.88rem] cursor-pointer border transition-all duration-200 bg-transparent text-text-secondary border-border-color hover:bg-bg-muted hover:text-text-primary flex-1"
                        title="Reset counters"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                        </svg>
                        Reset Tally
                    </button>
                )}
                <button
                    onClick={onTakeSnapshot}
                    disabled={mode === 'idle'}
                    className="inline-flex items-center justify-center gap-2 w-full py-[0.7rem] px-5 rounded-md font-semibold text-[0.88rem] cursor-pointer border transition-all duration-200 bg-bg-surface text-text-secondary border-border-color hover:bg-bg-muted hover:text-text-primary hover:border-border-accent disabled:opacity-50 disabled:cursor-not-allowed flex-1"
                    title="Capture image overlay"
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                        <circle cx="12" cy="13" r="4" />
                    </svg>
                    Save View
                </button>
            </div>
        </div>
    );
};

export default StatsDashboard;
