import { Schema, type } from "@colyseus/schema";


export class Point extends Schema {
  @type("number")
  x: number;
  @type("number")
  y: number;

  constructor(x: number = 0, y: number = 0) {
    super();
    this.x = x;
    this.y = y;
  }

  public toString = (): string => {
    return `(${this.x}, ${this.y})`;
  }
  // get x(): number { return this._x }
  // get y(): number { return this._x }

  // set x(value: number) { this._x = value }
  // set y(value: number) { this._y = value }
}
