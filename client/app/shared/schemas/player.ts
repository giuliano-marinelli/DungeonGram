import * as BABYLON from '@babylonjs/core/Legacy/legacy';
import { Path } from './path';
import { Point } from './point';
import { Schema } from './schema';
import { Animator } from '../utils/animator';
import { Vectors } from '../utils/vectors';

export class Player extends Schema {
  //schema
  id?: string;
  x?: number;
  y?: number;
  direction?: Point;
  movementPath?: Path;
  movementCooldown?: number;
  beignDragged?: boolean;
  visionRange?: number;
  //game objects
  mesh?: any;
  collider?: any;
  skeleton?: any;
  animator?: any;
  visionLight?: any;
  visionRays?: any = [];
  visiblePlayers?: any = [];
  //physics
  xPhysics?: number;
  yPhysics?: number;
  isCollidingPhysics?: boolean;
  colliderPhysics?: any;

  constructor(schema, parameters) {
    super(parameters);

    this.id = parameters.id;

    this.doMesh();

    this.synchronizeSchema(schema,
      {
        direction: { type: Point, datatype: Object },
        movementPath: {
          type: Path, datatype: Object, parameters: () => {
            return {
              world: parameters.world,
              scene: parameters.scene,
              room: parameters.room,
              playerId: this.id
            }
          }
        }
      }
    );
  }

  update(changes?) {
    changes?.forEach((change) => {
      switch (change.field) {
        case 'x':
          this.animator?.clear();
          if (!this.beignDragged) this.animator?.play('run');
          BABYLON.Animation.CreateAndStartAnimation("moveX", this.mesh, "position.x",
            100, this.movementCooldown / 10, this.mesh?.position.x, this.x,
            BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT, null, () => {
              if (!this.movementPath.to)
                this.animator?.play('idle');
            });
          break;
        case 'y':
          this.animator?.clear();
          if (!this.beignDragged) this.animator?.play('run');
          BABYLON.Animation.CreateAndStartAnimation("moveZ", this.mesh, "position.z",
            100, this.movementCooldown / 10, this.mesh?.position.z, this.y,
            BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT, null, () => {
              if (!this.movementPath.to)
                this.animator?.play('idle');
            });
          break;
        case 'direction':
          this.animator?.rotate(Vectors.directionToRotate(this.direction));
          break;
        case 'beignDragged':
          if (this.beignDragged) {
            if (this.collider) this.collider.isDragged = true;
            BABYLON.Animation.CreateAndStartAnimation("moveY", this.mesh, "position.y",
              10, 1, this.mesh?.position.y, 0.5, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
          } else {
            if (this.collider) this.collider.isDragged = false;
            BABYLON.Animation.CreateAndStartAnimation("moveY", this.mesh, "position.y",
              10, 1, this.mesh?.position.y, -0.05, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
          }
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
          if (this.isCollidingPhysics)
            this.animator?.play('idle');
          break;
      }
    });

    if (this.parameters.world.users[this.parameters.room.sessionId].selectedPlayer != null) {
      this.parameters.world.updatePlayersVisibility(this.id);
      this.initVisionLight();
    }
  }

  remove() {
    super.remove();
    this.mesh.dispose();
    this.collider.dispose();
    this.colliderPhysics.dispose();
  }

  doMesh() {
    if (!this.mesh) {
      BABYLON.SceneLoader.ImportMesh('', "assets/meshes/", "dummy.babylon", this.parameters.scene, (meshes, particleSystems, skeletons) => {
        this.mesh = meshes[0];
        this.mesh.name = this.id;

        //positioning mesh
        this.mesh.position.y = -0.05;
        this.mesh.position.x = this.x;
        this.mesh.position.z = this.y;
        this.mesh.isPickable = false;

        //set collider mesh
        this.collider = BABYLON.MeshBuilder.CreateCylinder('', { height: 1.5, diameter: 0.5 }, this.parameters.scene);
        this.collider.parent = this.mesh;
        this.collider.name = this.id;
        this.collider.position.y = 1;
        this.collider.visibility = 0;
        this.collider.isCollible = true;
        this.collider.isPlayer = true;

        //set collider phyics mesh
        this.colliderPhysics = BABYLON.MeshBuilder.CreateBox('', { height: 2, width: 0.9, depth: 0.9 }, this.parameters.scene);
        this.colliderPhysics.name = this.id + "physics";
        this.colliderPhysics.position.y = 0.95;
        this.colliderPhysics.position.x = this.xPhysics;
        this.colliderPhysics.position.z = this.yPhysics;
        this.colliderPhysics.visibility = 0;
        this.colliderPhysics.isPickable = false;
        this.colliderPhysics.material = new BABYLON.StandardMaterial("colliderPhysicsMaterial", this.parameters.scene);

        this.skeleton = skeletons[0];

        var idleRange = this.skeleton.getAnimationRange("YBot_Idle");
        var walkRange = this.skeleton.getAnimationRange("YBot_Walk");
        var runRange = this.skeleton.getAnimationRange("YBot_Run");
        var leftRange = this.skeleton.getAnimationRange("YBot_LeftStrafeWalk");
        var rightRange = this.skeleton.getAnimationRange("YBot_RightStrafeWalk");

        //create the animator to manage the transition between animations
        this.animator = new Animator(
          {
            idle: this.parameters.scene.beginWeightedAnimation(this.skeleton, idleRange.from, idleRange.to, 1.0, true),
            walk: this.parameters.scene.beginWeightedAnimation(this.skeleton, walkRange.from, walkRange.to, 0.0, true),
            run: this.parameters.scene.beginWeightedAnimation(this.skeleton, runRange.from, runRange.to, 0.0, true),
            left: this.parameters.scene.beginWeightedAnimation(this.skeleton, leftRange.from, leftRange.to, 0.0, true),
            right: this.parameters.scene.beginWeightedAnimation(this.skeleton, rightRange.from, rightRange.to, 0.0, true)
          }, this.mesh, this.parameters.scene
        );

        //adjust start direction
        this.animator.rotate(Vectors.directionToRotate(this.direction));

        //set action on mouse in/out/click
        this.collider.actionManager = new BABYLON.ActionManager(this.parameters.scene);
        // this.mesh.actionManager.registerAction(new BABYLON.SetValueAction(BABYLON.ActionManager.OnPointerOutTrigger, this.mesh.material, "emissiveColor", this.mesh.material.emissiveColor));
        // this.mesh.actionManager.registerAction(new BABYLON.SetValueAction(BABYLON.ActionManager.OnPointerOverTrigger, this.mesh.material, "emissiveColor", BABYLON.Color3.White()));
        this.collider.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnRightPickTrigger, () => {
          console.log('Player', this.id, ': (', this.x, ',', this.y, ')', this._schema);
          this.parameters.controller.send('game', 'player', { id: this.id, action: 'select' });
        }));
        this.collider.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickDownTrigger, (e) => {
          if (e.sourceEvent.button == 0 && !this.parameters.controller.activeTool) {
            this.parameters.controller.toggleAction('dragPlayer', true);
            this.parameters.controller.send('game', 'player', { id: this.id, action: 'drag' });
            var drag = () => {
              var pick = this.parameters.scene.pick(this.parameters.scene.pointerX, this.parameters.scene.pointerY, (mesh) => { return !mesh.isDragged && mesh.isPickable });
              if (pick?.pickedPoint) {
                this.parameters.controller.send('game', 'player', { id: this.id, x: pick.pickedPoint.x, y: pick.pickedPoint.z, action: 'drag' });
              }
            }
            var drop = () => {
              this.parameters.controller.send('game', 'player', { id: this.id, action: 'drop' });
              this.parameters.canvas.removeEventListener("pointerup", drop, false);
              this.parameters.canvas.removeEventListener("pointermove", drag, false);
              setTimeout(() => {
                this.parameters.controller.toggleAction('dragPlayer', false);
              }, 10);
            };
            this.parameters.canvas.addEventListener("pointermove", drag, false);
            this.parameters.canvas.addEventListener("pointerup", drop, false);
          }
        }));

        //cast shadows
        // this.parameters.shadowGenerators.baseLight.addShadowCaster(this.mesh);

        this.parameters.world.updateLights();
        this.parameters.world.updateShadows();

        this.initVisionLight();

        this.update();
      });
    }
  }

  initVisionLight() {
    //add vision light
    if (this.id == this.parameters.world.users[this.parameters.room.sessionId].selectedPlayer) {
      if (!this.visionLight && this.mesh) {
        this.visionLight = new BABYLON.PointLight("playerLight" + this.id, new BABYLON.Vector3(0, 2, 0), this.parameters.scene);
        this.visionLight.range = this.visionRange;
        this.visionLight.parent = this.mesh;
        this.visionLight.diffuse = new BABYLON.Color3(0.5, 0.5, 0.5);
        this.visionLight.specular = new BABYLON.Color3(0, 0, 0);
        this.visionLight.shadowMinZ = 0.1;
        this.visionLight.intensity = 100;
        this.parameters.lights.playerLight = this.visionLight;

        //add shadow generator for the vision light
        new BABYLON.ShadowGenerator(1024, this.visionLight);
        this.visionLight._shadowGenerator.useBlurExponentialShadowMap = true;
        this.visionLight._shadowGenerator.transparencyShadow = true;
      }
    } else if (this.visionLight) {
      this.visionLight.dispose();
      this.visionLight = null;
    }
  }

  doVisionRays() {
    if (this.id == this.parameters.room.sessionId) {
      this.visionRays.forEach(visionRay => {
        visionRay.dispose();
      });
      this.visiblePlayers = [];
      var raysPoints = Vectors.getRadiusPoints({ x: 0, y: 0 }, 64);
      raysPoints.forEach(rayPoint => {
        var ray = new BABYLON.Ray(new BABYLON.Vector3(this.x, 1, this.y), new BABYLON.Vector3(rayPoint.x, 0, rayPoint.y), this.visionRange);
        // this.visionRays.push(BABYLON.RayHelper.CreateAndShow(ray, this.parameters.scene, new BABYLON.Color3(1, 1, 0.1)));
        var pickedMesh = this.parameters.scene.pickWithRay(ray)?.pickedMesh;
        if (pickedMesh?.name.indexOf('player') != -1)
          this.visiblePlayers.push(pickedMesh);
      });
    }

    this.parameters.world.updatePlayersVisibility();
  }
}
