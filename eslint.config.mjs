import nextConfig from "eslint-config-next";

const eslintConfig = [
  ...nextConfig,
  {
    ignores: [
      "node_modules/**",
      "ubuntu-pools-phase1/**",
      ".next/**",
      ".cache/**",
      "quickstart/**",
      ".local/**",
    ],
  },
];

export default eslintConfig;
