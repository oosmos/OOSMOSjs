import { StateMachine } from '../OOSMOS';

class TimeoutTest extends StateMachine {
  constructor() {
    super({ DEFAULT: 'A',
      A: {
        ENTER() {
          this.Print("In state A");
          this.SetTimeoutSeconds(4);
        },
        TIMEOUT() {
          this.Transition('B');
        },
      },

      B: {
        ENTER() {
          this.Print("In state B");
          this.SetTimeoutSeconds(1);
        },
        TIMEOUT() {
          this.Transition('A');
        },
      },
    });
  }
}

const pTimeoutTest = new TimeoutTest();
pTimeoutTest.SetDebug(true, 'debugFSM');
pTimeoutTest.Start();
