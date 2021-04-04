import * as BABYLON from '@babylonjs/core/Legacy/legacy';
import { Point } from './point';
import { Schema } from './schema';
import { Vectors } from '../utils/vectors';

export class Wall extends Schema {
  //schema
  id?: string;
  from?: Point;
  to?: Point;
  size?: string;
  type?: string;
  //game objects
  mesh?: any;
  height?: number;
  collider?: any;
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
      }
    });
  }

  doMesh() {
    this.height = 2.55;
    if (this.size == 'medium') this.height = this.height / 2;
    if (this.size == 'small' || (this.size == 'collider' && this.type != 'door')) this.height = this.height / 4;
    this.mesh = BABYLON.MeshBuilder.CreateBox('', { height: this.height, width: 1, depth: this.type == "door" ? 0.1 : 0.01 }, this.parameters.scene);
    // this.mesh = BABYLON.MeshBuilder.CreateBox('', { height: 1, width: 1, depth: 0.01 }, this.parameters.scene);
    this.mesh.scaling.x = Vectors.distance(this.from, this.to);

    //set material of base tile mesh
    var material = new BABYLON.StandardMaterial("wall", this.parameters.scene);
    if (this.type == "door") {
      var texture = new BABYLON.Texture('assets/images/game/door.png', this.parameters.scene);
      material.diffuseTexture = texture;
    } else {
      material.diffuseColor = BABYLON.Color3.Gray();
    }
    this.mesh.visibility = this.type == 'door' && this.size == 'collider' ? 0.5 : 1;
    this.mesh.material = material;
    this.mesh.isPickable = false;

    //set semantic data to the mesh
    this.mesh.isCollible = true;
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

    this.initActions()

    //cast shadows with character light (if it's not an only collider wall)
    if (this.size != 'collider')
      this.parameters.world.lights.characterLight._shadowGenerator.addShadowCaster(this.mesh, false);
    this.parameters.world.updateCharactersVisibility();
    this.parameters.world.updateWallVisibility(this);
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
        if (!this.parameters.controller.activeTool && !this.parameters.controller.activeAction && e.sourceEvent.button == 0) {
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
    }
  }

  remove() {
    super.remove();
    this.mesh.dispose();
    this.tilesPhysicsColliders.forEach((tilesPhysicsCollider) => {
      tilesPhysicsCollider.dispose();
    });
    this.parameters.world.updateCharactersVisibility();
  }
}
