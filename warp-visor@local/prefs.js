import Adw from "gi://Adw";
import Gio from "gi://Gio";
import Gtk from "gi://Gtk";

import {
  ExtensionPreferences,
  gettext as _,
} from "resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js";

export default class WarpVisorPreferences extends ExtensionPreferences {
  fillPreferencesWindow(window) {
    const settings = this.getSettings();

    const page = new Adw.PreferencesPage({
      title: _("Warp Visor Settings"),
      name: "warp-visor-preferences",
    });

    const behaviorGroup = new Adw.PreferencesGroup({
      title: _("Behavior"),
    });
    page.add(behaviorGroup);

    const skipTaskbarRow = new Adw.SwitchRow({
      title: _("Hide In Certain Modes"),
      subtitle: _(
        "When enabled, the Warp visor will not appear in overview mode or when using Alt+Tab."
      ),
    });
    behaviorGroup.add(skipTaskbarRow);

    settings.bind(
      "skip-taskbar",
      skipTaskbarRow,
      "active",
      Gio.SettingsBindFlags.DEFAULT
    );

    const geometryGroup = new Adw.PreferencesGroup({
      title: _("Geometry"),
    });
    page.add(geometryGroup);

    const resetGeometryRow = new Adw.ActionRow({
      title: _("Reset Saved Geometry"),
      subtitle: _(
        "Clear saved top and bottom sizes and restore the default visor height."
      ),
    });
    const resetGeometryButton = new Gtk.Button({
      label: _("Reset"),
      valign: Gtk.Align.CENTER,
    });
    resetGeometryButton.connect("clicked", () => {
      settings.set_string("top-geometry", "");
      settings.set_string("bottom-geometry", "");
    });
    resetGeometryRow.add_suffix(resetGeometryButton);
    geometryGroup.add(resetGeometryRow);

    window.add(page);
  }
}
