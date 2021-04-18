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
  line?: any;

  constructor(schema, parameters) {
    super(parameters);

    this.init();

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
  }

  remove() {
    super.remove();
    this.removeMeshTo();
    this.removeLine();
  }

  removeMeshTo() {
    this.meshTo?.dispose();
    this.meshTo = null;
  }

  removeLine() {
    this.line?.dispose();
    this.line = null;
  }

  reset() {
    this.meshTo.visibility = 0;
    this.removeLine();
  }

  init() {
    //create mesh to
    this.meshTo = this.parameters.assets.pathPoint.clone();
    this.meshTo.setEnabled(true);
    this.meshTo.visibility = 0;
  }

  doMeshTo() {
    this.reset();

    if (this.parameters.characterId == this.parameters.world.users[this.parameters.token].selectedCharacter &&
      this.to) {
      //show mesh to
      this.meshTo.visibility = 1;

      //positioning mesh to
      this.meshTo.position = new BABYLON.Vector3(this.to.x, 0.1, this.to.y);
    }

    if (this.parameters.characterId == this.parameters.world.users[this.parameters.token].selectedCharacter &&
      this.points.length) {
      var points3D = [];
      for (let i = 0; i < this.points.length; i++) {
        points3D.push(new BABYLON.Vector3(this.points[i].x, 0.1, this.points[i].y));
      }
      //create line based on the points
      this.line = BABYLON.MeshBuilder.CreateLines("lines", { points: points3D }, this.parameters.scene);
    }
  }
}
