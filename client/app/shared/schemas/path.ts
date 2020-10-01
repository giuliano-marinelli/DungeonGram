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
    super(parameters);

    this.synchronizeSchema(schema,
      {
        from: { type: Point, datatype: Object, parameters: () => { return { parent: this } } },
        to: { type: Point, datatype: Object, parameters: () => { return { parent: this } } },
        points: { type: Point, datatype: Array, onAdd: 'last', onRemove: 'first' }
      }
    );
  }

  update(changes?) {
    changes?.forEach((change) => {
      if (this.parameters.playerId == this.parameters.room.sessionId) {
        switch (change.field) {
          case 'to':
            if (this.to) this.doMeshTo();
            else {
              this.meshTo?.dispose();
              delete this.meshTo;
            }
            break;
          case 'points':
            this.doMeshPoints();
            break;
        }
      }
    });
  }

  remove() {
    super.remove();
    this.meshTo?.dispose();
    this.meshPoints?.forEach(meshPoint => {
      meshPoint.dispose();
    });
  }

  doMeshTo() {
    if (!this.meshTo) {
      //create mesh
      this.meshTo = BABYLON.MeshBuilder.CreateSphere('', { segments: 16, diameter: 0.4 }, this.parameters.scene);

      //set material
      var material = new BABYLON.StandardMaterial("ground", this.parameters.scene);
      material.diffuseColor = BABYLON.Color3.White();
      material.alpha = 1;
      this.meshTo.material = material;
    }

    //positioning mesh
    this.meshTo.position.y = 0;
    this.meshTo.position.x = this.to.x;
    this.meshTo.position.z = this.to.y;
  }

  doMeshPoints() {
    if (this.meshPoints) {
      this.meshPoints.forEach(meshPoint => {
        meshPoint.dispose();
      });
      this.meshPoints = [];
    }

    this.points.forEach(point => {
      //create mesh
      this.meshPoints.push(BABYLON.MeshBuilder.CreateSphere('', { segments: 16, diameter: 0.2 }, this.parameters.scene));

      //set material
      var material = new BABYLON.StandardMaterial("ground", this.parameters.scene);
      material.diffuseColor = BABYLON.Color3.White();
      material.alpha = 0.8;
      this.meshPoints[this.meshPoints.length - 1].material = material;

      //positioning mesh
      this.meshPoints[this.meshPoints.length - 1].position.y = 0;
      this.meshPoints[this.meshPoints.length - 1].position.x = point.x;
      this.meshPoints[this.meshPoints.length - 1].position.z = point.y;
    });
  }
}
