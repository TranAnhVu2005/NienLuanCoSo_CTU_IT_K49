import React from 'react';
import type { Detection } from '../services/aiService';
import { getInfoForLabel } from '../utils/canvasHelper';

interface StatsDashboardProps {
    detections: Detection[];
    onTakeSnapshot: () => void;
    mode: string;
    activeTab: 'static' | 'conveyor';
    conveyorTotal: number;
    conveyorFresh: number;
    conveyorRotten: number;
    onResetConveyor: () => void;
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
    // 1. Logic tính toán giữ nguyên 100%
    const totalCurrent = detections.length;
    const freshCurrent = detections.filter(d => {
        const info = getInfoForLabel(d.label);
        return !info.labelEn.toLowerCase().includes('rotten');
    }).length;
    const rottenCurrent = totalCurrent - freshCurrent;

    const isConveyor = activeTab === 'conveyor';
    const totalToShow = isConveyor ? conveyorTotal : totalCurrent;
    const freshToShow = isConveyor ? conveyorFresh : freshCurrent;
    const rottenToShow = isConveyor ? conveyorRotten : rottenCurrent;

    return (
        <div className="bg-bg-surface border border-border-color rounded-2xl shadow-sm p-5 md:p-6 flex flex-col gap-5">
            
            {/* --- HEADER --- */}
            <div className="flex justify-center items-center gap-3">
                <h3 className="font-display text-lg font-bold text-text-primary tracking-tight m-0">
                    Live Summary
                </h3>
            </div>

            {/* --- METRICS GRID --- */}
            <div className="grid grid-cols-2 gap-3">
                
                {/* Khối Total: Chiếm trọn 2 cột ở trên cùng */}
                <div className="col-span-2 p-4 rounded-xl border border-border-color/50 bg-bg-muted/30 flex flex-col items-center justify-center gap-1 transition-transform hover:-translate-y-0.5">
                    <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Total Detected</span>
                    <span className="font-display text-4xl font-bold text-text-primary leading-none">
                        {totalToShow.toLocaleString()}
                    </span>
                </div>

                {/* Khối Qualified (Bên trái) */}
                <div className="p-4 rounded-xl border border-accent/20 bg-accent/5 flex flex-col items-center justify-center gap-1 transition-transform hover:-translate-y-0.5">
                    <span className="text-xs font-bold text-accent/80 uppercase tracking-wider">Qualified</span>
                    <span className="font-display text-2xl font-bold text-accent leading-none">
                        {freshToShow.toLocaleString()}
                    </span>
                </div>

                {/* Khối Defect (Bên phải) */}
                <div className="p-4 rounded-xl border border-danger/20 bg-danger/5 flex flex-col items-center justify-center gap-1 transition-transform hover:-translate-y-0.5">
                    <span className="text-xs font-bold text-danger/80 uppercase tracking-wider">Defect</span>
                    <span className="font-display text-2xl font-bold text-danger leading-none">
                        {rottenToShow.toLocaleString()}
                    </span>
                </div>

            </div>

            {/* --- ACTIONS --- */}
            <div className="flex gap-3 mt-1">
                {isConveyor && (
                    <button
                        onClick={onResetConveyor}
                        className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-semibold text-sm cursor-pointer border border-border-color bg-bg-surface text-text-secondary transition-all duration-200 hover:bg-bg-muted hover:text-text-primary"
                        title="Reset counters"
                    >
                        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                        </svg>
                        Reset Tally
                    </button>
                )}
                <button
                    onClick={onTakeSnapshot}
                    disabled={mode === 'idle'}
                    className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-semibold text-sm cursor-pointer border border-border-color bg-bg-surface text-text-secondary transition-all duration-200 hover:bg-bg-muted hover:text-accent hover:border-accent/50 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Capture image overlay"
                >
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                        <circle cx="12" cy="13" r="4" />
                    </svg>
                    Save View
                </button>
            </div>
               {/* Recognition Categories Panel */}
            <div className="bg-bg-surface border border-border-color rounded-lg shadow-card transition-colors duration-300">
                <h3 className="mt-5 ml-5 flex items-center font-display text-base font-bold text-text-primary pl-[0.65rem] border-l-3 border-accent mb-4">Recognition Categories</h3>
                <div className="flex flex-col gap-[0.65rem] mt-3">
                    <div className="flex items-center gap-3 py-[0.65rem] px-[0.85rem] rounded-md bg-bg-surface transition-all duration-200 hover:shadow-sm">
                        <div className="flex flex-col">
                            <span className="font-semibold text-[0.88rem] text-text-primary">1. Fresh Apple</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 py-[0.65rem] px-[0.85rem] rounded-md  bg-bg-surface transition-all duration-200 hover:shadow-sm">
                        <div className="flex flex-col">
                            <span className="font-semibold text-[0.88rem]">2. Rotten Apple</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 py-[0.65rem] px-[0.85rem] rounded-md bg-bg-surface transition-all duration-200 hover:shadow-sm">
                        <div className="flex flex-col">
                            <span className="font-semibold text-[0.88rem] text-text-primary">3. Fresh Orange</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 py-[0.65rem] px-[0.85rem] rounded-md bg-bg-surface transition-all duration-200 hover:shadow-sm">
                        <div className="flex flex-col">
                            <span className="font-semibold text-[0.88rem] text-text-primary">4. Rotten Orange</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 py-[0.65rem] px-[0.85rem] rounded-md  bg-bg-surface transition-all duration-200 hover:shadow-sm">
                        <div className="flex flex-col">
                            <span className="font-semibold text-[0.88rem] text-text-primary">5. Fresh Capsicum</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 py-[0.65rem] px-[0.85rem] rounded-md  bg-bg-surface transition-all duration-200 hover:shadow-sm">
                        <div className="flex flex-col">
                            <span className="font-semibold text-[0.88rem] text-text-primary">6. Rotten Capsicum</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StatsDashboard;