import { Schema, type, MapSchema } from '@colyseus/schema';
import { Tile } from '../schemas/tile';

export class TileMap extends Schema {
  @type('number')
  width: number;
  @type('number')
  height: number;
  // @type({ map: Tile })
  // tiles = new MapSchema<Tile>();

  //for destroy the object
  @type('boolean')
  destroy: boolean = false;

  constructor(width: number = 20, height: number = 20) {
    super();
    this.width = width;
    this.height = height;
    // for (let x = 0; x < width; x++) {
    //   for (let y = 0; y < height; y++) {
    //     this.tiles[x + ',' + y] = new Tile(x, y);
    //   }
    // }
  }

  changeSize(width: number, height: number) {
    this.width = width;
    this.height = height;
  }

  remove() {
    this.destroy = true;
  }
}
