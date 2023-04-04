import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "/haunted-house/", // replace with the repo name
  assetsInclude: ["**/*.gltf"],
});
