import * as BABYLON from '@babylonjs/core/Legacy/legacy';
import { Path } from './path';
import { Point } from './point';
import { Wear } from './wear';
import { Schema } from './schema';
import { Animator } from '../utils/animator';
import { Vectors } from '../utils/vectors';
import "@babylonjs/loaders/glTF/2.0/glTFLoader";
import { Image, Rectangle, TextBlock, TextWrapping } from '@babylonjs/gui';

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
  stealth?: boolean;
  hidden?: boolean;
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
  nameSign?: any;
  nameSignText?: any;
  hiddenSign?: any;
  //physics
  xPhysics?: number;
  yPhysics?: number;
  isCollidingPhysics?: boolean;
  colliderPhysics?: any;
  //test
  visionRays?: any = [];
  //global actions registered
  actions: any = {};

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
              assets: parameters.assets,
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
    changes?.forEach((change) => {
      switch (change.field) {
        case 'map':
          this.doMesh();
          break;
        case 'x':
          if (!this.beignDragged && (!this.animation || this.animation == 'None')) this.animator?.playMove();
          BABYLON.Animation.CreateAndStartAnimation("moveX", this.mesh, "position.x",
            100, this.movementCooldown / 10, this.mesh?.position.x, this.x,
            BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT, null, () => {
              if (!this.movementPath.to && !this.beignDragged)
                if (!this.animation || this.animation == 'None') this.animator?.playIdle();
            });
          break;
        case 'y':
          if (!this.beignDragged && (!this.animation || this.animation == 'None')) this.animator?.playMove();
          BABYLON.Animation.CreateAndStartAnimation("moveZ", this.mesh, "position.z",
            100, this.movementCooldown / 10, this.mesh?.position.z, this.y,
            BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT, null, () => {
              if (!this.movementPath.to && !this.beignDragged)
                if (!this.animation || this.animation == 'None') this.animator?.playIdle();
            });
          break;
        case 'direction':
          this.animator?.rotate(this.direction);
          break;
        case 'animation':
          this.initAnimation();
          break;
        case 'stealth':
          this.initStealth();
          break;
        case 'hidden': {
          if (this.hiddenSign) this.animator.toggleUI(this.hiddenSign, this.hidden);
          this.parameters.world.updateCharactersVisibility();
        }
        case 'beignDragged':
          this.initBeignDragged();
          break;
        case 'visionRange':
          if (this.visionLight) this.visionLight.range = this.visionRange;
          break;
        case 'xPhysics':
          if (this.parameters.world.test) {
            if (this.colliderPhysics) this.colliderPhysics.position.x = this.xPhysics;
          }
          break;
        case 'yPhysics':
          if (this.parameters.world.test) {
            if (this.colliderPhysics) this.colliderPhysics.position.z = this.yPhysics;
          }
          break;
        case 'isCollidingPhysics':
          if (this.parameters.world.test) {
            if (this.colliderPhysics) {
              this.colliderPhysics.material.diffuseColor = this.isCollidingPhysics ? BABYLON.Color3.Red() : BABYLON.Color3.Gray();
            }
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
    this.removeActions();
    this.removeMesh();
  }

  removeActions() {
    Object.entries(this.actions)?.forEach(([key, value]) => {
      this.parameters.canvas?.removeEventListener("pointermove", value, false);
      this.parameters.canvas?.removeEventListener("pointerup", value, false);
    });
  }

  removeMesh() {
    this.detachSelection();
    this.removeSigns();
    this.mesh?.dispose();
    this.selectionMesh?.dispose();
    this.collider?.dispose();
    this.colliderPhysics?.dispose();
    this.mesh = null;
    this.selectionMesh = null;
    this.collider = null;
    this.colliderPhysics = null;
  }

  removeSigns() {
    this.nameSign?.dispose();
    this.nameSignText?.dispose();
    this.hiddenSign?.dispose();
    this.nameSign = null;
    this.nameSignText = null;
    this.hiddenSign = null;
  }

  removeVisionRays() {
    if (this.parameters.world.test) {
      this.visionRays?.forEach(visionRay => {
        visionRay.dispose();
      });
      this.visionRays = [];
    }
  }

  doMesh() {
    setTimeout(() => {
      if (!this.mesh && this.map && this.parameters.world.map && this.parameters.world.map?.mapId == this.map) {
        //set mesh
        this.mesh = this.parameters.assets.base.clone();
        this.mesh.skeleton = this.parameters.assets.base.skeleton.clone();
        this.mesh.material = this.parameters.assets.baseMaterial.clone();

        //scaling mesh by height
        this.mesh.scaling.y = this.height;

        //positioning mesh
        this.mesh.position.y = this.z;
        this.mesh.position.x = this.x;
        this.mesh.position.z = this.y;

        //set semantic data to the mesh
        this.mesh.name = this.id;
        this.mesh.isPickable = false;

        //set collider
        this.collider = this.parameters.assets.characterCollider.createInstance();
        this.collider.setEnabled(true);
        this.collider.position.y = 1;
        //parent collider to mesh
        this.collider.parent = this.mesh;
        //set semantic data to the collider
        this.collider.name = this.id;
        this.collider.isCollible = true;
        this.collider.isCharacter = true;

        //set selection mesh
        this.selectionMesh = this.parameters.assets.characterSelection.clone();
        this.selectionMesh.setEnabled(true);
        this.selectionMesh.position.y = this.selectionMeshZ;
        //parent selection mesh to mesh
        this.selectionMesh.parent = this.mesh;
        //set selection mesh visibility
        this.selectionMesh.visibility = 0;
        //set semantic data to the selection mesh
        this.selectionMesh.name = this.id + "-selection";
        this.selectionMesh.isPickable = false;

        //set collider phyics mesh (if testing)
        if (this.parameters.world.test) {
          this.colliderPhysics = this.parameters.assets.characterColliderPhysics.clone();
          this.colliderPhysics.material = this.parameters.assets.characterColliderPhysicsMaterial.clone();
          this.colliderPhysics.setEnabled(true);
          this.colliderPhysics.position.y = 0.95;
          this.colliderPhysics.position.x = this.xPhysics;
          this.colliderPhysics.position.z = this.yPhysics;
          //set semantic data to the collider
          this.colliderPhysics.name = this.id + "-physics";
          this.colliderPhysics.isPickable = false;
        }

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
          this.initStealth();
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
            this.wearsMeshes[wearId] = this.parameters.assets[this.wears[wearId].category][this.wears[wearId].subcategory][this.wears[wearId].name].clone();
            this.wearsMeshes[wearId].material = this.parameters.assets[this.wears[wearId].category][this.wears[wearId].subcategory][this.wears[wearId].name + 'Material'].clone();
            this.wearsMeshes[wearId].material.diffuseColor = BABYLON.Color3.FromHexString(this.wears[wearId].color);
            this.animator.parent(this.wearsMeshes[wearId]);
          });
        } else if (this.mesh.material) {
          this.mesh.material.diffuseColor = BABYLON.Color3.FromHexString(this.wears[wearId].color);
        }
      }
    }
  }

  doSigns() {
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
    this.parameters.world.ui.addControl(this.nameSign);
    // this.nameSign.linkWithMesh(this.mesh);

    this.nameSignText = new TextBlock();
    this.nameSignText.text = this.name ? this.name : "";
    this.nameSignText.fontFamily = "Helvetica";
    this.nameSignText.fontSize = 14;
    this.nameSignText.width = "80px";
    this.nameSignText.height = "30px";
    this.nameSignText.textWrapping = TextWrapping.WordWrap;
    this.nameSignText.resizeToFit = true;
    this.nameSign.addControl(this.nameSignText);

    this.animator.parentUI(this.nameSign, 0.8, 0.2);

    this.hiddenSign = new Image('hidden', 'assets/images/game/hidden.png');
    this.hiddenSign.width = "30px";
    this.hiddenSign.height = "30px";
    this.hiddenSign.linkOffsetY = -20;
    this.parameters.world.ui.addControl(this.hiddenSign);
    this.hiddenSign.linkWithMesh(this.mesh);

    this.animator.parentUI(this.hiddenSign, 1, 0);
    this.animator.toggleUI(this.hiddenSign, this.hidden);
  }

  initActions() {
    //set action on mouse in/out/click
    this.collider.actionManager = new BABYLON.ActionManager(this.parameters.scene);
    //add the actions when is not an adding mode character
    if (!this.addingMode) {
      //for drag, drop and lookAt (with shift + hold(click) on character) actions
      this.collider.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickDownTrigger, (e) => {
        if (e.sourceEvent.button == 0 && !e.sourceEvent.ctrlKey && !e.sourceEvent.altKey && !this.parameters.controller.activeTool) {
          var isShift = e.sourceEvent.shiftKey;
          this.parameters.controller.toggleAction('dragCharacter', true);
          if (!isShift) this.parameters.controller.send('game', 'character', { id: this.id, action: 'drag' });
          this.actions.drag = () => {
            var pick = this.parameters.scene.pick(this.parameters.scene.pointerX, this.parameters.scene.pointerY, (mesh) => { return !mesh.isDragged && mesh.isPickable });
            if (pick?.pickedPoint) {
              if (!isShift) this.parameters.controller.send('game', 'character', { id: this.id, x: pick.pickedPoint.x, y: pick.pickedPoint.z, action: 'drag' });
              else if (this.parameters.world.users[this.parameters.token].isDM)
                this.parameters.controller.send('game', 'character', { id: this.id, x: pick.pickedPoint.x, y: pick.pickedPoint.z, action: 'lookAt' });
            }
          }
          this.actions.drop = (e) => {
            if (!isShift) this.parameters.controller.send('game', 'character', { id: this.id, snapToGrid: !e.altKey, action: 'drop' });
            this.parameters.canvas.removeEventListener("pointerup", this.actions.drop, false);
            this.parameters.canvas.removeEventListener("pointermove", this.actions.drag, false);
            setTimeout(() => {
              this.parameters.controller.toggleAction('dragCharacter', false);
            }, 10);
          };
          this.parameters.canvas.addEventListener("pointermove", this.actions.drag, false);
          this.parameters.canvas.addEventListener("pointerup", this.actions.drop, false);
        }
      }));
      //for select and hide actions
      this.collider.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickUpTrigger, (e) => {
        if (e.sourceEvent.button == 0 && !this.parameters.controller.activeTool) {
          console.log('Character', this.id, ': (', this.x, ',', this.y, ')', this);
          if (e.sourceEvent.ctrlKey) {
            this.parameters.controller.send('game', 'character', { id: this.id, action: 'select' });
          } else if (e.sourceEvent.altKey) {
            this.parameters.controller.send('game', 'character', { id: this.id, hide: !this.hidden, action: 'hide' });
          }
        }
      }));
      //for show name sign and highlight the mesh
      this.collider.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOverTrigger, (e) => {
        this.parameters.world.lights.highlightCharacter.addMesh(this.mesh, BABYLON.Color3.Black(), true);
        this.animator.toggleUI(this.nameSign, true);
      }));
      //for blur name sign and hide highlight
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
        this.visionLight.range = this.parameters.world.adjustVisionRange(this.visionRange);
        this.visionLight.parent = this.mesh;
        this.visionLight.intensity = 100;
        //show selection mesh
        // this.selectionMesh.intensity = 1;
        this.selectionMesh.visibility = 1;
        this.selectionMesh.position.y = this.selectionMeshZ;
        // this.parameters.world.lights.highlightCharacter.addMesh(this.selectionMesh, BABYLON.Color3.Black(), true);
        // this.parameters.world.lights.highlightCharacter.addMesh(this.mesh, BABYLON.Color3.Black(), true);
        //focus the camera on the character
        this.parameters.world.camera?.focusOnMesh(this.mesh);
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
    if (this.parameters.world.test) this.removeVisionRays();
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
      if (!this.animation || this.animation == 'None') this.animator?.playIdle();
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
      else this.animator?.playIdle();
      if (this.mesh) {
        this.mesh.position.y = this.z;
        this.selectionMesh.position.y = this.selectionMeshZ;
        this.mesh.scaling.x = scaling;
        this.mesh.scaling.z = scaling;
      }
    }
  }

  initStealth() {
    if (this.animator) {
      if (this.stealth) {
        this.animator.defaultIdleAnimation = { animation: 'Crouch.Idle' };
        this.animator.defaultMoveAnimation = { animation: 'Crouch.Walk' };
        if (!this.beignDragged && (!this.animation || this.animation == 'None')) this.animator?.playIdle();
      } else {
        this.animator.defaultIdleAnimation = { animation: 'Idle' };
        this.animator.defaultMoveAnimation = { animation: 'Run' };
        if (!this.beignDragged && (!this.animation || this.animation == 'None')) this.animator?.playIdle();
      }
    }
  }
}
