export class Controller {
  rooms: any = {};
  activeTool: any = null;
  activeAction: any = null;
  userSettings: any = {};

  toggleTool(tool, toggle) {
    this.activeTool = toggle ? tool : null;
  }

  toggleAction(action, toggle) {
    this.activeAction = toggle ? action : null;
  }

  send(room, action, parameters) {
    this.rooms[room].send(action, parameters);
  }

  updateSetting(setting, value) {
    if (this.userSettings[setting] != null)
      this.userSettings[setting].value = value;
  }

  initSetting(setting, value) {
    this.userSettings[setting] = { value: value };
    return this.userSettings[setting];
  }
}
