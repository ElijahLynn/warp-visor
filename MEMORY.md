# Warp Visor agent context

Repo: `/home/elijah/projects/warp-visor`

## Dev testing

Use **warp-visor-dev** (skill: `warp-visor-dev`, user may say `/warp-visor-dev`):

```sh
make install-dev-cmd   # once
warp-visor-dev host-prep
warp-visor-dev enter
warp-visor-dev start   # inside enter; ~30-60s for "Mutter Development Kit" window
warp-visor-dev reload  # after verified edits
exit
warp-visor-dev host-restore
```

After confirmed working: sync script, README, skill, this file, then commit and push (see skill **Finish and land**).

Nested target: `org.gnome.Console.desktop`. Host daily: `dev.warp.Warp.desktop`.

Full docs: README.md.
