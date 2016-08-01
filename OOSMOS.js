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
var OOSMOS;
(function (OOSMOS) {
    var StateMachine = (function () {
        function StateMachine(Composite) {
            this.m_LinesOut = 0;
            this.m_ROOT = { COMPOSITE: Composite };
            this.m_Timeouts = {};
            this.m_DotPath2State = {};
            this.m_DebugMode = false;
            this.m_InBrowser = typeof (window) !== 'undefined';
            if (this.m_InBrowser) {
                this.m_DebugID;
                this.m_LinesOut = 0;
                this.m_MaxLinesOut;
                this.m_ScrollIntoView;
            }
        }
        StateMachine.prototype.InstrumentStateMachine = function () {
            var StateStack = [];
            function InstrumentComposite(Composite) {
                var StateName;
                for (StateName in Composite) {
                    if (StateName === 'DEFAULT') {
                        continue;
                    }
                    if (typeof (Composite[StateName]) === 'function') {
                        Composite[StateName] = Composite[StateName]();
                    }
                    InstrumentState.call(this, Composite[StateName], StateName);
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
            function InstrumentState(State, StateName) {
                if (State.ENTER && typeof (State.ENTER) !== 'function') {
                    this.Alert('ENTER must be a function.');
                }
                if (State.EXIT && typeof (State.EXIT) !== 'function') {
                    this.Alert('EXIT must be a function.');
                }
                if (typeof (State.COMPOSITE) === 'function') {
                    State.COMPOSITE = State.COMPOSITE();
                }
                StateStack.push(StateName);
                State.DOTPATH = StateStack.join('.');
                this.m_DotPath2State[State.DOTPATH] = State;
                if (State.COMPOSITE) {
                    InstrumentComposite.call(this, State.COMPOSITE);
                }
                StateStack.pop();
            }
            InstrumentState.call(this, this.m_ROOT, 'ROOT');
        };
        ;
        StateMachine.prototype.StripROOT = function (StateName) {
            return StateName.replace('ROOT.', '');
        };
        StateMachine.prototype.EnterDefaultStates = function (Composite) {
            this.m_State = Composite[Composite.DEFAULT];
            this.DebugPrint('==> ' + this.StripROOT(this.m_State.DOTPATH));
            if (this.m_State.ENTER) {
                this.m_State.ENTER.call(this);
            }
            if (this.m_State.COMPOSITE) {
                this.EnterDefaultStates.call(this, this.m_State.COMPOSITE);
            }
        };
        StateMachine.prototype.CalculateLCA = function (StringA, StringB) {
            var A = StringA.split('.');
            var B = StringB.split('.');
            var Iterations = Math.min(A.length, B.length);
            var Return = [];
            for (var I = 0; I < Iterations && A[I] === B[I]; I++) {
                Return.push(A[I]);
            }
            return Return.join('.');
        };
        StateMachine.prototype.Transition = function (To) {
            if (this.m_EventSourceState === undefined) {
                this.m_EventSourceState = this.m_State;
            }
            To = 'ROOT.' + To;
            this.DebugPrint('TRANSITION: ' + this.StripROOT(this.m_EventSourceState.DOTPATH) + ' -> ' + this.StripROOT(To));
            var LCA = this.CalculateLCA(this.m_EventSourceState.DOTPATH, To);
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
                var ToSuffix = To.replace(From + '.', '');
                var ToArray = ToSuffix.split('.');
                var StatePath;
                do {
                    FromArray.push(ToArray.shift());
                    StatePath = FromArray.join('.');
                    this.m_State = this.m_DotPath2State[StatePath];
                    this.DebugPrint('--> ' + this.StripROOT(StatePath));
                    if (this.m_State.ENTER) {
                        this.m_State.ENTER.apply(this, Args);
                    }
                } while (StatePath !== To);
            }
            function ExitStates(To, From) {
                var FromArray = From.split('.');
                while (To !== From) {
                    this.m_State = this.m_DotPath2State[From];
                    this.DebugPrint('    ' + this.StripROOT(From) + '-->');
                    if (this.m_State.EXIT) {
                        this.m_State.EXIT.call(this);
                    }
                    if (this.m_Timeouts[this.m_State.DOTPATH]) {
                        this.DebugPrint('Delete Timeout: ' + this.m_State.DOTPATH + ' ' + this.m_Timeouts[this.m_State.DOTPATH]);
                        delete this.m_Timeouts[this.m_State.DOTPATH];
                    }
                    FromArray.splice(-1, 1); // Remove last item, in place.
                    From = FromArray.join('.');
                }
            }
            ExitStates.call(this, LCA, this.m_State.DOTPATH);
            EnterStates.call(this, LCA, To);
            if (this.m_DotPath2State[this.m_State.DOTPATH].COMPOSITE) {
                this.EnterDefaultStates.call(this, this.m_DotPath2State[this.m_State.DOTPATH].COMPOSITE);
            }
            this.m_EventSourceState = undefined;
        };
        StateMachine.prototype.Start = function () {
            this.InstrumentStateMachine();
            this.EnterDefaultStates.call(this, this.m_ROOT.COMPOSITE);
        };
        StateMachine.prototype.Restart = function () {
            this.m_State = undefined;
            this.m_Timeouts = {};
            this.m_Interval = undefined;
            this.m_EventSourceState = undefined;
            this.m_DotPath2State = {};
            if (this.m_InBrowser) {
                document.getElementById(this.m_DebugID).innerHTML = '';
                this.m_LinesOut = 0;
            }
            this.Start();
        };
        StateMachine.prototype.IsIn = function (StateDotPath) {
            StateDotPath = 'ROOT.' + StateDotPath;
            if (StateDotPath === this.m_State.DOTPATH) {
                return true;
            }
            var Beginning = StateDotPath + '.';
            return this.m_State.DOTPATH.substr(0, Beginning.length) === Beginning;
        };
        StateMachine.prototype.Event = function (EventString) {
            var CandidateStatePath = this.m_State.DOTPATH.split('.');
            while (CandidateStatePath.length > 0) {
                var CandidateStateDotPath = CandidateStatePath.join('.');
                var CandidateState = this.m_DotPath2State[CandidateStateDotPath];
                if (EventString in CandidateState) {
                    this.DebugPrint('EVENT: ' + EventString + ' sent to ' + this.StripROOT(this.m_State.DOTPATH));
                    var EventFunc = CandidateState[EventString];
                    if (EventFunc) {
                        var Args = Array.prototype.splice.call(arguments, 1);
                        this.m_EventSourceState = CandidateState;
                        EventFunc.apply(this, Args);
                        this.m_EventSourceState = undefined;
                    }
                    return;
                }
                CandidateStatePath.splice(-1, 1); // Remove last element
            }
            this.DebugPrint('EVENT: ' + EventString + '. No handler from ' + this.StripROOT(this.m_State.DOTPATH));
        };
        StateMachine.prototype.SetTimeoutSeconds = function (TimeoutSeconds) {
            this.m_Timeouts[this.m_State.DOTPATH] = TimeoutSeconds;
            if (this.m_Interval === undefined) {
                var that_1 = this;
                var IntervalTick = function () {
                    for (var StateDotPath in that_1.m_Timeouts) {
                        that_1.m_Timeouts[StateDotPath] -= 1;
                        if (that_1.m_Timeouts[StateDotPath] <= 0) {
                            var State = that_1.m_DotPath2State[StateDotPath];
                            that_1.m_EventSourceState = that_1.m_State;
                            that_1.DebugPrint('Delete Timeout: ' + that_1.m_State.DOTPATH + ' ' + that_1.m_Timeouts[StateDotPath]);
                            delete that_1.m_Timeouts[StateDotPath];
                            if (State.TIMEOUT) {
                                State.TIMEOUT.call(that_1);
                            }
                        }
                    }
                };
                this.m_Interval = setInterval(IntervalTick, 1000);
            }
            this.DebugPrint('SetTimeoutSeconds:' + this.m_State.DOTPATH + ' ' + TimeoutSeconds);
        };
        StateMachine.prototype.Extend = function (From) {
            var To = this;
            Object.keys(From).forEach(function (key) {
                To[key] = From[key];
            });
            return To;
        };
        StateMachine.prototype.DebugPrint = function (String) {
            if (this.m_DebugMode) {
                this.Print(String);
            }
        };
        StateMachine.prototype.SetDebug = function (DebugMode, DebugID, MaxLinesOut, ScrollIntoView) {
            if (typeof (DebugMode) !== 'boolean') {
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
        };
        StateMachine.prototype.Print = function (String) {
            if (!this.m_InBrowser) {
                console.log(String);
                return;
            }
            var DebugDIV = document.getElementById(this.m_DebugID);
            var TextDIV = document.createElement('div');
            var Text = document.createTextNode(String);
            TextDIV.appendChild(Text);
            DebugDIV.appendChild(TextDIV);
            function IsVisible(Element) {
                var Rect = Element.getBoundingClientRect();
                var ViewHeight = Math.max(document.documentElement.clientHeight, window.innerHeight);
                return !(Rect.bottom < 0 || Rect.top - ViewHeight >= 0);
            }
            if (this.m_ScrollIntoView && IsVisible(DebugDIV)) {
                TextDIV.scrollIntoView(false);
            }
            this.m_LinesOut += 1;
            if (this.m_LinesOut > this.m_MaxLinesOut) {
                DebugDIV.removeChild(DebugDIV.childNodes[0]);
            }
        };
        StateMachine.prototype.Assert = function (Condition, Message) {
            if (!Condition) {
                this.Alert(Message || 'Assertion failed');
            }
        };
        StateMachine.prototype.Alert = function (Message) {
            if (this.m_InBrowser) {
                window.alert(Message);
            }
            else {
                console.log(Message);
            }
        };
        return StateMachine;
    }());
    OOSMOS.StateMachine = StateMachine;
})(OOSMOS || (OOSMOS = {}));
if (typeof exports != 'undefined') {
    exports.StateMachine = OOSMOS.StateMachine;
}
