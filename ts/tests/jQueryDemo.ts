import { StateMachine } from '../OOSMOS';
import * as $ from 'jquery';

class jQueryDemo extends StateMachine {
  constructor() {
    super({ DEFAULT: 'Idle',
      Idle: {
        ENTER() {
          $('#Idle').show();

          $('#eStart').click(() => { this.Transition('Active'); });
        },

        EXIT() {
          $('#eStart').unbind('click');

          $('#Idle').hide();
        },
      },

      Active: {
        ENTER() {
          $('#Active').show();

          $('#eStop').click(() => { this.Transition('Idle');   });
          $('#eReset').click(() => { this.Transition('Active'); });
        },

        EXIT() {
          $('#eStop').unbind('click');
          $('#eReset').unbind('click');

          $('#Active').hide();
        },

        COMPOSITE: { DEFAULT: 'A',
          A() {
            const $A = $('#A');
            const $AA = $('#AA');

            return {
              ENTER() {
                $A.show();

                $('#eA2B').click(() => { this.Transition('Active.B'); });
                $('#eA2BB').click(() => { this.Transition('Active.B.BB'); });
              },

              EXIT() {
                $('#eA2B').unbind('click');
                $('#eA2BB').unbind('click');

                $A.hide();
              },

              COMPOSITE: {
                AA: {
                  ENTER() {
                    $AA.show();

                    $('#eAA2B').click(() => { this.Transition('Active.B'); });
                    $('#eAA2BB').click(() => { this.Transition('Active.B.BB'); });
                  },

                  EXIT() {
                    $('#eAA2B').unbind('click');
                    $('#eAA2BB').unbind('click');

                    $AA.hide();
                  },
                },
              },
            };
          },

          B() {
            const $B  = $('#B');
            const $BB = $('#BB');

            return {
              ENTER() {
                $B.show();
              },

              EXIT() {
                $B.hide();
              },

              COMPOSITE: {
                BB: {
                  ENTER() {
                    $BB.show();
                  },

                  EXIT() {
                    $BB.hide();
                  },
                },
              },
            };
          },
        },
      },
    });
  }
}

const jQueryDemoObject = new jQueryDemo();
jQueryDemoObject.SetDebug(true, 'debugTest');
jQueryDemoObject.Start();
