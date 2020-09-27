import * as BABYLON from '@babylonjs/core/Legacy/legacy';
import { Player } from './player';
import { TileMap } from './tilemap';

export class World {
  //schema
  players?: Player[] = [];
  tilemap?: TileMap;
  //game objects
  camera?: any;
  light?: any;

  constructor(schema, scene, room, canvas) {
    if (schema?.tilemap) this.tilemap = new TileMap(schema.tilemap, scene, room);

    if (schema?.players) {
      schema.players.onAdd = (player, id) => {
        this.players[id] = new Player(player, scene, room, { id: id });
      }
      schema.players.onRemove = (player, id) => {
        this.players[id].remove(player, scene, room);
        delete this.players[id];
      }
      schema.players.triggerAll();
    }

    this.initCamera(scene, canvas);

    this.initGlobalLights(scene);
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
