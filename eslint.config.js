import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import autoImports from "./.wxt/eslint-auto-imports.mjs";

export default tseslint.config(
  { ignores: [".output/", ".wxt/", "node_modules/"] },
  autoImports,
  js.configs.recommended,
  ...tseslint.configs.recommended,
  reactHooks.configs.flat.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      globals: { ...globals.browser },
    },
  },
  {
    files: ["*.config.ts", "web-ext.config.ts"],
    languageOptions: {
      globals: { ...globals.node },
    },
  },
);
