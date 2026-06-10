import React, { createContext, useContext, useEffect, useState } from 'react';

// Định nghĩa kiểu dữ liệu cho theme (chỉ chấp nhận 'light' hoặc 'dark')
type Theme = 'light' | 'dark';

// Định nghĩa cấu trúc giá trị lưu trữ trong Context
interface ThemeContextValue {
  theme: Theme; // Theme hiện tại
  toggleTheme: () => void; // Hàm chuyển đổi giữa sáng và tối
}

// Khởi tạo Context với giá trị mặc định ban đầu là null
const ThemeContext = createContext<ThemeContextValue | null>(null);

// Key dùng để lưu trạng thái theme vào LocalStorage của trình duyệt
const STORAGE_KEY = 'veg_ai_theme';

// Provider bao bọc ứng dụng để quản lý và phân phối trạng thái theme
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Khởi tạo state theme: Ưu tiên lấy cấu hình cũ từ LocalStorage, 
  // nếu không có thì tự động phát hiện tùy chọn dark mode của hệ điều hành người dùng.
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  // Đồng bộ theme vào thuộc tính 'data-theme' của thẻ html (documentElement) và lưu lại vào LocalStorage mỗi khi theme thay đổi
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  // Hàm chuyển đổi trạng thái theme qua lại
  const toggleTheme = () => setTheme(prev => (prev === 'light' ? 'dark' : 'light'));

  return (
    // Cung cấp state theme và hàm toggleTheme cho toàn bộ các component con bên trong
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook giúp các component con lấy thông tin theme và đổi theme nhanh chóng, an toàn
export const useTheme = (): ThemeContextValue => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};
