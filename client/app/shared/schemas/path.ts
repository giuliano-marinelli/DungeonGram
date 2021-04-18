import * as BABYLON from '@babylonjs/core/Legacy/legacy';
import { Schema } from './schema';
import { Point } from './point';

export class Path extends Schema {
  //schema
  from?: Point;
  to?: Point;
  points?: Point[];
  //game objects
  meshTo?: any;
  rays?: any[] = [];

  constructor(schema, parameters) {
    super(parameters);

    this.synchronizeSchema(schema,
      {
        from: { type: Point, datatype: Object },
        to: { type: Point, datatype: Object },
        points: { type: Point, datatype: Array, onAdd: 'last', onRemove: 'first' }
      }
    );
  }

  update(changes) {
    changes?.forEach((change) => {
      switch (change.field) {
        case 'to':
          if (!this.parameters.character.animation || this.parameters.character.animation == 'None') this.parameters.character.animator?.playIdle();
          break;
      }
    });
    this.doMeshTo();
    this.doMeshPoints();
  }

  remove() {
    super.remove();
    this.removeMeshTo();
    this.removeRays();
  }

  removeMeshTo() {
    this.meshTo?.dispose();
    this.meshTo = null;
  }

  removeRays() {
    this.rays?.forEach(ray => {
      ray.dispose();
    });
    this.rays = [];
  }

  doMeshTo() {
    this.removeMeshTo();

    if (this.parameters.characterId == this.parameters.world.users[this.parameters.token].selectedCharacter &&
      this.to) {
      //create mesh
      this.meshTo = this.parameters.assets.pathPoint.createInstance();

      //positioning mesh
      this.meshTo.position.y = 0.1;
      this.meshTo.position.x = this.to.x;
      this.meshTo.position.z = this.to.y;

      //enable mesh
      this.meshTo.setEnabled(true);
    }
  }

  doMeshPoints() {
    this.removeRays();

    if (this.parameters.characterId == this.parameters.world.users[this.parameters.token].selectedCharacter &&
      this.points.length) {
      for (let i = 0; i < this.points.length; i++) {
        var point = this.points[i];

        if (i > 0) {
          var origin = new BABYLON.Vector3(this.points[i - 1].x, 0.1, this.points[i - 1].y);
          var target = new BABYLON.Vector3(point.x, 0.1, point.y);
          var targetNormalized = BABYLON.Vector3.Normalize(target.subtract(origin));
          var ray = new BABYLON.Ray(
            origin,
            targetNormalized,
            BABYLON.Vector3.Distance(origin, target)
          );
          this.rays.push(BABYLON.RayHelper.CreateAndShow(ray, this.parameters.scene, BABYLON.Color3.White()));
        }
      }
    }
  }
}
