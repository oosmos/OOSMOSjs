## OOSMOS.js --  A Hierarchical State Machine Framework for JavaScript.

OOSMOS for JavaScript is an open source, easy-to-use hierarchical state machine framework comprised of a single object, called OOSMOS, housed in the file `OOSMOS.js`.

Live Demo: [OOSMOSjs](https://oosmos.com/OOSMOSjs)

### Features

- Very readable encapsulated state machine structure.
- Simple, less than 400 lines of code.
- Same code runs in a browser or `Node.js`.
- Supports arbitrarily deep hierarchical state machines.
- Supports state local variables. (Ideal for caching `jQuery` elements.)
- Simple API: Only 5 principal APIs.
- Can run multiple state machines concurrently.
- Can inherit any `OOSMOS` state machine without using the JavaScript prototype mechanism.  (See the **Inheritance** example below.)
- Events can pass arguments into the state entry function via transitions.

*Note: OOSMOS stands for **O**bject **O**riented **S**tate **M**achine **O**perating **S**ystem.  OOSMOS is a small footprint C/C++ state machine operating system for the industrial IOT space.  (See [www.oosmos.com](http://www.oosmos.com).) This JavaScript implementation borrows from the Object-Oriented and 
State Machine elements of OOSMOS but the Operating System elements are supported by the JavaScript runtime.*

### Example

We'll use `OOSMOS.js` to implement a simple state machine that toggles between states `A` and `B` with timeouts as represented in this state chart.

![](http://www.oosmos.com/github/README.md/simple_timeout.svg)

The entire implementation is below.  In lines 1 through 20, we create a state machine called `TimeoutDemo`.  State `A` starts on line 2 and state `B` starts on line 11 and look very similar.  State `A` implements an `ENTER` event that establishes a timeout of `4` seconds.  When the timeout expires, the `TIMEOUT` function will be executed which transitions to state `B`.  State `B` essentially does the same thing as state `A` except that it times out in `1` second.

Line 22 starts the state machine.

In lines 4 and 13 we use the `OOSMOS` `Print()` API to display progress.

```javascript
 1  var TimeoutDemo = OOSMOS({ DEFAULT: 'A',
 2    A: {
 3      ENTER: function() {
 4        this.Print("In state A");
 5        this.SetTimeoutSeconds(4);
 6      },
 7      TIMEOUT: function() {
 8        this.Transition('B');
 9      } 
10    },
11    B: {
12      ENTER: function() {
13        this.Print("In state B");
14        this.SetTimeoutSeconds(1);
15      },
16      TIMEOUT: function() {
17        this.Transition('A');
18      }
19    }  
20 });
21
22 TimeoutDemo.Start();
```

### State Machine Structure Overview

This is the basic layout of an `OOSMOS` state machine, explained below.

```javascript
var StateMachine = OOSMOS({ DEFAULT: 'StateName',
  StateName: {
    ENTER: function() {
      this.SetTimeoutSeconds(4);
    },
    EXIT: function() {
    },
    TIMEOUT: function() {
    },
    EventName: function() {
      this.Transition('StateName');
    },
    'Event-String': function() {
    }
  },
  StateName: {
    EventName: function() {
    },
    EventName: function() {
    },
    COMPOSITE: { DEFAULT: 'StateName',
      StateName: {
        EventName: function() {
        }
      }
    }
  }
});

StateMachine.Start();
```

### State Machine Structure Rules

0. The `DEFAULT` state indicator is only required when there is more than one state in the `COMPOSITE`. *Note that the object passed to the top level `OOSMOS` function is a `COMPOSITE` object.*
0. `ENTER` and `EXIT` are optional. They are only supplied when there is something to do on entry or exit from the state.
0. If a timeout is desired for the state, it must be set up in the special `ENTER` event using the `SetTimeoutSeconds()` API.
0. If state names or event names contain special characters, they must be enclosed in quotes.  (Standard JavaScript object property rules.)
0. A `Transition` can only be executed within an `OOSMOS` event function.

## API

### Principal APIs

|API|Description|
|---|---|
|`Event('Event', [, arguments...])`|Generates an event.  If the current state does not handle the event, it is propagated up the hierarchy until a state does handle it.  If no active state handles the event, then the event has no effect.<br><br>Any supplied arguments are passed to the appropriate event handler function.|
|`IsIn('dot.qualified.statename'`)|Returns `true` if the specified dot-qualified state is active.<br><br>If state `A.AA.AAA` is the current leaf state, then `IsIn` of `'A'`, `'A.AA'` and `'A.AA.AAA'` will all return `true`.<br><br>Note that if your state machine is not hierarchical, i.e., it does not use the `COMPOSITE` keyword, then none of your state names will contain a "dot" character.|
|`SetTimeoutSeconds(Seconds)`|Establish a timeout for this state.<br><br>Multiple, nested timeouts can all be active at once.|
|`Start()`|Starts the state machine.|
|`Transition('dot.qualified.statename' [, arguments...])`|Transitions from one state to another.<br><br>Must be called from within an event function.  Any supplied arguments are passed to the `ENTER` function of the target state.|

### Support APIs

|API|Description|
|---|---|
|`Alert(Message)`|When running under `Node.js`, executes a `console.log()` call.<br><br>In a browser, executes a `window.alert()` call.|
|`Assert(Condition, String)`|Calls the `Alert(String)` function if `Condition` is not met.|
|`DebugPrint(String)`|Executes a `Print(String)` if debug mode is on.  See `SetDebug`.|
|`Extend(Derived)`|Adds the object properties from the `Derived` object into the `OOSMOS` state machine object.  (See Inheritance example below.) |
|`Print(String)`|When running under `Node.js`, executes a `console.log(String)`.<br><br>When running in a browser, requires an ID of a `<div>` element into which to write the string, specified in the `SetDebug` call). |
|`Restart`|Re-initializes the state machine as if run for the first time. Principally used for testing.|
|`SetDebug(DebugMode [, DebugID [, MaxLines [, ScrollIntoView]]])`|Pass a `DebugMode` of `true` to enable debug mode, `false` otherwise.<br><br>The next three arguments apply only when running under a browser.<br><br>Required `DebugID` specifies the  `id` of a `<div>` element into which debug lines will be written.<br><br>Optional `MaxLines` specifies the maximum number of lines that are retained in the `<div>`.  *Note that most browsers slow down considerably due to inefficient scrolling if there are too many lines retained in the `<div>`.  Defaults to 200.*<br><br>If `true`, optional `ScrollIntoView` causes each new debug line to come into focus.|


### Reserved Names in a State Object

|Reserved Event Name|Description|
|---|---|
|`ENTER`|The `ENTER` function is called as the state is entered.|
|`EXIT`|The `EXIT` function is called as the state is exited.|
|`TIMEOUT`|This event is triggered if a timeout that was established in the `ENTER` function occurred.|
|`COMPOSITE`|Specified by you to indicate nested states (hierarchy).|
|`DOTPATH`|Used internally by `OOSMOS`.|

### Reserved Names in a Composite Object

|Reserved State Name|Description|
|---|---|
|`DEFAULT`|Specified by you inside of a `COMPOSITE` to indicate which of multiple states at the same level should be entered by default.<br><br>Not required if there is only one state in the composite.|


### State Local Variables

Each state must (eventually) specify an object of events.  See state `A`, below.  It specifies events `ENTER` and `TIMEOUT` within an object.  If you want to specify one or more variables that are local only to the state, you can instead specify a function that returns the required object of events.  An example is state `B` below. We specify a function that declares state-local variables and then returns the object of events.  All the variables declared form a closure with state `B`'s object of events.  This is very useful for, say, caching `jQuery` elements for the life of the state.


```javascript
var TimeoutDemo = OOSMOS({ DEFAULT: 'A',
  A: {
    ENTER: function() {
      this.SetTimeoutSeconds(4);
    },
    TIMEOUT: function() {
      this.Transition('B');
    } 
  },
  B: function() {
    var Timeouts = 0;
    var $Foo = $('#Foo');

    return {
      ENTER: function() {
        $Foo.text('bar');
        this.SetTimeoutSeconds(1);
      },
      TIMEOUT: function() {
        Timeouts += 1;
        this.Transition('A');
      }
    };
  }  
});

TimeoutDemo.Start();
```

### Inheritance

You can add your own interface to an `OOSMOS` state machine using the `OOSMOS` `Extend()` API, like this.

```javascript
var MyExtendedStateMachine = (function() {
  var m_MyMemberVariableA;
  var m_MyMemberVariableB;

  var MyStateMachine = OOSMOS({ 
    ... your OOSMOS state machine implemenation ... 
  });

  return MyStateMachine.Extend({
    MyNewMemberFunctionA: function() {
      return m_MyMemberVariableA;
    },
    MyNewMemberFunctionB: function() {
      return m_MyMemberVariableB;
    }
  };
}());    
```

### jQuery Example (fragments)

Note that we can establish `jQuery` event handlers in the `ENTER` event and then `unbind` them in the corresponding `EXIT` event.  

Also note that, because the `jQuery` `click` event is executed under a different `this`, we have to use a closure to remember our state machine's `this`.  We use the common `var that = this;` JavaScript closure technique. 

```javascript
  .
  .
  Active: {
    ENTER: function() {
      $('#Active').show();

      var that = this;
      $('#eStop').click(function()    { that.Event('eStop');    });
      $('#eRestart').click(function() { that.Event('eRestart'); });
    },

    EXIT: function() {
      $('#eStop').unbind('click');
      $('#eRestart').unbind('click');

      $('#Active').hide();
    },
    .
    .
  },
  .
  .
```

Further, we can use state-local variables to cache the `jQuery` selectors, like this:

```javascript
  .
  .
  Active: function() {
    var $Active   = $('#Active');
    var $eStop    = $('#eStop');
    var $eRestart = $('#eRestart');

    return {
      ENTER: function() {
        $Active.show();

        var that = this;
        $eStop.click(function()    { that.Event('eStop');    });
        $eRestart.click(function() { that.Event('eRestart'); });
      },

      EXIT: function() {
        $eStop.unbind('click');
        $eRestart.unbind('click');

        $Active.hide();
      },
      .
      .
    };
  },
  .
  .
```

## Debug Output

A `StateName` being entered is represented like this:

```
--> StateName
```

A `StateName` being exited is represented like this:

```
    StateName -->
```

A default state being entered is indicated like this:

```
==> StateName
```

## Tests

There are both `Node.js` (`.js`) and browser (`.html`) tests in the `tests` directory.
