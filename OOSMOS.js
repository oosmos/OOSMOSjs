/*\
|*| The MIT License (MIT)
|*|
|*| Copyright (c) 2016 Mark J Glenn and OOSMOS, LLC
|*|
|*| Permission is hereby granted, free of charge, to any person obtaining a copy
|*| of this software and associated documentation files (the "Software"), to deal
|*| in the Software without restriction, including without limitation the rights
|*| to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
|*| copies of the Software, and to permit persons to whom the Software is
|*| furnished to do so, subject to the following conditions:
|*|
|*| The above copyright notice and this permission notice shall be included in all
|*| copies or substantial portions of the Software.
|*|
|*| THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
|*| IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
|*| FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
|*| AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
|*| LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
|*| OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
|*| SOFTWARE.
\*/

var OOSMOS = function(Region) {
  'use strict';

  var m_ROOT = { REGION: Region };
  var m_State;
  var m_Timeouts = [];
  var m_Interval;
  var m_EventSourceState;
  var m_DotPath2State = {};
  var m_DebugMode = false;
  var m_InBrowser = typeof(window) !== 'undefined';

  if (m_InBrowser) {
    var m_DebugID;
    var m_LinesOut    = 0;
    var m_MaxLinesOut;
  }

  (function InstrumentStateMachine() {
    var StateStack = [];

    function InstrumentRegion(Region) {
      var StateName;

      for (StateName in Region) {
        if (StateName === 'DEFAULT') {
          continue;
        }

        if (typeof(Region[StateName]) === 'function') {
          Region[StateName] = Region[StateName]();
        }

        InstrumentState(Region[StateName], StateName);
      }

      //
      // If there is only one state in the region, set the
      // DEFAULT so the user doesn't have to.
      //
      if (Object.keys(Region).length === 1) {
        Region.DEFAULT = StateName;
      }
      else {
        if (!Region.DEFAULT) {
          this.Alert('You must specify a DEFAULT if there are more than one state in the region.');
        }
      }
    }

    function InstrumentState(State, StateName) {
      if (State.ENTER && typeof(State.ENTER) !== 'function') {
        this.Alert('ENTER must be a function.');
      }

      if (State.EXIT && typeof(State.EXIT) !== 'function') {
        this.Alert('EXIT must be a function.');
      }

      if (typeof(State.REGION) === 'function') {
        State.REGION = State.REGION();
      }

      StateStack.push(StateName);
        State.DOTPATH = StateStack.join('.');
        m_DotPath2State[StateStack.join('.')] = State;

        if (State.REGION) {
          InstrumentRegion(State.REGION);
        }
      StateStack.pop();
    }

    InstrumentState(m_ROOT, 'ROOT');
  }());

  function StripROOT(StateName) {
    return StateName.replace('ROOT.', '');
  }

  function EnterDefaultStates(Region) {
    m_State = Region[Region.DEFAULT];

    this.DebugPrint('==> '+StripROOT(m_State.DOTPATH));

    if (m_State.ENTER) {
      m_State.ENTER.call(this);
    }

    if (m_State.REGION) {
      EnterDefaultStates.call(this, m_State.REGION);
    }
  }

  function CalculateLCA(StringA, StringB) {
    var A = StringA.split('.');
    var B = StringB.split('.');

    var Iterations = Math.min(A.length, B.length);
    var Return = [];

    for (var I = 0; I < Iterations && A[I] === B[I]; I++) {
      Return.push(A[I]);
    }

    return Return.join('.');
  }

  return {
    Transition: function(To) {
      if (m_EventSourceState === undefined) {
        this.Alert('You must only transition within an OOSMOS event handler.');
        return;
      }

      To = 'ROOT.'+To;

      this.DebugPrint('TRANSITION: '+StripROOT(m_EventSourceState.DOTPATH) + ' -> ' + StripROOT(To));

      var LCA = CalculateLCA(m_EventSourceState.DOTPATH, To);

      //
      // Self-transition is a special case.
      //
      if (To === LCA) {
        var A = LCA.split('.');
        A.splice(-1, 1); // Remove last element, in place.
        LCA = A.join('.');
      }
  
      var Args = Array.prototype.splice.call(arguments, 1);

      function EnterStates(From, To) {
        if (From === To) {
          return;
        }

        var FromArray = From.split('.');
        var ToSuffix = To.replace(From+'.', '');
        var ToArray  = ToSuffix.split('.');

        do {
          FromArray.push(ToArray.shift());

          var StatePath = FromArray.join('.');
          m_State = m_DotPath2State[StatePath];

          this.DebugPrint('--> '+StripROOT(StatePath));

          if (m_State.ENTER) {
            m_State.ENTER.apply(this, Args);
          }
        } while (StatePath !== To);
      }

      function ExitStates(To, From) {
        var FromArray = From.split('.');

        while (To !== From) {
          m_State = m_DotPath2State[From];

          this.DebugPrint('    '+StripROOT(From)+'-->');

          if (m_State.EXIT) {
            m_State.EXIT.call(this);
          }

          if (m_Timeouts[m_State.DOTPATH]) {
            this.DebugPrint('Delete Timeout: '+m_State.DOTPATH+' '+m_Timeouts[m_State.DOTPATH]);
            delete m_Timeouts[m_State.DOTPATH];
          }

          FromArray.splice(-1, 1);  // Remove last item, in place.
          From = FromArray.join('.');
        }
      }

      ExitStates.call(this, LCA, m_State.DOTPATH);
      EnterStates.call(this, LCA, To);

      if (m_DotPath2State[m_State.DOTPATH].REGION) {
        EnterDefaultStates.call(this, m_DotPath2State[m_State.DOTPATH].REGION);
      }
    },

    Start: function() {
      EnterDefaultStates.call(this, m_ROOT.REGION);
    },

    IsIn: function(StateDotPath) {
      StateDotPath = 'ROOT.'+StateDotPath;

      if (StateDotPath === m_State.DOTPATH) {
        return true;
      }

      var Beginning = StateDotPath+'.';

      return m_State.DOTPATH.substr(0, Beginning.length) === Beginning;
    },

    Event: function(EventString) {
      var CandidateStatePath = m_State.DOTPATH.split('.');

      while (CandidateStatePath.length > 0) {
        var CandidateStateDotPath = CandidateStatePath.join('.');
        var CandidateState = m_DotPath2State[CandidateStateDotPath];

        if (EventString in CandidateState) {
          this.DebugPrint('EVENT: '+EventString+' sent to '+StripROOT(m_State.DOTPATH));

          var EventFunc = CandidateState[EventString];

          if (EventFunc) {
            var Args = Array.prototype.splice.call(arguments, 1);

            m_EventSourceState = CandidateState;
              EventFunc.apply(this, Args);
            m_EventSourceState = undefined;
          }

          return;
        }

        CandidateStatePath.splice(-1, 1); // Remove last element
      }

      this.DebugPrint('EVENT: '+EventString+'. No handler from '+StripROOT(m_State.DOTPATH));
    },

    SetTimeoutSeconds: function(TimeoutSeconds) {
      m_Timeouts[m_State.DOTPATH] = TimeoutSeconds;

      if (m_Interval === undefined) {
        var that = this;

        var IntervalTick = function () {
          for (var StateDotPath in m_Timeouts) {
            m_Timeouts[StateDotPath] -= 1;

            if (m_Timeouts[StateDotPath] <= 0) {
              var State = m_DotPath2State[StateDotPath];
              m_EventSourceState = m_State;
              that.DebugPrint('Delete Timeout: '+m_State.DOTPATH+' '+m_Timeouts[StateDotPath]);
              delete m_Timeouts[StateDotPath];

              if (State.TIMEOUT) {
                State.TIMEOUT.call(that);
              }
            }
          }
        };

        m_Interval = setInterval(IntervalTick, 1000);
      }

      this.DebugPrint('SetTimeoutSeconds:'+m_State.DOTPATH+' '+TimeoutSeconds);
    },

    DebugPrint: function(String) {
      if (m_DebugMode) {
        this.Print(String);
      }
    },

    SetDebug: function(DebugMode, DebugID, MaxLinesOut) {
      m_DebugMode = DebugMode || false;

      if (m_InBrowser) {
        m_DebugID = DebugID;
        m_MaxLinesOut = MaxLinesOut || 1000;
      }
    },

    Print: function(String) {
      if (!m_InBrowser) {
        console.log(String);
        return;
      }

      var DebugDIV = document.getElementById(m_DebugID);
      var TextDIV  = document.createElement('div');
      var Text     = document.createTextNode(String);
      TextDIV.appendChild(Text);
      DebugDIV.appendChild(TextDIV);

      function IsVisible(Element) {
        var Rect       = Element.getBoundingClientRect();
        var ViewHeight = Math.max(document.documentElement.clientHeight, window.innerHeight);

        return !(Rect.bottom < 0 || Rect.top - ViewHeight >= 0);
      }

      if (IsVisible(DebugDIV)) {
        TextDIV.scrollIntoView(false);
      }

      m_LinesOut += 1;

      if (m_LinesOut > m_MaxLinesOut) {
        DebugDIV.removeChild(DebugDIV.childNodes[0]);
      }
    },

    Assert: function(Condition, Message) {
      if (!Condition) {
        this.Alert(Message || 'Assertion failed');
      }
    },

    Alert: function(Message) {
      if (m_InBrowser) {
        window.alert(Message);
      }
      else {
        console.log(Message);
      }
    },
  }
};

if (typeof(window) === 'undefined') {
  module.exports = OOSMOS;
}
