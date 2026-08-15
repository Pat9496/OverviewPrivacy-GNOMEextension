# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [1.3] - 2026-08-15

### Added

- Optional chezmoi sync for the extension's GSettings keys during `install.sh`.

### Fixed

- Overlay scale misalignment during the overview's hover-zoom animation for black/white modes.

### Changed

- Addressed GNOME Extensions review feedback from JustPerfection:
  - `prefs.js`: removed the GNOME 50 vs. 45-49 try/fallback import block and replaced it with the single correct GNOME 45+ import path for `ExtensionPreferences`, per the [gjs.guide preferences upgrade doc](https://gjs.guide/extensions/upgrading/gnome-shell-45.html#preferences).
  - `extension.js`: removed `PrivacyOverlay`'s connection to the window preview's `destroy` signal; overlays now only tear down when the extension disables, rather than also listening for individual preview destruction.

## [1.0] - 2026-08-14

### Added

- Initial release: blur, black overlay, and white overlay modes for window previews in the Activities overview, selectable per application.
- Adjustable blur radius (4-128) via `Shell.BlurEffect`.
- Adwaita preferences window for managing protected applications and their modes.
- GPL-2.0-or-later license.
