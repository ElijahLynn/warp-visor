# Warp Visor Context

Current repo: `/home/elijah/projects/warp-visor`

## Current Tested Workflow

For nested GNOME Shell testing, use a nested D-Bus shell so `gnome-extensions`
and `gsettings` target the nested session:

```sh
dbus-run-session -- bash
make install
gnome-shell --devkit --wayland &
gnome-extensions enable warp-visor@local
gnome-extensions info warp-visor@local
```

Stop and restart the nested shell job from that same shell:

```sh
jobs
kill %1
gnome-shell --devkit --wayland &
gnome-extensions enable warp-visor@local
```

Disable the host copy while nested testing:

```sh
gnome-extensions disable warp-visor@local
```

Re-enable it when done:

```sh
gnome-extensions enable warp-visor@local
```

## App Target During Testing

Use GNOME Console as a stand-in target inside the nested session unless the user
explicitly wants to test real Warp:

```sh
GSETTINGS_SCHEMA_DIR="$HOME/.local/share/gnome-shell/extensions/warp-visor@local/schemas" \
gsettings set org.gnome.shell.extensions.warp-visor warp-app-id 'org.gnome.Console.desktop'
```

Switch back to real Warp with:

```sh
GSETTINGS_SCHEMA_DIR="$HOME/.local/share/gnome-shell/extensions/warp-visor@local/schemas" \
gsettings set org.gnome.shell.extensions.warp-visor warp-app-id 'dev.warp.Warp.desktop'
```

Clear saved geometry inside the nested `dbus-run-session -- bash` shell when
testing default 50% sizing:

```sh
GSETTINGS_SCHEMA_DIR="$HOME/.local/share/gnome-shell/extensions/warp-visor@local/schemas" \
gsettings set org.gnome.shell.extensions.warp-visor top-geometry ''

GSETTINGS_SCHEMA_DIR="$HOME/.local/share/gnome-shell/extensions/warp-visor@local/schemas" \
gsettings set org.gnome.shell.extensions.warp-visor bottom-geometry ''
```

## Recent Fix Context

The reported glitch was:

- `<Shift><Alt>T` shows the visor at the top.
- `<Shift><Alt>T` hides it.
- `<Shift><Alt>B` briefly shows the window at the previous top position before
  moving to the bottom.

The current implementation addresses that by:

- Making the window actor transparent before minimize.
- Revealing minimized windows while still transparent.
- Applying the requested geometry after unminimize.
- Restoring opacity on the next idle tick.
- Suppressing geometry saves briefly after programmatic geometry changes so
  compositor transition frames do not get stored as manual geometry.

If sizing looks wrong during nested testing, first clear `top-geometry` and
`bottom-geometry` from inside the nested D-Bus shell. A previously saved
geometry can override the 50% default height.

