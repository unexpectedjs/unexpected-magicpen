const pkg = require('./package.json');
const commonjs = require('rollup-plugin-commonjs');
const resolve = require('rollup-plugin-node-resolve');
const json = require('rollup-plugin-json');

const plugins = [commonjs(), resolve(), json()];

module.exports = [
  {
    input: pkg.main,
    output: {
      file: 'unexpected-magicpen.min.js',
      name: 'weknowhow.unexpectedMagicPen',
      format: 'umd',
      exports: 'named',
      legacy: true,
      strict: false,
    },
    plugins,
  },
  {
    input: pkg.main,
    output: {
      file: 'unexpected-magicpen.esm.js',
      format: 'esm',
      exports: 'named',
      strict: false,
    },
    plugins,
  },
];
