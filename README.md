# Overview Privacy

A GNOME Shell extension that obscures window preview thumbnails in the Activities overview for selected applications. Choose from blur, black overlay, or white overlay. App icons remain untouched.

## Table of Contents

- [Status](#status)
- [Description](#description)
- [Requirements](#requirements)
- [Installation](#installation)
- [Usage](#usage)
- [Known Limitations](#known-limitations)
- [Packaging](#packaging)
- [License](#license)
- [Project Files](#project-files)

## Status

**Early development phase as a prototype.** The extension code is structurally complete, but the core integration with GNOME Shell's private UI API has **not yet been tested against a running GNOME Shell session**. Verification steps before use are documented in [Known Limitations](#known-limitations).

**⚠ Warning: Blur Mode Shell Freeze Risk**: Blur mode can cause GNOME Shell to freeze or crash when opening the Activities overview. If this occurs, you must log out and log back in to recover the session. A simple extension restart is insufficient. See [Blur Mode: Shell Freeze Risk](#blur-mode-shell-freeze-risk) for details.

## Description

When you open the Activities overview, GNOME Shell displays live thumbnail previews of open windows. This extension protects window thumbnails for specific applications by applying an obscuring effect. Each protected application gets its own individually selectable obscuring mode:

- **Blur**: Shell blur effect in actor mode with adjustable radius 4–128.
- **Black**: Solid black rectangle overlay.
- **White**: Solid white rectangle overlay.

The window icon and title in the overview remain visible and untouched. Configure the extension through a preferences window (accessible via `gnome-extensions prefs`), where you adjust the blur radius and add or manage protected applications with their individual obscuring modes.

## Requirements

- **GNOME Shell**: 45, 46, 47, 48, 49, or 50
- **GLib development files**: Required to compile the GSettings schema
  - Debian/Ubuntu: `libglib2.0-dev`
  - Fedora: `glib2-devel`

## Installation

### Automated Installation with install.sh

The `./install.sh` script in the repository root automates all installation steps:

```bash
./install.sh
```

The script checks for required commands (`glib-compile-schemas` and `gnome-extensions`), installs missing packages via `sudo` with confirmation `[y/N]`, compiles the GSettings schema, creates the symlink, and enables the extension.

On `rpm-ostree` systems, the script warns that installation requires a reboot before the package is available and exits. Reboot, then run `./install.sh` again.

The following sections document the manual steps that `install.sh` automates.

### Compile the GSettings Schema

Before running the extension, compile the GSettings schema:

```bash
cd /path/to/overview-privacy
glib-compile-schemas schemas/
```

This creates `schemas/gschemas.compiled`, which is listed in `.gitignore`.

### Install the Extension

The extension must be copied or symlinked into the local extensions directory. For local testing during development, symlinking avoids needing to reinstall the extension:

```bash
mkdir -p ~/.local/share/gnome-shell/extensions
ln -s "$(pwd)" ~/.local/share/gnome-shell/extensions/overview-privacy@pat
```

Alternatively, copy the extension instead of symlinking:

```bash
cp -r . ~/.local/share/gnome-shell/extensions/overview-privacy@pat
```

### Enable the Extension

```bash
gnome-extensions enable overview-privacy@pat
```

### Load and Test

**Nested Wayland session** (no logout required; requires X11 host):

```bash
dbus-run-session -- gnome-shell --nested --wayland
```

**X11 host (Wayland only)**: Log out and log back in. GNOME Shell only loads extensions at session or nested-session start.

### Monitor Logs

To view extension output and debug errors:

```bash
journalctl -f -o cat /usr/bin/gnome-shell
```

Monitor this output while interacting with the overview to detect errors if the visual effect does not appear.

## Usage

### Via the Preferences Window

```bash
gnome-extensions prefs overview-privacy@pat
```

Opens an Adwaita preferences window with:

- **Blur Settings**: Spin row to adjust the blur radius (4–128). This value applies only to applications whose individual mode is set to Blur.
- **Protected Applications**: List of currently protected applications. Each application has its own dropdown menu to choose the obscuring mode (Blur, Black out, or White out) and a remove button. An additional "Add application" dropdown lets you add more applications from installed apps; newly added applications default to Blur mode but can be changed immediately via their dropdown.

### Via GSettings (Command Line)

Settings are stored in the `org.gnome.shell.extensions.overview-privacy` schema. Inspect or change them with `gsettings` or `dconf-editor`:

```bash
# Show current settings
gsettings get org.gnome.shell.extensions.overview-privacy protected-apps
gsettings get org.gnome.shell.extensions.overview-privacy blur-radius

# Set blur radius to 64
gsettings set org.gnome.shell.extensions.overview-privacy blur-radius 64

# Add applications with individual modes
# Format: {'App-ID': 'mode', ...} where mode is one of: 'blur', 'black', 'white'
gsettings set org.gnome.shell.extensions.overview-privacy protected-apps "{'firefox.desktop': 'blur', 'org.gnome.Terminal': 'black'}"
```

### Settings Reference

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `protected-apps` | `a{ss}` | `{}` | Dictionary map: application ID (from `.desktop` file name) → obscuring mode. Each application gets its own mode: `'blur'`, `'black'`, or `'white'`. |
| `blur-radius` | Integer | `32` | Blur radius for applications whose mode is set to `'blur'`. Range: 4–128. |

## Known Limitations

The extension hooks into `WindowPreview`, a private UI class in GNOME Shell. The name of the thumbnail content actor property is **not documented** and **has changed across GNOME Shell releases**. The code tries three known variants (`window_container`, `_windowContainer`, `_clone`) in fallback order, but this has **not yet been tested against a running GNOME Shell session**.

**This means:**

- The extension may not find the content actor in your Shell version.
- The visual effect may not appear.
- The feature may work on some GNOME Shell versions but not others.

### Blur Mode: Shell Freeze Risk

Blur mode (`Shell.BlurEffect` in `extension.js`) can cause GNOME Shell to freeze or crash when opening the Activities overview. If this happens, you must **log out and log back in** to recover the session. A simple extension restart via `gnome-extensions disable` and `gnome-extensions enable` is insufficient.

To avoid this risk, use **Black** or **White** mode as an alternative to Blur for affected applications. These use a static overlay widget instead of an effect and are more stable.

### Verify the Actor Name

If the extension loads but no visual effect appears on window thumbnails:

1. Open a nested session or a real GNOME Shell session.
2. Press **Alt+F2** to open the run dialog.
3. Type `lg` and press Enter to open Looking Glass (the Shell debugger).
4. Click **Inspector** (or press **Ctrl+Shift+I**).
5. Hover the mouse pointer over the thumbnail preview of an open window in the Activities overview.
6. Check the actor hierarchy. Look for the actor containing the live thumbnail content, typically named `_windowContainer`, `window_container`, `_clone`, or similar.
7. Note the actor property name.
8. If it is not one of the three variants in the fallback chain, edit `extension.js` line 14 and add the name to the `getPreviewContentActor()` function.
9. Recompile the schema and reload or restart the Shell to test.

## Packaging

Create a distribution package for publication on GNOME Extensions:

```bash
gnome-extensions pack
```

This creates a `.zip` archive (listed in `.gitignore`).

## License

Licensed under the GNU General Public License v2.0 or later (GPL-2.0-or-later). See [LICENSE](LICENSE) for the full text. This satisfies the GPL-compatible license requirement of [GNOME Extensions](https://extensions.gnome.org/).

## Project Files

- `extension.js` — Core extension logic. Patches `WindowPreview._init` to attach privacy overlays to each window preview. Overlays read the per-app mode from the `protected-apps` dictionary and manage blur effects or black/white overlay widgets.
- `prefs.js` — Preferences window UI. Standard Adwaita preferences window with blur radius adjustment and a list of protected applications. Each application has its own dropdown menu to choose the obscuring mode.
- `metadata.json` — Extension metadata (UUID, name, description, supported GNOME Shell versions, settings schema ID).
- `schemas/org.gnome.shell.extensions.overview-privacy.gschema.xml` — GSettings schema definition (two keys: `protected-apps` of type `a{ss}` and `blur-radius` of type Integer).
- `stylesheet.css` — CSS classes for black and white overlays (`.overview-privacy-black`, `.overview-privacy-white`).
