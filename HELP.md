# For.A Hanabi HVS-100/110 Companion Module

This module allows for control of a [For.A Hanabi HVS-100/110](https://www.for-a.com/products/hvsxt100_xt110/) video switcher using the undocumented websocket protocol. The official way to remote control this device is to purchase the _HVS-100ED: Editor Interface Software_ upgrade to allow the switcher to speak the `BVS-3000/DVS` and `GVG-100` protocols.

Because we are using an undocumented protocol, it is possible that a software update from For.A could introduce breaking changes. This module has only been tested on software version Main:1.12.1 / GUI:1.10.0

## Current Features

- Change PVW/PGM sources
- Change AUX sources
- Cut & Auto transitions
- Recall events by id #
- Reboot the switcher
- Send the switcher a custom command through the websocket (**Note**: If you send something the switcher doesnt understand, it may drop the connection.)

## Planned / Coming Soon

- Pull source names from the switcher
- Transition keys in/out
- Recall/playback macros by id #
- Better disconnect detection
- **Feedbacks**
  - Tally (PVW / PGM / Clear)
  - Key status (ON AIR / CLEAR)
- **Variables**
  - Current PVW source
  - Current PGM source
  - Current AUX sources
  - Current KEY/DSK Sources
