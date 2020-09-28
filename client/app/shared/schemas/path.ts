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

  constructor(schema, parameters) {
    super();

    this.synchronizeSchema(schema,
      {
        from: { type: Point, datatype: Object },
        to: { type: Point, datatype: Object },
        points: { type: Point, datatype: Array }
      },
      { scene: parameters.scene, room: parameters.room }
    );
  }

  update(changes, parameters?) {
    changes.forEach((change) => {
      switch (change.field) {
        case 'to':
          if (change.value) this.doMeshTo(change.value, parameters.scene, parameters.room);
          else {
            this.meshTo?.dispose();
            delete this.meshTo;
          }
          break;
        case 'points':
          this.doMeshPoints(change.value, parameters.scene, parameters.room);
          break;
      }
    });
  }

  remove(parameters?) {
    super.remove(parameters);
    this.meshTo.dispose();
    this.meshPoints.forEach(meshPoint => {
      meshPoint.dispose();
    });
  }

  doMeshTo(schema, scene, room) {
    if (!this.meshTo) {
      //create mesh
      this.meshTo = BABYLON.MeshBuilder.CreateSphere('', { segments: 16, diameter: 0.4 }, scene);

      //set material
      var material = new BABYLON.StandardMaterial("ground", scene);
      material.diffuseColor = BABYLON.Color3.Magenta();
      material.alpha = 0.25;
      this.meshTo.material = material;
    }

    //positioning mesh
    this.meshTo.position.y = 0;
    this.meshTo.position.x = schema.x;
    this.meshTo.position.z = schema.y;
  }

  doMeshPoints(schema, scene, room) {
    if (this.meshPoints) {
      this.meshPoints.forEach(meshPoint => {
        meshPoint.dispose();
      });
      this.meshPoints = [];
    }

    schema.forEach(point => {
      //create mesh
      this.meshPoints.push(BABYLON.MeshBuilder.CreateSphere('', { segments: 16, diameter: 0.2 }, scene));

      //set material
      var material = new BABYLON.StandardMaterial("ground", scene);
      material.diffuseColor = BABYLON.Color3.White();
      material.alpha = 0.25;
      this.meshPoints[this.meshPoints.length - 1].material = material;

      //positioning mesh
      this.meshPoints[this.meshPoints.length - 1].position.y = 0;
      this.meshPoints[this.meshPoints.length - 1].position.x = point.x;
      this.meshPoints[this.meshPoints.length - 1].position.z = point.y;
    });
  }
}
