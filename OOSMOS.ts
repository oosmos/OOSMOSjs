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

module Lib {
interface iState {
  ENTER?: () => void;
  EXIT?: () => void;
  TIMEOUT?: () => void;
  COMPOSITE?: iComposite | (() => iComposite); 
  //[EventString: string]: () => void;
  // Private
  DOTPATH?: string;
}

interface iComposite {
  DEFAULT?: string;
  [StateName: string]: iState | (() => iState);
}

class cOOSMOS {
   // Principle interface
   Transition: (To:string) => void;
   Start: () => void;
   IsIn: (StateDotPath:string) => boolean;
   Event: (EventString: string) => void;
   SetTimeoutSeconds: (TimeoutSeconds: number) => void;   
   // Support interface
   Restart: () => void;
   Extend: (From:iState) => iState;
   DebugPrint: (String:string) => void;
   SetDebug: (DebugMode:boolean, DebugID?:string, MaxLinesOut?:number, ScrollIntoView?:boolean) => void;
   Print: (String:string) => void;
   Assert: (Condition:boolean, Message:string) => void;
   Alert: (Message:string) => void;
}

export function OOSMOS(Composite : iComposite):cOOSMOS {
  'use strict';

  let m_ROOT:iState = { COMPOSITE: Composite };
  let m_State:iState;
  let m_Timeouts: { [StateName: string]: number; } = {};
  let m_Interval:number;
  let m_EventSourceState:iState;

  let m_DotPath2State:{[DotStateName : string] : iState} = {};

  let m_DebugMode:boolean = false;
  let m_InBrowser:boolean = typeof(window) !== 'undefined';

  if (m_InBrowser) {
    var m_DebugID:string;
    var m_LinesOut:number = 0;
    var m_MaxLinesOut:number;
    var m_ScrollIntoView:boolean;
  }

  function InstrumentStateMachine() {
    let StateStack:string[] = [];

    function InstrumentComposite(Composite:iComposite) {
      let StateName:string;

      for (StateName in Composite) {
        if (StateName === 'DEFAULT') {
          continue;
        }

        if (typeof(Composite[StateName]) === 'function') {
          Composite[StateName] = (<()=>iComposite>Composite[StateName])();
        }

        InstrumentState(Composite[StateName], StateName);
      }

      //
      // If there is only one state in the composite, set the
      // DEFAULT so the user doesn't have to.
      //
      if (Object.keys(Composite).length === 1) {
        Composite.DEFAULT = StateName;
      }
      else {
        if (!Composite.DEFAULT) {
          this.Alert('You must specify a DEFAULT if there are more than one state in the composite.');
        }
      }
    }

    function InstrumentState(State:iState, StateName:string) {
      if (State.ENTER && typeof(State.ENTER) !== 'function') {
        this.Alert('ENTER must be a function.');
      }

      if (State.EXIT && typeof(State.EXIT) !== 'function') {
        this.Alert('EXIT must be a function.');
      }

      if (typeof(State.COMPOSITE) === 'function') {
        State.COMPOSITE = (<()=>iComposite>State.COMPOSITE)();
      }

      StateStack.push(StateName);
        State.DOTPATH = StateStack.join('.');
        m_DotPath2State[State.DOTPATH] = State;

        if (State.COMPOSITE) {
          InstrumentComposite(<iComposite>State.COMPOSITE);
        }
      StateStack.pop();
    }

    InstrumentState(m_ROOT, 'ROOT');
  };

  function StripROOT(StateName:string) {
    return StateName.replace('ROOT.', '');
  }

  function EnterDefaultStates(Composite:iComposite) {
    m_State = Composite[Composite.DEFAULT];

    this.DebugPrint('==> '+StripROOT(m_State.DOTPATH));

    if (m_State.ENTER) {
      m_State.ENTER.call(this);
    }

    if (m_State.COMPOSITE) {
      EnterDefaultStates.call(this, m_State.COMPOSITE);
    }
  }

  function CalculateLCA(StringA:string, StringB:string):string {
    const A = StringA.split('.');
    const B = StringB.split('.');

    let Iterations = Math.min(A.length, B.length);
    let Return:string[] = [];

    for (let I = 0; I < Iterations && A[I] === B[I]; I++) {
      Return.push(A[I]);
    }

    return Return.join('.');
  }

  return {
    Transition: function(To) {
      if (m_EventSourceState === undefined) {
        m_EventSourceState = m_State;
      }

      To = 'ROOT.'+To;

      this.DebugPrint('TRANSITION: '+StripROOT(m_EventSourceState.DOTPATH) + ' -> ' + StripROOT(To));

      let LCA = CalculateLCA(m_EventSourceState.DOTPATH, To);

      //
      // Self-transition is a special case.
      //
      if (To === LCA) {
        let A = LCA.split('.');
        A.splice(-1, 1); // Remove last element, in place.
        LCA = A.join('.');
      }
  
      let Args = Array.prototype.splice.call(arguments, 1);

      function EnterStates(From:string, To:string) {
        if (From === To) {
          return;
        }

        let FromArray = From.split('.');
        let ToSuffix = To.replace(From+'.', '');
        let ToArray  = ToSuffix.split('.');
        let StatePath:string;

        do {
          FromArray.push(ToArray.shift());

          StatePath = FromArray.join('.');
          m_State = m_DotPath2State[StatePath];

          this.DebugPrint('--> '+StripROOT(StatePath));

          if (m_State.ENTER) {
            m_State.ENTER.apply(this, Args);
          }
        } while (StatePath !== To);
      }

      function ExitStates(To:string, From:string) {
        let FromArray = From.split('.');

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

      if (m_DotPath2State[m_State.DOTPATH].COMPOSITE) {
        EnterDefaultStates.call(this, m_DotPath2State[m_State.DOTPATH].COMPOSITE);
      }

      m_EventSourceState = undefined;
    },

    Start: function() {
      InstrumentStateMachine();
      EnterDefaultStates.call(this, m_ROOT.COMPOSITE);
    },

    Restart: function() {
      m_State            = undefined;
      m_Timeouts         = {};
      m_Interval         = undefined;
      m_EventSourceState = undefined;
      m_DotPath2State    = {};
    
      if (m_InBrowser) {
        document.getElementById(m_DebugID).innerHTML = '';
        m_LinesOut = 0;
      }
    
      this.Start();
    },

    IsIn: function(StateDotPath) {
      StateDotPath = 'ROOT.'+StateDotPath;

      if (StateDotPath === m_State.DOTPATH) {
        return true;
      }

      const Beginning = StateDotPath+'.';

      return m_State.DOTPATH.substr(0, Beginning.length) === Beginning;
    },

    Event: function(EventString) {
      const CandidateStatePath = m_State.DOTPATH.split('.');

      while (CandidateStatePath.length > 0) {
        let CandidateStateDotPath = CandidateStatePath.join('.');
        let CandidateState = m_DotPath2State[CandidateStateDotPath];

        if (EventString in CandidateState) {
          this.DebugPrint('EVENT: '+EventString+' sent to '+StripROOT(m_State.DOTPATH));

          let EventFunc = <()=>void>CandidateState[EventString];

          if (EventFunc) {
            let Args = Array.prototype.splice.call(arguments, 1);

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
        let that = this;

        let IntervalTick = function () {
          for (let StateDotPath in m_Timeouts) {
            m_Timeouts[StateDotPath] -= 1;

            if (m_Timeouts[StateDotPath] <= 0) {
              let State = m_DotPath2State[StateDotPath];
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

    Extend: function(From: { [index: string]: iState; } ) {
      let To:{ [index: string]: iState; } = this;

      Object.keys(From).forEach(function(key) {
        To[key] = From[key];
      });

      return To;
    },

    DebugPrint: function(String) {
      if (m_DebugMode) {
        this.Print(String);
      }
    },

    SetDebug: function(DebugMode, DebugID?, MaxLinesOut?, ScrollIntoView?) {
      if (typeof(DebugMode) !== 'boolean') {
        this.Alert('First argument of SetDebug must be a boolean value. Defaulting to false.');
        DebugMode = false;
      }

      m_DebugMode = DebugMode;

      if (m_InBrowser) {
        if (DebugID === undefined) {
          this.Alert('DebugID must be set to the ID of a <div> element.');
          return;
        }

        m_DebugID = DebugID;
        m_MaxLinesOut = MaxLinesOut || 200;
        m_ScrollIntoView = ScrollIntoView || false;
      }
    },

    Print: function(String) {
      if (!m_InBrowser) {
        console.log(String);
        return;
      }

      let DebugDIV = document.getElementById(m_DebugID);
      let TextDIV  = document.createElement('div');
      let Text     = document.createTextNode(String);

      TextDIV.appendChild(Text);
      DebugDIV.appendChild(TextDIV);

      function IsVisible(Element:HTMLElement) {
        const Rect       = Element.getBoundingClientRect();
        const ViewHeight = Math.max(document.documentElement.clientHeight, window.innerHeight);

        return !(Rect.bottom < 0 || Rect.top - ViewHeight >= 0);
      }

      if (m_ScrollIntoView && IsVisible(DebugDIV)) {
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
    }
  };
}
}

declare var exports: any;
if (typeof exports != 'undefined') {
  exports.OOSMOS = Lib.OOSMOS;
}
