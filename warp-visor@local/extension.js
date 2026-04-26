import GLib from "gi://GLib";
import Meta from "gi://Meta";
import Shell from "gi://Shell";

import { Extension, gettext as _ } from "resource:///org/gnome/shell/extensions/extension.js";
import * as Main from "resource:///org/gnome/shell/ui/main.js";

import {
  PLACEMENT_BOTTOM,
  PLACEMENT_HIDDEN,
  PLACEMENT_TOP,
  clampGeometry,
  computeDefaultGeometry,
  keyForPlacement,
  parseGeometry,
  serializeGeometry,
} from "./geometry.js";

const STARTUP_TIMEOUT_SECONDS = 5;
const GEOMETRY_SAVE_DELAY_MS = 250;
const POST_LAUNCH_REFIT_DELAY_MS = 200;

export default class WarpVisorExtension extends Extension {
  enable() {
    this._settings = this.getSettings();
    this._appSystem = Shell.AppSystem.get_default();
    this._window = null;
    this._windowSignals = [];
    this._startupTimeoutId = 0;
    this._postLaunchRefitId = 0;
    this._geometrySaveId = 0;
    this._appWindowsChangedId = 0;
    this._app = null;
    this._applyingGeometry = false;

    Main.wm.addKeybinding(
      "toggle-top-keybinding",
      this._settings,
      Meta.KeyBindingFlags.IGNORE_AUTOREPEAT,
      Shell.ActionMode.NORMAL | Shell.ActionMode.OVERVIEW | Shell.ActionMode.POPUP,
      () => this._handlePlacementHotkey(PLACEMENT_TOP)
    );

    Main.wm.addKeybinding(
      "toggle-bottom-keybinding",
      this._settings,
      Meta.KeyBindingFlags.IGNORE_AUTOREPEAT,
      Shell.ActionMode.NORMAL | Shell.ActionMode.OVERVIEW | Shell.ActionMode.POPUP,
      () => this._handlePlacementHotkey(PLACEMENT_BOTTOM)
    );
  }

  disable() {
    Main.wm.removeKeybinding("toggle-top-keybinding");
    Main.wm.removeKeybinding("toggle-bottom-keybinding");
    this._clearStartupWatch();
    this._clearPostLaunchRefit();
    this._clearGeometrySave();
    this._disconnectWindow();
    this._disconnectApp();
    this._settings = null;
    this._appSystem = null;
  }

  _handlePlacementHotkey(placement) {
    try {
      this._togglePlacement(placement);
    } catch (error) {
      console.error(`Warp Visor: ${error}`);
      Main.notify(_("Warp Visor"), String(error));
    }
  }

  _togglePlacement(placement) {
    const window = this._findWarpWindow();
    const currentPlacement = this._settings.get_string("current-placement");

    if (
      window &&
      !this._isWindowHidden(window) &&
      currentPlacement === placement
    ) {
      this._saveCurrentGeometryNow();
      this._hideWindow(window);
      this._settings.set_string("current-placement", PLACEMENT_HIDDEN);
      return;
    }

    if (window) {
      this._showWindow(window, placement);
      return;
    }

    this._launchWarpThenShow(placement);
  }

  _findWarpWindow() {
    if (this._window && this._isUsableWindow(this._window)) {
      return this._window;
    }

    const app = this._lookupWarpApp();
    if (!app) return null;

    const windows = app
      .get_windows()
      .filter(window => this._isUsableWindow(window));

    const focusedWindow = global.display.focus_window;
    const chosenWindow =
      windows.find(window => window === focusedWindow) ||
      windows.find(window => !this._isWindowHidden(window)) ||
      windows.at(0) ||
      null;

    if (chosenWindow) this._trackWindow(chosenWindow);
    return chosenWindow;
  }

  _lookupWarpApp() {
    const appId = this._settings.get_string("warp-app-id");
    const app = this._appSystem.lookup_app(appId);
    if (!app) {
      Main.notify(_("Warp Visor"), _(`Could not find Warp app id: ${appId}`));
      return null;
    }
    return app;
  }

  _launchWarpThenShow(placement) {
    const app = this._lookupWarpApp();
    if (!app) return;

    this._disconnectApp();
    this._app = app;

    this._appWindowsChangedId = app.connect("windows-changed", () => {
      const window = this._findWarpWindow();
      if (!window) return;

      this._clearStartupWatch();
      this._disconnectApp();
      this._showWindow(window, placement);
    });

    app.launch(
      global.get_current_time(),
      global.workspace_manager.get_active_workspace_index(),
      Shell.AppLaunchGpu.APP_PREF
    );

    this._startupTimeoutId = GLib.timeout_add_seconds(
      GLib.PRIORITY_DEFAULT,
      STARTUP_TIMEOUT_SECONDS,
      () => {
        this._startupTimeoutId = 0;
        this._disconnectApp();
        Main.notify(_("Warp Visor"), _("Timed out waiting for Warp to open."));
        return GLib.SOURCE_REMOVE;
      }
    );
  }

  _showWindow(window, placement) {
    this._trackWindow(window);

    if (typeof window.unminimize === "function" && window.minimized) {
      window.unminimize();
    }

    if (this._settings.get_boolean("all-workspaces")) {
      window.stick();
    }

    if (this._settings.get_boolean("always-on-top")) {
      window.make_above();
    }

    this._unmaximizeWindow(window);
    this._applyGeometry(window, placement);
    this._settings.set_string("current-placement", placement);
    Main.activateWindow(window);

    this._clearPostLaunchRefit();
    this._postLaunchRefitId = GLib.timeout_add(
      GLib.PRIORITY_DEFAULT,
      POST_LAUNCH_REFIT_DELAY_MS,
      () => {
        this._postLaunchRefitId = 0;
        if (this._window === window && !this._isWindowHidden(window)) {
          this._applyGeometry(window, placement);
        }
        return GLib.SOURCE_REMOVE;
      }
    );
  }

  _hideWindow(window) {
    if (window.is_above()) {
      window.unmake_above();
    }

    window.minimize();
  }

  _unmaximizeWindow(window) {
    if (typeof window.unmaximize !== "function") return;

    if (typeof window.is_maximized !== "function" || window.is_maximized()) {
      window.unmaximize();
    }
  }

  _applyGeometry(window, placement) {
    const monitor = this._getTargetMonitor(window);
    const workArea = window.get_work_area_for_monitor(monitor);
    const savedGeometry = parseGeometry(
      this._settings.get_string(keyForPlacement(placement))
    );
    const defaultGeometry = computeDefaultGeometry(
      workArea,
      placement,
      this._settings.get_int("default-height-percent")
    );
    const geometry = clampGeometry(savedGeometry || defaultGeometry, workArea);

    this._applyingGeometry = true;
    this._logGeometry("before", window, placement, geometry, workArea);
    window.move_to_monitor(monitor);
    window.move_resize_frame(true, geometry.x, geometry.y, geometry.width, geometry.height);
    GLib.idle_add(GLib.PRIORITY_DEFAULT_IDLE, () => {
      this._logGeometry("after", window, placement, geometry, workArea);
      this._applyingGeometry = false;
      return GLib.SOURCE_REMOVE;
    });
  }

  _logGeometry(stage, window, placement, requested, workArea) {
    const frame = window.get_frame_rect();
    const message =
      `Warp Visor geometry ${stage} placement=${placement} ` +
        `requested=${serializeGeometry(requested)} ` +
        `frame=${serializeGeometry(frame)} ` +
        `workArea=${serializeGeometry(workArea)} ` +
        `maximized=${this._getWindowMaximizedState(window)}`;

    console.log(message);
    GLib.file_set_contents("/tmp/warp-visor-geometry.log", `${message}\n`);
  }

  _getWindowMaximizedState(window) {
    if (typeof window.is_maximized === "function") {
      return window.is_maximized();
    }

    if (typeof window.maximized_horizontally === "boolean" ||
        typeof window.maximized_vertically === "boolean") {
      return Boolean(window.maximized_horizontally && window.maximized_vertically);
    }

    return "unknown";
  }

  _getTargetMonitor(window) {
    const currentMonitor = global.display.get_current_monitor();
    if (currentMonitor >= 0) return currentMonitor;

    const frameRect = window.get_frame_rect();
    return global.display.get_monitor_index_for_rect(frameRect);
  }

  _trackWindow(window) {
    if (this._window === window) return;

    this._disconnectWindow();
    this._window = window;
    this._windowSignals = [
      window.connect("position-changed", () => this._queueGeometrySave()),
      window.connect("size-changed", () => this._queueGeometrySave()),
      window.connect("unmanaged", () => {
        this._settings.set_string("current-placement", PLACEMENT_HIDDEN);
        this._disconnectWindow();
      }),
    ];
  }

  _disconnectWindow() {
    if (!this._window) return;

    for (const signalId of this._windowSignals) {
      this._window.disconnect(signalId);
    }

    this._windowSignals = [];
    this._window = null;
  }

  _disconnectApp() {
    if (this._app && this._appWindowsChangedId) {
      this._app.disconnect(this._appWindowsChangedId);
    }

    this._app = null;
    this._appWindowsChangedId = 0;
  }

  _clearStartupWatch() {
    if (!this._startupTimeoutId) return;

    GLib.Source.remove(this._startupTimeoutId);
    this._startupTimeoutId = 0;
  }

  _clearPostLaunchRefit() {
    if (!this._postLaunchRefitId) return;

    GLib.Source.remove(this._postLaunchRefitId);
    this._postLaunchRefitId = 0;
  }

  _queueGeometrySave() {
    if (this._applyingGeometry) return;

    this._clearGeometrySave();
    this._geometrySaveId = GLib.timeout_add(
      GLib.PRIORITY_DEFAULT,
      GEOMETRY_SAVE_DELAY_MS,
      () => {
        this._geometrySaveId = 0;
        this._saveCurrentGeometryNow();
        return GLib.SOURCE_REMOVE;
      }
    );
  }

  _clearGeometrySave() {
    if (!this._geometrySaveId) return;

    GLib.Source.remove(this._geometrySaveId);
    this._geometrySaveId = 0;
  }

  _saveCurrentGeometryNow() {
    if (!this._window || this._isWindowHidden(this._window)) return;

    const placement = this._settings.get_string("current-placement");
    if (placement !== PLACEMENT_TOP && placement !== PLACEMENT_BOTTOM) return;

    const frame = this._window.get_frame_rect();
    const monitor = this._getTargetMonitor(this._window);
    const workArea = this._window.get_work_area_for_monitor(monitor);

    if (this._getWindowMaximizedState(this._window) === true ||
        this._rectCoversWorkArea(frame, workArea)) {
      return;
    }

    this._settings.set_string(
      keyForPlacement(placement),
      serializeGeometry(frame)
    );
  }

  _rectCoversWorkArea(rect, workArea) {
    return (
      rect.x <= workArea.x &&
      rect.y <= workArea.y &&
      rect.x + rect.width >= workArea.x + workArea.width &&
      rect.y + rect.height >= workArea.y + workArea.height
    );
  }

  _isUsableWindow(window) {
    if (!window || !window.is_alive) return false;
    if (typeof window.is_override_redirect !== "function") return true;
    return !window.is_override_redirect();
  }

  _isWindowHidden(window) {
    return window.minimized || window.is_hidden();
  }
}
