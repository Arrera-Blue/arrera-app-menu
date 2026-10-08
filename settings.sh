#!/bin/bash

# Configuration Arrera App Menu
SCHEMA="org.gnome.shell.extensions.app-menu"
KEY_SUPER="super-key-opens-launcher"
KEY_REPLACE="replace-gnome-app-menu"
KEY_COMPACT="compact-mode"
KEY_THEME="theme-mode"

# Couleurs pour le terminal
GREEN="\033[0;32m"
RED="\033[0;31m"
BLUE="\033[0;34m"
YELLOW="\033[0;33m"
BOLD="\033[1m"
RESET="\033[0m"

# Vérifier si gsettings a accès au schéma
if ! gsettings list-schemas | grep -qx "$SCHEMA"; then
    # Vérification avec le dossier local schemas si nécessaire
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    if [ -d "$SCRIPT_DIR/schemas" ]; then
        GSETTINGS_CMD="gsettings --schemadir $SCRIPT_DIR/schemas"
    else
        echo -e "${RED}Erreur : Le schéma $SCHEMA n'est pas trouvé.${RESET}"
        exit 1
    fi
else
    GSETTINGS_CMD="gsettings"
fi

get_val() {
    $GSETTINGS_CMD get "$SCHEMA" "$1"
}

set_val() {
    $GSETTINGS_CMD set "$SCHEMA" "$1" "$2"
}

toggle_val() {
    local key="$1"
    local current
    current=$(get_val "$key")
    if [ "$current" = "true" ]; then
        set_val "$key" false
    else
        set_val "$key" true
    fi
}

format_status() {
    local val="$1"
    if [ "$val" = "true" ]; then
        echo -e "${GREEN}[ Activé ]${RESET}"
    else
        echo -e "${RED}[ Désactivé ]${RESET}"
    fi
}

format_theme() {
    local val="$1"
    val=$(echo "$val" | tr -d "'")
    case "$val" in
        "expressive")
            echo -e "${GREEN}Expressif (Material 3)${RESET}"
            ;;
        "black-outline")
            echo -e "${BLUE}Contour noir / Accentué${RESET}"
            ;;
        "vanilla-gnome")
            echo -e "${YELLOW}Vanilla GNOME (Standard)${RESET}"
            ;;
        *)
            echo -e "$val"
            ;;
    esac
}

while true; do
    clear
    val_super=$(get_val "$KEY_SUPER")
    val_replace=$(get_val "$KEY_REPLACE")
    val_compact=$(get_val "$KEY_COMPACT")
    val_theme=$(get_val "$KEY_THEME")

    echo -e "${BLUE}${BOLD}========================================${RESET}"
    echo -e "${BOLD}   Configuration - Arrera App Menu   ${RESET}"
    echo -e "${BLUE}${BOLD}========================================${RESET}"
    echo ""
    echo -e " 1) Touche Super ouvre le menu         : $(format_status "$val_super")"
    echo -e " 2) Remplacement total du menu GNOME   : $(format_status "$val_replace")"
    echo -e " 3) Mode compact au-dessus du dock     : $(format_status "$val_compact")"
    echo -e " 4) Style visuel du thème (theme-mode) : $(format_theme "$val_theme")"
    echo ""
    echo -e " r) Réinitialiser les valeurs par défaut"
    echo -e " q) Quitter"
    echo ""
    echo -e "${BLUE}----------------------------------------${RESET}"
    read -rp "Choisissez une option (1, 2, 3, 4, r, q) : " choix

    case "$choix" in
        1)
            toggle_val "$KEY_SUPER"
            ;;
        2)
            toggle_val "$KEY_REPLACE"
            ;;
        3)
            toggle_val "$KEY_COMPACT"
            ;;
        4)
            echo ""
            echo " Thème visuel :"
            echo "   1) Expressif / Tonal (expressive)"
            echo "   2) Noir avec contour couleur (black-outline)"
            echo "   3) Vanilla GNOME / Dash standard (vanilla-gnome)"
            read -rp " Choix [1-3] : " theme_choix
            case "$theme_choix" in
                1) set_val "$KEY_THEME" "'expressive'" ;;
                2) set_val "$KEY_THEME" "'black-outline'" ;;
                3) set_val "$KEY_THEME" "'vanilla-gnome'" ;;
            esac
            ;;
        r|R)
            set_val "$KEY_SUPER" true
            set_val "$KEY_REPLACE" true
            set_val "$KEY_COMPACT" false
            set_val "$KEY_THEME" "'expressive'"
            ;;
        q|Q)
            echo "Au revoir !"
            break
            ;;
        *)
            # Choix invalide, la boucle continue
            ;;
    esac
done
