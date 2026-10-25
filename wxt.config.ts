import { defineConfig } from "wxt";
import { readFileSync } from "node:fs";
import tailwindcss from "@tailwindcss/vite";

// See https://wxt.dev/api/reference/wxt/interfaces/inlineconfig.html
export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  manifest: {
    name: "Jukebox",
    description: "A new tab extension that shows your Spotify status",
    key: readFileSync("./keys/public-key.txt", "utf-8").trim(),
    host_permissions: ["https://suggestqueries.google.com/*"],
    permissions: ["search", "favicon", "identity", "storage"],
  },
  vite: () => ({ plugins: [tailwindcss()] }),
});
