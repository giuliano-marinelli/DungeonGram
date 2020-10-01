import * as BABYLON from '@babylonjs/core/Legacy/legacy';
import { Schema } from './schema';
import { Player } from './player';
import { Wall } from './wall';
import { TileMap } from './tilemap';
import { Point } from './point';

export class World extends Schema {
  //schema
  players?: Player[];
  walls?: Wall[];
  tilemap?: TileMap;
  //game objects
  camera?: any;
  lights?: any[] = [];
  shadowGenerator: any;

  constructor(schema, parameters) {
    super(parameters);

    this.initCamera();

    this.initGlobalLights();

    this.synchronizeSchema(schema,
      {
        players: {
          type: Player, datatype: Array, parameters: (key) => {
            return {
              canvas: parameters.canvas,
              scene: parameters.scene,
              room: parameters.room,
              shadowGenerator: this.shadowGenerator,
              controller: parameters.controller,
              id: key
            }
          }
        },
        walls: {
          type: Wall, datatype: Array, parameters: (key) => {
            return {
              canvas: parameters.canvas,
              scene: parameters.scene,
              room: parameters.room,
              shadowGenerator: this.shadowGenerator,
              controller: parameters.controller,
              id: key
            }
          }
        },
        tilemap: { type: TileMap, datatype: Object, parameters: () => { return { scene: parameters.scene, room: parameters.room, controller: parameters.controller } } }
      }
    );
  }

  initCamera() {
    //creates, angles, distances and targets the camera
    this.camera = new BABYLON.ArcRotateCamera("mainCamera", -1, 1, 30, new BABYLON.Vector3(3, 0, 3), this.parameters.scene);
    //this positions the camera
    this.camera.setPosition(new BABYLON.Vector3(20, 20, -15));
    //this attaches the camera to the canvas
    this.camera.attachControl(this.parameters.canvas, true);
    //detach left click from camera control
    this.camera.inputs.attached.pointers.buttons[0] = null;
  }

  initGlobalLights() {
    //init lights
    // this.light = new BABYLON.PointLight("mainLight", new BABYLON.Vector3(0, 1, 0), scene);
    this.lights.push(new BABYLON.DirectionalLight("baseLight", new BABYLON.Vector3(-1, -2, -1), this.parameters.scene));
    this.lights[0].position = new BABYLON.Vector3(50, 100, 50);
    this.lights[0].intensity = 1;
    // this.lights.push(new BABYLON.HemisphericLight("ambientLight", new BABYLON.Vector3(0, 1, 0), this.parameters.scene));

    //init shadow generator for that lights
    this.shadowGenerator = new BABYLON.ShadowGenerator(4096, this.lights[0]);
    this.shadowGenerator.useExponentialShadowMap = true;
    // this.shadowGenerator.usePoissonSampling = true;

    //init skybox
    // var box = BABYLON.Mesh.CreateBox('SkyBox', 1000, this.parameters.scene, false, BABYLON.Mesh.BACKSIDE);
    // box.material = new BABYLON.SkyMaterial('sky', this.parameters.scene);
    // box.material.inclination = -0.35;
    this.parameters.scene.clearColor = new BABYLON.Color3(0.1, 0.1, 0.1);
  }
}
