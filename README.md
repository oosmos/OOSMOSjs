# OOSMOS.js

`OOSMOS.js` contains two state machine implementations:

0. A simple finite state machine.
0. A hierarchical state machine.

*Note: OOSMOS stands for **O**bject **O**riented **S**tate **M**achine **O**perating **S**ystem (see [OOSMOS](http://www.oosmos.com)).  OOSMOS is a small footprint C/C++ state machine operating system for the industrial IOT space. This JavaScript implementation focuses on the "Object-Oriented" and 
"State Machine" elements of OOSMOS and not on the "Operating System" elements.*

`OOSMOS.js` is packaged as a `node.js` package that can also run inside a browser.

## Example

Let's use the `OOSMOS.js` finite state machine engine `FSM` to implement a simple state machine that toggles between states `A` and `B` as represented here:

![](http://localhost/oosmos.com/pages/OOSMOS.js/images/fsm_timeout.svg)

     1  var OOSMOS = require('../OOSMOS.js');
     2
     3  var oFsmTimeoutTest = OOSMOS.FSM({ DEFAULT: 'A',
     4    A: {
     5      ENTER: function() {
     6        this.SetTimeoutSeconds(4);
     7      },
     8      TIMEOUT: function() {
     9        this.Transition('B');
    10      } 
    11    },
    12    B: {
    13      ENTER: function() {
    14        this.SetTimeoutSeconds(1);
    15      },
    16      TIMEOUT: function() {
    17        this.Transition('A');
    18      }
    19    }  
    20 });
    21
    22 oFsmTimeoutTest.SetDebug();
    23 oFsmTimeoutTest.Start();

## API

`Transition` - blah

`Start`

`IsIn`

`Print`

`Event`

`SetTimeoutSeconds`

`DebugPrint`

`SetDebug`

`Assert`

## State Machine Structure
### Reserved events

`ENTER`
`EXIT`
`TIMEOUT`

### Reserved State Names

`DEFAULT`
`REGION`

