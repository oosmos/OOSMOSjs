///<reference path='./typings/jquery/jqueryui.d.ts'/>
///<reference path='./typings/jquery/jquery.d.ts'/>
///<reference path='./typings/reference_OOSMOS.d.ts'/>

class jQueryDemo extends StateMachine {
  constructor() {
    super({ DEFAULT: 'Idle',
      Idle: {
        ENTER: function() {
          $('#Idle').show();

          var that = this;
          $('#eStart').click(function() { that.Transition('Active'); });
        },

        EXIT: function() {
          $('#eStart').unbind('click');

          $('#Idle').hide();
        }
      },

      Active: {
        ENTER: function() {
          $('#Active').show();

          var that = this;
          $('#eStop').click(function()    { that.Transition('Idle');   });
          $('#eRestart').click(function() { that.Transition('Active'); });
        },

        EXIT: function() {
          $('#eStop').unbind('click');
          $('#eRestart').unbind('click');

          $('#Active').hide();
        },

        COMPOSITE: { DEFAULT: 'A',
          A: function() {
            var $A = $('#A');
            var $AA = $('#AA');

            return {
              ENTER: function() {
                $A.show();
      
                var that = this;
                $('#eA2B').click(function()  { that.Transition('Active.B');    });
                $('#eA2BB').click(function() { that.Transition('Active.B.BB'); });
              },
      
              EXIT: function() {
                $('#eA2B').unbind('click');
                $('#eA2BB').unbind('click');
      
                $A.hide();
              },

              COMPOSITE: {
                AA: {
                  ENTER: function() {
                    $AA.show();
      
                    var that = this;
                    $('#eAA2B').click(function()  { that.Transition('Active.B');    });
                    $('#eAA2BB').click(function() { that.Transition('Active.B.BB'); });
                  },
          
                  EXIT: function() {
                    $('#eAA2B').unbind('click');
                    $('#eAA2BB').unbind('click');
      
                    $AA.hide();
                  }
                }
              }
            };
          },

          B: function() {
            var $B  = $('#B');
            var $BB = $('#BB');

            return {
              ENTER: function() {
                $B.show();
              },
      
              EXIT: function() {
                $B.hide();
              },
      
              COMPOSITE: {
                BB: {
                  ENTER: function() {
                    $BB.show();
                  },
      
                  EXIT: function() {
                    $BB.hide();
                  }
                }
              }
            };
          }
        }
      }
    });
  }
}

const jQueryDemoObject = new jQueryDemo();
jQueryDemoObject.SetDebug(true, 'debugTest');
jQueryDemoObject.Start();
