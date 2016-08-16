import { StateMachine } from '../OOSMOS';

class TimeoutTest extends StateMachine {
  constructor() {
    super({ DEFAULT: 'A',
      A: {
        ENTER: function() {
          this.Print("In state A");
          this.SetTimeoutSeconds(4);
        },
        TIMEOUT: function() {
          this.Transition('B');
        },
      },

      B: {
        ENTER: function() {
          this.Print("In state B");
          this.SetTimeoutSeconds(1);
        },
        TIMEOUT: function() {
          this.Transition('A');
        },
      },
    });
  }
}

const pTimeoutTest = new TimeoutTest();
pTimeoutTest.SetDebug(true, 'debugFSM');
pTimeoutTest.Start();
