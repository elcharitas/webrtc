import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";
import { webSocketServer } from "./socket.js";

export default defineConfig({
  plugins: [sveltekit(), webSocketServer],
});
