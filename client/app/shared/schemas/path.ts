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
  meshPoints?: any[] = [];
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
          this.parameters.character.animator?.play('Idle');
          break;
      }
    });
    this.doMeshTo();
    this.doMeshPoints();
  }

  remove() {
    super.remove();
    this.meshTo?.dispose();
    this.meshPoints?.forEach(meshPoint => {
      meshPoint.dispose();
    });
    this.rays?.forEach(ray => {
      ray.dispose();
    });
  }

  doMeshTo() {
    if (this.meshTo) {
      this.meshTo.dispose();
      delete this.meshTo;
    }

    if (this.parameters.characterId == this.parameters.world.users[this.parameters.token].selectedCharacter &&
      this.to) {
      //create mesh
      this.meshTo = BABYLON.MeshBuilder.CreateSphere('', { segments: 16, diameter: 0.4 }, this.parameters.scene);

      //set material
      var material = new BABYLON.StandardMaterial("ground", this.parameters.scene);
      material.emissiveColor = BABYLON.Color3.White();
      material.alpha = 1;
      this.meshTo.material = material;

      //positioning mesh
      this.meshTo.position.y = 0;
      this.meshTo.position.x = this.to.x;
      this.meshTo.position.z = this.to.y;
    }
  }

  doMeshPoints() {
    if (this.meshPoints) {
      this.meshPoints.forEach(meshPoint => {
        meshPoint.dispose();
      });
      this.meshPoints = [];

      this.rays.forEach(ray => {
        ray.dispose();
      });
      this.rays = [];
    }

    if (this.parameters.characterId == this.parameters.world.users[this.parameters.token].selectedCharacter &&
      this.points.length) {
      for (let i = 0; i < this.points.length; i++) {
        var point = this.points[i];
        //create mesh
        // this.meshPoints.push(BABYLON.MeshBuilder.CreateSphere('', { segments: 16, diameter: 0.2 }, this.parameters.scene));

        // //set material
        // var material = new BABYLON.StandardMaterial("ground", this.parameters.scene);
        // material.diffuseColor = BABYLON.Color3.White();
        // material.alpha = 0.8;
        // this.meshPoints[this.meshPoints.length - 1].material = material;

        // //positioning mesh
        // this.meshPoints[this.meshPoints.length - 1].position.y = 0;
        // this.meshPoints[this.meshPoints.length - 1].position.x = point.x;
        // this.meshPoints[this.meshPoints.length - 1].position.z = point.y;
        if (i > 0) {
          var origin = new BABYLON.Vector3(this.points[i - 1].x, 0, this.points[i - 1].y);
          var target = new BABYLON.Vector3(point.x, 0, point.y);
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
