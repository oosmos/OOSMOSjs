var OOSMOS = require('../OOSMOS.js') ;

var TimeoutTest = new OOSMOS.StateMachine({ DEFAULT: 'Outer',
  Outer: {
    ENTER: function() {
      this.Print('In state Outer');
      this.SetTimeoutSeconds(4);
    },
    TIMEOUT: function() {
      this.Transition('OuterTimeout');
    },
    COMPOSITE: {
      Inner: {
        ENTER: function() {
          this.Print('In state Outer.Inner');
          this.SetTimeoutSeconds(2);
        },
        TIMEOUT: function() {
          this.Transition('InnerTimeout');
        }
      }
    }
  },

  OuterTimeout: {
    ENTER: function() {
      this.Print('In state OuterTimeout');
      this.Assert(false);
    }
  },

  InnerTimeout: {
    ENTER: function() {
      this.Print('In state InnerTimeout');
      this.SetTimeoutSeconds(1);
    },
    TIMEOUT: function() {
      this.Transition('Outer');
    }
  }
});

TimeoutTest.SetDebug(true);
TimeoutTest.Start();
