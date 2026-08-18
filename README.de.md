# Overview Privacy

[![License: GPL-2.0-or-later](https://img.shields.io/badge/License-GPL--2.0--or--later-blue.svg)](LICENSE)
![GNOME Shell](https://img.shields.io/badge/GNOME%20Shell-45--50-4A86CF?logo=gnome&logoColor=white)

Eine GNOME-Shell-Erweiterung, die Fenstervorschau-Miniaturbilder in der Aktivitätenübersicht für ausgewählte Anwendungen verdeckt. Es stehen Unschärfe, schwarze Überlagung oder weiße Überlagung zur Wahl. App-Symbole bleiben unverändert.

[English version](README.md)

## Inhaltsverzeichnis

- [Status](#status)
- [Beschreibung](#beschreibung)
- [Anforderungen](#anforderungen)
- [Installation](#installation)
- [Verwendung](#verwendung)
- [Bekannte Einschränkungen](#bekannte-einschränkungen)
- [Paketierung](#paketierung)
- [Lizenz](#lizenz)
- [Danksagungen](#danksagungen)
- [Projektdateien](#projektdateien)
- [Changelog](CHANGELOG.md)

## Status

**Getestet und funktioniert bestätigt**, einschließlich aller drei Modi (Unschärfe, Schwarz und Weiß) auf GNOME Shell 50. Versionsabhängige Hinweise auf GNOME Shell 45–49 und den erforderlichen ersten Schritt nach der Installation für den Unschärfemodus befinden sich in [Bekannte Einschränkungen](#bekannte-einschränkungen).

**⚠ Unschärfemodus: Neustart der Sitzung beim ersten Mal erforderlich**: Beim ersten Mal, wenn der Unschärfemodus verwendet wird, bevor der routinemäßige Neustart nach der Installation abgeschlossen ist (siehe [Laden und Testen](#laden-und-testen)), kann das Öffnen der Aktivitätenübersicht zu einem Einfrieren oder Absturz der GNOME Shell führen. Erst diesen einmaligen Neustart abschließen; danach funktioniert der Unschärfemodus – einschließlich Änderung des Unschärferadius – zuverlässig ohne weitere Neustarts. Details finden sich unter [Unschärfemodus: Risiko einer Shell-Einfrierung](#unschärfemodus-risiko-einer-shell-einfrierung).

## Beschreibung

Beim Öffnen der Aktivitätenübersicht zeigt die GNOME Shell Live-Miniaturbilder offener Fenster an. Diese Erweiterung schützt Fensterminiaturen für bestimmte Anwendungen durch Anwendung eines verdeckenden Effekts. Jede geschützte Anwendung erhält einen eigenen, einzeln wählbaren Verdeckungsmodus:

- **Unschärfe**: Shell-Unschärfeeffekt im Actor-Modus mit einstellbarem Radius 4–128.
- **Schwarz**: Solid-schwarzes rechteckiges Overlay.
- **Weiß**: Solid-weißes rechteckiges Overlay.

Das Fenstersymbol und die Titelleiste in der Übersicht bleiben sichtbar und unverändert. Die Erweiterung wird durch ein Einstellungsfenster konfiguriert (zugänglich über `gnome-extensions prefs`), wo der Unschärferadius angepasst und geschützte Anwendungen mit ihren einzelnen Verdeckungsmodi hinzugefügt oder verwaltet werden.

## Anforderungen

- **GNOME Shell**: 45, 46, 47, 48, 49 oder 50
- **GLib-Entwicklungsdateien**: Erforderlich zum Kompilieren des GSettings-Schemas
  - Debian/Ubuntu: `libglib2.0-dev`
  - Fedora: `glib2-devel`

## Installation

### Automatisierte Installation mit install.sh

Das `./install.sh`-Skript im Repository-Root automatisiert alle Installationsschritte:

```bash
./install.sh
```

Das Skript überprüft erforderliche Befehle (`glib-compile-schemas` und `gnome-extensions`), installiert fehlende Pakete über `sudo` mit Bestätigung `[y/N]`, kompiliert das GSettings-Schema, erstellt den Symlink und aktiviert die Erweiterung.

Auf `rpm-ostree`-Systemen zeigt das Skript an, dass die Installation einen Neustart erfordert, bevor das Paket verfügbar ist, und wird beendet. Nach dem Neustart kann `./install.sh` erneut ausgeführt werden.

Falls [chezmoi](https://www.chezmoi.io/) installiert ist und ein initialisiertes Quellverzeichnis hat, bietet das Skript (mit einer `[y/N]`-Bestätigung) an, die GSettings der Erweiterung (`protected-apps`, `blur-radius`) zum chezmoi-Quellzustand hinzuzufügen, damit ein späteres `chezmoi apply` diese auf anderen Maschinen wiederherstellt. Dies schreibt nur Dateien unter dem chezmoi-Quellverzeichnis – es wird `chezmoi apply` nicht ausgeführt und das Dotfiles-Repository wird nicht committed oder gepusht; dies bleibt dem Benutzer überlassen. Falls chezmoi nicht installiert ist oder kein initialisiertes Quellverzeichnis hat, wird dieser Schritt automatisch übersprungen.

Die folgenden Abschnitte dokumentieren die manuellen Schritte, die `install.sh` automatisiert.

### GSettings-Schema kompilieren

Vor dem Ausführen der Erweiterung muss das GSettings-Schema kompiliert werden:

```bash
cd /path/to/overview-privacy
glib-compile-schemas schemas/
```

Dies erstellt `schemas/gschemas.compiled`, das in `.gitignore` aufgeführt ist.

### Erweiterung installieren

Die Erweiterung muss in das lokale Erweiterungsverzeichnis kopiert oder als Symlink eingefügt werden. Zum lokalen Testen während der Entwicklung wird ein Symlink verwendet, um eine Neuinstallation der Erweiterung zu vermeiden:

```bash
mkdir -p ~/.local/share/gnome-shell/extensions
ln -s "$(pwd)" ~/.local/share/gnome-shell/extensions/overview-privacy@pat9496
```

Alternativ kann die Erweiterung kopiert statt als Symlink eingefügt werden:

```bash
cp -r . ~/.local/share/gnome-shell/extensions/overview-privacy@pat9496
```

### Erweiterung aktivieren

```bash
gnome-extensions enable overview-privacy@pat9496
```

### Laden und Testen

GNOME Shell scannt sein Erweiterungsverzeichnis nur bei Sitzungs- (oder verschachtelt-Sitzungs-) Start und lädt neue Erweiterungs-UUIDs. Dies bedeutet, dass jede Neuinstallation – einschließlich dieser – eine der beiden folgenden Optionen erfordert, bevor die Erweiterung sichtbar wird. Dies ist normal und erwartet; es ist unabhängig vom Risiko der Einfrierung im Unschärfemodus, das in [Bekannte Einschränkungen](#bekannte-einschränkungen) beschrieben ist und später auftreten kann, nachdem die Erweiterung bereits geladen und ausgeführt wird.

**Verschachtelte Sitzung** (erfordert X11-Host; wirkt sich nicht auf die echte Sitzung aus und erfordert nicht, sich abzumelden):

```bash
dbus-run-session -- gnome-shell --nested --wayland
```

**Wayland-only Host** (keine verschachtelte Sitzung verfügbar): abmelden und wieder anmelden. Ein einfaches `gnome-extensions disable`/`enable`-Zyklus oder nur ein Neustart der Erweiterung ist nicht ausreichend – GNOME Shell muss seinen eigenen Prozess neu starten, um eine brandneue UUID zu laden.

### Protokolle überwachen

Zur Anzeige von Erweiterungsausgabe und zum Debuggen von Fehlern:

```bash
journalctl -f -o cat /usr/bin/gnome-shell
```

Diese Ausgabe beim Interagieren mit der Übersicht überwachen, um Fehler zu erkennen, falls der visuelle Effekt nicht angezeigt wird.

## Verwendung

### Über das Einstellungsfenster

```bash
gnome-extensions prefs overview-privacy@pat9496
```

Öffnet ein Adwaita-Einstellungsfenster mit:

- **Unschärfeeinstellungen**: Spin-Row zum Anpassen des Unschärferadius (4–128). Dieser Wert gilt nur für Anwendungen, deren einzelner Modus auf Unschärfe gesetzt ist.
- **Geschützte Anwendungen**: Liste derzeit geschützter Anwendungen. Jede Anwendung hat ein eigenes Dropdown-Menü zur Wahl des Verdeckungsmodus (Unschärfe, Schwarz oder Weiß) und eine Schaltfläche zum Entfernen. Ein zusätzliches „Anwendung hinzufügen"-Dropdown ermöglicht das Hinzufügen weiterer Anwendungen aus installierten Apps; neu hinzugefügte Anwendungen haben standardmäßig den Modus Unschärfe, können aber sofort über ihr Dropdown geändert werden.

### Über GSettings (Befehlszeile)

Einstellungen sind im `org.gnome.shell.extensions.overview-privacy`-Schema gespeichert und können mit `gsettings` oder `dconf-editor` überprüft oder geändert werden:

```bash
# Aktuelle Einstellungen anzeigen
gsettings get org.gnome.shell.extensions.overview-privacy protected-apps
gsettings get org.gnome.shell.extensions.overview-privacy blur-radius

# Unschärferadius auf 64 setzen
gsettings set org.gnome.shell.extensions.overview-privacy blur-radius 64

# Anwendungen mit einzelnen Modi hinzufügen
# Format: {'App-ID': 'mode', ...} wobei mode eine der folgenden ist: 'blur', 'black', 'white'
gsettings set org.gnome.shell.extensions.overview-privacy protected-apps "{'firefox.desktop': 'blur', 'org.gnome.Terminal': 'black'}"
```

### Einstellungsreferenz

| Schlüssel | Typ | Standard | Beschreibung |
|-----|------|---------|-------------|
| `protected-apps` | `a{ss}` | `{}` | Dictionary-Map: Anwendungs-ID (aus `.desktop`-Dateiname) → Verdeckungsmodus. Jede Anwendung erhält ihren eigenen Modus: `'blur'`, `'black'` oder `'white'`. |
| `blur-radius` | Integer | `32` | Unschärferadius für Anwendungen, deren Modus auf `'blur'` gesetzt ist. Bereich: 4–128. |

## Bekannte Einschränkungen

Die Erweiterung greift in `WindowPreview`, eine private UI-Klasse in GNOME Shell, ein. Der Name der Thumbnail-Content-Actor-Eigenschaft ist **nicht dokumentiert** und **hat sich über GNOME-Shell-Versionen hinweg geändert**. Der Code versucht drei bekannte Varianten (`window_container`, `_windowContainer`, `_clone`) in Fallback-Reihenfolge. Dies wurde **durch echte Tests auf GNOME Shell 50 bestätigt funktioniert**; es wurde nicht speziell gegen GNOME Shell 45–49 getestet.

**Auf untesteten Versionen bedeutet dies:**

- Die Erweiterung kann den Content-Actor in der Shell-Version möglicherweise nicht finden.
- Der visuelle Effekt wird möglicherweise nicht angezeigt.
- Die Funktion funktioniert möglicherweise auf einigen GNOME-Shell-Versionen, aber nicht auf anderen.

### Arbeitsbereich-Miniaturleiste nicht abgedeckt

Das Fenstervorschau-Raster in der Übersicht ist verdeckt, aber die kleine Arbeitsbereich-Miniaturleiste auf der Seite der Übersicht bleibt sichtbar: Die Fenster in dieser Leiste verwenden eine andere Actor-Klasse (`WindowClone` in `workspaceThumbnail.js`), die diese Erweiterung nicht berücksichtigt. Geschützte Fenster bleiben in dieser kleinen Größe sichtbar.

### Unschärfemodus: Risiko einer Shell-Einfrierung

Beim ersten Mal, wenn der Unschärfemodus verwendet wird – bevor GNOME Shell den Neustart durchlaufen hat, den jede Neuinstallation erfordert (siehe [Laden und Testen](#laden-und-testen)) – kann das Öffnen der Aktivitätenübersicht mit aktiven Unschärfemodus (`Shell.BlurEffect` in `extension.js`) zu einem Einfrieren oder Absturz der GNOME Shell führen. Falls dies geschieht, **muss sich abgemeldet und wieder angemeldet werden**, um die Sitzung wiederherzustellen. Ein einfacher Erweiterungsneustart über `gnome-extensions disable` und `gnome-extensions enable` ist unzureichend.

Nach diesem einen Neustart wurde bestätigt, dass der Unschärfemodus – einschließlich Änderung des Unschärferadius – zuverlässig funktioniert, ohne weitere Neustarts erforderlich zu sein.

Um das Risiko der ersten Verwendung vollständig zu vermeiden, sollte stattdessen für betroffene Anwendungen der **Schwarz**- oder **Weiß**-Modus verwendet werden. Diese verwenden ein statisches Overlay-Widget statt eines Effekts, werden sofort wirksam und erfordern niemals einen Neustart der Sitzung.

### Überlagungsausrichtung während Hover-Zoom (Schwarz-/Weiß-Modi)

GNOME Shell vergrößert ein Fenstervorschau-Miniaturbild leicht, wenn sich der Zeiger darüber befindet – eine private Animation in `WindowPreview.showOverlay()`/`hideOverlay()`, die den Actor um seinen Mittelpunkt skaliert. Der Unschärfemodus wird direkt auf diesen Actor angewendet, daher wird er mit der Animation automatisch skaliert. Der Schwarz-/Weiß-Modus verwendet stattdessen ein separates Overlay-Widget, das über `Clutter.BindConstraint` oben positioniert wird und Position und Größe verfolgt, aber nicht diese Skalierungsanimation selbst; `extension.js` spiegelt die Skalierung des Actors manuell auf das Overlay, damit es während des Schwebens ausgerichtet bleibt.

### Aktornamen überprüfen

Falls die Erweiterung geladen wird, aber kein visueller Effekt auf Fensterminiaturen angezeigt wird:

1. Eine verschachtelte Sitzung oder eine echte GNOME-Shell-Sitzung öffnen.
2. **Alt+F2** drücken, um den Run-Dialog zu öffnen.
3. `lg` eingeben und die Eingabetaste drücken, um Looking Glass (den Shell-Debugger) zu öffnen.
4. **Inspector** klicken (oder **Strg+Umschalt+I** drücken).
5. Den Mauszeiger über das Miniaturvorschaubild eines offenen Fensters in der Aktivitätenübersicht bewegen.
6. Die Actor-Hierarchie überprüfen. Nach dem Actor mit dem Live-Miniaturbild-Inhalt suchen, üblicherweise benannt `_windowContainer`, `window_container`, `_clone` oder ähnlich.
7. Den Actor-Eigenschaftsnamen notieren.
8. Falls es nicht einer der drei Varianten in der Fallback-Kette ist, `extension.js` Zeile 14 bearbeiten und den Namen zur `getPreviewContentActor()`-Funktion hinzufügen.
9. Das Schema neu kompilieren und die Shell neu laden oder neu starten, um zu testen.

## Paketierung

Ein Distributionspaket zur Veröffentlichung auf GNOME Extensions erstellen:

```bash
gnome-extensions pack
```

Dies erstellt ein `.zip`-Archiv (aufgeführt in `.gitignore`).

## Lizenz

Lizenziert unter der GNU General Public License v2.0 oder später (GPL-2.0-or-later). Der vollständige Text befindet sich in [LICENSE](LICENSE). Dies erfüllt die GPL-kompatible Lizenzanforderung von [GNOME Extensions](https://extensions.gnome.org/).

## Danksagungen

Dank an das [GNOME](https://www.gnome.org/)-Projekt für GNOME Shell, seine Erweiterungs-APIs und [gjs.guide](https://gjs.guide/), und an [GNOME Extensions](https://extensions.gnome.org/) für den Review-Prozess und das Hosting, das die Verteilung dieser Erweiterung möglich macht.

Dank an **JustPerfection** für die Überprüfung dieser Erweiterung für das GNOME-Extensions-Verzeichnis und die Kennzeichnung zweier Probleme, die in v1.3 behoben wurden (siehe [CHANGELOG.md](CHANGELOG.md)):

- `prefs.js`: Verwendung des einzelnen korrekten GNOME-45+-Importpfads für `ExtensionPreferences` (siehe das [gjs.guide preferences upgrade doc](https://gjs.guide/extensions/upgrading/gnome-shell-45.html#preferences)) statt eines Try/Fallback-Imports für GNOME 50 vs. 45-49.
- `extension.js`: Entfernung von `PrivacyOverlay`'s Verbindung zum `destroy`-Signal der Fenstervorschau.

## Projektdateien

- `extension.js` — Kernlogik der Erweiterung. Patches `WindowPreview._init`, um Privacy-Overlays an jede Fenstervorschau anzufügen. Overlays lesen den Pro-App-Modus aus dem `protected-apps`-Dictionary und verwalten Unschärfeeffekte oder Schwarz-/Weiß-Overlay-Widgets.
- `prefs.js` — Benutzeroberfläche des Einstellungsfensters. Standard-Adwaita-Einstellungsfenster mit Unschärferadius-Anpassung und einer Liste geschützter Anwendungen. Jede Anwendung hat ein eigenes Dropdown-Menü zur Wahl des Verdeckungsmodus.
- `metadata.json` — Erweiterungs-Metadaten (UUID, Name, Beschreibung, unterstützte GNOME-Shell-Versionen, Einstellungsschema-ID).
- `schemas/org.gnome.shell.extensions.overview-privacy.gschema.xml` — GSettings-Schemadefinition (zwei Schlüssel: `protected-apps` vom Typ `a{ss}` und `blur-radius` vom Typ Integer).
- `stylesheet.css` — CSS-Klassen für Schwarz- und Weiß-Overlays (`.overview-privacy-black`, `.overview-privacy-white`).
- `CHANGELOG.md` — Bemerkenswerte Änderungen pro Version.
