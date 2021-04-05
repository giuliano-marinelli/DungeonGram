import * as BABYLON from '@babylonjs/core/Legacy/legacy';
import { Point } from './point';
import { Schema } from './schema';
import { Vectors } from '../utils/vectors';
import { Animator } from '../utils/animator';
import { Image } from '@babylonjs/gui';

export class Wall extends Schema {
  //schema
  id?: string;
  from?: Point;
  to?: Point;
  defaultTo?: Point;
  size?: string;
  type?: string;
  blocked?: boolean;
  hidden?: boolean;
  //game objects
  mesh?: any;
  animator?: any;
  height?: number;
  collider?: any;
  blockedSign?: any;
  hiddenSign?: any;
  //physics
  tilesPhysics?: Point[];
  tilesPhysicsColliders?: any[] = [];

  constructor(schema, parameters) {
    super(parameters);

    this.id = parameters.id;

    this.synchronizeSchema(schema,
      {
        from: { type: Point, datatype: Object },
        to: { type: Point, datatype: Object },
        defaultTo: { type: Point, datatype: Object },
        tilesPhysics: { type: Point, datatype: Array, onAdd: 'last', onRemove: 'first' }
      }
    );

    this.doMesh();
  }

  update(changes?) {
    changes?.forEach((change) => {
      switch (change.field) {
        case 'tilesPhysics':
          //for testing purposes
          // this.doTilesPhysics();
          break;
        case 'to': {
          if (this.mesh) {
            this.mesh.scaling.x = Vectors.distance(this.from, this.to);
            this.mesh.rotation.y = Vectors.angle(this.from, this.to);
            this.parameters.world.updateCharactersVisibility();
          }
        }
        case 'blocked': {
          if (this.blockedSign) this.animator.toggleUI(this.blockedSign, this.blocked);
        }
        case 'hidden': {
          if (this.hiddenSign) this.animator.toggleUI(this.hiddenSign, this.hidden);
          this.parameters.world.updateCharactersVisibility();
        }
      }
    });
  }

  doMesh() {
    this.height = 2.55;
    if (this.size == 'medium') this.height = this.height / 2;
    if (this.size == 'small' || (this.size == 'collider' && this.type != 'door')) this.height = this.height / 4;
    // this.mesh = BABYLON.MeshBuilder.CreateBox('', { height: 1, width: 1, depth: 1 }, this.parameters.scene);
    this.mesh = this.type == "door" ? this.parameters.assets.door.clone() : this.parameters.assets.wall.clone();
    this.mesh.setEnabled(true);
    this.mesh.scaling.x = Vectors.distance(this.from, this.to);
    this.mesh.scaling.y = this.height;
    this.mesh.scaling.z = this.type == "door" ? 0.1 : 0.01;

    //set material of base tile mesh
    // var material = new BABYLON.StandardMaterial("wall", this.parameters.scene);
    // if (this.type == "door") {
    //   var texture = new BABYLON.Texture('assets/images/game/door.png', this.parameters.scene);
    //   material.diffuseTexture = texture;
    // } else {
    //   material.diffuseColor = BABYLON.Color3.Gray();
    // }
    this.mesh.material = this.type == "door" ? this.parameters.assets.doorMaterial.clone() : this.parameters.assets.wallMaterial.clone();
    this.mesh.visibility = this.type == 'door' && this.size == 'collider' ? 0.5 : 1;
    this.mesh.isPickable = false;

    //set semantic data to the mesh
    this.mesh.isCollible = this.size != 'collider';
    this.mesh.isWall = true;
    this.mesh.isDoor = this.type == "door";

    //set pivot point and position at this.from
    this.mesh.setPivotPoint(new BABYLON.Vector3(-0.5, 0, 0));
    this.mesh.position.x = this.from.x + 0.5;
    this.mesh.position.z = this.from.y;
    this.mesh.position.y = this.height / 2 - 0.05;

    //rotate by the angle between this.from and this.to
    this.mesh.rotation.y = Vectors.angle(this.from, this.to);

    if (this.type == "door") {
      //set collider mesh
      this.collider = BABYLON.MeshBuilder.CreateCylinder('', { height: this.height, diameter: 2 }, this.parameters.scene);
      this.collider.parent = this.mesh;
      this.collider.name = this.id;
      this.collider.position = new BABYLON.Vector3(-0.5, 0, 0);
      this.collider.visibility = 0;
      this.collider.isCollible = true;
      this.collider.isTranspasable = true;
      this.collider.isDoor = true;
      this.collider.isPickable = false;
    }

    //create the animator to manage visibility of doors
    if (this.type == "door") this.animator = new Animator(this.mesh, null, { defaultVisibility: this.size == 'collider' ? 0.5 : 1 });

    //positioning mesh (old way)
    // var middlePoint = Vectors.middlePoint(this.from, this.to);
    // this.mesh.position.y = height / 2 - 0.05;
    // // this.mesh.position.y = 0.45;
    // this.mesh.position.x = middlePoint.x;
    // this.mesh.position.z = middlePoint.y;

    //for visualize pivot point
    // var spherePivot = BABYLON.MeshBuilder.CreateSphere("sphereP", { diameter: .5 }, this.parameters.scene);
    // var spherePivotmaterial = new BABYLON.StandardMaterial("pivot", this.parameters.scene);
    // spherePivotmaterial.diffuseColor = BABYLON.Color3.Blue();
    // spherePivot.material = spherePivotmaterial;
    // spherePivot.parent = this.mesh;
    // spherePivot.position = new BABYLON.Vector3(-0.5, 0, 0);

    //for visualize or test collision tiles
    // this.doTilesPhysics();

    this.doSigns();

    this.initActions()

    //cast shadows with character light (if it's not an only collider wall)
    if (this.size != 'collider')
      this.parameters.world.lights.characterLight._shadowGenerator.addShadowCaster(this.mesh, false);
    this.parameters.world.updateCharactersVisibility();
    this.parameters.world.updateWallVisibility(this);
  }

  doSigns() {
    if (this.type == "door") {
      this.blockedSign = new Image('blocked', 'assets/images/game/blocked.png');
      this.blockedSign.width = "30px";
      this.blockedSign.height = "30px";
      // this.blockedSign.linkOffsetY = -55;
      this.parameters.world.ui.addControl(this.blockedSign);
      this.blockedSign.linkWithMesh(this.mesh);

      this.animator.parentUI(this.blockedSign, 1, 0);
      this.animator.toggleUI(this.blockedSign, this.blocked);

      this.hiddenSign = new Image('hidden', 'assets/images/game/hidden.png');
      this.hiddenSign.width = "30px";
      this.hiddenSign.height = "30px";
      this.hiddenSign.linkOffsetY = -20;
      this.parameters.world.ui.addControl(this.hiddenSign);
      this.hiddenSign.linkWithMesh(this.mesh);

      this.animator.parentUI(this.hiddenSign, 1, 0);
      this.animator.toggleUI(this.hiddenSign, this.hidden);
    }
  }

  doTilesPhysics() {
    this.tilesPhysicsColliders.forEach((tilesPhysicsCollider) => {
      tilesPhysicsCollider.dispose();
    });
    this.tilesPhysicsColliders = [];
    setTimeout(() => {
      this.tilesPhysics.forEach((tile) => {
        var tileCollider = BABYLON.MeshBuilder.CreateBox('', { height: 0.1, width: 0.5, depth: 0.5 }, this.parameters.scene);
        this.tilesPhysicsColliders.push(tileCollider);
        var material = new BABYLON.StandardMaterial('', this.parameters.scene);
        material.diffuseColor = BABYLON.Color3.Red();
        tileCollider.material = material;
        tileCollider.visibility = 1;
        tileCollider.position.x = tile.x;
        tileCollider.position.z = tile.y;
        tileCollider.position.y = 0.05;
      });
    }, 1000);
  }

  initActions() {
    //set action on mouse in/out/click
    this.mesh.actionManager = new BABYLON.ActionManager(this.parameters.scene);
    this.mesh.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOutTrigger, () => {
      this.mesh.material.emissiveColor = BABYLON.Color3.Black();
    }));
    this.mesh.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOverTrigger, () => {
      if (this.parameters.controller.activeTool?.name == 'walls')
        this.mesh.material.emissiveColor = BABYLON.Color3.White();
    }));
    this.mesh.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnLeftPickTrigger, (e) => {
      if (this.parameters.controller.activeTool?.name == 'walls' &&
        e.sourceEvent.ctrlKey && this.parameters.controller.activeTool?.options?.remove) {
        this.parameters.controller.send('game', 'wall', { id: this.id, action: 'remove' });
      }
    }));
    if (this.type == 'door') {
      this.mesh.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickDownTrigger, (e) => {
        if (((!this.blocked && !this.hidden) || this.parameters.world.users[this.parameters.token].isDM) &&
          !this.parameters.controller.activeTool && !this.parameters.controller.activeAction && e.sourceEvent.button == 0) {
          var pickDoor = this.parameters.scene.pick(this.parameters.scene.pointerX, this.parameters.scene.pointerY, (mesh) => { return mesh.isDoor });
          var pickGround = this.parameters.scene.pick(this.parameters.scene.pointerX, this.parameters.scene.pointerY, (mesh) => { return mesh.isGround });
          if (pickDoor?.pickedPoint && pickGround?.pickedPoint) {
            console.log(this);
            this.parameters.controller.toggleAction('dragDoor', true);
            var difference = {
              x: pickDoor.pickedPoint.x - pickGround.pickedPoint.x,
              z: pickDoor.pickedPoint.z - pickGround.pickedPoint.z,
            }
            var drag = (e) => {
              var pick = this.parameters.scene.pick(this.parameters.scene.pointerX, this.parameters.scene.pointerY, (mesh) => { return mesh.isGround });
              if (pick?.pickedPoint) {
                this.parameters.controller.send('game', 'wall', {
                  id: this.id,
                  target: { x: pick.pickedPoint.x + difference.x / 2, y: pick.pickedPoint.z + difference.z / 2 },
                  action: 'rotate'
                });
              }
            }
            var drop = (e) => {
              this.parameters.canvas.removeEventListener("pointerup", drop, false);
              this.parameters.canvas.removeEventListener("pointermove", drag, false);
              setTimeout(() => {
                this.parameters.controller.toggleAction('dragDoor', false);
                this.parameters.controller.send('game', 'wall', { id: this.id, action: 'endRotate' });
              }, 10);
            };
            this.parameters.canvas.addEventListener("pointermove", drag, false);
            this.parameters.canvas.addEventListener("pointerup", drop, false);
          }
        }
      }));
      this.mesh.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnLeftPickTrigger, (e) => {
        if (!this.parameters.controller.activeTool) {
          if (e.sourceEvent.shiftKey) {
            this.parameters.controller.send('game', 'wall', { id: this.id, block: !this.blocked, action: 'block' });
          } else if (e.sourceEvent.altKey) {
            this.parameters.controller.send('game', 'wall', { id: this.id, hide: !this.hidden, action: 'hide' });
          }
        }
      }));
      this.mesh.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnDoublePickTrigger, (e) => {
        console.log("doble click door")
        if (e.sourceEvent.button == 0 && !this.parameters.controller.activeTool) {
          console.log("send close door")
          this.parameters.controller.send('game', 'wall', { id: this.id, action: 'close' });
        }
      }));
    }
  }

  remove() {
    super.remove();
    this.removeSigns();
    this.mesh?.dispose();
    this.collider?.dispose();
    this.mesh = null;
    this.collider = null;
    this.tilesPhysicsColliders.forEach((tilesPhysicsCollider) => {
      tilesPhysicsCollider.dispose();
    });
    this.parameters.world.updateCharactersVisibility();
  }

  removeSigns() {
    this.blockedSign?.dispose();
    this.hiddenSign?.dispose();
    this.blockedSign = null;
    this.hiddenSign = null;
  }
}
