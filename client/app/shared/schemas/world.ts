import * as BABYLON from '@babylonjs/core/Legacy/legacy';
import { Schema } from './schema';
import { User } from './user';
import { Map } from './map';
import { Character } from './character';
import {
  ShadowOnlyMaterial
} from '@babylonjs/materials';
import { Vectors } from '../utils/vectors';

export class World extends Schema {
  //schema
  campaignId?: string;
  users?: User[];
  characters?: Character[];
  map?: Map;
  fogOfWarVisibilityPlayers?: number;
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
              token: parameters.token,
              controller: parameters.controller,
              assets: parameters.assets,
              id: key
            }
          }
        },
        map: {
          type: Map, datatype: Object, parameters: () => {
            return {
              world: this,
              canvas: parameters.canvas,
              scene: parameters.scene,
              room: parameters.room,
              token: parameters.token,
              controller: parameters.controller,
              assets: parameters.assets
            }
          }
        },
        characters: {
          type: Character, datatype: Array, parameters: (key) => {
            return {
              world: this,
              canvas: parameters.canvas,
              scene: parameters.scene,
              room: parameters.room,
              token: parameters.token,
              controller: parameters.controller,
              assets: parameters.assets,
              id: key
            }
          }
        },
      }
    );
  }

  update(changes) {
    changes?.forEach((change) => {
      switch (change.field) {
        case 'map':
          for (let character in this.characters) {
            this.characters[character].doMesh();
          }
          break;
        case 'users':
          this.parameters.controller.updateSetting('usersOnCampaign', this.users);
          break;
        case 'characters':
          this.parameters.controller.updateSetting('charactersOnCampaign', this.characters);
          break;
        case 'fogOfWarVisibilityPlayers':
          this.updateFogOfWar();
          this.parameters.controller.updateSetting('fogOfWarVisibilityPlayers', this.fogOfWarVisibilityPlayers);
          break;
      }
    });
  }

  initCamera() {
    //creates, angles, distances and targets the camera
    this.camera = new BABYLON.ArcRotateCamera("mainCamera", -1, 0.75, 30, new BABYLON.Vector3(3, 0, 3), this.parameters.scene);
    this.camera.wheelPrecision = 40;
    this.camera.setPosition(new BABYLON.Vector3(20, 20, -15));
    this.camera.panningAxis = new BABYLON.Vector3(1, 0, 1);
    this.camera.panningSensibility = 200;
    this.camera.attachControl(this.parameters.canvas, true);
    //for limit how much the camera can rotate to bottom
    this.camera.upperBetaLimit = 1.3
    //for limit how much the camera can rotate to top
    this.camera.lowerBetaLimit = 0.75
    //for limit how much the camera zoom in
    this.camera.lowerRadiusLimit = 8
    //for limit how much the camera zoom out
    this.camera.upperRadiusLimit = 150


    //detach left click from camera control
    this.camera.inputs.attached.pointers.buttons[0] = null;

    //custom function added to the camera to focus a passed mesh
    this.camera.focusOnMesh = (mesh) => {
      if (mesh) {
        BABYLON.Animation.CreateAndStartAnimation('targetCamera', this.camera,
          'target', 3, 1, this.camera.target, mesh.position.clone(),
          BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
        BABYLON.Animation.CreateAndStartAnimation('betaCamera', this.camera,
          'beta', 3, 1, this.camera.beta, this.camera.beta,
          BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
        BABYLON.Animation.CreateAndStartAnimation('radiusCamera', this.camera,
          'radius', 3, 1, this.camera.radius, this.camera.radius > 50 ? 30 : this.camera.radius,
          BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
        BABYLON.Animation.CreateAndStartAnimation('alphaCamera', this.camera,
          'alpha', 3, 1, this.camera.alpha, this.camera.alpha,
          BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
      }
    }
  }

  initGlobalLights() {
    //clear existent lights
    this.lights.baseLight?.dispose();
    this.lights.secondLight?.dispose();
    this.lights.fogLight?.dispose();
    this.lights.characterLight?.dispose();

    //init base light for global lighting characters
    this.lights.baseLight = new BABYLON.DirectionalLight("baseLight", new BABYLON.Vector3(-1, -2, -1), this.parameters.scene);
    this.lights.baseLight.position = new BABYLON.Vector3(50, 100, 50);
    this.lights.baseLight.intensity = 1;
    this.lights.baseLight.specular = new BABYLON.Color3(0, 0, 0);

    //init shadow generator for base light to generate shadows of characters on terrainShadows
    new BABYLON.ShadowGenerator(4096, this.lights.baseLight);
    this.lights.baseLight._shadowGenerator.useBlurExponentialShadowMap = true;
    this.lights.baseLight._shadowGenerator.darkness = 0.5;

    //init second light for global lighting characters from behind
    this.lights.secondLight = new BABYLON.DirectionalLight("secondLight", new BABYLON.Vector3(1, -2, 1), this.parameters.scene);
    this.lights.secondLight.position = new BABYLON.Vector3(-50, 100, -50);
    this.lights.secondLight.intensity = 1;
    this.lights.secondLight.specular = new BABYLON.Color3(0, 0, 0);

    //init fog light for lighting the terrain based on fog visibility
    this.lights.fogLight = new BABYLON.DirectionalLight("fogLight", new BABYLON.Vector3(-1, -2, -1), this.parameters.scene);
    this.lights.fogLight.position = new BABYLON.Vector3(50, 100, 50);
    this.lights.fogLight.intensity = 0;
    this.lights.fogLight.specular = new BABYLON.Color3(0, 0, 0);

    //init character light for lighting the terrain respectively to character vision
    this.lights.characterLight = new BABYLON.PointLight("characterLight", new BABYLON.Vector3(0, 2, 0), this.parameters.scene);
    this.lights.characterLight.diffuse = new BABYLON.Color3(0.5, 0.5, 0.5);
    this.lights.characterLight.specular = new BABYLON.Color3(0, 0, 0);
    this.lights.characterLight.shadowMinZ = 0.1;
    this.lights.characterLight.range = 0;
    this.lights.characterLight.intensity = 0;

    //init shadow generator for the character light to generate shadows of walls on the terrain
    new BABYLON.ShadowGenerator(1024, this.lights.characterLight);
    this.lights.characterLight._shadowGenerator.useBlurExponentialShadowMap = true;
    this.lights.characterLight._shadowGenerator.transparencyShadow = true;

    //init highlight layer for character selection
    this.lights.highlightCharacter = new BABYLON.HighlightLayer("highlightCharacter", this.parameters.scene);
    this.lights.highlightCharacter.innerGlow = false;

    //init skybox
    // var box = BABYLON.Mesh.CreateBox('SkyBox', 1000, this.parameters.scene, false, BABYLON.Mesh.BACKSIDE);
    // box.material = new BABYLON.SkyMaterial('sky', this.parameters.scene);
    // box.material.inclination = -0.35;
    this.parameters.scene.clearColor = new BABYLON.Color3(0.1, 0.1, 0.1);
  }

  updateFogOfWar() {
    setTimeout(() => {
      var user = this.users[this.parameters.token];
      this.lights.fogLight.intensity = user.isDM
        ? user.fogOfWarVisibility
        : (user.fogOfWarVisibility <= this.fogOfWarVisibilityPlayers ? this.fogOfWarVisibilityPlayers : user.fogOfWarVisibility);
    });
  }

  updateTilemap() {
    setTimeout(() => {
      if (this.map) {
        var user = this.users[this.parameters.token];
        if (this.map.tilemap.ground) {
          if (user.tilemapShowGrid)
            this.map.tilemap.ground.material = this.map.tilemap.gridMaterial;
          else
            this.map.tilemap.ground.material = new ShadowOnlyMaterial('shadowOnly', this.parameters.scene);
        }
      }
    });
  }

  updateWallsVisibility() {
    setTimeout(() => {
      if (this.map) {
        for (let wall in this.map?.walls) {
          this.updateWallVisibility(this.map.walls[wall]);
        }
        for (let door in this.map?.doors) {
          this.updateWallVisibility(this.map.doors[door]);
        }
      }
    });
  }

  updateWallVisibility(wall?) {
    var user = this.users[this.parameters.token];
    wall.mesh.isPickable = user.wallsPickable;
    if (wall.type != "door") wall.mesh.visibility = user.wallsVisibility;
  }

  updateCharactersVisibility(character?) {
    var selectedCharacter = this.users[this.parameters.token]?.selectedCharacter;
    if (selectedCharacter && this.characters[selectedCharacter]?.mesh && this.characters[selectedCharacter]?.collider) {
      setTimeout(() => {
        if (this.map) {
          this.characters[selectedCharacter].animator.show();
          // this.characters[selectedCharacter].visionRays.forEach(visionRay => {
          //   visionRay?.dispose();
          // });
          this.characters[selectedCharacter].collider.isCollible = false;
          if (!character || character == selectedCharacter) {
            for (let character in this.characters) {
              this.updateCharacterVisibility(character, selectedCharacter)
            }
            for (let door in this.map.doors) {
              this.updateDoorVisibility(door, selectedCharacter)
            }
          } else {
            this.updateCharacterVisibility(character, selectedCharacter)
          }
          this.characters[selectedCharacter].collider.isCollible = true;
          // this.characters[selectedCharacter]?.visibleCharacters?.forEach(characterMesh => {
          //   if (characterMesh) characterMesh.animator.show();
          // });
        }
      }, this.characters[selectedCharacter].movementCooldown);
    } else {
      setTimeout(() => {
        if (this.map) {
          if (this.users[this.parameters.token]?.isDM) {
            for (let character in this.characters) {
              if (this.characters[character].mesh) {
                this.characters[character].collider.isPickable = true;
                this.characters[character].animator.show();
              }
            }
            for (let door in this.map.doors) {
              if (this.map.doors[door].mesh) {
                this.map.doors[door].mesh.visibility = this.map.doors[door].size == 'collider' ? 0.5 : 1;
                this.map.doors[door].mesh.isPickable = true;
              }
            }
          } else {
            for (let character in this.characters) {
              if (this.characters[character].mesh) {
                this.characters[character].collider.isPickable = false;
                this.characters[character].animator.hide();
              }
            }
            for (let door in this.map.doors) {
              if (this.map.doors[door].mesh) {
                this.map.doors[door].mesh.visibility = 0;
                this.map.doors[door].mesh.isPickable = false;
              }
            }
          }
        }
      });
    }
  }

  updateCharacterVisibility(character, selectedCharacter) {
    if (this.characters[character] && this.characters[character].mesh &&
      character != selectedCharacter &&
      (!this.characters[character].addingMode || this.users[this.parameters.token]?.addingModeCharacter != character)) {
      this.characters[character].collider.isPickable = true;
      var origin = new BABYLON.Vector3(this.characters[selectedCharacter].mesh.position.x, this.characters[selectedCharacter].mesh.position.y + 1.65 * this.characters[selectedCharacter].height, this.characters[selectedCharacter].mesh.position.z);
      var target = BABYLON.Vector3.Normalize(new BABYLON.Vector3(this.characters[character].mesh.position.x, this.characters[character].mesh.position.y + 1.65 * this.characters[character].height, this.characters[character].mesh.position.z).subtract(origin));
      var ray = new BABYLON.Ray(
        origin,
        target,
        this.characters[selectedCharacter].visionRange - 1
      );
      // this.characters[selectedCharacter].visionRays.push(BABYLON.RayHelper.CreateAndShow(ray, this.parameters.scene, new BABYLON.Color3(1, 1, 0.1)));
      var pickedMesh = this.parameters.scene.pickWithRay(ray, (mesh) => {
        return mesh.isCollible && !mesh.isTranspasable && (!mesh.isCharacter || mesh.name == this.characters[character].id)
      })?.pickedMesh;
      if (pickedMesh && this.characters[character].id == pickedMesh.name)
        this.characters[character].animator.show();
      else {
        this.characters[character].animator.hide();
        this.characters[character].collider.isPickable = false;
      }
    }
  }

  updateDoorVisibility(door, selectedCharacter) {
    if (this.map.doors[door] && this.map.doors[door].mesh) {
      this.map.doors[door].collider.isPickable = true;
      var origin = new BABYLON.Vector3(this.characters[selectedCharacter].mesh.position.x, this.characters[selectedCharacter].mesh.position.y + 1.65 * this.characters[selectedCharacter].height, this.characters[selectedCharacter].mesh.position.z);
      var middlePoint = Vectors.middlePoint(this.map.doors[door].from, this.map.doors[door].to);
      var target = BABYLON.Vector3.Normalize(new BABYLON.Vector3(middlePoint.x, this.map.doors[door].height, middlePoint.y).subtract(origin));
      var ray = new BABYLON.Ray(
        origin,
        target,
        this.characters[selectedCharacter].visionRange - 1
      );
      // this.characters[selectedCharacter].visionRays.push(BABYLON.RayHelper.CreateAndShow(ray, this.parameters.scene, new BABYLON.Color3(0, 1, 0.1)));
      var pickedMesh = this.parameters.scene.pickWithRay(ray, (mesh) => {
        return (mesh.isCollible || mesh.isTranspasable) && ((!mesh.isCharacter && !mesh.isDoor) || mesh.name == this.map.doors[door].id)
      })?.pickedMesh;
      var distanceToDoor = Vectors.distance({ x: this.characters[selectedCharacter].mesh.position.x, y: this.characters[selectedCharacter].mesh.position.z }, { x: this.map.doors[door].to.x, y: this.map.doors[door].to.y });
      if ((pickedMesh && this.map.doors[door].id == pickedMesh.name) ||
        distanceToDoor < 3) {
        this.map.doors[door].mesh.visibility = this.map.doors[door].size == 'collider' ? 0.5 : 1;
        if (distanceToDoor <= 3) {
          this.map.doors[door].mesh.isPickable = true;
        } else if (this.parameters.controller.activeTool?.name != 'walls') {
          this.map.doors[door].mesh.isPickable = false;
        }
      } else {
        this.map.doors[door].mesh.visibility = 0;
        if (this.parameters.controller.activeTool?.name != 'walls') this.map.doors[door].mesh.isPickable = false;
      }
      this.map.doors[door].collider.isPickable = false;
    }
  }
}
