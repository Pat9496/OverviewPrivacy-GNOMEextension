import Adw from 'gi://Adw';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import Gtk from 'gi://Gtk';

// GNOME 50 moved the prefs base classes to a new resource path; GNOME 45-49 only
// have the old one. Try the new path first, fall back to the old one.
let ExtensionPreferences, _;
try {
    ({ExtensionPreferences, gettext: _} = await import('resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js'));
} catch {
    ({ExtensionPreferences, gettext: _} = await import('resource:///org/gnome/shell/extensions/prefs.js'));
}

const MODES = ['blur', 'black', 'white'];
const modeLabels = () => [_('Blur'), _('Black out'), _('White out')];

export default class OverviewPrivacyPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        const settings = this.getSettings();

        const page = new Adw.PreferencesPage();
        window.add(page);

        page.add(this._buildBlurGroup(settings));
        page.add(this._buildAppsGroup(settings));
    }

    _buildBlurGroup(settings) {
        const group = new Adw.PreferencesGroup({
            title: _('Blur Settings'),
            description: _('Warning: blur mode can freeze GNOME Shell when you open the Overview. If this happens, you will need to log out and log back in to recover.'),
        });

        const blurRow = new Adw.SpinRow({
            title: _('Blur radius'),
            subtitle: _('Only used for apps set to blur mode'),
            adjustment: new Gtk.Adjustment({lower: 4, upper: 128, step_increment: 1, page_increment: 8}),
        });
        settings.bind('blur-radius', blurRow, 'value', Gio.SettingsBindFlags.DEFAULT);
        group.add(blurRow);

        return group;
    }

    _buildAppsGroup(settings) {
        const group = new Adw.PreferencesGroup({
            title: _('Protected Applications'),
            description: _('Previews for these apps are obscured in the overview, using the mode chosen for each app. Icons stay untouched.'),
        });

        const appsList = new Gtk.ListBox({
            selection_mode: Gtk.SelectionMode.NONE,
            css_classes: ['boxed-list'],
        });
        group.add(appsList);

        const readMap = () => settings.get_value('protected-apps').deep_unpack();
        const writeMap = map => settings.set_value('protected-apps', new GLib.Variant('a{ss}', map));

        const refresh = () => {
            let child = appsList.get_first_child();
            while (child) {
                const next = child.get_next_sibling();
                appsList.remove(child);
                child = next;
            }

            for (const [appId, mode] of Object.entries(readMap())) {
                const appInfo = Gio.DesktopAppInfo.new(appId);
                const row = new Adw.ComboRow({
                    title: appInfo ? appInfo.get_display_name() : appId,
                    subtitle: appId,
                    model: Gtk.StringList.new(modeLabels()),
                });
                row.selected = Math.max(0, MODES.indexOf(mode));
                row.connect('notify::selected', () => {
                    const map = readMap();
                    map[appId] = MODES[row.selected];
                    writeMap(map);
                });

                const removeButton = new Gtk.Button({
                    icon_name: 'user-trash-symbolic',
                    valign: Gtk.Align.CENTER,
                    css_classes: ['flat'],
                });
                removeButton.connect('clicked', () => {
                    const map = readMap();
                    delete map[appId];
                    writeMap(map);
                    refresh();
                });
                row.add_suffix(removeButton);
                appsList.append(row);
            }
        };
        refresh();

        const installedApps = Gio.AppInfo.get_all()
            .filter(appInfo => appInfo.should_show())
            .map(appInfo => ({id: appInfo.get_id(), name: appInfo.get_display_name()}))
            .sort((a, b) => a.name.localeCompare(b.name));

        const addRow = new Adw.ComboRow({
            title: _('Add application'),
            model: Gtk.StringList.new(installedApps.map(app => app.name)),
        });
        addRow.connect('notify::selected', () => {
            const app = installedApps[addRow.selected];
            if (!app)
                return;
            const map = readMap();
            if (!(app.id in map)) {
                map[app.id] = 'blur';
                writeMap(map);
                refresh();
            }
        });
        group.add(addRow);

        return group;
    }
}
