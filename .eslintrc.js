module.exports = {
  plugins: ['@typescript-eslint', 'prettier', 'import'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'plugin:prettier/recommended'
  ],
  globals: {
    'Atomics': 'readonly',
    'SharedArrayBuffer': 'readonly'
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    'ecmaVersion': 2019,
    'project': './tsconfig.json',
    'tsconfigRootDir': __dirname
  },
  env: {
    'es2021': true,
    'node': true
  },

  settings: {
    'import/parsers': {
      '@typescript-eslint/parser': ['.ts', '.tsx']
    },
    'import/resolver': {
      'node': {
        'extensions': ['.js', '.jsx', '.ts', '.tsx', '.json', '.vue']
      },
      'typescript': {
        'alwaysTryTypes': true
      }
    }
  },
  'rules': {
    'no-console': 'off',
    'no-debugger': 'off',
    'react/display-name': 0,
    'react/prop-types': 0,
    'react-hooks/exhaustive-deps': ['off'],
    'import/no-webpack-loader-syntax': ['off'],
    'prefer-promise-reject-errors': ['off'],
    'n/no-callback-literal': ['off'],
    'quote-props': ['off'],
    'func-call-spacing': ['off'],
    // 在并非旨在处理它们的地方禁止 Promises
    '@typescript-eslint/no-misused-promises': ['off'],
    // 要求适当处理类似 Promise 的语句
    '@typescript-eslint/no-floating-promises': ['off'],
    // 不允许等待不是 Thenable 的值
    '@typescript-eslint/await-thenable': ['off'],
    // 要求.toString()仅在字符串化时提供有用信息的对象上调用
    '@typescript-eslint/no-base-to-string': ['off'],
    // 强制使用简洁的可选链式表达式，而不是链式逻辑与、否定逻辑或或空对象
    '@typescript-eslint/prefer-optional-chain': ['off'],
    // 要求 void 类型的表达式出现在语句位置
    '@typescript-eslint/no-confusing-void-expression': ['off'],
    // 要求函数和类方法的显式返回类型
    '@typescript-eslint/explicit-function-return-type': ['off'],
    // 要求任何返回 Promise 的函数或方法被标记为异步
    '@typescript-eslint/promise-function-async': ['off'],
    // 强制一致地使用类型断言
    '@typescript-eslint/consistent-type-assertions': ['off'],
    // 禁止布尔表达式中的某些类型（后续打开，主要是规范此类情况 let str: string | null = null; if (!str)）
    '@typescript-eslint/strict-boolean-expressions': ['off'],
    // 强制使用无效合并运算符而不是逻辑链接
    '@typescript-eslint/prefer-nullish-coalescing': ['off'],
    // 禁止在 import 语句中使用 require 语句
    '@typescript-eslint/no-var-requires': ['off'],
    // 允许数组使用 for-in 循环（暂不打开）
    '@typescript-eslint/no-for-in-array': ['off'],
    // 强制模板文字表达式为string类型
    '@typescript-eslint/restrict-template-expressions': [
      'warn',
      {
        'allowNumber': true,
        'allowBoolean': true,
        'allowAny': true,
        'allowNever': true
      }
    ],
    // 要求加法的两个操作数是同一类型并且是bigint, number, 或string'（会有很多数字拼接字符串的情况如文件大小，暂不打开）
    '@typescript-eslint/restrict-plus-operands': ['off']
  }
};
