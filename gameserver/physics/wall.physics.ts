import { Body, Bodies, Vector } from 'matter-js';
import { EntityPhysics } from './entity.physics';

export class WallPhysics extends EntityPhysics {
  body: any;
  isColliding: boolean = false;

  constructor(id: string, type: string, parameters: any) {
    super(type);
    var middlePoint = Vector.div(Vector.add(parameters.from,parameters.to), 2);
    var subVector = Vector.sub(parameters.from,parameters.to);
    var distance = Math.sqrt(subVector.x * subVector.x + subVector.y * subVector.y);
    var angle = Vector.angle(parameters.from,parameters.to);
    //isSensor: triggers collision events, but doesn't react with colliding body physically
    this.body = Bodies.rectangle(middlePoint.x, middlePoint.y, distance, 0.09, { isSensor: true, angle: angle});
    this.body.id = id;
  }
}
