# CSD-only comparison build

This branch is a demonstration of native desktop decorations over the upstream
web interface. It intentionally omits the supporting desktop UI redesign. It is
not a replacement for the complete `desktop-modernization-effort` branch.

## Included

- Linux CSD, native controls, desktop button ordering, system dragging/resizing,
  rounded surfaces and shadows, and the startup transparency correction.
- The native Qt host, restricted WebChannel contract, and minimal web geometry
  reporting required for native dragging without JavaScript pointer round trips.
- A global window-contour mask. This is part of the rounded CSD surface.

The comparison forces CSD by default on Linux, ignoring the saved system-border
preference so that an earlier testing preference cannot hide the demonstration.
`BITBOXAPP_NATIVE_DECORATIONS=1` remains an explicit troubleshooting override.
Other desktop platforms retain their original system decorations in this build.

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

Use the repository's normal `make qt-linux` target with the configured toolchain;
the standard development helper runs that target. See [BUILD.md](BUILD.md).
Run the compiled app with `-testnet` when demonstrating testnet mode. This flag
does not isolate wallet storage. Close another running instance before launch.

Use the same viewport, theme and page when comparing with the complete branch.
Useful examples are Settings with the guide open, a narrow window with the
sidebar open, a scrolled list, and left-positioned Linux window controls. A real
comparison build demonstrates missing integration; generated figures remain
illustrative explanations rather than runtime evidence.
