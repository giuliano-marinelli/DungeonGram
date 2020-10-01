import * as BABYLON from '@babylonjs/core/Legacy/legacy';
import { Point } from './point';
import { Schema } from './schema';
import { Vectors } from '../utils/vectors';

export class Wall extends Schema {
  //schema
  id?: string;
  from?: Point;
  to?: Point;
  //game objects
  mesh?: any;

  constructor(schema, parameters) {
    super(parameters);

    this.id = parameters.id;

    this.synchronizeSchema(schema,
      {
        from: { type: Point, datatype: Object, parameters: () => { return { parent: this } } },
        to: { type: Point, datatype: Object, parameters: () => { return { parent: this } } }
      }
    );

    this.doMesh();
  }

  doMesh() {
    this.mesh = BABYLON.MeshBuilder.CreateBox('', { height: 2, width: 1, depth: 0.2 }, this.parameters.scene);
    this.mesh.scaling.x = Vectors.distance(this.from, this.to);
    //set material of base tile mesh
    var material = new BABYLON.StandardMaterial("wall", this.parameters.scene);
    material.diffuseColor = BABYLON.Color3.Gray();
    this.mesh.material = material;

    //positioning mesh
    var middlePoint = Vectors.middlePoint(this.from, this.to);
    this.mesh.position.y = 1;
    this.mesh.position.x = middlePoint.x;
    this.mesh.position.z = middlePoint.y;

    //rotate relative to orientation
    // if (this.from.x == this.to.x)
    this.mesh.rotate(BABYLON.Axis.Y, Vectors.angle(this.from, this.to), BABYLON.Space.WORLD);

    //set action on mouse in/out
    // this.mesh.actionManager = new BABYLON.ActionManager(this.parameters.scene);
    // this.mesh.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickUpTrigger, () => {
    //   console.log('Tile : (', this.x, ',', this.y, ')', this._schema);
    //   this.parameters.room.send('move', { x: this.x, y: this.y });
    // }));
  }

  remove() {
    super.remove();
    this.mesh.dispose();
  }
}
