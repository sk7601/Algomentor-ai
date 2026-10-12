import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Separate frontend app (own package/eslint config) and generated Prisma client:
    "frontend/**",
    "src/generated/**",
    // Reference copy of the upstream project (git-ignored, not built):
    ".audit-upstream/**",
  ]),
]);

export default eslintConfig;
