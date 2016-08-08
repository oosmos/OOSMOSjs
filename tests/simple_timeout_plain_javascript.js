var OOSMOS = require('./built/OOSMOS.js');

var TimeoutDemo = new OOSMOS.StateMachine({ DEFAULT: 'A',
  A: {
    ENTER: function() {
      this.SetTimeoutSeconds(4);
    },
    TIMEOUT: function() {
      this.Transition('B');
    } 
  },
  B: function() {
    var Timeouts = 0;

    return {
      ENTER: function() {
        this.SetTimeoutSeconds(1);
      },
      TIMEOUT: function() {
        Timeouts += 1;
        this.Transition('A');
      }
    };
  }  
});

TimeoutDemo.SetDebug(true);
TimeoutDemo.Start();
