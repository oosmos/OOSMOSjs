var OOSMOS = require('../dist/OOSMOS.js');

var TimeoutTest = new OOSMOS.StateMachine({ DEFAULT: 'A',
  A: {
    ENTER: function() {
      this.Print("In state A");
      this.SetTimeoutSeconds(4);
    },
    TIMEOUT: function() {
      this.Transition('B');
    }
  },

  B: {
    ENTER: function() {
      this.Print("In state B");
      this.SetTimeoutSeconds(1);
    },
    TIMEOUT: function() {
      this.Transition('A');
    }
  }
});

TimeoutTest.SetDebug(true);
TimeoutTest.Start();
