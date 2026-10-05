/* extension.js
 *
 * Arrera App Menu - Extension GNOME Shell
 * Distribution Arrera Blue
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

import Clutter from 'gi://Clutter';
import Gio from 'gi://Gio';
import GObject from 'gi://GObject';
import St from 'gi://St';

import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as OverviewControls from 'resource:///org/gnome/shell/ui/overviewControls.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';

import { AppLauncher } from './appLauncher.js';

const PanelAppMenuButton = GObject.registerClass(
class PanelAppMenuButton extends PanelMenu.Button {
    _init(extension) {
        super._init(0.0, 'Arrera App Menu', false);
        this._extension = extension;
        this.add_style_class_name('app-menu-panel-button');

        const icon = this._createIcon();
        this.add_child(icon);
    }

    _createIcon() {
        const extPath = this._extension?.path;
        if (extPath) {
            const file = Gio.File.new_for_path(`${extPath}/icons/show-apps-symbolic.svg`);
            if (file.query_exists(null)) {
                return new St.Icon({
                    gicon: new Gio.FileIcon({ file }),
                    style_class: 'system-status-icon',
                });
            }
        }
        return new St.Icon({
            icon_name: 'view-app-grid-symbolic',
            style_class: 'system-status-icon',
        });
    }

    vfunc_event(event) {
        if (event.type() === Clutter.EventType.BUTTON_PRESS) {
            this._extension.toggle();
            return Clutter.EVENT_STOP;
        }
        return super.vfunc_event(event);
    }
});

export default class ArreraAppMenuExtension extends Extension {
    enable() {
        this._settings = this.getSettings();
        this._superKeyOpensLauncher = this._settings?.get_boolean('super-key-opens-launcher') ?? true;
        this._showPanelButton = this._settings?.get_boolean('show-panel-button') ?? true;

        if (this._settings) {
            this._settings.connectObject(
                'changed::super-key-opens-launcher', () => {
                    this._superKeyOpensLauncher = this._settings.get_boolean('super-key-opens-launcher');
                },
                'changed::show-panel-button', () => {
                    this._showPanelButton = this._settings.get_boolean('show-panel-button');
                    this._syncPanelButton();
                },
                this
            );
        }

        // Initialize Floating App Launcher
        this._appLauncher = new AppLauncher(this);

        // Sync panel button indicator state with launcher
        this._appLauncher.connectObject(
            'opened', () => this._panelButton?.add_style_pseudo_class('checked'),
            'closed', () => this._panelButton?.remove_style_pseudo_class('checked'),
            this
        );

        // Add top bar panel button if enabled
        this._syncPanelButton();

        // Configure Super key shortcut to toggle launcher
        this._patchOverviewToggle();
    }

    get appLauncher() {
        return this._appLauncher;
    }

    get isOpen() {
        return this._appLauncher ? this._appLauncher.isOpen : false;
    }

    open() {
        if (Main.overview.visible)
            Main.overview.hide();

        this._appLauncher?.open();
    }

    close() {
        this._appLauncher?.close();
    }

    toggle() {
        if (Main.overview.visible)
            Main.overview.hide();

        this._appLauncher?.toggle();
    }

    _syncPanelButton() {
        if (this._showPanelButton && !this._panelButton) {
            this._panelButton = new PanelAppMenuButton(this);
            Main.panel.addToStatusArea('arrera-app-menu', this._panelButton, 0, 'left');
            if (this._appLauncher?.isOpen)
                this._panelButton.add_style_pseudo_class('checked');
        } else if (!this._showPanelButton && this._panelButton) {
            this._panelButton.destroy();
            this._panelButton = null;
        }
    }

    _patchOverviewToggle() {
        let cornerOrButtonClicked = false;
        const origShouldToggle = Main.overview.shouldToggleByCornerOrButton.bind(Main.overview);
        this._origShouldToggle = origShouldToggle;
        Main.overview.shouldToggleByCornerOrButton = () => {
            const allowed = origShouldToggle();
            if (allowed)
                cornerOrButtonClicked = true;
            return allowed;
        };

        const origToggle = Main.overview.toggle.bind(Main.overview);
        this._origOverviewToggle = origToggle;

        Main.overview.toggle = () => {
            if (Main.overview.isDummy)
                return;

            const fromCornerOrButton = cornerOrButtonClicked;
            cornerOrButtonClicked = false;

            if (Main.overview.visible) {
                Main.overview.hide();
                return;
            }

            if (!fromCornerOrButton && this._superKeyOpensLauncher) {
                this.toggle();
            } else {
                Main.overview.show(OverviewControls.ControlsState.WINDOW_PICKER);
            }
        };
    }

    _restoreOverviewToggle() {
        if (this._origShouldToggle) {
            Main.overview.shouldToggleByCornerOrButton = this._origShouldToggle;
            this._origShouldToggle = null;
        }

        if (this._origOverviewToggle) {
            Main.overview.toggle = this._origOverviewToggle;
            this._origOverviewToggle = null;
        }
    }

    disable() {
        this._restoreOverviewToggle();

        if (this._panelButton) {
            this._panelButton.destroy();
            this._panelButton = null;
        }

        if (this._appLauncher) {
            this._appLauncher.disconnectObject(this);
            this._appLauncher.destroy();
            this._appLauncher = null;
        }

        if (this._settings) {
            this._settings.disconnectObject(this);
            this._settings = null;
        }
    }
}
