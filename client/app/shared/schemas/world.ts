import * as BABYLON from '@babylonjs/core/Legacy/legacy';
import { Schema } from './schema';
import { User } from './user';
import { Player } from './player';
import { Wall } from './wall';
import { TileMap } from './tilemap';
import {
  GridMaterial,
  ShadowOnlyMaterial
} from '@babylonjs/materials';

export class World extends Schema {
  //schema
  users?: User[];
  players?: Player[];
  walls?: Wall[];
  tilemap?: TileMap;
  //game objects
  camera?: any;
  lights?: any = {};

  constructor(schema, parameters) {
    super(parameters);

    this.initCamera();

    this.initGlobalLights();

    this.synchronizeSchema(schema,
      {
        users: {
          type: User, datatype: Array, parameters: (key) => {
            return {
              world: this,
              canvas: parameters.canvas,
              scene: parameters.scene,
              room: parameters.room,
              controller: parameters.controller,
              id: key
            }
          }
        },
        players: {
          type: Player, datatype: Array, parameters: (key) => {
            return {
              world: this,
              canvas: parameters.canvas,
              scene: parameters.scene,
              room: parameters.room,
              lights: this.lights,
              controller: parameters.controller,
              id: key
            }
          }
        },
        walls: {
          type: Wall, datatype: Array, parameters: (key) => {
            return {
              world: this,
              canvas: parameters.canvas,
              scene: parameters.scene,
              room: parameters.room,
              lights: this.lights,
              controller: parameters.controller,
              id: key
            }
          }
        },
        tilemap: {
          type: TileMap, datatype: Object, parameters: () => {
            return {
              world: this,
              canvas: parameters.canvas,
              scene: parameters.scene,
              room: parameters.room,
              controller: parameters.controller
            }
          }
        }
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
    this.lights.baseLight = new BABYLON.DirectionalLight("baseLight", new BABYLON.Vector3(-1, -2, -1), this.parameters.scene);
    this.lights.baseLight.position = new BABYLON.Vector3(50, 100, 50);
    this.lights.baseLight.intensity = 1;
    this.lights.baseLight.specular = new BABYLON.Color3(0, 0, 0);

    this.lights.fogLight = new BABYLON.DirectionalLight("fogLight", new BABYLON.Vector3(-1, -2, -1), this.parameters.scene);
    this.lights.fogLight.position = new BABYLON.Vector3(50, 100, 50);
    this.lights.fogLight.intensity = 0;
    this.lights.fogLight.specular = new BABYLON.Color3(0, 0, 0);

    //init shadow generator for base light
    new BABYLON.ShadowGenerator(4096, this.lights.baseLight);
    this.lights.baseLight._shadowGenerator.useBlurExponentialShadowMap = true;
    this.lights.baseLight._shadowGenerator.darkness = 0.5;

    //init skybox
    // var box = BABYLON.Mesh.CreateBox('SkyBox', 1000, this.parameters.scene, false, BABYLON.Mesh.BACKSIDE);
    // box.material = new BABYLON.SkyMaterial('sky', this.parameters.scene);
    // box.material.inclination = -0.35;
    this.parameters.scene.clearColor = new BABYLON.Color3(0.1, 0.1, 0.1);
  }

  updateLights() {
    setTimeout(() => {
      if (this.lights.playerLight && this.tilemap?.terrain && !this.lights.playerLight.setted) {
        this.lights.playerLight.includedOnlyMeshes.push(this.tilemap.terrain);
        this.lights.playerLight.setted = true;
      }

      if (this.lights.baseLight && this.tilemap?.terrain && !this.lights.baseLight.setted) {
        this.lights.baseLight.excludedMeshes.push(this.tilemap.terrain);
        this.lights.baseLight.setted = true;

        this.lights.fogLight.includedOnlyMeshes.push(this.tilemap.terrain);
      }
    });
  }

  updateShadows() {
    setTimeout(() => {
      try {
        for (let wall in this.walls) {
          if (this.walls[wall].size != 'collider')
            this.lights.playerLight._shadowGenerator.addShadowCaster(this.walls[wall].mesh);
        }
        for (let player in this.players) {
          this.lights.baseLight._shadowGenerator.addShadowCaster(this.players[player].mesh);
        }
      } catch (err) { }
    });
  }

  updateWalls() {
    setTimeout(() => {
      var user = this.users[this.parameters.room.sessionId];
      for (let wall in this.walls) {
        this.walls[wall].mesh.isPickable = user.wallsPickable;
        this.walls[wall].mesh.visibility = user.wallsVisibility;
      }
    });
  }

  updateFogOfWar() {
    setTimeout(() => {
      var user = this.users[this.parameters.room.sessionId];
      this.lights.fogLight.intensity = user.fogOfWarVisibility;
    });
  }

  updateTilemap() {
    setTimeout(() => {
      var user = this.users[this.parameters.room.sessionId];
      if (user.tilemapShowGrid)
        this.tilemap.ground.material = this.tilemap.gridMaterial;
      else
        this.tilemap.ground.material = new ShadowOnlyMaterial('shadowOnly', this.parameters.scene);
    });
  }

  updatePlayersVisibility(player?) {
    var selectedPlayer = this.users[this.parameters.room.sessionId]?.selectedPlayer;
    if (selectedPlayer && this.players[selectedPlayer]?.mesh) {
      setTimeout(() => {
        this.players[selectedPlayer].mesh.visibility = 1;
        // this.players[selectedPlayer]?.visionRays.forEach(visionRay => {
        //   visionRay?.dispose();
        // });
        this.players[selectedPlayer].collider.isCollible = false;
        if (!player || player == selectedPlayer) {
          for (let player in this.players) {
            this._updatePlayerVisibility(player, selectedPlayer)
          }
        } else {
          this._updatePlayerVisibility(player, selectedPlayer)
        }
        this.players[selectedPlayer].collider.isCollible = true;
        // this.players[selectedPlayer]?.visiblePlayers?.forEach(playerMesh => {
        //   if (playerMesh) playerMesh.visibility = 1;
        // });
      }, this.players[selectedPlayer].movementCooldown);
    } else {
      setTimeout(() => {
        for (let player in this.players) {
          if (this.players[player].mesh) {
            this.players[player].collider.isPickable = true;
            this.players[player].mesh.visibility = 1;
          }
        }
      });
    }
  }

  _updatePlayerVisibility(player, selectedPlayer) {
    if (this.players[player].mesh && player != selectedPlayer) {
      this.players[player].collider.isPickable = true;
      var origin = new BABYLON.Vector3(this.players[selectedPlayer].mesh.position.x, this.players[player].mesh.position.y + 1.65, this.players[selectedPlayer].mesh.position.z);
      var target = BABYLON.Vector3.Normalize(new BABYLON.Vector3(this.players[player].mesh.position.x, this.players[player].mesh.position.y + 1.65, this.players[player].mesh.position.z).subtract(origin));
      var ray = new BABYLON.Ray(
        origin,
        target,
        this.players[selectedPlayer].visionRange - 1
      );
      // this.players[selectedPlayer].visionRays.push(BABYLON.RayHelper.CreateAndShow(ray, this.parameters.scene, new BABYLON.Color3(1, 1, 0.1)));
      var pickedMesh = this.parameters.scene.pickWithRay(ray, (mesh) => {
        return mesh.isCollible && (!mesh.isPlayer || mesh.name == this.players[player].id)
      })?.pickedMesh;
      if (pickedMesh && this.players[player].id == pickedMesh.name)
        this.players[player].mesh.visibility = 1;
      else {
        this.players[player].mesh.visibility = 0;
        this.players[player].collider.isPickable = false;
      }
    }
  }
}
