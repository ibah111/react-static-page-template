import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "./",
  // Настройки сервера разработки
  server: {
    // Автоматически открывать браузер при запуске
    open: true,
    // Автоматический перезапуск при изменении файлов
    watch: {
      usePolling: true,
    },
    // Hot Module Replacement
    hmr: {
      overlay: true,
    },
  },
  // Оптимизация сборки
});
