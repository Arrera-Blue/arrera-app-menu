# Thèmes d'Arrera App Menu

Arrera App Menu intègre un moteur de styles dynamique s'adaptant à vos préférences visuelles et à la couleur d'accentuation configurée dans votre environnement de bureau GNOME Shell.

Trois modes de thème sont disponibles via la clé GSettings `theme-mode`. Si Arrera Dock est également installé, Arrera App Menu se synchronise automatiquement avec le thème du dock sauf si vous choisissez une configuration personnalisée.

---

## 1. Thème Expressif (`expressive`) — *Par défaut*

Inspiré des lignes de design de **Material 3 Expressive** et d'**Android 16 QPR2**, ce thème offre une esthétique moderne et colorée.

* **Fond** : Surface acrylique semi-transparente teintée dynamiquement selon la couleur d'accentuation GNOME active (`rgba(..., 0.94)`).
* **Bordure** : Liseré doux et lumineux assorti à la teinte dominante.
* **Champ de recherche** : Anneau de focus et curseur (caret) illuminés de la couleur d'accentuation.
* **Icône d'en-tête** : Colorée avec la couleur d'accentuation GNOME.
* **Survols d'applications** : Effets de rétro-éclairage (glow) et cartes d'applications subtilement teintées avec bordure intérieure inset.
* **Couleurs d'accentuation prises en charge** :
  * Bleu (`blue`)
  * Sarcelle (`teal`)
  * Vert (`green`)
  * Jaune (`yellow`)
  * Orange (`orange`)
  * Rouge (`red`)
  * Rose (`pink`)
  * Violet (`purple`)
  * Ardoise (`slate`)
* **Recommandé pour** : L'environnement Arrera Blue et les utilisateurs cherchant une intégration visuelle riche et harmonieuse avec leur fond d'écran et leur thème d'accentuation.

---

## 2. Thème Contour noir (`black-outline`)

Un thème sombre et contrasté, conçu pour faire ressortir les icônes et offrir une lisibilité maximale.

* **Fond** : Noir profond (`#0c0c0f` / `rgba(10, 10, 14, 0.95)`), offrant une absorption lumineuse maximale.
* **Bordure** : Contour net et précis de 2 px reprenant la couleur d'accentuation active de GNOME.
* **Champ de recherche** : Fond noir profond avec bordure discrète s'illuminant de la couleur d'accentuation au focus.
* **Icône d'en-tête** : Reprend la couleur d'accentuation.
* **Survols d'applications** : Effet de survol intérieur discret (`inset`) combinant assombrissement et liseré de la couleur d'accentuation.
* **Ombrage** : Ombre portée noire profonde sans halo diffus.
* **Recommandé pour** : Les écrans OLED, les espaces de travail en mode sombre prononcé ou les amateurs de styles cyberpunk et contrastes nets.

---

## 3. Thème Vanilla GNOME (`vanilla-gnome`)

Conçu pour les puristes de GNOME qui souhaitent retrouver l'exacte fidélité esthétique des panneaux et du Dash natif de GNOME Shell.

* **Fond** : Gris neutre standard GNOME Shell `#38383b` (`rgb(56, 56, 59)`).
* **Bordure** : Aucune bordure (`border: none`), rendu flat et épuré.
* **Icône d'en-tête** : Blanc neutre (`#ffffff`), identique aux icônes d'aperçu officiel GNOME.
* **Champ de recherche** : Fond gris neutre (`rgba(255, 255, 255, 0.12)`), sans bordure, curseur blanc et halo de focus blanc discret.
* **Survols d'applications** : Survol neutre et sobre (`rgba(255, 255, 255, 0.10)`), sans interférence de couleur d'accentuation.
* **Ombrage** : Ombre portée douce standard GNOME (`rgba(0, 0, 0, 0.45)`).
* **Réactivité à l'accent GNOME** : Neutre (ignorer l'accent).
* **Recommandé pour** : Les utilisateurs recherchant une intégration 100 % cohérente avec le thème Adwaita et l'ergonomie officielle de GNOME Shell.

---

## Tableau comparatif

| Caractéristique | Expressif (`expressive`) | Contour noir (`black-outline`) | Vanilla GNOME (`vanilla-gnome`) |
| :--- | :--- | :--- | :--- |
| **Couleur de fond** | Teintée selon l'accent (`rgba(..., 0.94)`) | Noir profond (`#0c0c0f`) | Gris natif GNOME (`#38383b`) |
| **Bordure** | Liseré translucide teinté | 2 px solide couleur d'accent | Aucune (flat) |
| **Icône d'en-tête** | Couleur d'accentuation | Couleur d'accentuation | Blanc neutre (`#ffffff`) |
| **Champ de recherche** | Focus ring couleur d'accent | Bordure 2 px accent au focus | Fond gris neutre, focus blanc |
| **Effet de survol** | Halo teinté de la couleur d'accent | Overlay neutre + liseré accent | Overlay blanc transparent discret |
| **Réactivité à l'accent GNOME** | Fond, bordures, recherche et items | Bordures, recherche et items | Neutre (ignore l'accent) |
| **Inspiration** | Material 3 Expressive | Minimaliste / OLED / High Contrast | Dash officiel GNOME Shell / Adwaita |

---

## Comment changer de thème ?

### Méthode 1 : Avec le script interactif `settings.sh`

Lancez le script de configuration à la racine du projet :

```bash
./settings.sh
```

Choisissez ensuite l'option **4) Style visuel du thème (theme-mode)** et sélectionnez le numéro correspondant à votre choix :
* `1` pour **Expressif (Material 3)**
* `2` pour **Contour noir / Accentué**
* `3` pour **Vanilla GNOME (Standard)**

---

### Méthode 2 : En ligne de commande avec `gsettings`

Vous pouvez appliquer directement le thème de votre choix sans redémarrer la session :

```bash
# Appliquer le thème Expressif
gsettings set org.gnome.shell.extensions.app-menu theme-mode 'expressive'

# Appliquer le thème Contour noir
gsettings set org.gnome.shell.extensions.app-menu theme-mode 'black-outline'

# Appliquer le thème Vanilla GNOME
gsettings set org.gnome.shell.extensions.app-menu theme-mode 'vanilla-gnome'
```

---

### Changer la couleur d'accentuation (pour les thèmes Expressif et Contour noir)

Si vous utilisez le thème `expressive` ou `black-outline`, vous pouvez modifier la couleur d'accentuation du bureau GNOME :

```bash
# Exemples : 'blue', 'teal', 'green', 'yellow', 'orange', 'red', 'pink', 'purple', 'slate'
gsettings set org.gnome.desktop.interface accent-color 'orange'
```

Le menu d'applications mettra automatiquement à jour ses couleurs en temps réel.
