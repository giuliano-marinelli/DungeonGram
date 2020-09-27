import * as BABYLON from '@babylonjs/core/Legacy/legacy';
import { Point } from './point';

export class Path {
  //schema
  from?: Point;
  to?: Point;
  points?: Point[] = [];
  //game objects
  meshTo?: any;
  meshPoints?: any[] = [];

  constructor(schema, scene, room) {
    if (schema?.from) this.from = new Point(schema.from);
    if (schema?.to) this.to = new Point(schema.to);

    if (schema?.points) {
      schema.points.onAdd = (point, id) => {
        this.points[id] = new Point(point);
      }
      schema.points.onRemove = (point, id) => {
        delete this.points[id];
        this.points.length = this.points.length - 1;
      }
      schema.points.triggerAll();
    }

    schema.onChange = (changes) => {
      changes.forEach((change) => {
        switch (change.field) {
          case 'from': case 'to':
            if (!this[change.field] && change.value != null) this[change.field] = new Point(change.value);
            else if (change.value == null) delete this[change.field];
            break;
        }
        switch (change.field) {
          case 'to':
            if (change.value) this.doMeshTo(change.value, scene, room);
            else {
              this.meshTo?.dispose();
              delete this.meshTo;
            }
            break;
          case 'points':
            this.doMeshPoints(change.value, scene, room);
            break;
        }
      });
    }
    schema.triggerAll();
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

  remove(schema, scene, room) {
    this.meshTo.dispose();
    this.meshPoints.forEach(meshPoint => {
      meshPoint.dispose();
    });
  }
}
