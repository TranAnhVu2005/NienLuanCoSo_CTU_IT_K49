import React from 'react';

const Header: React.FC = () => {
    return (
        <div className="bg-emerald-600 p-6 text-center shadow-md relative z-10">
            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
                Hệ Thống Phân Tích Nông Sản AI
            </h1>
            <p className="mt-2 text-emerald-100 font-medium tracking-wide">
                Kiến trúc React, TypeScript & YOLOv8
            </p>
        </div>
    );
};

export default Header;