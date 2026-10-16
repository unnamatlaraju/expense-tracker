import { fileURLToPath } from "node:url"
import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    // The logic under test is pure/Node-only, so no browser environment needed.
    environment: "node",
    include: ["**/*.test.ts"],
  },
  resolve: {
    // Mirror the `@/*` path alias from tsconfig without an extra plugin.
    alias: { "@": fileURLToPath(new URL("./", import.meta.url)) },
  },
})
