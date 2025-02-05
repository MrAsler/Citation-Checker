import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  base: "/citation-checker/", // Replace with your repository name
  root: path.resolve(__dirname, "src/client"), // Specify the custom directory for index.html
  plugins: [tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src/client"),
    },
  },
});
