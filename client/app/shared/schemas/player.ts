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
  beignDragged: boolean;
  //game objects
  mesh?: any;
  skeleton?: any;
  animator?: any;

  constructor(schema, parameters) {
    super(parameters);

    this.id = parameters.id;

    this.doMesh();

    this.synchronizeSchema(schema,
      {
        direction: { type: Point, datatype: Object },
        movementPath: { type: Path, datatype: Object, parameters: () => { return { scene: parameters.scene, room: parameters.room, playerId: this.id } } }
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
            1000 / this.movementCooldown, 1, this.mesh?.position.x, this.x,
            BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT, null, () => {
              if (!this.movementPath.to)
                this.animator?.play('idle');
            });
          break;
        case 'y':
          this.animator?.clear();
          if (!this.beignDragged) this.animator?.play('run');
          BABYLON.Animation.CreateAndStartAnimation("moveZ", this.mesh, "position.z",
            1000 / this.movementCooldown, 1, this.mesh?.position.z, this.y,
            BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT, null, () => {
              if (!this.movementPath.to)
                this.animator?.play('idle');
            });
          break;
        case 'beignDragged':
          if (this.beignDragged) {
            BABYLON.Animation.CreateAndStartAnimation("moveY", this.mesh, "position.y",
              10, 1, this.mesh?.position.y, 0.5, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
          } else
            BABYLON.Animation.CreateAndStartAnimation("moveY", this.mesh, "position.y",
              10, 1, this.mesh?.position.y, -0.05, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
          break;
      }
    });

    this.animator?.rotate(Vectors.directionToRotate(this.direction));
  }

  remove() {
    super.remove();
    this.mesh.dispose();
  }

  doMesh() {
    if (!this.mesh) {
      BABYLON.SceneLoader.ImportMesh('', "assets/meshes/", "dummy.babylon", this.parameters.scene, (meshes, particleSystems, skeletons) => {
        this.mesh = meshes[0];
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

        //set action on mouse in/out/click
        this.mesh.actionManager = new BABYLON.ActionManager(this.parameters.scene);
        // this.mesh.actionManager.registerAction(new BABYLON.SetValueAction(BABYLON.ActionManager.OnPointerOutTrigger, this.mesh.material, "emissiveColor", this.mesh.material.emissiveColor));
        // this.mesh.actionManager.registerAction(new BABYLON.SetValueAction(BABYLON.ActionManager.OnPointerOverTrigger, this.mesh.material, "emissiveColor", BABYLON.Color3.White()));
        this.mesh.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickUpTrigger, () => {
          console.log('Player', this.id, ': (', this.x, ',', this.y, ')', this._schema);
        }));
        this.mesh.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickDownTrigger, (e) => {
          if (e.sourceEvent.button == 0) {
            this.parameters.controller.toggleAction('dragPlayer', true);
            this.parameters.controller.send('game', 'dragPlayer', { id: this.id, action: 'drag' });
            var drag = () => {
              var pick = this.parameters.scene.pick(this.parameters.scene.pointerX, this.parameters.scene.pointerY);
              if (pick?.pickedPoint) {
                this.parameters.controller.send('game', 'dragPlayer', { id: this.id, position: { x: pick.pickedPoint.x, y: pick.pickedPoint.z }, action: 'drag' });
              }
            }
            var drop = () => {
              this.parameters.controller.send('game', 'dragPlayer', { id: this.id, action: 'drop' });
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

        //positioning mesh
        this.mesh.position.y = -0.05;
        this.mesh.position.x = this.x;
        this.mesh.position.z = this.y;

        //cast shadows
        this.parameters.shadowGenerator.addShadowCaster(this.mesh);

        this.update();
      });
    }
  }
}
