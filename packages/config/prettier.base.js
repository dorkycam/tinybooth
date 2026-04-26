// Shared Prettier base config consumed by every package.
/** @type {import('prettier').Config} */
export const prettierBase = {
  singleQuote: true,
  trailingComma: 'all',
  printWidth: 100,
  semi: true,
  tabWidth: 2,
  endOfLine: 'lf',
  arrowParens: 'always',
};

export default prettierBase;
