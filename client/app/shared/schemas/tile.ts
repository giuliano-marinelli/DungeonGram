import * as BABYLON from '@babylonjs/core/Legacy/legacy';
import { Schema } from './schema';

export class Tile extends Schema {
  //schema
  id?: string;
  x?: number;
  y?: number;
  //game objects
  mesh?: any;

  constructor(schema, parameters) {
    super(parameters);

    this.id = parameters.id;

    this.synchronizeSchema(schema);

    this.doMesh();
  }

  doMesh() {
    this.mesh = this.parameters.baseTileMesh.createInstance(this.id);

    //positioning mesh
    this.mesh.position.y = 0;
    this.mesh.position.x = this.x;
    this.mesh.position.z = this.y;

    //set action on mouse in/out
    this.mesh.actionManager = new BABYLON.ActionManager(this.parameters.scene);
    // this.mesh.actionManager.registerAction(new BABYLON.SetValueAction(BABYLON.ActionManager.OnPointerOutTrigger, this.mesh.material, "emissiveColor", this.mesh.material.emissiveColor));
    // this.mesh.actionManager.registerAction(new BABYLON.SetValueAction(BABYLON.ActionManager.OnPointerOverTrigger, this.mesh.material, "emissiveColor", BABYLON.Color3.White()));
    this.mesh.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickUpTrigger, () => {
      console.log('Tile : (', this.x, ',', this.y, ')', this._schema);
      this.parameters.room.send('move', { x: this.x, y: this.y });
    }));
  }

  remove() {
    super.remove();
    this.mesh.dispose();
  }
}
