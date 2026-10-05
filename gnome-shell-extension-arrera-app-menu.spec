%global uuid app-menu@linux.arrera-software.fr

Name:           gnome-shell-extension-arrera-app-menu
Version:        1.0.0
Release:        0.1.beta1%{?dist}
Summary:        Menu d'applications moderne pour GNOME Shell (Distribution Arrera Blue)

License:        GPL-2.0-or-later
URL:            https://github.com/Arrera-Blue/arrera-app-menu
Source0:        %{name}-%{version}.tar.gz

BuildArch:      noarch

BuildRequires:  glib2-devel
Requires:       gnome-shell >= 45
Requires:       glib2

Provides:       arrera-app-menu = %{version}-%{release}
Provides:       gnome-shell-extension-app-menu = %{version}-%{release}

%description
Arrera App Menu est un menu et lanceur d'applications moderne pour GNOME Shell conçu pour la distribution Arrera Blue Linux.
Il fournit un panneau flottant élégant avec recherche instantanée, navigation fluide et intégration des couleurs d'accentuation de GNOME.

%prep
%autosetup -n %{name}-%{version}

%build
glib-compile-schemas schemas/

%install
rm -rf %{buildroot}

install -d -m 0755 %{buildroot}%{_datadir}/gnome-shell/extensions/%{uuid}
install -d -m 0755 %{buildroot}%{_datadir}/gnome-shell/extensions/%{uuid}/schemas

install -p -m 0644 metadata.json %{buildroot}%{_datadir}/gnome-shell/extensions/%{uuid}/
install -p -m 0644 extension.js %{buildroot}%{_datadir}/gnome-shell/extensions/%{uuid}/
install -p -m 0644 appLauncher.js %{buildroot}%{_datadir}/gnome-shell/extensions/%{uuid}/
install -p -m 0644 stylesheet.css %{buildroot}%{_datadir}/gnome-shell/extensions/%{uuid}/

install -p -m 0644 schemas/org.gnome.shell.extensions.app-menu.gschema.xml %{buildroot}%{_datadir}/gnome-shell/extensions/%{uuid}/schemas/
install -p -m 0644 schemas/gschemas.compiled %{buildroot}%{_datadir}/gnome-shell/extensions/%{uuid}/schemas/

install -d -m 0755 %{buildroot}%{_datadir}/glib-2.0/schemas
install -p -m 0644 schemas/org.gnome.shell.extensions.app-menu.gschema.xml %{buildroot}%{_datadir}/glib-2.0/schemas/

%files
%doc README.md
%{_datadir}/gnome-shell/extensions/%{uuid}/
%{_datadir}/glib-2.0/schemas/org.gnome.shell.extensions.app-menu.gschema.xml

%changelog
* Mon Oct 05 2026 Arrera Software <contact@arrera.org> - 1.0.0-0.1.beta1
- Initialisation du paquet autonome pour Arrera Blue Linux
