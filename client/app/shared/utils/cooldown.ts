export class Cooldown {
  static cooldowns: {} = {};
  static updating: boolean = false;

  /**
   * @param  {string} id unique id
   * @param  {number} time in milliseconds
   */
  static set(id: string, time: number) {
    if (!this.updating) this.update();
    if (this.cooldowns[id] != null && this.cooldowns[id] > 0) {
      return false;
    } else {
      this.cooldowns[id] = time;
      return true;
    }
  }

  static update() {
    this.updating = true;
    setInterval(() => {
      for (var id in this.cooldowns) {
        this.cooldowns[id] = this.cooldowns[id] - 1 >= 0 ? this.cooldowns[id] - 1 : 0;
      }
    }, 1);
  }
}
