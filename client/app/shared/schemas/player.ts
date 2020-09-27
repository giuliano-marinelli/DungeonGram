import * as BABYLON from '@babylonjs/core/Legacy/legacy';
import { Path } from './path';
import { Point } from './point';

export class Player {
  //schema
  id?: string;
  x?: number;
  y?: number;
  direction?: Point;
  movementPath?: Path;
  movementCooldown?: number;
  //game objects
  mesh?: any;
  skeleton?: any;
  animations?: any = {};

  constructor(schema, scene, room, parameters?) {
    this.id = parameters?.id;
    if (schema?.direction) this.direction = new Point(schema.direction);
    if (schema?.movementPath) this.movementPath = new Path(schema.movementPath, scene, room);

    schema.onChange = (changes) => {
      changes.forEach((change) => {
        switch (change.field) {
          case 'x': case 'y': case 'movementCooldown':
            this[change.field] = change.value;
            break;
        }
        switch (change.field) {
          case 'direction':
            if (!this[change.field] && change.value != null) this[change.field] = new Point(change.value);
            else if (change.value == null) delete this[change.field];
            break;
        }
        switch (change.field) {
          case 'x':
            // this.mesh.position.x = change.value;
            // this.mesh?.translate(BABYLON.Axis.X, change.value - this.mesh.position.x, BABYLON.Space.WORLD);
            this.transition('x', change.previousValue, change.value);
            break;
          case 'y':
            // this.mesh.position.z = change.value;
            // this.mesh?.translate(BABYLON.Axis.Z, change.value - this.mesh.position.z, BABYLON.Space.WORLD);
            this.transition('z', change.previousValue, change.value);
            break;
          case 'direction':
            if (this.mesh?.rotation) this.mesh.rotation.y = 6.27 / 8 * this.directionToRotate(change.value);
            break;
          case 'movementPath':
            if (change.value.points.length) {
              if (this.animations.run && this.animations.actual != 'run') this.animations.run();
            } else {
              setTimeout(() => {
                if (this.animations.idle && this.animations.actual != 'idle') this.animations.idle();
              }, this.movementCooldown);
            }
            break;
        }
      });
    }
    schema.triggerAll();

    this.doMesh(schema, scene, room);
  }

  doMesh(schema, scene, room) {
    if (!this.mesh) {
      // //create mesh
      // this.mesh = BABYLON.MeshBuilder.CreateBox(this.id, { height: 2, width: 0.5, depth: 0.5 }, scene);

      // //set material
      // var material = new BABYLON.StandardMaterial("ground", scene);
      // material.diffuseColor = BABYLON.Color3.Random();
      // this.mesh.material = material;

      BABYLON.SceneLoader.ImportMesh('', "assets/meshes/", "dummy.babylon", scene, (meshes, particleSystems, skeletons) => {
        console.log(meshes, particleSystems, skeletons);
        this.mesh = meshes[0];
        this.skeleton = skeletons[0];

        // for (var index = 0; index < newMeshes2.length; index++) {
        //     shadowGenerator.getShadowMap().renderList.push(newMeshes2[index]);
        // }

        var idleRange = this.skeleton.getAnimationRange("YBot_Idle");
        var walkRange = this.skeleton.getAnimationRange("YBot_Walk");
        var runRange = this.skeleton.getAnimationRange("YBot_Run");
        var leftRange = this.skeleton.getAnimationRange("YBot_LeftStrafeWalk");
        var rightRange = this.skeleton.getAnimationRange("YBot_RightStrafeWalk");
        this.animations = {
          idle: () => { scene.beginAnimation(this.skeleton, idleRange.from, idleRange.to, true); this.animations.actual = 'idle' },
          walk: () => { scene.beginAnimation(this.skeleton, walkRange.from, walkRange.to, true); this.animations.actual = 'walk' },
          run: () => { scene.beginAnimation(this.skeleton, runRange.from, runRange.to, true); this.animations.actual = 'run' },
          left: () => { scene.beginAnimation(this.skeleton, leftRange.from, leftRange.to, true); this.animations.actual = 'left' },
          right: () => { scene.beginAnimation(this.skeleton, rightRange.from, rightRange.to, true); this.animations.actual = 'right' }
        }

        //play idle animation
        this.animations.idle();

        //set action on mouse in/out/click
        this.mesh.actionManager = new BABYLON.ActionManager(scene);
        this.mesh.actionManager.registerAction(new BABYLON.SetValueAction(BABYLON.ActionManager.OnPointerOutTrigger, this.mesh.material, "emissiveColor", this.mesh.material.emissiveColor));
        this.mesh.actionManager.registerAction(new BABYLON.SetValueAction(BABYLON.ActionManager.OnPointerOverTrigger, this.mesh.material, "emissiveColor", BABYLON.Color3.White()));
        this.mesh.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickUpTrigger, () => {
          console.log('Player', this.id, ': (', this.x, ',', this.y, ')', schema);
        }));

        //positioning mesh
        this.mesh.position.y = 0.05;
        this.mesh.position.x = schema.x;
        this.mesh.position.z = schema.y;
      });
    }
  }

  remove(schema, scene, room) {
    this.mesh.dispose();
    this.movementPath.remove(schema, scene, room);
  }

  directionToRotate(direction) {
    switch (direction.x) {
      case 1:
        switch (direction.y) {
          case 1:
            return 1;
          case 0:
            return 2;
          case -1:
            return 3;
        }
        break;
      case 0:
        switch (direction.y) {
          case 1:
            return 0;
          case 0:
            return 1;
          case -1:
            return 4;
        }
        break;
      case -1:
        switch (direction.y) {
          case 1:
            return 7;
          case 0:
            return 6;
          case -1:
            return 5;
        }
        break;
    }
  }

  transition(axis, previousPosition, newPosition) {
    if (this.mesh?.position[axis] != null) {
      if (this.animations.run && this.animations.actual != 'run') this.animations.run();
      var distance = newPosition - previousPosition;
      var foot = distance / (this.movementCooldown / 50);
      var i = 0;
      console.log('distance', distance);
      console.log('foot', foot);
      var transition = setInterval(() => {
        this.mesh.position[axis] += foot;
        i += 50;
        if (i > this.movementCooldown) {
          clearInterval(transition);
          this.mesh.position[axis] = newPosition;
        }
      }, 50);
    }
  }
}
