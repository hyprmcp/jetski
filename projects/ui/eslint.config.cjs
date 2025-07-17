// @ts-check
const tseslint = require("typescript-eslint");
const rootConfig = require("../../eslint.config.cjs");

module.exports = tseslint.config(...rootConfig);
