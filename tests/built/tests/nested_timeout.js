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
        _super.call(this, { DEFAULT: 'Outer',
            Outer: {
                ENTER: function () {
                    this.Print('In state Outer');
                    this.SetTimeoutSeconds(4);
                },
                TIMEOUT: function () {
                    this.Transition('OuterTimeout');
                },
                COMPOSITE: {
                    Inner: {
                        ENTER: function () {
                            this.Print('In state Outer.Inner');
                            this.SetTimeoutSeconds(2);
                        },
                        TIMEOUT: function () {
                            this.Transition('InnerTimeout');
                        },
                    },
                },
            },
            OuterTimeout: {
                ENTER: function () {
                    this.Print('In state OuterTimeout');
                    this.Assert(false);
                },
            },
            InnerTimeout: {
                ENTER: function () {
                    this.Print('In state InnerTimeout');
                    this.SetTimeoutSeconds(1);
                },
                TIMEOUT: function () {
                    this.Transition('Outer');
                },
            },
        });
    }
    return TimeoutTest;
}(OOSMOS_1.StateMachine));
var pTimeoutTest = new TimeoutTest();
pTimeoutTest.SetDebug(true);
pTimeoutTest.Start();
