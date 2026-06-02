import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwinds from "@tailwindcss/vite";
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),],
})
