import Clutter from 'gi://Clutter';
import Shell from 'gi://Shell';
import St from 'gi://St';

import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';
import * as WindowPreviewModule from 'resource:///org/gnome/shell/ui/windowPreview.js';

const OVERLAY_BLACK_CLASS = 'overview-privacy-black';
const OVERLAY_WHITE_CLASS = 'overview-privacy-white';

function getPreviewContentActor(preview) {
    // The window clone actor inside WindowPreview is private Shell UI state
    // and its name has changed across GNOME Shell releases; try known variants.
    return preview.window_container ?? preview._windowContainer ?? preview._clone ?? null;
}

class PrivacyOverlay {
    constructor(preview, settings) {
        this._preview = preview;
        this._settings = settings;
        this._contentActor = getPreviewContentActor(preview);
        this._blurEffect = null;
        this._overlayWidget = null;
        this._scaleXId = null;
        this._scaleYId = null;

        this._settingsChangedId = settings.connect('changed', () => this._update());

        this._update();
    }

    _getMode() {
        const app = Shell.WindowTracker.get_default().get_window_app(this._preview.metaWindow);
        if (!app)
            return null;
        return this._settings.get_value('protected-apps').deep_unpack()[app.get_id()] ?? null;
    }

    _clear() {
        if (this._blurEffect) {
            this._contentActor?.remove_effect(this._blurEffect);
            this._blurEffect = null;
        }
        if (this._scaleXId) {
            this._contentActor?.disconnect(this._scaleXId);
            this._scaleXId = null;
        }
        if (this._scaleYId) {
            this._contentActor?.disconnect(this._scaleYId);
            this._scaleYId = null;
        }
        this._overlayWidget?.destroy();
        this._overlayWidget = null;
    }

    _update() {
        this._clear();

        if (!this._contentActor)
            return;

        const mode = this._getMode();
        if (!mode)
            return;

        if (mode === 'blur') {
            this._blurEffect = new Shell.BlurEffect({
                mode: Shell.BlurMode.ACTOR,
                radius: this._settings.get_int('blur-radius'),
            });
            this._contentActor.add_effect(this._blurEffect);
            return;
        }

        this._overlayWidget = new St.Widget({
            style_class: mode === 'white' ? OVERLAY_WHITE_CLASS : OVERLAY_BLACK_CLASS,
            reactive: false,
        });
        this._overlayWidget.add_constraint(new Clutter.BindConstraint({
            source: this._contentActor,
            coordinate: Clutter.BindCoordinate.ALL,
        }));

        // WindowPreview.showOverlay()/hideOverlay() animate the content actor's own
        // scale_x/scale_y on hover (zoom effect); BindConstraint only tracks position/size,
        // so mirror the scale by hand to keep the overlay aligned during that animation.
        const [pivotX, pivotY] = this._contentActor.get_pivot_point();
        this._overlayWidget.set_pivot_point(pivotX, pivotY);
        this._overlayWidget.scale_x = this._contentActor.scale_x;
        this._overlayWidget.scale_y = this._contentActor.scale_y;
        this._scaleXId = this._contentActor.connect('notify::scale-x',
            () => (this._overlayWidget.scale_x = this._contentActor.scale_x));
        this._scaleYId = this._contentActor.connect('notify::scale-y',
            () => (this._overlayWidget.scale_y = this._contentActor.scale_y));

        this._contentActor.get_parent()?.insert_child_above(this._overlayWidget, this._contentActor);
    }

    destroy() {
        this._clear();
        if (this._settingsChangedId) {
            this._settings.disconnect(this._settingsChangedId);
            this._settingsChangedId = null;
        }
    }
}

export default class OverviewPrivacyExtension extends Extension {
    enable() {
        this._settings = this.getSettings();
        this._overlays = new Set();

        const extension = this;
        this._originalInit = WindowPreviewModule.WindowPreview.prototype._init;
        WindowPreviewModule.WindowPreview.prototype._init = function (...args) {
            extension._originalInit.call(this, ...args);
            extension._overlays.add(new PrivacyOverlay(this, extension._settings));
        };
    }

    disable() {
        WindowPreviewModule.WindowPreview.prototype._init = this._originalInit;
        this._originalInit = null;

        for (const overlay of this._overlays)
            overlay.destroy();
        this._overlays = null;

        this._settings = null;
    }
}
