import buble from 'rollup-plugin-buble';

export default {
  input: 'index.js',
  output: {
    file: 'build/d3-gup.js',
    format: 'umd',
    extend: true,
    name: 'd3',
    globals: {
      "d3-selection": "d3",
      "d3-transition": "d3",
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
