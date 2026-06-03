import React from 'react';


const Header: React.FC = () => {
    return (
        <div className="bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-700 px-6 py-5 md:px-8 shadow-md relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-emerald-500/20">
            <div className="flex flex-col text-left">
                <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2">
                    Produce Quality Analyzer
                </h1>
                <p className="text-emerald-100 text-xs md:text-sm font-medium opacity-90 tracking-wide mt-1">
                    Real-time inspection system driven by YOLOv8
                </p>
            </div>
        </div>
    );
};

export default Header;