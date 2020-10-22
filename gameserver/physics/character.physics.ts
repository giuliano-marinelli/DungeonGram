import { World, Body, Bodies, Constraint } from 'matter-js';
import { EntityPhysics } from './entity.physics';

var PF = require('pathfinding');

export class CharacterPhysics extends EntityPhysics {

  constructor(id: string, type: string, grid: any, parameters: any) {
    super(type, grid);
    //isSensor: triggers collision events, but doesn't react with colliding body physically
    this.body = Bodies.rectangle(parameters.x, parameters.y, 0.9, 0.9, { isSensor: true });
    this.body.id = id;
  }

  move(x: number, y: number) {
    Body.setPosition(this.body, { x: x, y: y });
  }

  setColliding(isColliding, entityColliding) {
    if (isColliding && entityColliding.type == 'wall')
      this.isColliding = isColliding;
    else if (!isColliding)
      this.isColliding = isColliding
  }

  getPath(point) {
    var gridForPath = this.grid.clone();
    var finder = new PF.AStarFinder({
      allowDiagonal: true,
      heuristic: PF.Heuristic.chebyshev
    });
    var path = finder.findPath(Math.ceil((this.body.position.x + 0.5) * 2), Math.ceil((this.body.position.y + 0.5) * 2), Math.ceil((point.x + 0.5) * 2), Math.ceil((point.y + 0.5) * 2), gridForPath);
    var normalizedPath = []
    path.forEach((point) => {
      normalizedPath.push({ x: (point[0] / 2) - 0.5, y: (point[1] / 2) - 0.5 });
    })
    return normalizedPath;
  }
}
