import React from 'react';
import ThemeToggle from './ThemeToggle';
import Logo from '../assets/img/logo.svg';
import Background from '../assets/img/background.jpg';

const Header: React.FC = () => {
    return (
        <header className="relative bg-bg-surface border-b border-border-color flex items-center justify-between px-6 py-4 transition-colors duration-300 min-h-20 overflow-hidden">

            {/* === LỚP ẢNH NỀN (GHOST BACKGROUND) === */}
            <div
                className="absolute inset-0 z-0 opacity-70 pointer-events-none"
                style={{
                    backgroundImage: `url(${Background})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                }}
            ></div>

            {/* Lớp phủ Gradient giúp phần đặt Logo và Text không bị nhiễu bởi chi tiết của ảnh */}
            <div className="absolute inset-0 z-0 bg-linear-to-r from-bg-surface via-bg-surface/80 to-transparent pointer-events-none"></div>

            {/* === NỘI DUNG CHÍNH (NỔI LÊN TRÊN VỚI z-10) === */}
            <div className="relative z-10 flex items-center">
                <img src={Logo} alt="AgriLens Logo" className="w-20 h-20 mr-4 object-contain drop-shadow-sm rounded-full" />

                <div className="flex flex-col md:flex-row md:items-center">
                    <h1 className="font-display text-[2rem] font-bold text-accent tracking-tight flex items-center gap-2 m-0">
                        AgriLens
                    </h1>
                    <span className="text-[1rem] text-text-muted mt-1 md:mt-0 font-medium md:ml-[0.65rem] md:border-l border-border-color md:pl-[0.65rem] inline-block">
                        Quality Inspector
                    </span>
                </div>
            </div>

            <div className="relative z-10 flex items-center gap-4">
                <ThemeToggle />
            </div>

        </header>
    );
};

export default Header;