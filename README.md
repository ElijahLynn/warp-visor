# Warp Visor

Warp Visor is a GNOME Shell extension that turns the Warp terminal into a
Wayland-friendly visor window.

It exists because terminal-global shortcuts are awkward on GNOME Wayland:
applications do not get to grab arbitrary global keyboard shortcuts when they
are unfocused. GNOME Shell can own those shortcuts, though, so this extension
registers Shell keybindings and uses Mutter window APIs to find, launch,
position, focus, and hide Warp.

## Features

- `<Shift><Alt>T` shows or toggles a top visor.
- `<Shift><Alt>B` shows or toggles a bottom visor.
- Pressing the active visor shortcut again minimizes Warp out of view.
- Default visor height is 50% of the monitor work area.
- Warp can be kept above other windows.
- Warp can be shown on all workspaces.
- Per-placement geometry is saved when you manually resize the visor.
- Maximized or full-work-area windows are not saved as visor geometry.

## Target Environment

This project is currently aimed at:

- GNOME Shell 50
- GNOME Wayland
- Warp desktop id: `dev.warp.Warp.desktop`

The default app id comes from Warp's desktop file:

```ini
Exec=warp-terminal %U
StartupWMClass=dev.warp.Warp
```

## Install

Install the extension into your local GNOME Shell extensions directory:

```sh
make install
```

Enable it:

```sh
gnome-extensions enable warp-visor@local
```

On GNOME Wayland, existing extension JavaScript is loaded inside the running
Shell process. After changing extension code, log out and back in, or use the
development workflow below.

## Configure

This extension stores settings under:

```text
org.gnome.shell.extensions.warp-visor
```

Because the schema is extension-local, use `GSETTINGS_SCHEMA_DIR` when changing
settings from a terminal:

```sh
GSETTINGS_SCHEMA_DIR="$HOME/.local/share/gnome-shell/extensions/warp-visor@local/schemas" \
gsettings set org.gnome.shell.extensions.warp-visor default-height-percent 50
```

Useful settings:

```sh
GSETTINGS_SCHEMA_DIR="$HOME/.local/share/gnome-shell/extensions/warp-visor@local/schemas" \
gsettings set org.gnome.shell.extensions.warp-visor warp-app-id 'dev.warp.Warp.desktop'

GSETTINGS_SCHEMA_DIR="$HOME/.local/share/gnome-shell/extensions/warp-visor@local/schemas" \
gsettings set org.gnome.shell.extensions.warp-visor toggle-top-keybinding "['<Shift><Alt>T']"

GSETTINGS_SCHEMA_DIR="$HOME/.local/share/gnome-shell/extensions/warp-visor@local/schemas" \
gsettings set org.gnome.shell.extensions.warp-visor toggle-bottom-keybinding "['<Shift><Alt>B']"
```

Reset saved geometry:

```sh
GSETTINGS_SCHEMA_DIR="$HOME/.local/share/gnome-shell/extensions/warp-visor@local/schemas" \
gsettings set org.gnome.shell.extensions.warp-visor top-geometry ''

GSETTINGS_SCHEMA_DIR="$HOME/.local/share/gnome-shell/extensions/warp-visor@local/schemas" \
gsettings set org.gnome.shell.extensions.warp-visor bottom-geometry ''
```

## Develop

Run tests:

```sh
make test
```

Package the extension:

```sh
make package
```

Install local changes:

```sh
make install
```

### GNOME Wayland Development Loop

GNOME Shell extensions run inside the GNOME Shell process. On Wayland, the
host Shell process cannot be restarted in place, so extension developers should
test in a nested development Shell.

For GNOME 49 and later:

```sh
dbus-run-session gnome-shell --devkit --wayland
```

On Arch Linux, this requires:

```sh
sudo pacman -S mutter-devkit
```

The nested Shell opens in a separate window. Enable Warp Visor inside that
nested session, then test there. If you need a stand-in app instead of the real
Warp instance, GNOME Console works well:

```sh
GSETTINGS_SCHEMA_DIR="$HOME/.local/share/gnome-shell/extensions/warp-visor@local/schemas" \
gsettings set org.gnome.shell.extensions.warp-visor warp-app-id 'org.gnome.Console.desktop'
```

The development loop is:

```sh
make install
# Stop the nested Shell with Ctrl+C, then start it again:
dbus-run-session gnome-shell --devkit --wayland
```

Watch logs from the terminal that launched the nested Shell. For the host
session, this is also useful:

```sh
journalctl --user -f -o cat
```

## Troubleshooting

If a shortcut launches on the host instead of the nested Shell, disable the host
copy while testing:

```sh
gnome-extensions disable warp-visor@local
```

If a visor unexpectedly opens full height, clear saved geometry:

```sh
GSETTINGS_SCHEMA_DIR="$HOME/.local/share/gnome-shell/extensions/warp-visor@local/schemas" \
gsettings set org.gnome.shell.extensions.warp-visor top-geometry ''
```

If GNOME reports an old JavaScript error after you changed the source, the host
Shell is probably still running cached extension code. Log out and back in, or
use the nested development Shell.

## References

- GNOME Shell extension debugging: https://gjs.guide/extensions/development/debugging.html#reloading-extensions
- Mutter window API: https://mutter.gnome.org/meta/class.Window.html
