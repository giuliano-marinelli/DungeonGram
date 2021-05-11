import * as BABYLON from '@babylonjs/core/Legacy/legacy';
import { Schema } from './schema';
import { User } from './user';
import { Map } from './map';
import { Character } from './character';
import {
  ShadowOnlyMaterial
} from '@babylonjs/materials';
import { Vectors } from '../utils/vectors';
import { AdvancedDynamicTexture } from '@babylonjs/gui';
import { Camera } from '../utils/camera';
import { Color3, Vector3 } from '@babylonjs/core/Legacy/legacy';
import earcut from "earcut";

export class World extends Schema {
  //schema
  campaignId?: string;
  users?: User[];
  characters?: Character[];
  map?: Map;
  fogOfWarVisibilityPlayers?: number;
  maxVisionCharacters?: number;
  publicSelectedCharacter?: string;
  //game objects
  camera?: any;
  lights?: any = {};
  ui?: any;
  fieldOfView?: any;
  //test (activate physics colliders and other testing elements)
  test?: boolean = false;

  constructor(schema, parameters) {
    super(parameters);

    this.test = parameters.test;

    this.initCamera();

    this.initGlobalLights();

    this.initUI();

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
        case 'maxVisionCharacters':
          this.updateCharactersVisibility();
          this.parameters.controller.updateSetting('maxVisionCharacters', this.maxVisionCharacters);
          var selectedCharacter = this.users[this.parameters.token]?.selectedCharacter;
          if (this.characters[selectedCharacter] && this.lights.characterLight) this.lights.characterLight.range = this.adjustVisionRange(this.characters[selectedCharacter].visionRange);
          break;
        case 'publicSelectedCharacter':
          this.parameters.controller.updateSetting('publicSelectedCharacter', this.publicSelectedCharacter);
          break;
      }
    });
  }

  initCamera() {
    //set panning as the default camera movement
    Camera.PanningAsDefaultCameraInput();

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
    //add camera inputs for move it with WASD
    this.camera.inputs.attached.keyboard.keysUp.push(87);
    this.camera.inputs.attached.keyboard.keysDown.push(83);
    this.camera.inputs.attached.keyboard.keysLeft.push(65);
    this.camera.inputs.attached.keyboard.keysRight.push(68);
    // Camera.AddPanningCamera(this.camera);

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

    //update the 2D characters material by the character direction and camera position
    // this.camera.onViewMatrixChangedObservable.add(() => {
    //   for (let character in this.characters) {
    //     if (this.characters[character].mode2D && this.characters[character].visualMesh) {
    //       this.characters[character].updateMaterial();
    //     }
    //   }
    // });
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
    this.parameters.scene.clearColor = new BABYLON.Color3(0, 0, 0);
  }

  initUI() {
    this.ui = AdvancedDynamicTexture.CreateFullscreenUI("UI");
  }

  adjustVisionRange(visionRange) {
    return !this.maxVisionCharacters || visionRange < this.maxVisionCharacters ? visionRange : this.maxVisionCharacters;
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
        if (this.map.tilemap?.ground) {
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
        var user = this.users[this.parameters.token];
        //update walls and doors pickable
        for (let wall in this.map?.walls) {
          this.map.walls[wall].mesh.isPickable = user.wallsPickable;
        }
        for (let door in this.map?.doors) {
          this.map.doors[door].mesh.isPickable = user.wallsPickable;
        }
        //update walls visibility
        this.parameters.assets.wallMaterial.alpha = user.wallsVisibility;
        //update doors visibility
        if (!this.users[this.parameters.token].wallsPickable) this.updateCharactersVisibility();
      }
    });
  }

  updateWallVisibility() {
    var user = this.users[this.parameters.token];
    //update walls visibility
    this.parameters.assets.wallMaterial.alpha = user.wallsVisibility;
  }

  updateCharactersVisibility(character?) {
    var selectedCharacter = this.users[this.parameters.token]?.selectedCharacter;
    if (selectedCharacter && this.characters[selectedCharacter]?.mesh && this.characters[selectedCharacter]?.collider) {
      setTimeout(() => {
        if (this.map) {
          //for testing
          if (this.test) this.characters[selectedCharacter].removeVisionRays();

          this.characters[selectedCharacter].animator.show();
          this.characters[selectedCharacter].collider.isCollible = false;
          if (!character || character == selectedCharacter) {
            for (let character in this.characters) {
              this.updateCharacterVisibility(character, selectedCharacter);
            }
            for (let door in this.map.doors) {
              this.updateDoorVisibility(door, selectedCharacter);
            }
          } else {
            this.updateCharacterVisibility(character, selectedCharacter);
          }
          this.characters[selectedCharacter].collider.isCollible = true;
          // this.characters[selectedCharacter]?.visibleCharacters?.forEach(characterMesh => {
          //   if (characterMesh) characterMesh.animator.show();
          // });

          // this.getFieldOfView(32);
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
                this.map.doors[door].mesh.isPickable = true;
                this.map.doors[door].animator.show();
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
                this.map.doors[door].mesh.isPickable = false;
                this.map.doors[door].animator.hide(true);
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
      var canSeeIt = false;
      var distX = Math.abs(this.characters[character].x - this.characters[selectedCharacter].x);
      var distY = Math.abs(this.characters[character].y - this.characters[selectedCharacter].y);
      if (distX <= this.adjustVisionRange(this.characters[selectedCharacter].visionRange)
        && distY <= this.adjustVisionRange(this.characters[selectedCharacter].visionRange)) {
        this.characters[character].collider.isPickable = true;
        var origin = new BABYLON.Vector3(this.characters[selectedCharacter].mesh.position.x, this.characters[selectedCharacter].height * 2 - 0.1, this.characters[selectedCharacter].mesh.position.z);
        var target = BABYLON.Vector3.Normalize(new BABYLON.Vector3(this.characters[character].mesh.position.x, this.characters[character].height * 2 - 0.1, this.characters[character].mesh.position.z).subtract(origin));
        var ray = new BABYLON.Ray(
          origin,
          target,
          this.adjustVisionRange(this.characters[selectedCharacter].visionRange) - 1
        );
        var pickedMesh = this.parameters.scene.pickWithRay(ray, (mesh) => {
          return mesh.isCollible && !mesh.isTranspasable && (!mesh.isCharacter || mesh.name == this.characters[character].id)
        })?.pickedMesh;

        canSeeIt = (pickedMesh && this.characters[character].id == pickedMesh.name)
          && (!this.characters[character].hidden || this.users[this.parameters.token]?.isDM);
      }

      if (canSeeIt)
        this.characters[character].animator.show();
      else {
        this.characters[character].animator.hide(this.characters[character].hidden, false);
        this.characters[character].collider.isPickable = false;
      }

      //for testing
      if (this.test) this.characters[selectedCharacter].visionRays.push(BABYLON.RayHelper.CreateAndShow(ray, this.parameters.scene, BABYLON.Color3.Blue()));
    }
  }

  updateDoorVisibility(door, selectedCharacter) {
    if (this.map.doors[door] && this.map.doors[door].mesh) {
      var canSeeIt = false;
      var distX = Math.min(
        Math.abs(this.map.doors[door].from.x - this.characters[selectedCharacter].x),
        Math.abs(this.map.doors[door].to.x - this.characters[selectedCharacter].x)
      );
      var distY = Math.min(
        Math.abs(this.map.doors[door].from.y - this.characters[selectedCharacter].y),
        Math.abs(this.map.doors[door].to.y - this.characters[selectedCharacter].y),
      );
      if (distX <= this.adjustVisionRange(this.characters[selectedCharacter].visionRange)
        && distY <= this.adjustVisionRange(this.characters[selectedCharacter].visionRange)) {
        this.map.doors[door].collider.isPickable = true;
        var origin = new BABYLON.Vector3(this.characters[selectedCharacter].mesh.position.x, this.characters[selectedCharacter].height * 2 - 0.1, this.characters[selectedCharacter].mesh.position.z);
        var middlePoint = Vectors.middlePoint(this.map.doors[door].from, this.map.doors[door].to);
        var target = BABYLON.Vector3.Normalize(new BABYLON.Vector3(middlePoint.x, this.map.doors[door].height - 0.1, middlePoint.y).subtract(origin));
        var ray = new BABYLON.Ray(
          origin,
          target,
          this.adjustVisionRange(this.characters[selectedCharacter].visionRange) - 1
        );
        var pickedMesh = this.parameters.scene.pickWithRay(ray, (mesh) => {
          return (mesh.isCollible || mesh.isTranspasable) && ((!mesh.isCharacter && !mesh.isDoor) || mesh.name == this.map.doors[door].id)
        })?.pickedMesh;
        var distanceToDoor = Vectors.distance({ x: this.characters[selectedCharacter].mesh.position.x, y: this.characters[selectedCharacter].mesh.position.z }, { x: this.map.doors[door].to.x, y: this.map.doors[door].to.y });

        canSeeIt = ((pickedMesh && this.map.doors[door].id == pickedMesh.name) || distanceToDoor < 3)
          && (!this.map.doors[door].hidden || this.users[this.parameters.token]?.isDM);
      }
      if (canSeeIt) {
        this.map.doors[door].animator.show();
        if (distanceToDoor <= 3) {
          this.map.doors[door].mesh.isPickable = true;
        } else if (this.parameters.controller.activeTool?.name != 'walls') {
          this.map.doors[door].mesh.isPickable = false;
        }
      } else {
        this.map.doors[door].animator.hide(true, false);
        if (this.parameters.controller.activeTool?.name != 'walls') this.map.doors[door].mesh.isPickable = false;
      }
      this.map.doors[door].collider.isPickable = false;

      //for testing
      if (this.test) this.characters[selectedCharacter].visionRays.push(BABYLON.RayHelper.CreateAndShow(ray, this.parameters.scene, BABYLON.Color3.Green()));
    }
  }

  getFieldOfView(precision?) {
    var selectedCharacter = this.users[this.parameters.token]?.selectedCharacter;
    if (selectedCharacter && this.characters[selectedCharacter]?.mesh && this.characters[selectedCharacter]?.collider) {
      precision = precision ? precision : 20;
      var points = [];
      var points2 = [];
      var triangles = [];
      var origin = new BABYLON.Vector3(this.characters[selectedCharacter].mesh.position.x, this.characters[selectedCharacter].height * 2 - 0.1, this.characters[selectedCharacter].mesh.position.z);
      for (var i = 0; i < precision; i++) {
        //create ray in one direction per precision
        var ray = new BABYLON.Ray(origin,
          Vectors.angleToDirection(((Math.PI * 2) / precision) * i),
          this.adjustVisionRange(this.characters[selectedCharacter].visionRange) - 1
        );

        //get picking info
        var pickingInfo = this.parameters.scene.pickWithRay(ray, (mesh) => {
          return mesh.isCollible && mesh.isWall && !mesh.isTranspasable
        });

        //add point
        // var newPoint = pickingInfo.pickedPoint
        //   ? pickingInfo.pickedPoint.subtract(origin)
        //   : new BABYLON.Vector3(ray.direction.x * ray.length, ray.direction.y * ray.length, ray.direction.z * ray.length);
        var newPoint = pickingInfo.pickedPoint
          ? new BABYLON.Vector2(pickingInfo.pickedPoint.subtract(origin).x, pickingInfo.pickedPoint.subtract(origin).z)
          : new BABYLON.Vector2(ray.direction.x * ray.length, ray.direction.z * ray.length)
        points.push(newPoint);
        // if (i < precision / 2) points.push(newPoint);
        // else points2.unshift(newPoint);

        // if (i > 0) {
        //   triangles.push()
        // }

        //for testing
        if (this.test) {
          if (pickingInfo.pickedPoint) ray.length = Vector3.Distance(origin, pickingInfo.pickedPoint);
          this.characters[selectedCharacter].visionRays.push(BABYLON.RayHelper.CreateAndShow(ray, this.parameters.scene,
            i >= 2 ? BABYLON.Color3.Blue() : (i == 0 ? BABYLON.Color3.Red() : BABYLON.Color3.Purple())
          ));
        }
      }
      // points.push(points[0].clone());

      var polygonBuilder = new BABYLON.PolygonMeshBuilder("fieldOfView", points, this.parameters.scene, earcut)
      if (this.fieldOfView) this.fieldOfView.dispose();
      this.fieldOfView = polygonBuilder.build();
      this.fieldOfView.isPickable = false;
      this.fieldOfView.position = origin;
      this.fieldOfView.position.y = 0.2;
      this.fieldOfView.material = new BABYLON.StandardMaterial("fieldOfViewMaterial", this.parameters.scene);
      this.fieldOfView.material.wireframe = true;
    }
  }
}
