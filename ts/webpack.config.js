module.exports = {
  entry: {
    jQueryDemo: '../js/tests/jQueryDemo.js',
    SimpleTimeoutDemo: '../js/tests/SimpleTimeoutDemo.js'
  },

  output: {
    filename: '../js/tests/[name]Bundle.js',
    path: '.'
  }
};
