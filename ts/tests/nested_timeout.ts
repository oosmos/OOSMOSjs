import { StateMachine } from '../OOSMOS';

class TimeoutTest extends StateMachine {
  constructor() {
    super({ DEFAULT: 'Outer',
      Outer: {
        ENTER() {
          this.Print('In state Outer');
          this.SetTimeoutSeconds(4);
        },
        TIMEOUT() {
          this.Transition('OuterTimeout');
        },
        COMPOSITE: {
          Inner: {
            ENTER() {
              this.Print('In state Outer.Inner');
              this.SetTimeoutSeconds(2);
            },
            TIMEOUT() {
              this.Transition('InnerTimeout');
            },
          },
        },
      },

      OuterTimeout: {
        ENTER() {
          this.Print('In state OuterTimeout');
          this.Assert(false);
        },
      },

      InnerTimeout: {
        ENTER() {
          this.Print('In state InnerTimeout');
          this.SetTimeoutSeconds(1);
        },
        TIMEOUT() {
          this.Transition('Outer');
        },
      },
    });
  }
}

const pTimeoutTest = new TimeoutTest();
pTimeoutTest.SetDebug(true);
pTimeoutTest.Start();
