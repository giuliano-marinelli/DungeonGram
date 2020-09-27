import { Schema, type, MapSchema } from '@colyseus/schema';
import { Tile } from '../schemas/tile';

export class TileMap extends Schema {
  @type('number')
  width: number;
  @type('number')
  height: number;
  @type({ map: Tile })
  tiles = new MapSchema<Tile>();

  constructor(width: number = 10, height: number = 10) {
    super();
    this.width = width;
    this.height = height;
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        this.tiles[x + ',' + y] = new Tile(x, y);
      }
    }
  }
}
