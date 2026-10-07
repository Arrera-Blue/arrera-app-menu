# TODO - Arrera App Menu

Liste des fonctionnalités manquantes pour permettre une intégration parfaite avec les 3 designs de bureau :
- **Design 1** : Bureau moderne (Dock flottant centré en bas)
- **Design 2** : Barre unique inférieure (Dock barre pleine largeur en bas)
- **Design 3** : Barre latérale droite (Dock vertical à droite en tuiles)

---

## 1. Ancrage dynamique pour le Dock latéral droit (Pour le Design 3)
- [ ] **Alignement vertical selon le bouton Show Apps (`showAppsY`)** :
  - Dans `appLauncher.js` (`_updateGeometry()`), quand le dock est en position `right`, la position $Y$ est actuellement figée au centre de l'écran (`Math.round((monitor.height - h) / 2)`).
  - Calculer la position $Y$ d'ouverture en fonction de la position exacte du bouton Show Apps sur l'axe vertical, afin que le menu apparaisse directement en regard du bouton situé dans le tiers supérieur de l'écran.
- [ ] **Adaptation de la forme / layout pour panneau latéral** :
  - Prévoir un affichage plus vertical / flyout latéral adapté lorsque l'écran s'ouvre depuis le bord droit.

---

## 2. Mode « Menu Démarrer » bas-gauche (Pour le Design 2)
- [ ] **Ancrage strict en coin inférieur gauche** :
  - Ajouter un mode d'ancrage spécifique au coin bas-gauche avec marge minimale par rapport à la barre inférieure (style Start Menu Windows / ChromeOS).
  - Déclencher automatiquement cet ancrage lorsque le dock est en mode barre avec alignement à gauche (`bar-icons-alignment = 'left'`), même si le mode compact n'est pas coché par l'utilisateur.

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
