module.exports = {
  entry: {
    jQueryDemo: './dist/tests/jQueryDemo.js',
    SimpleTimeoutDemo: './dist/tests/SimpleTimeoutDemo.js'
  },

  output: {
    filename: './dist/tests/[name]Bundle.js',
    path: '.'
  }
};
