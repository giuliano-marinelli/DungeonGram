import * as BABYLON from '@babylonjs/core/Legacy/legacy';
import { Schema } from './schema';
import { Tile } from './tile';

export class TileMap extends Schema {
  //schema
  width?: number;
  height?: number;
  tiles?: Tile[];
  //game objects
  baseTileMesh?: any;

  constructor(schema, parameters) {
    super();

    this.doBaseTileMesh(parameters.scene);

    this.synchronizeSchema(schema,
      { tiles: { type: Tile, datatype: Array, parameters: (key) => { return { id: key, baseTileMesh: this.baseTileMesh } } } },
      { scene: parameters.scene, room: parameters.room }
    );
  }

  doBaseTileMesh(scene) {
    //create base tile mesh
    this.baseTileMesh = BABYLON.MeshBuilder.CreateBox('', { height: 0.1, width: 0.9, depth: 0.9 }, scene);
    this.baseTileMesh.position.y = 10000;

    //set material of base tile mesh
    var material = new BABYLON.StandardMaterial("ground", scene);
    material.diffuseColor = BABYLON.Color3.White();
    material.alpha = 0.5;
    this.baseTileMesh.material = material;
  }

  remove(parameters?) {
    super.remove(parameters);
    this.baseTileMesh.dispose();
  }
}
