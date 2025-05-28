/*
 * @Author: 
 * @Description: 
 * @Date: 2025-05-28 18:31:55
 * @LastEditTime: 2025-05-28 18:33:46
 * @FilePath: /my-workspaces/DragScrollTag/.eslintrc.js
 */
module.exports = {
  root: true,
  env: {
    node: true
  },
  extends: [
    'plugin:vue/essential',
    'eslint:recommended'
  ],
  parserOptions: {
    parser: 'babel-eslint'
  },
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off'
  }
}