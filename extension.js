/* extension.js
 *
 * Arrera App Menu - Extension GNOME Shell
 * Distribution Arrera Blue
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as OverviewControls from 'resource:///org/gnome/shell/ui/overviewControls.js';

import { AppLauncher } from './appLauncher.js';

export default class ArreraAppMenuExtension extends Extension {
    enable() {
        // Enregistrement global pour permettre au dock Arrera d'accéder au lanceur
        global.arreraAppMenu = this;
        Main.arreraAppMenu = this;

        this._settings = this.getSettings();
        this._superKeyOpensLauncher = this._settings?.get_boolean('super-key-opens-launcher') ?? true;

        if (this._settings) {
            this._settings.connectObject(
                'changed::super-key-opens-launcher', () => {
                    this._superKeyOpensLauncher = this._settings.get_boolean('super-key-opens-launcher');
                },
                this
            );
        }

        // Initialisation du lanceur d'applications flottant
        this._appLauncher = new AppLauncher(this);

        // Synchronisation avec l'icône d'applications du dock Arrera (si présent)
        this._appLauncher.connectObject(
            'opened', () => {
                const dock = global.arreraDock || Main.arreraDock;
                if (dock?._showAppsButton)
                    dock._showAppsButton.add_style_pseudo_class('checked');
                if (dock?._autohide)
                    dock._showDock?.();
            },
            'closed', () => {
                const dock = global.arreraDock || Main.arreraDock;
                if (dock?._showAppsButton)
                    dock._showAppsButton.remove_style_pseudo_class('checked');
                if (dock?._autohide && !dock.hover && !dock._dockPill?.hover)
                    dock._onLeave?.();
            },
            this
        );

        // Touche Super ouvre le menu d'applications
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
                // Touche Super : ouvre le menu d'applications flottant
                this.toggle();
            } else {
                // Clic sur coin / bouton Activités : ouvre l'aperçu classique GNOME
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

        if (this._appLauncher) {
            this._appLauncher.disconnectObject(this);
            this._appLauncher.destroy();
            this._appLauncher = null;
        }

        if (this._settings) {
            this._settings.disconnectObject(this);
            this._settings = null;
        }

        if (global.arreraAppMenu === this)
            delete global.arreraAppMenu;
        if (Main.arreraAppMenu === this)
            delete Main.arreraAppMenu;
    }
}
