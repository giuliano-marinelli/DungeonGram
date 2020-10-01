import { Schema, type } from "@colyseus/schema";


export class Dice extends Schema {
  faces: number

  constructor(faces: number = 20) {
    super();
    this.faces = faces;
  }

  roll(times: number = 1) {
    var result = [];
    for (let i = 0; i < times; i++) {
      result.push(this._random(1, this.faces));
    }
    return result;
  }

  _random(min, max) {
    return min + Math.floor((max - min) * Math.random());
  }
}
