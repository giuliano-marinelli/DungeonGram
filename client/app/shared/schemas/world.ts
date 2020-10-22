import * as BABYLON from '@babylonjs/core/Legacy/legacy';
import { Schema } from './schema';
import { User } from './user';
import { Character } from './character';
import { Wall } from './wall';
import { TileMap } from './tilemap';
import {
  GridMaterial,
  ShadowOnlyMaterial
} from '@babylonjs/materials';

export class World extends Schema {
  //schema
  users?: User[];
  characters?: Character[];
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
              token: parameters.token,
              controller: parameters.controller,
              id: key
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
              token: parameters.token,
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
              token: parameters.token,
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
    this.camera.wheelPrecision = 40;
    this.camera.setPosition(new BABYLON.Vector3(20, 20, -15));
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

    this.lights.secondLight = new BABYLON.DirectionalLight("secondLight", new BABYLON.Vector3(1, -2, 1), this.parameters.scene);
    this.lights.secondLight.position = new BABYLON.Vector3(-50, 100, -50);
    this.lights.secondLight.intensity = 1;
    this.lights.secondLight.specular = new BABYLON.Color3(0, 0, 0);

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
      if (this.lights.characterLight && this.tilemap?.terrain && !this.lights.characterLight.setted) {
        this.lights.characterLight.includedOnlyMeshes.push(this.tilemap.terrain);
        this.lights.characterLight.setted = true;
      }

      if (this.lights.baseLight && this.tilemap?.terrain && !this.lights.baseLight.setted) {
        this.lights.baseLight.excludedMeshes.push(this.tilemap.terrain);
        this.lights.baseLight.setted = true;

        this.lights.fogLight.includedOnlyMeshes.push(this.tilemap.terrain);
      }

      if (this.lights.secondLight && this.tilemap?.terrain && !this.lights.secondLight.setted) {
        this.lights.secondLight.excludedMeshes.push(this.tilemap.terrain);
        this.lights.secondLight.setted = true;

        this.lights.fogLight.includedOnlyMeshes.push(this.tilemap.terrain);
      }
    });
  }

  updateShadows() {
    setTimeout(() => {
      try {
        for (let wall in this.walls) {
          if (this.walls[wall].size != 'collider')
            this.lights.characterLight._shadowGenerator.addShadowCaster(this.walls[wall].mesh);
        }
        for (let character in this.characters) {
          this.lights.baseLight._shadowGenerator.addShadowCaster(this.characters[character].mesh);
        }
      } catch (err) { }
    });
  }

  updateWalls() {
    setTimeout(() => {
      var user = this.users[this.parameters.token];
      for (let wall in this.walls) {
        this.walls[wall].mesh.isPickable = user.wallsPickable;
        this.walls[wall].mesh.visibility = user.wallsVisibility;
      }
    });
  }

  updateFogOfWar() {
    setTimeout(() => {
      var user = this.users[this.parameters.token];
      this.lights.fogLight.intensity = user.fogOfWarVisibility;
    });
  }

  updateTilemap() {
    setTimeout(() => {
      var user = this.users[this.parameters.token];
      if (user.tilemapShowGrid)
        this.tilemap.ground.material = this.tilemap.gridMaterial;
      else
        this.tilemap.ground.material = new ShadowOnlyMaterial('shadowOnly', this.parameters.scene);
    });
  }

  updateCharactersVisibility(character?) {
    var selectedCharacter = this.users[this.parameters.token]?.selectedCharacter;
    if (selectedCharacter && this.characters[selectedCharacter]?.mesh) {
      setTimeout(() => {
        this.characters[selectedCharacter].animator.visibility(1);
        // this.characters[selectedCharacter]?.visionRays.forEach(visionRay => {
        //   visionRay?.dispose();
        // });
        this.characters[selectedCharacter].collider.isCollible = false;
        if (!character || character == selectedCharacter) {
          for (let character in this.characters) {
            this._updateCharacterVisibility(character, selectedCharacter)
          }
        } else {
          this._updateCharacterVisibility(character, selectedCharacter)
        }
        this.characters[selectedCharacter].collider.isCollible = true;
        // this.characters[selectedCharacter]?.visibleCharacters?.forEach(characterMesh => {
        //   if (characterMesh) characterMesh.animator.visibility(1);
        // });
      }, this.characters[selectedCharacter].movementCooldown);
    } else {
      setTimeout(() => {
        for (let character in this.characters) {
          if (this.characters[character].mesh) {
            this.characters[character].collider.isPickable = true;
            this.characters[character].animator.visibility(1);
          }
        }
      });
    }
  }

  _updateCharacterVisibility(character, selectedCharacter) {
    if (this.characters[character] && this.characters[character].mesh && character != selectedCharacter) {
      this.characters[character].collider.isPickable = true;
      var origin = new BABYLON.Vector3(this.characters[selectedCharacter].mesh.position.x, this.characters[character].mesh.position.y + 1.65, this.characters[selectedCharacter].mesh.position.z);
      var target = BABYLON.Vector3.Normalize(new BABYLON.Vector3(this.characters[character].mesh.position.x, this.characters[character].mesh.position.y + 1.65, this.characters[character].mesh.position.z).subtract(origin));
      var ray = new BABYLON.Ray(
        origin,
        target,
        this.characters[selectedCharacter].visionRange - 1
      );
      // this.characters[selectedCharacter].visionRays.push(BABYLON.RayHelper.CreateAndShow(ray, this.parameters.scene, new BABYLON.Color3(1, 1, 0.1)));
      var pickedMesh = this.parameters.scene.pickWithRay(ray, (mesh) => {
        return mesh.isCollible && (!mesh.isCharacter || mesh.name == this.characters[character].id)
      })?.pickedMesh;
      if (pickedMesh && this.characters[character].id == pickedMesh.name)
        this.characters[character].animator.visibility(1);
      else {
        this.characters[character].animator.visibility(0);
        this.characters[character].collider.isPickable = false;
      }
    }
  }
}
