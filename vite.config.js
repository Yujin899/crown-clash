import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite' // استيراد البلجن الجديد

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), // إضافة البلجن هنا
  ],
})