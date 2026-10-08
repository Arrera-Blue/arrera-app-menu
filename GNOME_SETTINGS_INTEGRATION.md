# Configuration GSettings - Arrera App Menu

* **Schéma** : `org.gnome.shell.extensions.app-menu`
* **Chemin** : `/org/gnome/shell/extensions/app-menu/`

---

### `super-key-opens-launcher` (booléen)
* **Description** : Ouvre le menu d'applications avec la touche Super. Si désactivé, elle rétablit le comportement d'origine de GNOME (aperçu des activités).
* **Valeurs possibles** :
  * `true` *(défaut)* : Ouvre le menu d'applications Arrera avec la touche Super.
  * `false` : Comportement par défaut de GNOME (aperçu des activités).

---

### `replace-gnome-app-menu` (booléen)
* **Description** : Remplace totalement le menu d'applications GNOME (vue et grille d'applications native, raccourci Super+A, bouton 9 points du Dash, raccourcis et gestes) par le menu d'applications Arrera.
* **Valeurs possibles** :
  * `true` *(défaut)* : Remplace totalement la vue et la grille d'applications native de GNOME.
  * `false` : Conserve la grille d'applications native de GNOME.

---

### `compact-mode` (booléen)
* **Description** : Affiche le menu sous forme de popover vertical compact au-dessus d'Arrera Dock (aligné selon la position de ses icônes, au centre ou à gauche) ou au centre de l'écran si le dock n'est pas présent.
* **Valeurs possibles** :
  * `true` : Active le mode compact vertical au-dessus du dock.
  * `false` *(défaut)* : Conserve le menu large centré d'origine.

---

### `theme-mode` (chaîne de caractères)
* **Description** : Style d'application du thème de couleur pour le menu d'applications flottant.
* **Valeurs possibles** :
  * `'expressive'` *(défaut)* : Style Material 3 Expressive avec surface acrylique teintée de la couleur d'accentuation et halos lumineux.
  * `'black-outline'` : Noir OLED profond (`#0c0c0f`) avec contour net de 2 px de la couleur d'accentuation active.
  * `'vanilla-gnome'` : Gris neutre standard GNOME Shell (`#38383b`), sans bordure, ignore l'accentuation de couleur.

