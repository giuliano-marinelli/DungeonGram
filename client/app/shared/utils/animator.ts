import * as BABYLON from '@babylonjs/core/Legacy/legacy';
import { Vectors } from '../utils/vectors';

export class Animator {
  mesh: any;
  skeleton: any;
  actual: any = { animation: null, loop: true };
  rotationSpeed: number = 3;
  lastDirection: number = 0;
  transition: number = 0.05;

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
    if (animation != this.actual.animation || loop != this.actual.animation) {
      this.skeleton.beginAnimation(animation, loop, 1);
      // this.mesh.getChildren().forEach((child) => {
      if (this.mesh._children) {
        this.mesh._children.forEach((child) => { //for each formally registered child
          child.skeleton?.beginAnimation(animation, loop, 1);
        });
      }
      this.actual.animation = animation;
      this.actual.loop = loop;
    }
  }

  parent(mesh) {
    if (!this.mesh._children || !this.mesh._children.find((child) => { return child.uniqueId == mesh.uniqueId })) {
      mesh.parent = this.mesh;
      mesh.skeleton = this.mesh.skeleton.clone("childSkeleton");
      // mesh.skeleton.enableBlending(this.transition);
      // for (let anim in mesh.skeleton._ranges) {
      //   mesh.skeleton._ranges[anim].from = mesh.skeleton._ranges[anim].from + 1;
      // }
      this.mesh._children.forEach((child) => { //for each formally registered child
        child.skeleton?.beginAnimation(this.actual.animation, this.actual.loop, 1);
      });
      this.skeleton.beginAnimation(this.actual.animation, this.actual.loop, 1);
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

    child.parent = null;
    child.setParent(null);
    this.mesh.removeChild(child);
  }

  rotate(direction, invert) {
    BABYLON.Animation.CreateAndStartAnimation("rotate", this.mesh, "rotation.y",
      this.rotationSpeed, 1, this.mesh?.rotation.y, this.mesh?.rotation.y + Math.PI * 2 / 8 * Vectors.distanceBetweenDirections(this.lastDirection, direction),
      BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT, null, () => {
        this.mesh.rotation.y = Math.PI * 2 / 8 * direction * (invert ? -1 : 1);
      });

    this.lastDirection = direction;
  }

}
