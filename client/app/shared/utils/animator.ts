import * as BABYLON from '@babylonjs/core/Legacy/legacy';
import { Vectors } from '../utils/vectors';

export class Animator {
  mesh: any;
  skeleton: any;
  actual: any = { animation: null, loop: true };
  rotationSpeed: number = 3;
  lastDirection: BABYLON.Vector2 = new BABYLON.Vector2(0, 1);
  transition: number = 0.05;
  registeredChildren: any = {};
  defaultVisibility: number = 1;

  constructor(mesh: any, skeleton: any, options?: any) {
    this.mesh = mesh;
    this.skeleton = skeleton;
    if (options?.rotationSpeed) this.rotationSpeed = options?.rotationSpeed;
    if (options?.transition) this.transition = options?.transition;

    this.skeleton.enableBlending(this.transition);
    for (let anim in this.skeleton._ranges) {
      this.skeleton._ranges[anim].from = this.skeleton._ranges[anim].from + 1;
    }

    if (options?.actual) this.play(options?.actual);
  }

  play(animation, loop?) {
    if (loop == null) loop = true;
    if (animation != this.actual.animation || loop != this.actual.loop) {
      this.skeleton.beginAnimation(animation, loop, 1);
      // this.mesh.getChildren().forEach((child) => {
      // if (this.mesh._children) {
      // this.mesh._children.forEach((child) => {
      for (let childId in this.registeredChildren) {//for each formally registered child
        this.registeredChildren[childId].skeleton?.beginAnimation(animation, loop, 1);
      }
      // });
      // }
      this.actual.animation = animation;
      this.actual.loop = loop;
    }
  }

  parent(mesh) {
    if (!this.mesh._children || !this.mesh._children.find((child) => { return child.uniqueId == mesh.uniqueId })) {
      this.registeredChildren[mesh.uniqueId] = mesh;
      mesh.parent = this.mesh;
      mesh.skeleton = this.mesh.skeleton.clone("childSkeleton");
      // mesh.skeleton.enableBlending(this.transition);
      // for (let anim in mesh.skeleton._ranges) {
      //   mesh.skeleton._ranges[anim].from = mesh.skeleton._ranges[anim].from + 1;
      // }
      // this.mesh._children.forEach((child) => {
      //   child.skeleton?.beginAnimation(this.actual.animation, this.actual.loop, 1);
      // });
      for (let childId in this.registeredChildren) {//for each formally registered child
        this.registeredChildren[childId].skeleton?.beginAnimation(this.actual.animation, this.actual.loop, 1);
      }
      this.skeleton.beginAnimation(this.actual.animation, this.actual.loop, 1);
      this.visibility(this.mesh.visibility);
    }
  }

  unparent(child) {
    // var child = this.mesh._children.find((child) => { return child.uniqueId == uniqueId });
    // if (child) {
    //   child.parent = null;
    //   child.setParent(null);
    //   this.mesh.removeChild(child);
    //   this.childs.
    // }

    delete this.registeredChildren[child.uniqueId];
    child.parent = null;
    child.setParent(null);
    this.mesh.removeChild(child);
  }

  visibility(value) {
    this.mesh.visibility = value;
    for (let childId in this.registeredChildren) {
      this.registeredChildren[childId].visibility = value;
    }
  }

  resetVisibility() {
    this.visibility(this.defaultVisibility);
  }

  rotate(direction?) {
    if (direction != null && (direction?.x != 0 || direction?.y != 0)) {
      var vectorDirection = new BABYLON.Vector2(direction.y, direction.x);
      // console.log(this.lastDirection, vectorDirection, this.mesh?.rotation.y, this.mesh?.rotation.y + BABYLON.Angle.BetweenTwoPoints(this.lastDirection, vectorDirection).radians());
      // BABYLON.Animation.CreateAndStartAnimation("rotate", this.mesh, "rotation.y",
      //   this.rotationSpeed, 1, this.mesh?.rotation.y, BABYLON.Angle.BetweenTwoPoints(this.lastDirection, vectorDirection).radians(),
      //   BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT, null, () => {
      //     this.mesh.rotation.y = BABYLON.Angle.BetweenTwoPoints(BABYLON.Vector2.Zero(), vectorDirection).radians();
      //   });

      this.mesh.rotation.y = BABYLON.Angle.BetweenTwoPoints(BABYLON.Vector2.Zero(), vectorDirection).radians();

      this.lastDirection = vectorDirection;
    }
  }

  static cameraSpinTo = function (camera, whichprop, targetval, speed) {
    var ease = new BABYLON.CubicEase();
    ease.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEINOUT);
    BABYLON.Animation.CreateAndStartAnimation('at4', camera, whichprop, speed, 120, camera[whichprop], targetval, 0, ease);
  }

}
