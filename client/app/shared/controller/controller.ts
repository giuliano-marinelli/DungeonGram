export class Controller {
  rooms: any = {};
  activeTool: any = null;
  activeAction: any = null;

  toggleTool(tool, toggle) {
    this.activeTool = toggle ? tool : null;
  }

  toggleAction(action, toggle) {
    this.activeAction = toggle ? action : null;
  }

  send(room, action, parameters) {
    this.rooms[room].send(action, parameters);
  }
}
