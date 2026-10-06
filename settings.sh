#!/bin/bash

# Configuration Arrera App Menu
SCHEMA="org.gnome.shell.extensions.app-menu"
KEY_SUPER="super-key-opens-launcher"
KEY_REPLACE="replace-gnome-app-menu"

# Couleurs pour le terminal
GREEN="\033[0;32m"
RED="\033[0;31m"
BLUE="\033[0;34m"
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

while true; do
    clear
    val_super=$(get_val "$KEY_SUPER")
    val_replace=$(get_val "$KEY_REPLACE")

    echo -e "${BLUE}${BOLD}========================================${RESET}"
    echo -e "${BOLD}   Configuration - Arrera App Menu   ${RESET}"
    echo -e "${BLUE}${BOLD}========================================${RESET}"
    echo ""
    echo -e " 1) Touche Super ouvre le menu         : $(format_status "$val_super")"
    echo -e " 2) Remplacement total du menu GNOME   : $(format_status "$val_replace")"
    echo ""
    echo -e " r) Réinitialiser les valeurs par défaut (tout activer)"
    echo -e " q) Quitter"
    echo ""
    echo -e "${BLUE}----------------------------------------${RESET}"
    read -rp "Choisissez une option (1, 2, r, q) : " choix

    case "$choix" in
        1)
            toggle_val "$KEY_SUPER"
            ;;
        2)
            toggle_val "$KEY_REPLACE"
            ;;
        r|R)
            set_val "$KEY_SUPER" true
            set_val "$KEY_REPLACE" true
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
