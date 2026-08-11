// @ts-check
const eslint = require("@eslint/js");
const { defineConfig } = require("eslint/config");
const tseslint = require("typescript-eslint");
const angular = require("angular-eslint");

module.exports = defineConfig([
  {
    files: ["**/*.ts"],
    extends: [
      eslint.configs.recommended,
      tseslint.configs.recommended,
      angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      "@angular-eslint/prefer-on-push-component-change-detection": "off",
      "@angular-eslint/directive-selector": [
        "error",
        {
          type: "attribute",
          prefix: "app",
          style: "camelCase",
        },
      ],
      "@angular-eslint/component-selector": [
        "error",
        {
          type: "element",
          prefix: "app",
          style: "kebab-case",
        },
      ],
    },
  },
  {
    files: ["**/*.html"],
    extends: [
      angular.configs.templateRecommended,
      angular.configs.templateAccessibility,
    ],
    rules: {},
  },
  {
    files: ["src/app/shared/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["**/features/**"],
              message: "Shared must not depend on feature code.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/app/core/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["**/features/**"],
              message: "Core infrastructure must not depend on feature code.",
            },
          ],
        },
      ],
    },
  },
  {
    files: [
      "src/app/**/domain/**/*.ts",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@angular/**"],
              message: "Domain code must remain framework-agnostic and cannot depend on Angular.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/app/layout/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["**/features/**"],
              message: "Layout must not depend on feature code.",
            },
          ],
        },
      ],
    },
  },
]);
