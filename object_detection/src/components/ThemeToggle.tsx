import React from 'react';
import { useTheme } from '../context/ThemeContext';

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="border border-border-color bg-bg-muted rounded-pill p-1 cursor-pointer transition-all duration-200 hover:border-border-accent hover:-translate-y-[1px]"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Light mode' : 'Dark mode'}
    >
      <span className="flex items-center gap-[0.35rem]">
        <span className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 text-white ${isDark ? 'bg-[#3b82f6]' : 'bg-[#f59e0b]'}`}>
          {isDark ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2"/>
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          )}
        </span>
        <span className="text-[0.78rem] font-semibold text-text-secondary pr-1">{isDark ? 'Dark' : 'Light'}</span>
      </span>
    </button>
  );
};

export default ThemeToggle;
