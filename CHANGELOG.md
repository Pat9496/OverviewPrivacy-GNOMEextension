# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [1.3] - 2026-08-15

### Fixed

- "Add application" dropdown in preferences not re-triggering when reselecting the same app immediately after removing it (GTK only fires `notify::selected` on a change, so the dropdown now resets to a placeholder after each add).
- `blur-radius` GSettings key had no enforced range, so a value set outside the preferences UI (e.g. via `gsettings set` or a synced dotfile) could reach `Shell.BlurEffect` unclamped; the schema now enforces the same 4-128 range as the preferences spin row.
- An unrecognized `protected-apps` mode string (e.g. stale/malformed data) silently rendered as a black overlay; it's now ignored instead.
- `extension.js`'s monkey-patch of `WindowPreview.prototype._init` could misbehave if another extension also patches it: `disable()` now only restores the original `_init` if it's still the exact function this extension installed, and the patched `_init` now no-ops after this extension has disabled and guards `PrivacyOverlay` construction with a try/catch so one failing preview can't abort Shell's own preview construction. `disable()` is now safe to call defensively (e.g. if `_overlays` is already cleared).
- `PrivacyOverlay._clear()`/`_update()` could act on the private content actor of an already-destroyed window preview (since individual overlays aren't torn down until the extension disables, see Changed below) and touch Clutter/effect APIs on it; they now skip that for any overlay past its initial setup whose actor is no longer attached to a `Clutter.Stage`.
- Replaced a `logError()` call (added for the try/catch above) with `console.error()`, per the [gjs.guide GNOME 45 logging guidance](https://gjs.guide/extensions/upgrading/gnome-shell-45.html).

### Changed

- Addressed GNOME Extensions review feedback from JustPerfection:
  - `prefs.js`: removed the GNOME 50 vs. 45-49 try/fallback import block and replaced it with the single correct GNOME 45+ import path for `ExtensionPreferences`, per the [gjs.guide preferences upgrade doc](https://gjs.guide/extensions/upgrading/gnome-shell-45.html#preferences).
  - `extension.js`: removed `PrivacyOverlay`'s connection to the window preview's `destroy` signal; overlays now only tear down when the extension disables, rather than also listening for individual preview destruction.

### Documentation

- Noted that the workspace thumbnail strip (a separate `WindowClone` actor class) is not covered by this extension's obscuring effect.

## [1.2] - 2026-08-14

### Added

- Optional chezmoi sync for the extension's GSettings keys during `install.sh`.

### Fixed

- Overlay scale misalignment during the overview's hover-zoom animation for black/white modes.

## [1.0] - 2026-08-14

### Added

- Initial release: blur, black overlay, and white overlay modes for window previews in the Activities overview, selectable per application.
- Adjustable blur radius (4-128) via `Shell.BlurEffect`.
- Adwaita preferences window for managing protected applications and their modes.
- GPL-2.0-or-later license.
