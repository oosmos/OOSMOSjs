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

export interface iState {
  ENTER?: () => void;
  EXIT?: () => void;
  TIMEOUT?: () => void;
  COMPOSITE?: iComposite | (() => iComposite);
  [EventString: string]: (() => void) /* Use 'any' only to avoid assignment error. */ | any;
  // Private
  DOTPATH?: string;
}

export interface iComposite {
  DEFAULT?: string;
  [StateName: string]: iState | (() => iState) /* Use 'any' only to avoid assignment error. */ | any;
}

export class StateMachine {
  private m_ROOT: iState;
  private m_State: iState;
  private m_Timeouts: { [StateName: string]: number } = {};
  private m_Interval: number;
  private m_EventSourceState: iState;
  private m_DotPath2State: {[DotStateName: string]: iState} = {};
  private m_DebugMode: boolean = false;
  private m_InBrowser: boolean = typeof(window) !== 'undefined';

  private m_DebugID: string;
  private m_LinesOut: number = 0;
  private m_MaxLinesOut: number;
  private m_ScrollIntoView: boolean;

  constructor(Composite: iComposite) {
    this.m_ROOT = { COMPOSITE: Composite };
  }

  private InstrumentStateMachine() {
    let StateStack: string[] = [];

    function InstrumentComposite(Composite: iComposite) {
      let StateName: string;

      for (StateName in Composite) {
        if (StateName === 'DEFAULT') {
          continue;
        }

        if (typeof(Composite[StateName]) === 'function') {
          Composite[StateName] = (<() => iComposite> Composite[StateName])();
        }

        InstrumentState.call(this, Composite[StateName], StateName);
      }

      //
      // If there is only one state in the composite, set the
      // DEFAULT so the user doesn't have to.
      //
      if (Object.keys(Composite).length === 1) {
        Composite.DEFAULT = Object.keys(Composite)[0];
      } else {
        if (!Composite.DEFAULT) {
          this.Alert('You must specify a DEFAULT if there are more than one state in the composite.');
        }
      }
    }

    function InstrumentState(State: iState, StateName: string) {
      if (State.ENTER && typeof(State.ENTER) !== 'function') {
        this.Alert('ENTER must be a function.');
      }

      if (State.EXIT && typeof(State.EXIT) !== 'function') {
        this.Alert('EXIT must be a function.');
      }

      if (typeof(State.COMPOSITE) === 'function') {
        State.COMPOSITE = (<() => iComposite> State.COMPOSITE)();
      }

      StateStack.push(StateName);
      State.DOTPATH = StateStack.join('.');
      this.m_DotPath2State[State.DOTPATH] = State;

      if (State.COMPOSITE) {
        InstrumentComposite.call(this, <iComposite> State.COMPOSITE);
      }
      StateStack.pop();
    }

    InstrumentState.call(this, this.m_ROOT, 'ROOT');
  };

  private StripROOT(StateName: string) {
    return StateName.replace('ROOT.', '');
  }

  private EnterDefaultStates(Composite: iComposite) {
    this.m_State = Composite[Composite.DEFAULT];

    this.DebugPrint('==> ' + this.StripROOT(this.m_State.DOTPATH));

    if (this.m_State.ENTER) {
      this.m_State.ENTER.call(this);
    }

    if (this.m_State.COMPOSITE) {
      this.EnterDefaultStates.call(this, this.m_State.COMPOSITE);
    }
  }

  private CalculateLCA(StringA: string, StringB: string): string {
    const A = StringA.split('.');
    const B = StringB.split('.');

    const Iterations = Math.min(A.length, B.length);

    let Return: string[] = [];

    for (let I = 0; I < Iterations && A[I] === B[I]; I++) {
      Return.push(A[I]);
    }

    return Return.join('.');
  }

  public Transition(To: string, ...Args: any[]) {
    if (this.m_EventSourceState === undefined) {
      this.m_EventSourceState = this.m_State;
    }

    To = 'ROOT.' + To;

    this.DebugPrint('TRANSITION: ' + this.StripROOT(this.m_EventSourceState.DOTPATH) + ' -> ' + this.StripROOT(To));

    let LCA = this.CalculateLCA(this.m_EventSourceState.DOTPATH, To);

    //
    // Self-transition is a special case.
    //
    if (To === LCA) {
      let A = LCA.split('.');
      A.splice(-1, 1); // Remove last element, in place.
      LCA = A.join('.');
    }

    let ArgArray = Array.prototype.splice.call(arguments, 1);

    function EnterStates(FromState: string, ToState: string) {
      if (FromState === ToState) {
        return;
      }

      const FromArray = FromState.split('.');
      const ToSuffix = ToState.replace(FromState + '.', '');
      const ToArray  = ToSuffix.split('.');

      let StatePath: string;

      do {
        FromArray.push(ToArray.shift());

        StatePath = FromArray.join('.');
        this.m_State = this.m_DotPath2State[StatePath];

        this.DebugPrint('--> ' + this.StripROOT(StatePath));

        if (this.m_State.ENTER) {
          this.m_State.ENTER.apply(this, ArgArray);
        }
      } while (StatePath !== ToState);
    }

    function ExitStates(ToState: string, FromState: string) {
      let FromArray = FromState.split('.');

      while (ToState !== FromState) {
        this.m_State = this.m_DotPath2State[FromState];

        this.DebugPrint('    ' + this.StripROOT(FromState) + '-->');

        if (this.m_State.EXIT) {
          this.m_State.EXIT.call(this);
        }

        if (this.m_Timeouts[this.m_State.DOTPATH]) {
          this.DebugPrint('Delete Timeout: ' + this.m_State.DOTPATH + ' ' + this.m_Timeouts[this.m_State.DOTPATH]);
          delete this.m_Timeouts[this.m_State.DOTPATH];
        }

        FromArray.splice(-1, 1);  // Remove last item, in place.
        FromState = FromArray.join('.');
      }
    }

    ExitStates.call(this, LCA, this.m_State.DOTPATH);
    EnterStates.call(this, LCA, To);

    if (this.m_DotPath2State[this.m_State.DOTPATH].COMPOSITE) {
      this.EnterDefaultStates.call(this, this.m_DotPath2State[this.m_State.DOTPATH].COMPOSITE);
    }

    this.m_EventSourceState = undefined;
  }

  public Start(): StateMachine {
    this.InstrumentStateMachine();
    this.EnterDefaultStates.call(this, this.m_ROOT.COMPOSITE);
    return this;
  }

  public Restart() {
    this.m_State            = {};
    this.m_Timeouts         = {};
    this.m_Interval         = undefined;
    this.m_EventSourceState = {};
    this.m_DotPath2State    = {};

    if (this.m_InBrowser) {
      document.getElementById(this.m_DebugID).innerHTML = '';
      this.m_LinesOut = 0;
    }

    this.Start();
  }

  public IsIn(StateDotPath: string) {
    StateDotPath = 'ROOT.' + StateDotPath;

    if (StateDotPath === this.m_State.DOTPATH) {
      return true;
    }

    const Beginning = StateDotPath + '.';

    return this.m_State.DOTPATH.substr(0, Beginning.length) === Beginning;
  }

  public Event(EventString: string, ...Args: any[]): void {
    const CandidateStatePath = this.m_State.DOTPATH.split('.');

    while (CandidateStatePath.length > 0) {
      const CandidateStateDotPath = CandidateStatePath.join('.');
      const CandidateState = this.m_DotPath2State[CandidateStateDotPath];

      if (EventString in CandidateState) {
        this.DebugPrint('EVENT: ' + EventString + ' sent to ' + this.StripROOT(this.m_State.DOTPATH));

        const EventFunc = <() => void> CandidateState[EventString];

        if (EventFunc) {
          const ArgArray = Array.prototype.splice.call(arguments, 1);

          this.m_EventSourceState = CandidateState;
          EventFunc.apply(this, ArgArray);
          this.m_EventSourceState = undefined;
        }

        return;
      }

      CandidateStatePath.splice(-1, 1); // Remove last element
    }

    this.DebugPrint('EVENT: ' + EventString + '. No handler from ' + this.StripROOT(this.m_State.DOTPATH));
  }

  public SetTimeoutSeconds(TimeoutSeconds: number) {
    this.m_Timeouts[this.m_State.DOTPATH] = TimeoutSeconds;

    if (this.m_Interval === undefined) {
      let IntervalTick = () => {
        for (const StateDotPath in this.m_Timeouts) {
          this.m_Timeouts[StateDotPath] -= 1;

          if (this.m_Timeouts[StateDotPath] <= 0) {
            const State = this.m_DotPath2State[StateDotPath];
            this.m_EventSourceState = this.m_State;
            this.DebugPrint('Delete Timeout: ' + this.m_State.DOTPATH + ' ' + this.m_Timeouts[StateDotPath]);
            delete this.m_Timeouts[StateDotPath];

            if (State.TIMEOUT) {
              State.TIMEOUT.call(this);
            }
          }
        }
      };

      this.m_Interval = setInterval(IntervalTick, 1000);
    }

    this.DebugPrint('SetTimeoutSeconds:' + this.m_State.DOTPATH + ' ' + TimeoutSeconds);
  }

  public DebugPrint(Message: string) {
    if (this.m_DebugMode) {
      this.Print(Message);
    }
  }

  public SetDebug(DebugMode: boolean, DebugID?: string, MaxLinesOut?: number, ScrollIntoView?: boolean) {
    if (typeof(DebugMode) !== 'boolean') {
      this.Alert('First argument of SetDebug must be a boolean value. Defaulting to false.');
      DebugMode = false;
    }

    this.m_DebugMode = DebugMode;

    if (this.m_InBrowser) {
      if (DebugID === undefined) {
        this.Alert('DebugID must be set to the ID of a <div> element.');
        return;
      }

      this.m_DebugID = DebugID;
      this.m_MaxLinesOut = MaxLinesOut || 200;
      this.m_ScrollIntoView = ScrollIntoView || false;
    }
  }

  public Print(Message: string) {
    if (!this.m_InBrowser) {
      console.log(Message);
      return;
    }

    const DebugDIV = document.getElementById(this.m_DebugID);
    const TextDIV  = document.createElement('div');
    const Text     = document.createTextNode(Message);

    TextDIV.appendChild(Text);
    DebugDIV.appendChild(TextDIV);

    function IsVisible(Element: HTMLElement) {
      const Rect       = Element.getBoundingClientRect();
      const ViewHeight = Math.max(document.documentElement.clientHeight, window.innerHeight);

      return !(Rect.bottom < 0 || Rect.top - ViewHeight >= 0);
    }

    if (this.m_ScrollIntoView && IsVisible(DebugDIV)) {
      TextDIV.scrollIntoView(false);
    }

    this.m_LinesOut += 1;

    if (this.m_LinesOut > this.m_MaxLinesOut) {
      DebugDIV.removeChild(DebugDIV.childNodes[0]);
    }
  }

  public Assert(Condition: boolean, Message: string) {
    if (!Condition) {
      this.Alert(Message || 'Assertion failed');
    }
  }

  public Alert(Message: string) {
    if (this.m_InBrowser) {
      window.alert(Message);
    } else {
      console.log(Message);
    }
  }
}
