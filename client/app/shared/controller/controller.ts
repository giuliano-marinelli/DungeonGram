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

  recieve(room, action, callback) {
    this.rooms[room].onMessage(action, (message) => {
      callback(message);
    });
  }

  updateSetting(setting, value) {
    if (this.userSettings[setting] != null) {
      this.userSettings[setting].value = value;
      if (this.userSettings[setting].update) this.userSettings[setting].update();
    }
  }

  initSetting(setting, value, onUpdate?) {
    if (!this.userSettings[setting])
      this.userSettings[setting] = { value: value, update: onUpdate };
    return this.userSettings[setting];
  }
}
