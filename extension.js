/* extension.js
 *
 * Arrera App Menu - Extension GNOME Shell
 * Distribution Arrera Blue
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

import Gio from 'gi://Gio';
import Meta from 'gi://Meta';
import Shell from 'gi://Shell';

import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as OverviewControls from 'resource:///org/gnome/shell/ui/overviewControls.js';

import { AppLauncher } from './appLauncher.js';

export default class ArreraAppMenuExtension extends Extension {
    enable() {
        // Enregistrement global pour permettre au dock Arrera et autres composants d'accéder au lanceur
        globalThis.arreraAppMenu = this;

        this._settings = this.getSettings();
        this._superKeyOpensLauncher = this._settings?.get_boolean('super-key-opens-launcher') ?? true;
        this._replaceGnomeAppMenu = this._settings?.get_boolean('replace-gnome-app-menu') ?? true;
        this._compactMode = this._settings?.get_boolean('compact-mode') ?? false;

        if (this._settings) {
            this._settings.connectObject(
                'changed::super-key-opens-launcher', () => {
                    this._superKeyOpensLauncher = this._settings.get_boolean('super-key-opens-launcher');
                },
                'changed::replace-gnome-app-menu', () => {
                    const replace = this._settings.get_boolean('replace-gnome-app-menu');
                    if (replace !== this._replaceGnomeAppMenu) {
                        this._replaceGnomeAppMenu = replace;
                        if (this._replaceGnomeAppMenu)
                            this._enableGnomeAppMenuReplacement();
                        else
                            this._disableGnomeAppMenuReplacement();
                    }
                },
                'changed::compact-mode', () => {
                    this._compactMode = this._settings.get_boolean('compact-mode');
                    this._appLauncher?.setCompactMode?.(this._compactMode);
                },
                this
            );
        }

        // Initialisation du lanceur d'applications flottant
        this._appLauncher = new AppLauncher(this);

        // Synchronisation avec l'icône d'applications du dock Arrera et du Dash GNOME
        this._appLauncher.connectObject(
            'opened', () => {
                const dock = globalThis.arreraDock;
                if (dock?._showAppsButton)
                    dock._showAppsButton.add_style_pseudo_class('checked');
                if (dock?._autohide)
                    dock._showDock?.();

                const dash = Main.overview?.dash;
                if (dash?.showAppsButton)
                    dash.showAppsButton.add_style_pseudo_class('checked');
            },
            'closed', () => {
                const dock = globalThis.arreraDock;
                if (dock?._showAppsButton)
                    dock._showAppsButton.remove_style_pseudo_class('checked');
                if (dock?._autohide && !dock.hover && !dock._dockPill?.hover)
                    dock._onLeave?.();

                const dash = Main.overview?.dash;
                if (dash?.showAppsButton)
                    dash.showAppsButton.remove_style_pseudo_class('checked');
            },
            this
        );

        // Remplacement de la touche Super / Aperçu
        this._patchOverviewToggle();

        // Remplacement total du menu et de la grille d'applications native de GNOME
        if (this._replaceGnomeAppMenu)
            this._enableGnomeAppMenuReplacement();
    }

    get appLauncher() {
        return this._appLauncher;
    }

    get compactMode() {
        return this._compactMode;
    }

    get isOpen() {
        return this._appLauncher ? this._appLauncher.isOpen : false;
    }

    open(appId = null) {
        if (Main.overview.visible)
            Main.overview.hide();

        this._appLauncher?.open(appId);
    }

    close() {
        this._appLauncher?.close();
    }

    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
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
                // Touche Super : ouvre le menu d'applications flottant
                this.toggle();
            } else {
                // Clic sur coin / bouton Activités : ouvre l'aperçu classique GNOME
                if (this.isOpen)
                    this.close();
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

    _enableGnomeAppMenuReplacement() {
        // 1. Rediriger les méthodes globales de Main.overview
        this._patchOverviewShowAndApps();

        // 2. Remplacer le raccourci Super+A (toggle-application-view)
        this._patchKeybindings();

        // 3. Remplacer les contrôles de l'Overview (bouton 9-points Dash, gestes, états)
        this._patchOverviewControls();
    }

    _disableGnomeAppMenuReplacement() {
        this._restoreOverviewControls();
        this._restoreKeybindings();
        this._restoreOverviewShowAndApps();
    }

    _patchOverviewShowAndApps() {
        // Rediriger Main.overview.showApps()
        if (!this._origShowApps && Main.overview.showApps) {
            this._origShowApps = Main.overview.showApps.bind(Main.overview);
            Main.overview.showApps = () => {
                this.open();
            };
        }

        // Rediriger Main.overview.show() vers le lanceur si l'état APP_GRID est demandé
        if (!this._origOverviewShow && Main.overview.show) {
            this._origOverviewShow = Main.overview.show.bind(Main.overview);
            Main.overview.show = (state = OverviewControls.ControlsState.WINDOW_PICKER) => {
                if (state === OverviewControls.ControlsState.APP_GRID) {
                    this.open();
                    return;
                }
                this._origOverviewShow(state);
            };
        }

        // Rediriger Main.overview.selectApp(id)
        if (!this._origSelectApp && Main.overview.selectApp) {
            this._origSelectApp = Main.overview.selectApp.bind(Main.overview);
            Main.overview.selectApp = (id) => {
                this.open(id);
            };
        }
    }

    _restoreOverviewShowAndApps() {
        if (this._origShowApps) {
            Main.overview.showApps = this._origShowApps;
            this._origShowApps = null;
        }

        if (this._origOverviewShow) {
            Main.overview.show = this._origOverviewShow;
            this._origOverviewShow = null;
        }

        if (this._origSelectApp) {
            Main.overview.selectApp = this._origSelectApp;
            this._origSelectApp = null;
        }
    }

    _patchKeybindings() {
        try {
            this._shellSettings = new Gio.Settings({ schema_id: 'org.gnome.shell.keybindings' });
            Main.wm.removeKeybinding('toggle-application-view');
            Main.wm.addKeybinding(
                'toggle-application-view',
                this._shellSettings,
                Meta.KeyBindingFlags.IGNORE_AUTOREPEAT,
                Shell.ActionMode.NORMAL | Shell.ActionMode.OVERVIEW,
                () => this.toggle()
            );
        } catch (e) {
            console.error(`[ArreraAppMenu] Error patching keybinding toggle-application-view: ${e}`);
        }
    }

    _restoreKeybindings() {
        try {
            Main.wm.removeKeybinding('toggle-application-view');
            const controls = Main.overview._overview?.controls;
            if (controls?._toggleAppsPage && this._shellSettings) {
                Main.wm.addKeybinding(
                    'toggle-application-view',
                    this._shellSettings,
                    Meta.KeyBindingFlags.IGNORE_AUTOREPEAT,
                    Shell.ActionMode.NORMAL | Shell.ActionMode.OVERVIEW,
                    controls._toggleAppsPage.bind(controls)
                );
            }
        } catch (e) {
            console.error(`[ArreraAppMenu] Error restoring keybinding toggle-application-view: ${e}`);
        } finally {
            this._shellSettings = null;
        }
    }

    _patchOverviewControls() {
        const controls = Main.overview._overview?.controls;
        if (!controls)
            return;

        // a) Intercepter le clic sur le bouton 9-points "Afficher les applications" du Dash GNOME
        if (!this._origOnShowAppsButtonToggled && controls._onShowAppsButtonToggled) {
            this._origOnShowAppsButtonToggled = controls._onShowAppsButtonToggled.bind(controls);
            controls._onShowAppsButtonToggled = () => {
                if (controls._ignoreShowAppsButtonToggle)
                    return;

                if (controls.dash?.showAppsButton?.checked) {
                    controls._ignoreShowAppsButtonToggle = true;
                    controls.dash.showAppsButton.checked = false;
                    controls._ignoreShowAppsButtonToggle = false;

                    this.toggle();
                    return;
                }
                this._origOnShowAppsButtonToggled();
            };
        }

        // b) Intercepter _toggleAppsPage
        if (!this._origToggleAppsPage && controls._toggleAppsPage) {
            this._origToggleAppsPage = controls._toggleAppsPage.bind(controls);
            controls._toggleAppsPage = () => {
                this.toggle();
            };
        }

        // c) Intercepter _shiftState (double Super ou Shift+Super+Up pour ne pas passer à APP_GRID)
        if (!this._origShiftState && controls._shiftState) {
            this._origShiftState = controls._shiftState.bind(controls);
            controls._shiftState = (direction) => {
                const { currentState, finalState } = controls._stateAdjustment.getStateTransitionParams();
                if (direction === Meta.MotionDirection.UP &&
                    (currentState >= OverviewControls.ControlsState.WINDOW_PICKER ||
                     finalState >= OverviewControls.ControlsState.WINDOW_PICKER)) {
                    this.open();
                    return;
                }
                this._origShiftState(direction);
            };
        }

        // d) Limiter les points d'ancrage des gestes tactiles à [HIDDEN, WINDOW_PICKER]
        if (!this._origGestureBegin && controls.gestureBegin) {
            this._origGestureBegin = controls.gestureBegin.bind(controls);
            controls.gestureBegin = (tracker) => {
                const baseDistance = global.screen_height;
                const progress = controls._stateAdjustment.value;
                const points = [
                    OverviewControls.ControlsState.HIDDEN,
                    OverviewControls.ControlsState.WINDOW_PICKER,
                ];

                const transition = controls._stateAdjustment.get_transition('value');
                const cancelProgress = transition
                    ? transition.get_interval().peek_final_value()
                    : Math.round(progress);
                controls._stateAdjustment.remove_transition('value');

                tracker.confirmSwipe(baseDistance, points, progress, cancelProgress);
                controls.prepareToEnterOverview();
                controls._stateAdjustment.gestureInProgress = true;
            };
        }

        // e) Empêcher l'affichage de la grille d'applications native dans l'Overview
        if (!this._origUpdateAppDisplayVisibility && controls._updateAppDisplayVisibility) {
            this._origUpdateAppDisplayVisibility = controls._updateAppDisplayVisibility.bind(controls);
            controls._updateAppDisplayVisibility = () => {
                if (controls._appDisplay)
                    controls._appDisplay.visible = false;
            };
            if (controls._appDisplay)
                controls._appDisplay.visible = false;
        }

        // f) Bloquer la limite supérieure de l'ajustement d'état à WINDOW_PICKER
        if (controls._stateAdjustment && this._origAdjustmentUpper === undefined) {
            this._origAdjustmentUpper = controls._stateAdjustment.upper;
            controls._stateAdjustment.upper = OverviewControls.ControlsState.WINDOW_PICKER;
        }
    }

    _restoreOverviewControls() {
        const controls = Main.overview._overview?.controls;
        if (!controls)
            return;

        if (this._origOnShowAppsButtonToggled) {
            controls._onShowAppsButtonToggled = this._origOnShowAppsButtonToggled;
            this._origOnShowAppsButtonToggled = null;
        }

        if (this._origToggleAppsPage) {
            controls._toggleAppsPage = this._origToggleAppsPage;
            this._origToggleAppsPage = null;
        }

        if (this._origShiftState) {
            controls._shiftState = this._origShiftState;
            this._origShiftState = null;
        }

        if (this._origGestureBegin) {
            controls.gestureBegin = this._origGestureBegin;
            this._origGestureBegin = null;
        }

        if (this._origUpdateAppDisplayVisibility) {
            controls._updateAppDisplayVisibility = this._origUpdateAppDisplayVisibility;
            this._origUpdateAppDisplayVisibility = null;
        }

        if (this._origAdjustmentUpper !== undefined && controls._stateAdjustment) {
            controls._stateAdjustment.upper = this._origAdjustmentUpper;
            this._origAdjustmentUpper = undefined;
        }
    }

    disable() {
        if (this._replaceGnomeAppMenu)
            this._disableGnomeAppMenuReplacement();

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

        if (globalThis.arreraAppMenu === this)
            delete globalThis.arreraAppMenu;
    }
}
