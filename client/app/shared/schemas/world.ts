import * as BABYLON from '@babylonjs/core/Legacy/legacy';
import { Schema } from './schema';
import { Player } from './player';
import { TileMap } from './tilemap';
import { Point } from './point';

export class World extends Schema {
  //schema
  players?: Player[];
  tilemap?: TileMap;
  //game objects
  camera?: any;
  light?: any;

  constructor(schema, parameters) {
    super();

    this.synchronizeSchema(schema,
      {
        players: { type: Player, datatype: Array, parameters: (key) => { return { id: key } } },
        tilemap: { type: TileMap, datatype: Object }
      },
      { scene: parameters.scene, room: parameters.room }
    );

    this.initCamera(parameters.scene, parameters.canvas);

    this.initGlobalLights(parameters.scene);
  }

  initCamera(scene, canvas) {
    //creates, angles, distances and targets the camera
    this.camera = new BABYLON.ArcRotateCamera("mainCamera", -1, 1, 30, new BABYLON.Vector3(3, 0, 3), scene);
    //this positions the camera
    this.camera.setPosition(new BABYLON.Vector3(20, 20, -15));
    //this attaches the camera to the canvas
    this.camera.attachControl(canvas, true);
  }

  initGlobalLights(scene) {
    this.light = new BABYLON.PointLight("mainLight", new BABYLON.Vector3(0, 1, 0), scene);
  }
}
