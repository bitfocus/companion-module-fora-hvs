# For.A Hanabi Video Switcher Companion Module

This module allows for control of a [For.A Hanabi Video Switcher](https://www.for-a.com/products/professional/switcher_p.html) video switcher using the undocumented websocket protocol. The official way to remote control these devices is to use the `BVS-3000/DVS` or `GVG-100` protocols over the serial port.

Because we are using an undocumented protocol, it is possible that a software update from For.A could introduce breaking changes.

## Supported Models

This module has been tested on the following switcher models, but will likely work with any model in the HVS line. If you are successfully using this module on a model not in this list, please [open an issue](https://github.com/bitfocus/companion-module-fora-hvs/issues) so I can add it to the list.

- HVS 100/110 (Software verisons - Main:1.12.1 / GUI:1.10.0)

## Current Features

- Change PVW/PGM sources
- Change AUX sources
- Cut & Auto transitions
- Recall events by id #
- Reboot the switcher
- Send the switcher a custom command through the websocket (**Note**: If you send something the switcher doesnt understand, it may drop the connection.)

## Planned / Coming Soon

- Multiple M/E support (Currently only controls M/E 1)
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
