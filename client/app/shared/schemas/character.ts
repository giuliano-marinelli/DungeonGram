import * as BABYLON from '@babylonjs/core/Legacy/legacy';
import { Path } from './path';
import { Point } from './point';
import { Wear } from './wear';
import { Schema } from './schema';
import { Animator } from '../utils/animator';
import { Vectors } from '../utils/vectors';
import "@babylonjs/loaders/glTF/2.0/glTFLoader";
import { AdvancedDynamicTexture, Rectangle, TextBlock, TextWrapping } from '@babylonjs/gui';

export class Character extends Schema {
  //schema
  id?: string;
  modelId?: string;
  map?: string;
  x?: number;
  y?: number;
  z?: number = 0.05;
  direction?: Point;
  animation?: string;
  movementPath?: Path;
  movementCooldown?: number;
  beignDragged?: boolean;
  visionRange?: number;
  wears?: Wear[];
  height?: number;
  addingMode?: boolean;
  name?: string;
  description?: string;
  group?: string;
  portrait?: string;
  //game objects
  mesh?: any;
  wearsMeshes?: any = {};
  selectionMesh?: any;
  selectionMeshZ?: number = 0;
  collider?: any;
  animator?: any;
  visionLight?: any;
  visionRays?: any = [];
  visibleCharacters?: any = [];
  uiSigns?: any;
  nameSign?: any;
  nameSignText?: any;
  //physics
  xPhysics?: number;
  yPhysics?: number;
  isCollidingPhysics?: boolean;
  colliderPhysics?: any;

  constructor(schema, parameters) {
    super(parameters);

    this.id = parameters.id;

    this.synchronizeSchema(schema,
      {
        direction: { type: Point, datatype: Object },
        movementPath: {
          type: Path, datatype: Object, parameters: () => {
            return {
              world: parameters.world,
              scene: parameters.scene,
              room: parameters.room,
              token: parameters.token,
              character: this,
              characterId: this.id
            }
          }
        },
        wears: { type: Wear, datatype: Array, parameters: (key) => { return { id: key } } }
      }
    );
  }

  update(changes?) {
    // console.log("characterChanges", changes);
    // changes?.forEach((change) => {
    //   switch (change.field) {
    //     case 'destroy':
    //       console.log("characterDestroy", change.value);
    //       break;
    //   }
    // });

    changes?.forEach((change) => {
      switch (change.field) {
        case 'map':
          this.doMesh();
          break;
        case 'x':
          if (!this.beignDragged && (!this.animation || this.animation == 'None')) this.animator?.play('Run');
          BABYLON.Animation.CreateAndStartAnimation("moveX", this.mesh, "position.x",
            100, this.movementCooldown / 10, this.mesh?.position.x, this.x,
            BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT, null, () => {
              if (!this.movementPath.to && !this.beignDragged)
                if (!this.animation || this.animation == 'None') this.animator?.play('Idle');
            });
          break;
        case 'y':
          if (!this.beignDragged && (!this.animation || this.animation == 'None')) this.animator?.play('Run');
          BABYLON.Animation.CreateAndStartAnimation("moveZ", this.mesh, "position.z",
            100, this.movementCooldown / 10, this.mesh?.position.z, this.y,
            BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT, null, () => {
              if (!this.movementPath.to && !this.beignDragged)
                if (!this.animation || this.animation == 'None') this.animator?.play('Idle');
            });
          break;
        case 'direction':
          this.animator?.rotate(this.direction);
          break;
        case 'animation':
          this.initAnimation();
          break;
        case 'beignDragged':
          this.initBeignDragged();
          break;
        case 'visionRange':
          if (this.visionLight) this.visionLight.range = this.visionRange;
          break;
        case 'xPhysics':
          if (this.colliderPhysics) this.colliderPhysics.position.x = this.xPhysics;
          break;
        case 'yPhysics':
          if (this.colliderPhysics) this.colliderPhysics.position.z = this.yPhysics;
          break;
        case 'isCollidingPhysics':
          if (this.colliderPhysics)
            this.colliderPhysics.material.diffuseColor = this.isCollidingPhysics ? BABYLON.Color3.Red() : BABYLON.Color3.Gray()
          if (this.isCollidingPhysics && !this.beignDragged) {
            // this.animator?.play('Idle');
          }
          break;
        case 'wears':
          this.doWears();
          break;
        case 'height':
          if (this.mesh) this.mesh.scaling.y = this.height;
          break;
        case 'addingMode':
          this.initAddingMode();
          break;
        case 'name':
          if (this.nameSignText) this.nameSignText.text = this.name;
          break;
      }
    });

    this.parameters.world.updateCharactersVisibility(this.id);
    if (this.parameters.world.users[this.parameters.token].selectedCharacter != null) {
      this.initSelection();
    }
  }

  remove() {
    super.remove();
    this.removeMesh();
  }

  removeMesh() {
    this.detachSelection();
    this.removeSigns();
    this.mesh?.dispose();
    this.collider?.dispose();
    this.colliderPhysics?.dispose();
    this.selectionMesh?.dispose();
    this.mesh = null;
    this.collider = null;
    this.colliderPhysics = null;
    this.selectionMesh = null;
  }

  removeSigns() {
    this.uiSigns?.dispose();
    this.nameSign?.dispose();
    this.nameSignText?.dispose();
    this.uiSigns = null;
    this.nameSign = null;
    this.nameSignText = null;
  }

  doMesh() {
    setTimeout(() => {
      if (!this.mesh && this.map && this.parameters.world.map && this.parameters.world.map?.mapId == this.map) {
        //  BABYLON.SceneLoader.ImportMesh('', "assets/meshes/base/", "base.babylon", this.parameters.scene, (meshes, particleSystems, skeletons, animationsGroups) => {
        // this.mesh = meshes[0];
        this.mesh = this.parameters.assets.base.clone();
        this.mesh.skeleton = this.parameters.assets.base.skeleton.clone();
        // this.mesh.setEnabled(true);
        this.mesh.name = this.id;

        //scaling mesh by height
        this.mesh.scaling.y = this.height;

        //positioning mesh
        this.mesh.position.y = this.z;
        this.mesh.position.x = this.x;
        this.mesh.position.z = this.y;
        this.mesh.isPickable = false;

        //set mesh material
        var material = new BABYLON.StandardMaterial(this.id + "Material", this.parameters.scene);
        this.mesh.material = material;

        //set collider mesh
        this.collider = BABYLON.MeshBuilder.CreateCylinder('', { height: 1.5, diameter: 0.5 }, this.parameters.scene);
        this.collider.parent = this.mesh;
        this.collider.name = this.id;
        this.collider.position.y = 1;
        this.collider.visibility = 0;
        this.collider.isCollible = true;
        this.collider.isCharacter = true;

        //set collider phyics mesh
        this.colliderPhysics = BABYLON.MeshBuilder.CreateBox('', { height: 2, width: 0.9, depth: 0.9 }, this.parameters.scene);
        this.colliderPhysics.name = this.id + "-physics";
        this.colliderPhysics.position.y = 0.95;
        this.colliderPhysics.position.x = this.xPhysics;
        this.colliderPhysics.position.z = this.yPhysics;
        this.colliderPhysics.visibility = 0;
        this.colliderPhysics.isPickable = false;
        this.colliderPhysics.material = new BABYLON.StandardMaterial("colliderPhysicsMaterial", this.parameters.scene);

        //set selection mesh
        this.selectionMesh = BABYLON.MeshBuilder.CreateCylinder('', { height: 0.05, diameter: 1.75 }, this.parameters.scene);
        this.selectionMesh.parent = this.mesh;
        this.selectionMesh.name = this.id + "-selection";
        this.selectionMesh.position.y = this.selectionMeshZ;
        this.selectionMesh.visibility = 0;
        this.selectionMesh.isPickable = false;
        var selectionMeshMaterial = new BABYLON.StandardMaterial("wall", this.parameters.scene);
        selectionMeshMaterial.diffuseTexture = new BABYLON.Texture("assets/images/game/selection_circle.png", this.parameters.scene);
        selectionMeshMaterial.diffuseTexture.hasAlpha = true;
        selectionMeshMaterial.useAlphaFromDiffuseTexture = true;
        selectionMeshMaterial.alpha = 0.5;
        this.selectionMesh.material = selectionMeshMaterial;

        //create the animator to manage the transition between animations
        this.animator = new Animator(this.mesh, this.mesh.skeleton, { actual: 'Idle' });

        //adjust start direction
        this.animator.rotate(this.direction);

        //create the wears meshes and parent to character mesh
        this.doWears();

        if (!this.addingMode) this.doSigns();

        this.initActions();

        //cast shadows with base light
        this.parameters.world.lights.baseLight._shadowGenerator.addShadowCaster(this.mesh);

        this.initSelection();

        this.initAddingMode();

        this.initBeignDragged();

        setTimeout(() => {
          this.initAnimation();
        }, 2000);

        this.update();
      } else if (!this.map || !this.parameters.world.map || this.parameters.world.map?.mapId != this.map) {
        this.removeMesh();
      }
    }, 100);
  }

  doWears() {
    if (this.mesh && this.animator) {
      for (let wearMeshId in this.wearsMeshes) {
        if (!this.wears[wearMeshId]) {
          this.animator.unparent(this.wearsMeshes[wearMeshId]);
          this.wearsMeshes[wearMeshId].dispose();
          delete this.wearsMeshes[wearMeshId];
        }
      }
      for (let wearId in this.wears) {
        if (this.wears[wearId].category != "skin") {
          if (this.wearsMeshes[wearId]) {
            this.animator.unparent(this.wearsMeshes[wearId]);
            this.wearsMeshes[wearId].dispose();
          }

          setTimeout(() => {
            // BABYLON.SceneLoader.ImportMesh("", "assets/meshes/wear/" + this.wears[wearId].category + "/" + this.wears[wearId].subcategory + "/", this.wears[wearId].name + ".babylon", this.parameters.scene, (meshes, particleSystems, skeletons, animationsGroups) => {
            // this.wearsMeshes[wearId] = meshes[0];
            this.wearsMeshes[wearId] = this.parameters.assets[this.wears[wearId].category][this.wears[wearId].subcategory][this.wears[wearId].name].clone();
            // this.wearsMeshes[wearId].setEnabled(true);
            var material = new BABYLON.StandardMaterial(this.id + '-' + wearId + "Material", this.parameters.scene);
            material.diffuseColor = BABYLON.Color3.FromHexString(this.wears[wearId].color);
            this.wearsMeshes[wearId].material = material;
            this.animator.parent(this.wearsMeshes[wearId]);
          });
        } else if (this.mesh.material) {
          this.mesh.material.diffuseColor = BABYLON.Color3.FromHexString(this.wears[wearId].color);
        }
      }
    }
  }

  doSigns() {
    this.uiSigns = AdvancedDynamicTexture.CreateFullscreenUI("UI");

    this.nameSign = new Rectangle();
    this.nameSign.adaptWidthToChildren = true;
    this.nameSign.adaptHeightToChildren = true;
    // this.nameSign.width = "100px";
    // this.nameSign.height = "40px";
    this.nameSign.cornerRadius = 5;
    this.nameSign.color = "White";
    this.nameSign.thickness = 0;
    this.nameSign.background = "Black";
    this.nameSign.linkOffsetY = -55;
    this.uiSigns.addControl(this.nameSign);
    // this.nameSign.linkWithMesh(this.mesh);

    this.nameSignText = new TextBlock();
    this.nameSignText.text = this.name;
    this.nameSignText.fontFamily = "Helvetica";
    this.nameSignText.fontSize = 14;
    this.nameSignText.width = "80px";
    this.nameSignText.height = "30px";
    this.nameSignText.textWrapping = TextWrapping.WordWrap;
    this.nameSignText.resizeToFit = true;
    this.nameSign.addControl(this.nameSignText);

    this.animator.parentUI(this.nameSign, 0.8, 0.2);
  }

  initActions() {
    //set action on mouse in/out/click
    this.collider.actionManager = new BABYLON.ActionManager(this.parameters.scene);
    this.collider.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickUpTrigger, (e) => {
      if (e.sourceEvent.button == 0 && e.sourceEvent.ctrlKey && !this.parameters.controller.activeTool) {
        console.log('Character', this.id, ': (', this.x, ',', this.y, ')', this);
        this.parameters.controller.send('game', 'character', { id: this.id, action: 'select' });
      }
    }));
    this.collider.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickDownTrigger, (e) => {
      if (e.sourceEvent.button == 0 && !e.sourceEvent.ctrlKey && !this.parameters.controller.activeTool) {
        this.parameters.controller.toggleAction('dragCharacter', true);
        this.parameters.controller.send('game', 'character', { id: this.id, action: 'drag' });
        var drag = () => {
          var pick = this.parameters.scene.pick(this.parameters.scene.pointerX, this.parameters.scene.pointerY, (mesh) => { return !mesh.isDragged && mesh.isPickable });
          if (pick?.pickedPoint) {
            this.parameters.controller.send('game', 'character', { id: this.id, x: pick.pickedPoint.x, y: pick.pickedPoint.z, action: 'drag' });
          }
        }
        var drop = (e) => {
          this.parameters.controller.send('game', 'character', { id: this.id, snapToGrid: !e.altKey, action: 'drop' });
          this.parameters.canvas.removeEventListener("pointerup", drop, false);
          this.parameters.canvas.removeEventListener("pointermove", drag, false);
          setTimeout(() => {
            this.parameters.controller.toggleAction('dragCharacter', false);
          }, 10);
        };
        this.parameters.canvas.addEventListener("pointermove", drag, false);
        this.parameters.canvas.addEventListener("pointerup", drop, false);
      }
    }));
    if (!this.addingMode) {
      this.collider.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOverTrigger, (e) => {
        this.parameters.world.lights.highlightCharacter.addMesh(this.mesh, BABYLON.Color3.Black(), true);
        this.animator.toggleUI(this.nameSign, true);
      }));
      this.collider.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOutTrigger, (e) => {
        this.parameters.world.lights.highlightCharacter.removeMesh(this.mesh);
        this.animator.toggleUI(this.nameSign, false);
      }));
    }
  }

  initSelection() {
    //add vision light
    if (this.id == this.parameters.world.users[this.parameters.token].selectedCharacter) {
      if (!this.visionLight && this.mesh && this.parameters.world.lights.characterLight) {
        //attach character light to this mesh
        this.visionLight = this.parameters.world.lights.characterLight;
        this.visionLight.range = this.visionRange;
        this.visionLight.parent = this.mesh;
        this.visionLight.intensity = 100;
        //show selection mesh
        // this.selectionMesh.intensity = 1;
        this.selectionMesh.visibility = 1;
        this.selectionMesh.position.y = this.selectionMeshZ;
        // this.parameters.world.lights.highlightCharacter.addMesh(this.selectionMesh, BABYLON.Color3.Black(), true);
        // this.parameters.world.lights.highlightCharacter.addMesh(this.mesh, BABYLON.Color3.Black(), true);
      }
    } else {
      this.detachSelection();
    }
  }

  detachSelection() {
    if (this.visionLight) {
      //dettach character light to this mesh
      this.visionLight.intensity = 0;
      this.visionLight.parent = null;
      this.visionLight = null;
      //hide selection mesh
      // this.selectionMesh.intensity = 0;
      this.selectionMesh.visibility = 0;
      // this.parameters.world.lights.highlightCharacter.removeMesh(this.selectionMesh);
      // this.parameters.world.lights.highlightCharacter.removeMesh(this.mesh);
      setTimeout(() => {
        this.parameters.world.updateCharactersVisibility(this.id);
      });
    }
  }

  initAddingMode() {
    if (this.addingMode) {
      if (this.animator) {
        this.animator.defaultVisibility = 0.5;
        this.animator.show();
      }
    }
  }

  initBeignDragged() {
    if (this.beignDragged) {
      if (!this.animation || this.animation == 'None') this.animator?.play('Float');
      if (this.collider) this.collider.isDragged = true;
      BABYLON.Animation.CreateAndStartAnimation("moveY", this.mesh, "position.y",
        10, 1, this.mesh?.position.y, 0.5, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
      BABYLON.Animation.CreateAndStartAnimation("moveYSelection", this.selectionMesh, "position.y",
        10, 1, this.selectionMesh?.position.y, -0.45, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
    } else {
      if (!this.animation || this.animation == 'None') this.animator?.play('Idle');
      if (this.collider) this.collider.isDragged = false;
      BABYLON.Animation.CreateAndStartAnimation("moveY", this.mesh, "position.y",
        10, 1, this.mesh?.position.y, this.z, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
      BABYLON.Animation.CreateAndStartAnimation("moveYSelection", this.selectionMesh, "position.y",
        10, 1, this.selectionMesh?.position.y, this.selectionMeshZ, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
    }
  }

  initAnimation() {
    var scaling = 1;
    var loop = true;
    switch (this.animation) {
      case 'Sleep':
        this.z = -this.height;
        this.selectionMeshZ = 1;
        scaling = this.height;
        break;
      case 'Die': case 'Die.001':
        this.z = -0.05;
        this.selectionMeshZ = 0;
        loop = false;
        break;
      default:
        this.z = -0.05;
        this.selectionMeshZ = 0;
        break;
    }
    if (!this.beignDragged) {
      if (this.animation && this.animation != 'None') this.animator?.play(this.animation, loop);
      else this.animator?.play('Idle');
      if (this.mesh) {
        this.mesh.position.y = this.z;
        this.selectionMesh.position.y = this.selectionMeshZ;
        this.mesh.scaling.x = scaling;
        this.mesh.scaling.z = scaling;
      }
    }
  }

  //for testing purposes
  doVisionRays() {
    if (this.id == this.parameters.token) {
      this.visionRays.forEach(visionRay => {
        visionRay.dispose();
      });
      this.visibleCharacters = [];
      var raysPoints = Vectors.getRadiusPoints({ x: 0, y: 0 }, 64);
      raysPoints.forEach(rayPoint => {
        var ray = new BABYLON.Ray(new BABYLON.Vector3(this.x, 1, this.y), new BABYLON.Vector3(rayPoint.x, 0, rayPoint.y), this.visionRange);
        // this.visionRays.push(BABYLON.RayHelper.CreateAndShow(ray, this.parameters.scene, new BABYLON.Color3(1, 1, 0.1)));
        var pickedMesh = this.parameters.scene.pickWithRay(ray)?.pickedMesh;
        if (pickedMesh?.name.indexOf('character') != -1)
          this.visibleCharacters.push(pickedMesh);
      });
    }

    this.parameters.world.updateCharactersVisibility();
  }
}
