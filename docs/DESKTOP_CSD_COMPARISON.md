# CSD-only comparison build

This branch is a demonstration of native desktop decorations over the upstream
web interface. It intentionally omits the supporting desktop UI redesign. It is
not a replacement for the complete `desktop-modernization-effort` branch.

## Included

- Native decorations integrated into the client surface on Linux, Windows and
  macOS. Linux retains desktop button ordering, rounded surfaces/shadows and
  startup transparency handling; Windows retains native caption roles and
  resize hit testing; macOS retains native traffic lights.
- The native Qt host, restricted WebChannel contract, and minimal web geometry
  reporting required for native dragging without JavaScript pointer round trips.
- A global window-contour mask. This is part of the rounded CSD surface.

The comparison forces CSD by default on desktop systems, ignoring the saved system-border
preference so that an earlier testing preference cannot hide the demonstration.
`BITBOXAPP_NATIVE_DECORATIONS=1` remains an explicit troubleshooting override.
The default web UI stays unchanged on all platforms. Linux compilation passed
for the Linux-only comparison commit. Windows and macOS compilation and runtime
validation of this comparison branch are pending.

## Intentionally omitted

The upstream scrollbar styling and gutters, scrolling/header ownership, header
alignment and control spacing, sidebar width and logo behavior, guide layout and
close-button placement, overlay dismissal, separators, bottom fades, system-theme
integration and the new system-border setting are unchanged. Controls may crowd
existing content; scrolling and overlay behavior expose the integration gaps.

The HTML changes add only a nonvisual bridge component and geometry/input marker
attributes. The comparison does not enable the full desktop-chrome frontend.
There is no send-flow redesign in this branch.

## Build and compare

Use the repository's normal `make qt-linux`, `make qt-windows` or `make qt-osx`
target on its native host. The standard development helper runs those targets.
See [BUILD.md](BUILD.md).
Run the compiled app with `-testnet` when demonstrating testnet mode. This flag
does not isolate wallet storage. Close another running instance before launch.

Use the same viewport, theme and page when comparing with the complete branch.
Useful examples are Settings with the guide open, a narrow window with the
sidebar open, a scrolled list, and left-positioned Linux window controls. A real
comparison build demonstrates missing integration; generated figures remain
illustrative explanations rather than runtime evidence.
