"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var OOSMOS_1 = require('../OOSMOS');
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
