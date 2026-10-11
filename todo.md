# TODO - Arrera App Menu

Liste des fonctionnalités manquantes pour permettre une intégration parfaite avec les 3 designs de bureau :
- **Design 1** : Bureau moderne (Dock flottant centré en bas)
- **Design 2** : Barre unique inférieure (Dock barre pleine largeur en bas)
- **Design 3** : Barre latérale droite (Dock vertical à droite en tuiles)

---

## 1. Positionnement explicite du lanceur (menu-position)
- [x] **Support des positions géométriques explicites** :
  - `center` : centré sur l'écran (Design 1).
  - `bottom-left` : ancré en bas à gauche au-dessus de la barre (Design 2 / Menu Démarrer).
  - `top-right` : ancré en haut à droite près du dock latéral (Design 3).
  - `top-left` : ancré en haut à gauche.
  - Décalage dynamique propre évitant le chevauchement avec le dock (`globalThis.arreraDock`).
  - Animations directionnelles d'ouverture/fermeture adaptées à chaque position.

---

## 3. Ancrage au-dessus du Dock flottant centré (Pour le Design 1)
- [ ] **Centrage parfait au-dessus de la pilule du dock** :
  - Vérifier que l'ouverture s'aligne harmonieusement au-dessus de la pilule flottante du dock lorsqu'il est en position basse centrée.

---

## 4. Harmonisation visuelle & Thèmes (Designs 1, 2 et 3)
- [ ] **Thème sombre et réactivité à la couleur d'accentuation** :
  - Harmoniser le style du lanceur d'applications avec les tuiles sombres et les bordures d'accentuation du Dock et de la Top Bar.
- [ ] **Cohérence des coins arrondis et flous d'arrière-plan** :
  - Adapter le rayon de courbure et la transparence pour correspondre aux styles graphiques Arrera Blue.
