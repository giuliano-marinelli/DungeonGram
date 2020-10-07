import { Engine, World, Events } from 'matter-js';
import { EntityPhysics } from './entity.physics';
import { PlayerPhysics } from './player.physics';
import { WallPhysics } from './wall.physics';

export class WorldPhysics {
  engine: Engine;
  entities: EntityPhysics[] = [];
  types: any = {
    player: PlayerPhysics,
    wall: WallPhysics
  }

  addEntity(id: string, type: string, parameters: any) {
    var uniqueId = type + id;
    this.entities[uniqueId] = new this.types[type](uniqueId, type, parameters);
    World.add(this.engine.world, [this.entities[uniqueId].body]);
    console.log('GameRoom[Physics]: added entity', type, uniqueId);
    return this.entities[uniqueId];
  }

  removeEntity(id: string, type: string) {
    var uniqueId = type + id;
    World.remove(this.engine.world, [this.entities[uniqueId].body]);
    delete this.entities[uniqueId];
    console.log('GameRoom[Physics]: removed entity', type, uniqueId);
  }

  constructor() {
    this.engine = Engine.create();
    // very slow motion
    this.engine.timing.timeScale = 0.1;
    // World.bounds = { min: { x: -Infinity, y: -Infinity }, max: { x: Infinity, y: Infinity } }
    this.engine.world.gravity.y = 0;
    //capture event when entities start colliding
    Events.on(this.engine, "collisionStart", (e) => {
      console.log('GameRoom[Physics]: collision started', e.pairs);
      for (let pair of e.pairs) {
        if (this.entities[pair.bodyA.id]) this.entities[pair.bodyA.id].setColliding(true, this.entities[pair.bodyB.id]);
        if (this.entities[pair.bodyB.id]) this.entities[pair.bodyB.id].setColliding(true, this.entities[pair.bodyA.id]);
      }
    });
    //capture event when entities end colliding
    Events.on(this.engine, "collisionEnd", (e) => {
      // console.log('GameRoom[Physics]: collision ended', e.pairs);
      for (let pair of e.pairs) {
        if (this.entities[pair.bodyA.id]) this.entities[pair.bodyA.id].setColliding(false, this.entities[pair.bodyB.id]);
        if (this.entities[pair.bodyB.id]) this.entities[pair.bodyB.id].setColliding(false, this.entities[pair.bodyA.id]);
      }
    });

    console.log('GameRoom[Physics]: created');
  }

  update(deltaTime) {
    Engine.update(this.engine, deltaTime);
  }
}
