/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var __extends = (this && this.__extends) || function (d, b) {
	    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
	    function __() { this.constructor = d; }
	    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
	};
	var OOSMOS_1 = __webpack_require__(1);
	var TimeoutTest = (function (_super) {
	    __extends(TimeoutTest, _super);
	    function TimeoutTest() {
	        _super.call(this, { DEFAULT: 'A',
	            A: {
	                ENTER: function () {
	                    this.Print("In state A");
	                    this.SetTimeoutSeconds(4);
	                },
	                TIMEOUT: function () {
	                    this.Transition('B');
	                },
	            },
	            B: {
	                ENTER: function () {
	                    this.Print("In state B");
	                    this.SetTimeoutSeconds(1);
	                },
	                TIMEOUT: function () {
	                    this.Transition('A');
	                },
	            },
	        });
	    }
	    return TimeoutTest;
	}(OOSMOS_1.StateMachine));
	var pTimeoutTest = new TimeoutTest();
	pTimeoutTest.SetDebug(true, 'debugFSM');
	pTimeoutTest.Start();


/***/ },
/* 1 */
/***/ function(module, exports) {

	"use strict";
	var StateMachine = (function () {
	    function StateMachine(Composite) {
	        this.m_Timeouts = {};
	        this.m_DotPath2State = {};
	        this.m_DebugMode = false;
	        this.m_InBrowser = typeof (window) !== 'undefined';
	        this.m_LinesOut = 0;
	        this.m_ROOT = { COMPOSITE: Composite };
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
	            if (Object.keys(Composite).length === 1) {
	                Composite.DEFAULT = Object.keys(Composite)[0];
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
	        var Args = [];
	        for (var _i = 1; _i < arguments.length; _i++) {
	            Args[_i - 1] = arguments[_i];
	        }
	        if (this.m_EventSourceState === undefined) {
	            this.m_EventSourceState = this.m_State;
	        }
	        To = 'ROOT.' + To;
	        this.DebugPrint('TRANSITION: ' + this.StripROOT(this.m_EventSourceState.DOTPATH) + ' -> ' + this.StripROOT(To));
	        var LCA = this.CalculateLCA(this.m_EventSourceState.DOTPATH, To);
	        if (To === LCA) {
	            var A = LCA.split('.');
	            A.splice(-1, 1);
	            LCA = A.join('.');
	        }
	        var ArgArray = Array.prototype.splice.call(arguments, 1);
	        function EnterStates(FromState, ToState) {
	            if (FromState === ToState) {
	                return;
	            }
	            var FromArray = FromState.split('.');
	            var ToSuffix = ToState.replace(FromState + '.', '');
	            var ToArray = ToSuffix.split('.');
	            var StatePath;
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
	        function ExitStates(ToState, FromState) {
	            var FromArray = FromState.split('.');
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
	                FromArray.splice(-1, 1);
	                FromState = FromArray.join('.');
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
	        return this;
	    };
	    StateMachine.prototype.Restart = function () {
	        this.m_State = {};
	        this.m_Timeouts = {};
	        this.m_Interval = undefined;
	        this.m_EventSourceState = {};
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
	        var Args = [];
	        for (var _i = 1; _i < arguments.length; _i++) {
	            Args[_i - 1] = arguments[_i];
	        }
	        var CandidateStatePath = this.m_State.DOTPATH.split('.');
	        while (CandidateStatePath.length > 0) {
	            var CandidateStateDotPath = CandidateStatePath.join('.');
	            var CandidateState = this.m_DotPath2State[CandidateStateDotPath];
	            if (EventString in CandidateState) {
	                this.DebugPrint('EVENT: ' + EventString + ' sent to ' + this.StripROOT(this.m_State.DOTPATH));
	                var EventFunc = CandidateState[EventString];
	                if (EventFunc) {
	                    var ArgArray = Array.prototype.splice.call(arguments, 1);
	                    this.m_EventSourceState = CandidateState;
	                    EventFunc.apply(this, ArgArray);
	                    this.m_EventSourceState = undefined;
	                }
	                return;
	            }
	            CandidateStatePath.splice(-1, 1);
	        }
	        this.DebugPrint('EVENT: ' + EventString + '. No handler from ' + this.StripROOT(this.m_State.DOTPATH));
	    };
	    StateMachine.prototype.SetTimeoutSeconds = function (TimeoutSeconds) {
	        var _this = this;
	        this.m_Timeouts[this.m_State.DOTPATH] = TimeoutSeconds;
	        if (this.m_Interval === undefined) {
	            var IntervalTick = function () {
	                for (var StateDotPath in _this.m_Timeouts) {
	                    _this.m_Timeouts[StateDotPath] -= 1;
	                    if (_this.m_Timeouts[StateDotPath] <= 0) {
	                        var State = _this.m_DotPath2State[StateDotPath];
	                        _this.m_EventSourceState = _this.m_State;
	                        _this.DebugPrint('Delete Timeout: ' + _this.m_State.DOTPATH + ' ' + _this.m_Timeouts[StateDotPath]);
	                        delete _this.m_Timeouts[StateDotPath];
	                        if (State.TIMEOUT) {
	                            State.TIMEOUT.call(_this);
	                        }
	                    }
	                }
	            };
	            this.m_Interval = setInterval(IntervalTick, 1000);
	        }
	        this.DebugPrint('SetTimeoutSeconds:' + this.m_State.DOTPATH + ' ' + TimeoutSeconds);
	    };
	    StateMachine.prototype.DebugPrint = function (Message) {
	        if (this.m_DebugMode) {
	            this.Print(Message);
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
	    StateMachine.prototype.Print = function (Message) {
	        if (!this.m_InBrowser) {
	            console.log(Message);
	            return;
	        }
	        var DebugDIV = document.getElementById(this.m_DebugID);
	        var TextDIV = document.createElement('div');
	        var Text = document.createTextNode(Message);
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
	exports.StateMachine = StateMachine;


/***/ }
/******/ ]);