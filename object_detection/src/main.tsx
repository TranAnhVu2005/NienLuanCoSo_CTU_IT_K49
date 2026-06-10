import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css' // Import styles chính cho toàn bộ giao diện dự án
import App from './App.tsx' // Component chính chứa cấu trúc layout dashboard
import { ThemeProvider } from './context/ThemeContext' // Context quản lý giao diện sáng/tối (Light/Dark theme)

// Tạo gốc render của ứng dụng React và gắn vào thẻ div#root trong file index.html
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* Bao bọc ứng dụng trong ThemeProvider để tất cả component con có thể truy cập theme */}
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>,
)
