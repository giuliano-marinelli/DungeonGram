import { Body, Bodies, Vector } from 'matter-js';
import { EntityPhysics } from './entity.physics';
import { Utils } from '../utils';

export class WallPhysics extends EntityPhysics {
  from: any;
  to: any;
  tiles: any;
  isWalkable: boolean = false;

  constructor(id: string, type: string, grid: any, parameters: any) {
    super(type, grid);
    this.from = { x: Math.round((parameters.from.x + 0.5) * 2), y: Math.round((parameters.from.y + 0.5) * 2) };
    this.to = { x: Math.round((parameters.to.x + 0.5) * 2), y: Math.round((parameters.to.y + 0.5) * 2) };
    var middlePoint = Vector.div(Vector.add(parameters.from, parameters.to), 2);
    var subVector = Vector.sub(parameters.from, parameters.to);
    var distance = Math.sqrt(subVector.x * subVector.x + subVector.y * subVector.y);
    var angle = Vector.angle(parameters.from, parameters.to);
    //isSensor: triggers collision events, but doesn't react with colliding body physically
    this.body = Bodies.rectangle(middlePoint.x, middlePoint.y, distance, 0.09, { isSensor: true, angle: angle });
    this.body.id = id;
    this.updateGrid();
  }

  updateGrid(newGrid?) {
    super.updateGrid(newGrid);
    this.tiles = Utils.BresenhamLine(this.from.x, this.from.y, this.to.x, this.to.y);
    // var tiles = Utils.BresenhamLine2(this.from, this.to);
    // console.log('GameRoom[Physics]: wall bresenham line from', this.from, 'to', this.to, ' = ', this.tiles);
    this.tiles.forEach((tile) => {
      // console.log('setWalkable', tile);
      this.grid.setWalkableAt(Math.ceil(tile.x), Math.ceil(tile.y), false);
    });
  }
}
