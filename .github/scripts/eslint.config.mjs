// Delivery tooling is standalone Node code, independent of either application's plugins.
export default [{
  files: ["**/*.cjs", "**/*.mjs"],
  languageOptions: {
    ecmaVersion: 2022,
    globals: { require: "readonly", module: "readonly", process: "readonly" },
  },
  rules: {
    "no-undef": "error",
    "no-unused-vars": "error",
    "no-unreachable": "error",
    "valid-typeof": "error",
    "no-constant-condition": "error",
  },
}];
