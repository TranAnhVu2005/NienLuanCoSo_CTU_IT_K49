import React from 'react';
import ThemeToggle from './ThemeToggle';

const Header: React.FC = () => {
    return (
        <header className="h-[60px] bg-bg-surface border-b border-border-color flex items-center justify-between px-6 flex-shrink-0 transition-colors duration-300">
            <div className="flex items-center">
                <h1 className="font-display text-[1.35rem] font-bold text-accent tracking-tight flex items-center gap-2 before:content-[''] before:inline-block before:w-3 before:h-3 before:bg-accent before:rounded-[3px] before:rotate-45 m-0">
                    Real-time System for Agricultural Produce Monitoring and Quality Inspection.</h1>
                <span className="text-[0.78rem] text-text-muted mt-1 font-medium ml-[0.65rem] border-l border-border-color pl-[0.65rem] inline-block">
                    Quality Inspector
                </span>
            </div>
            <div className="flex items-center gap-4">
                <ThemeToggle />
            </div>
        </header>
    );
};

export default Header;