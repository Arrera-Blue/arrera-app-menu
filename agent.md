# Guide d'intégration et d'architecture pour Agents d'IA - Arrera App Menu

Ce document sert de guide de référence complet et autonome pour tout agent d'IA ou développeur reprenant le projet **Arrera App Menu**. Il détaille l'architecture, le cycle de vie, les interactions avec GNOME Shell et l'écosystème Arrera, ainsi que les commandes de développement et bonnes pratiques.

---

## 1. Vue d'ensemble du projet

* **Nom** : Arrera App Menu
* **UUID** : `app-menu@linux.arrera-software.fr`
* **Distribution cible** : Arrera Blue Linux
* **Environnement** : GNOME Shell (versions 45 à 50) sur Wayland & X11 (GJS, ES Modules, Clutter, St)
* **Objectif** : Un menu / lanceur d'applications moderne et flottant (style Launchpad / Material 3 Expressive avec verre dépoli / acrylique) qui remplace intégralement la grille d'applications native de GNOME Shell.
* **Fonctionnalités principales** :
  * Fenêtre modale flottante centrée avec fond acrylique semi-transparent et flou d'arrière-plan.
  * Recherche instantanée en direct filtrant sur le nom et l'identifiant des applications (`.desktop`).
  * Grille multi-colonnes (7 colonnes) avec icônes haute résolution et libellés élégants.
  * Menu contextuel complet (clic droit ou appui long) permettant le lancement d'instances ou l'épinglage/détachement des favoris (`AppFavorites`).
  * Remplacement total et transparent de la grille d'applications GNOME native (raccourci `Super+A`, bouton 9 points du Dash, gestes tactiles de défilement).
  * Ouverture configurable via la touche `Super` (Windows) sans briser l'accès à la vue Activités classique lors d'un clic sur le coin réactif ou le bouton de la barre supérieure.
  * Synchronisation dynamique avec la couleur d'accentuation de GNOME (`org.gnome.desktop.interface accent-color`).
  * Intégration et communication bidirectionnelle avec l'extension sœur `arrera-dock`.

---

## 2. Structure des fichiers

```text
.
├── extension.js                    # Point d'entrée de l'extension (cycle de vie enable/disable, patches GNOME Shell)
├── appLauncher.js                  # Interface du lanceur flottant (AppLauncher, MacAppItem, recherche, grille, signaux)
├── stylesheet.css                  # Feuilles de style Clutter/St (effet verre dépoli, cartes d'apps, thèmes d'accent)
├── metadata.json                   # Métadonnées déclaratives de l'extension pour GNOME Shell (UUID, versions 45-50)
├── GNOME_SETTINGS_INTEGRATION.md   # Documentation de référence des clés GSettings
├── settings.sh                     # Menu CLI interactif Bash pour activer/désactiver les réglages GSettings
├── compile_schemas.sh              # Script de compilation des schémas GSettings dans le projet et l'espace utilisateur
├── lauch_dev.sh                    # Script de lancement en session imbriquée de test (gnome-shell --devkit)
├── build.sh                        # Script d'empaquetage de l'archive tar.gz et génération du paquet RPM
├── gnome-shell-extension-arrera-app-menu.spec  # Fichier de spécification RPM pour Fedora / Arrera Blue
├── schemas/
│   ├── org.gnome.shell.extensions.app-menu.gschema.xml  # Schéma GSettings décrivant les clés de configuration
│   └── gschemas.compiled                            # Binaire de schéma compilé localement
└── output/                         # Répertoire de sortie des RPM générés par build.sh
```

---

## 3. Rôle des composants clés

### `extension.js` (Point d'entrée principal)
* Hérite de `Extension` (`resource:///org/gnome/shell/extensions/extension.js`).
* **Enregistrement global** : expose `globalThis.arreraAppMenu = this` pour que `arrera-dock` et d'autres composants puissent interagir avec le menu d'applications.
* **Méthodes publiques** :
  * `open(appId = null)` : Masque l'aperçu GNOME si ouvert et affiche le lanceur.
  * `close()` : Ferme le lanceur.
  * `toggle()` : Bascule l'affichage du lanceur.
  * `isOpen` : Propriété booléenne retournant l'état d'ouverture.
* **Synchronisation avec `arrera-dock` et le Dash GNOME** :
  * Écoute les signaux `'opened'` et `'closed'` de `AppLauncher`.
  * Lorsque le menu s'ouvre, active le style pseudo-classe `'checked'` sur le bouton d'applications du dock (`globalThis.arreraDock._showAppsButton`) et sur le Dash natif.
  * Si l'autohide du dock est actif, force l'affichage du dock via `dock._showDock()`.
* **Interception de la touche Super (`_patchOverviewToggle`)** :
  * Distingue un appui sur la touche Super d'un clic de souris sur le coin réactif / bouton Activités via `shouldToggleByCornerOrButton`.
  * Si la touche Super est pressée et `super-key-opens-launcher` est activé, ouvre le lanceur Arrera. Si l'utilisateur clique sur le bouton Activités, affiche l'aperçu classique GNOME (`WINDOW_PICKER`).
* **Remplacement total de la grille GNOME (`_enableGnomeAppMenuReplacement`)** :
  1. Redirige `Main.overview.showApps()` et `Main.overview.selectApp(id)` vers le lanceur.
  2. Redirige `Main.overview.show(state)` si l'état demandé est `ControlsState.APP_GRID`.
  3. Réassigne le raccourci `org.gnome.shell.keybindings toggle-application-view` (Super+A) vers `this.toggle()`.
  4. Intercepte le clic sur le bouton 9-points du Dash (`controls._onShowAppsButtonToggled`).
  5. Intercepte la transition d'état vers le haut (`controls._shiftState`).
  6. Réduit les points d'ancrage des gestes tactiles (`controls.gestureBegin`) pour empêcher le swipe vers `APP_GRID`.
  7. Verrouille `controls._stateAdjustment.upper = OverviewControls.ControlsState.WINDOW_PICKER`.
  8. Force `controls._appDisplay.visible = false`.
* **Restauration propre (`disable`)** :
  * Restaure intégralement chaque méthode originale écrasée (`_orig...`), réenregistre le keybinding natif, détruit le widget `AppLauncher`, nettoie les écouteurs d'événements et supprime `globalThis.arreraAppMenu`.

### `appLauncher.js` (Interface graphique et moteur du lanceur)
Composé de deux classes Clutter/St :

#### 1. `MacAppItem` (Item individuel dans la grille)
* Hérite de `St.Button`.
* Contient une icône de 56px (`app.create_icon_texture(56)`) et un libellé avec retours à la ligne / troncature intelligente via Pango.
* **Actions** :
  * Clic gauche : appelle `_activate()` (active l'application ou ouvre une nouvelle fenêtre si déjà lancée via `app.open_new_window(-1)`).
  * Clic droit ou appui long (`Clutter.LongPressGesture`) : ouvre un menu contextuel complet (`AppMenu`) positionné sur le dessus (`St.Side.TOP`).
  * Intégration `AppFavorites` : gère le basculement "Épingler aux favoris" / "Détacher des favoris" avec mise à jour dynamique du libellé.

#### 2. `AppLauncher` (Conteneur racine du lanceur flottant)
* Hérite de `St.Widget` avec un `Clutter.BinLayout`. Ajouté directement dans `Main.uiGroup`.
* **Backdrop (`_backdrop`)** :
  * Acteur plein écran semi-transparent qui capture les clics hors de la fenêtre pour fermer le lanceur.
  * **Comportement transparent** : détecte si le clic survient sur la barre supérieure (`Main.panel`) ou sur le dock (`_findDockActor()`) et propage l'événement (`EVENT_PROPAGATE`) pour permettre de cliquer directement sur une icône du dock ou un menu système sans double clic.
* **Fenêtre flottante (`_window`)** :
  * `St.BoxLayout` vertical avec bordure translucide, ombrage profond et angles arrondis.
  * Dimensions adaptatives calculées selon l'écran principal et le mode (`_updateGeometry()`) :
    * Mode standard : centré, 780x540 px, grille 7 colonnes (`COLUMNS = 7`).
    * Mode compact (`compact-mode`) : portrait vertical (560x630 px max), grille 6 colonnes (`COMPACT_COLUMNS = 6`), positionné au-dessus d'Arrera Dock (aligné à gauche ou au centre selon les icônes du dock) ou au centre de l'écran en repli.
* **En-tête de recherche (`_buildHeader`)** :
  * `St.Entry` pour la recherche temps réel.
  * Raccourcis gérés : `Échap` (vide le champ puis ferme), `Super` (ferme), `Entrée` (lance la première application filtrée via `_launchFirstApp()`).
  * Bouton croix pour fermer à la souris.
* **Grille défilable (`_buildGrid`, `_refilterApps`)** :
  * `St.ScrollView` avec barres de défilement automatiques et gestion du défilement fluide souris/touchpad.
  * Grille organisée en lignes de 7 colonnes (ou 6 en mode compact). Si la dernière ligne a moins d'éléments, des widgets d'espacement vides (`dummy`) maintiennent l'alignement strict.
* **Filtrage des applications** :
  * Écoute `Shell.AppSystem.get_default().connectObject('installed-changed', ...)` pour rafraîchir la liste si une application est installée ou désinstallée.
  * Filtre insensible à la casse à la fois sur le nom de l'application et l'ID du fichier `.desktop`.
* **Animations d'ouverture/fermeture** :
  * Transitions fluides Clutter (`ease()`) couplant fondu d'opacité et zoom d'échelle (scale de 0.94 à 1.0 avec `EASE_OUT_BACK`).
* **Gestion du focus clavier** :
  * Mémorise l'acteur ayant le focus clavier avant l'ouverture (`_prevKeyFocus`) et le restaure fidèlement lors de la fermeture.

### `stylesheet.css` (Moteur de style St)
* Déclare les styles graphiques de l'interface :
  * `.mac-app-launcher-root` : Arrière-plan sombre semi-transparent (`rgba(0, 0, 0, 0.35)`).
  * `.mac-app-launcher-window` : Boîte acrylique (`rgba(22, 22, 26, 0.92)` avec bordure 1px et ombrage 64px).
  * `.mac-launcher-search-entry` : Champ de texte moderne avec focus ring réagissant à `-st-accent-color`.
  * `.mac-app-item` : Cartes d'applications avec effets de survol (`:hover`, `:active`).
  * Déclinaisons de classes d'accent (`accent-blue`, `accent-teal`, `accent-green`, `accent-yellow`, `accent-orange`, `accent-red`, `accent-pink`, `accent-purple`, `accent-slate`) appliquant la couleur d'accentuation sur les icônes, bordures et curseurs.

---

## 4. Schéma GSettings (`org.gnome.shell.extensions.app-menu`)

Le schéma est défini dans [schemas/org.gnome.shell.extensions.app-menu.gschema.xml](file:///home/baptistep/.local/share/gnome-shell/extensions/arrera-app-menu/schemas/org.gnome.shell.extensions.app-menu.gschema.xml) et documenté dans [GNOME_SETTINGS_INTEGRATION.md](file:///home/baptistep/.local/share/gnome-shell/extensions/arrera-app-menu/GNOME_SETTINGS_INTEGRATION.md) :

| Clé | Type | Défaut | Valeurs autorisées | Rôle |
|---|---|---|---|---|
| `super-key-opens-launcher` | `b` (booléen) | `true` | `true`, `false` | Si activé, la touche Super ouvre le menu d'applications. Si désactivé, rétablit le comportement d'origine GNOME (aperçu des activités). |
| `replace-gnome-app-menu` | `b` (booléen) | `true` | `true`, `false` | Si activé, remplace totalement la vue et la grille d'applications native de GNOME (Super+A, bouton 9 points du Dash, gestes tactiles) par le menu Arrera. |
| `compact-mode` | `b` (booléen) | `false` | `true`, `false` | Si activé, affiche le menu sous forme de popover vertical compact au-dessus d'Arrera Dock (aligné selon les icônes du dock au centre ou à gauche) ou au centre de l'écran. |

---

## 5. Commandes de développement et flux de travail

### Vérification de la syntaxe JavaScript (ESM / Node.js)
```bash
node --check extension.js appLauncher.js
```

### Recompilation des schémas GSettings
Lors de toute modification du fichier XML de schéma :
```bash
./compile_schemas.sh
```
*Ce script compile les schémas dans `schemas/` et installe le schéma dans `~/.local/share/glib-2.0/schemas/` pour que `gsettings` puisse y accéder immédiatement sans redémarrage système.*

### Lancement de l'environnement de test (Session GNOME Shell imbriquée)
```bash
./lauch_dev.sh
```
*Le script supprime les fichiers de verrou de mode sans échec, active les extensions `app-menu` et `dock`, et lance une instance imbriquée Wayland via `dbus-run-session -- gnome-shell --devkit`.*

> [!NOTE]
> **Structure des répertoires et UUID dans GNOME Shell** :
> GNOME Shell exige strictement que le nom du dossier dans `~/.local/share/gnome-shell/extensions/` corresponde exactement à l'UUID de l'extension (`app-menu@linux.arrera-software.fr`).
> Pour développer dans le dépôt cloné `arrera-app-menu`, un lien symbolique est présent :
> `~/.local/share/gnome-shell/extensions/app-menu@linux.arrera-software.fr -> arrera-app-menu`
> Si GNOME Shell affiche un avertissement critique indiquant que le dossier `arrera-app-menu` ne correspond pas à l'UUID, cela provient de l'exploration brute du dossier source ; l'extension est bien chargée via le lien symbolique UUID.

### Configuration interactive des options (CLI)
```bash
./settings.sh
```
*Ou directement via la commande `gsettings` :*
```bash
gsettings set org.gnome.shell.extensions.app-menu super-key-opens-launcher true
gsettings set org.gnome.shell.extensions.app-menu replace-gnome-app-menu true
```

### Génération du paquet RPM
```bash
./build.sh
```
*Génère l'archive source tarball et les fichiers `.rpm` et `.src.rpm` dans le dossier `output/` via `rpmbuild`.*

---

## 6. Interaction avec l'écosystème Arrera & GNOME

### Interaction avec `arrera-dock`
* L'extension vérifie `globalThis.arreraDock`.
* Lors de l'ouverture du menu d'applications :
  * Le bouton de grille d'applications du dock reçoit la classe CSS pseudo-classe `:checked`.
  * Si l'option d'autohide du dock est active, le dock est maintenu visible tant que le menu est ouvert.
  * Dans `Main.uiGroup`, le dock et le panneau supérieur sont réhaussés au-dessus du lanceur (`Main.uiGroup.set_child_above_sibling(...)`) afin que leurs barres restent accessibles.
* Lors de clics extérieurs sur l'arrière-plan du lanceur, si les coordonnées du clic se trouvent sur le dock, l'événement est propagé pour permettre un clic direct sans avoir à fermer le menu au préalable.

### Interaction avec GNOME Shell Overview
* Lorsque `replace-gnome-app-menu` est actif :
  * La grille d'applications par défaut de GNOME est complètement désactivée de la hiérarchie visuelle.
  * Le geste de swipe vertical vers le haut s'arrête à l'aperçu des fenêtres (`WINDOW_PICKER`) sans jamais transitionner vers `APP_GRID`.
  * Tout appel externe à `Main.overview.showApps()` ou `Main.overview.selectApp(id)` est redirigé en douceur vers le menu Arrera.

---

## 7. Règles de conception & Bonnes pratiques pour l'agent

1. **Cycle de vie et nettoyage strict (`enable` / `disable`)** :
   * Tout monkey-patching appliqué sur des méthodes natives de GNOME Shell (`Main.overview.toggle`, `Main.overview.showApps`, `controls._onShowAppsButtonToggled`, etc.) **doit obligatoirement** conserver une référence à la méthode originale (`this._origMethod`) et la restaurer fidèlement dans `_restore...()` et `disable()`.
   * Tous les écouteurs de signaux créés avec `connectObject(...)` doivent être libérés avec `disconnectObject(this)`.
   * Tout widget inséré dans `Main.uiGroup` doit être retiré et détruit lors du `disable()` ou `destroy()`.

2. **Gestion du focus clavier et modalité** :
   * L'extension ne doit jamais voler définitivement le focus clavier. Toujours sauvegarder `_prevKeyFocus = global.stage.get_key_focus()` avant d'attribuer le focus au champ de recherche, et restaurer ce focus lors de la fermeture si l'acteur n'est pas détruit.
   * La touche `Échap` doit d'abord vider le texte s'il y en a un, puis fermer le lanceur si le champ est vide.

3. **Spécificités Clutter et St** :
   * `St` n'utilise pas un moteur CSS web complet : les propriétés supportées sont restreintes (utiliser `icon-size`, `spacing`, `border-radius`, `st-mix`, `st-transparentize`, `-st-accent-color`).
   * Toujours vérifier l'existence des acteurs avant d'accéder à leurs propriétés (`actor?.visible`, `is_finalized()`).

4. **Compatibilité GNOME Shell 45 à 50** :
   * Utiliser impérativement la syntaxe des modules ECMAScript (`import ... from 'gi://...';` et `import ... from 'resource:///...'`).
   * Ne jamais utiliser l'ancienne syntaxe `const { ... } = imports.gi;`.
