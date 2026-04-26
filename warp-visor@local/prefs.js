import Adw from "gi://Adw";
import Gio from "gi://Gio";

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

    window.add(page);
  }
}
