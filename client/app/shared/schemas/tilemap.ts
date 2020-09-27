import * as BABYLON from '@babylonjs/core/Legacy/legacy';
import { Tile } from './tile';

export class TileMap {
  //schema
  width?: number;
  height?: number;
  tiles?: Tile[] = [];
  //game objects
  baseTileMesh?: any;

  constructor(schema, scene, room) {
    schema.onChange = (changes) => {
      changes.forEach((change) => {
        switch (change.field) {
          case 'width': case 'height':
            this[change.field] = change.value;
            break;
        }
      });
    }
    schema.triggerAll();

    if (schema?.tiles) {
      //create base tile mesh
      this.baseTileMesh = BABYLON.MeshBuilder.CreateBox('', { height: 0.1, width: 0.9, depth: 0.9 }, scene);
      this.baseTileMesh.position.y = 10000;

      //set material of base tile mesh
      var material = new BABYLON.StandardMaterial("ground", scene);
      material.diffuseColor = BABYLON.Color3.White();
      material.alpha = 0.5;
      this.baseTileMesh.material = material;

      schema.tiles.onAdd = (tile, id) => {
        this.tiles[id] = new Tile(tile, scene, room, { id: id, baseTileMesh: this.baseTileMesh });
      }
      schema.tiles.triggerAll();
    }
  }
}
