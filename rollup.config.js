import buble from 'rollup-plugin-buble';

export default {
  entry: 'index.js',
  dest: 'build/d3-gup.js',
  format: 'umd',
  moduleName: 'd3',
  name: 'd3',
  plugins: [
    buble({
      transforms: {
        dangerousForOf: true
      }
    })
  ]
};
