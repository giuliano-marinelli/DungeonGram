import * as BABYLON from '@babylonjs/core/Legacy/legacy';
import { Schema } from './schema';
import { User } from './user';
import { Map } from './map';
import {
  ShadowOnlyMaterial
} from '@babylonjs/materials';

export class World extends Schema {
  //schema
  campaignId?: string;
  users?: User[];
  map?: Map;
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
        }, map: {
          type: Map, datatype: Object, parameters: () => {
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

  update(changes) {
    changes?.forEach((change) => {
      switch (change.field) {
        case 'map':
          this.parameters.controller.updateSetting('charactersOnMap', this.map?.characters);
          break;
      }
    });
  }

  initCamera() {
    //creates, angles, distances and targets the camera
    this.camera = new BABYLON.ArcRotateCamera("mainCamera", -1, 1, 30, new BABYLON.Vector3(3, 0, 3), this.parameters.scene);
    this.camera.wheelPrecision = 40;
    this.camera.setPosition(new BABYLON.Vector3(20, 20, -15));
    this.camera.panningAxis = new BABYLON.Vector3(1, 0, 1);
    this.camera.panningSensibility = 200;
    this.camera.attachControl(this.parameters.canvas, true);

    //detach left click from camera control
    this.camera.inputs.attached.pointers.buttons[0] = null;
  }

  initGlobalLights() {
    //clear existent lights
    this.lights.baseLight?.dispose();
    this.lights.secondLight?.dispose();
    this.lights.fogLight?.dispose();

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
      if (this.lights.characterLight && this.map?.tilemap?.terrain && !this.lights.characterLight.setted) {
        this.lights.characterLight.includedOnlyMeshes.push(this.map.tilemap.terrain);
        this.lights.characterLight.setted = true;
      }

      if (this.lights.baseLight && this.map?.tilemap?.terrain && !this.lights.baseLight.setted) {
        this.lights.baseLight.excludedMeshes.push(this.map.tilemap.terrain);
        this.lights.baseLight.setted = true;

        this.lights.fogLight.includedOnlyMeshes.push(this.map.tilemap.terrain);
      }

      if (this.lights.secondLight && this.map?.tilemap?.terrain && !this.lights.secondLight.setted) {
        this.lights.secondLight.excludedMeshes.push(this.map.tilemap.terrain);
        this.lights.secondLight.setted = true;

        this.lights.fogLight.includedOnlyMeshes.push(this.map.tilemap.terrain);
      }
      this.updateFogOfWar();
    });
  }

  updateShadows() {
    setTimeout(() => {
      try {
        for (let wall in this.map.walls) {
          if (this.map.walls[wall].size != 'collider')
            this.lights.characterLight._shadowGenerator.addShadowCaster(this.map.walls[wall].mesh);
        }
        for (let character in this.map.characters) {
          this.lights.baseLight._shadowGenerator.addShadowCaster(this.map.characters[character].mesh);
        }
      } catch (err) { }
    });
  }

  updateWalls() {
    setTimeout(() => {
      if (this.map) {
        var user = this.users[this.parameters.token];
        for (let wall in this.map?.walls) {
          this.map.walls[wall].mesh.isPickable = user.wallsPickable;
          this.map.walls[wall].mesh.visibility = user.wallsVisibility;
        }
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
      if (this.map) {
        var user = this.users[this.parameters.token];
        if (user.tilemapShowGrid)
          this.map.tilemap.ground.material = this.map.tilemap.gridMaterial;
        else
          this.map.tilemap.ground.material = new ShadowOnlyMaterial('shadowOnly', this.parameters.scene);
      }
    });
  }

  updateCharactersVisibility(character?) {
    var selectedCharacter = this.users[this.parameters.token]?.selectedCharacter;
    if (selectedCharacter && this.map?.characters[selectedCharacter]?.mesh) {
      setTimeout(() => {
        if (this.map) {
          this.map.characters[selectedCharacter].animator.resetVisibility();
          // this.map.characters[selectedCharacter].visionRays.forEach(visionRay => {
          //   visionRay?.dispose();
          // });
          this.map.characters[selectedCharacter].collider.isCollible = false;
          if (!character || character == selectedCharacter) {
            for (let character in this.map.characters) {
              this._updateCharacterVisibility(character, selectedCharacter)
            }
          } else {
            this._updateCharacterVisibility(character, selectedCharacter)
          }
          this.map.characters[selectedCharacter].collider.isCollible = true;
          // this.characters[selectedCharacter]?.visibleCharacters?.forEach(characterMesh => {
          //   if (characterMesh) characterMesh.animator.resetVisibility();
          // });
        }
      }, this.map.characters[selectedCharacter].movementCooldown);
    } else {
      setTimeout(() => {
        if (this.map) {
          for (let character in this.map.characters) {
            if (this.map.characters[character].mesh) {
              this.map.characters[character].collider.isPickable = true;
              this.map.characters[character].animator.resetVisibility();
            }
          }
        }
      });
    }
  }

  _updateCharacterVisibility(character, selectedCharacter) {
    if (this.map.characters[character] && this.map.characters[character].mesh &&
      character != selectedCharacter &&
      (!this.map.characters[character].addingMode || this.users[this.parameters.token]?.addingModeCharacter != character)) {
      this.map.characters[character].collider.isPickable = true;
      var origin = new BABYLON.Vector3(this.map.characters[selectedCharacter].mesh.position.x, this.map.characters[selectedCharacter].mesh.position.y + 1.65 * this.map.characters[selectedCharacter].height, this.map.characters[selectedCharacter].mesh.position.z);
      var target = BABYLON.Vector3.Normalize(new BABYLON.Vector3(this.map.characters[character].mesh.position.x, this.map.characters[character].mesh.position.y + 1.65 * this.map.characters[character].height, this.map.characters[character].mesh.position.z).subtract(origin));
      var ray = new BABYLON.Ray(
        origin,
        target,
        this.map.characters[selectedCharacter].visionRange - 1
      );
      // this.map.characters[selectedCharacter].visionRays.push(BABYLON.RayHelper.CreateAndShow(ray, this.parameters.scene, new BABYLON.Color3(1, 1, 0.1)));
      var pickedMesh = this.parameters.scene.pickWithRay(ray, (mesh) => {
        return mesh.isCollible && (!mesh.isCharacter || mesh.name == this.map.characters[character].id)
      })?.pickedMesh;
      if (pickedMesh && this.map.characters[character].id == pickedMesh.name)
        this.map.characters[character].animator.resetVisibility();
      else {
        this.map.characters[character].animator.visibility(0);
        this.map.characters[character].collider.isPickable = false;
      }
    }
  }
}
