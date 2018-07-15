import buble from 'rollup-plugin-buble';

export default {
  input: 'index.js',
  output: {
    file: 'build/d3-gup.js',
    format: 'umd',
    name: 'd3',
    globals: {
      "d3-selection": "d3"
    },
  },
  plugins: [
    buble({
      transforms: {
        dangerousForOf: true
      }
    })
  ]
};
