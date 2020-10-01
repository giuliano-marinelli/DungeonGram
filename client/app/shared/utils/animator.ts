import * as BABYLON from '@babylonjs/core/Legacy/legacy';
import { Vectors } from '../utils/vectors';

export class Animator {
  planning: any[] = [];
  animations: any = {};
  mesh: any;
  scene: any;
  playing: boolean = false;
  actual: string;
  rotationSpeed: number;
  lastDirection: number = 0;
  vectors: Vectors = Vectors;

  constructor(animations: any, mesh: any, scene: any, rotationSpeed: number = 3) {
    this.animations = animations;
    this.mesh = mesh;
    this.scene = scene;
    this.rotationSpeed = rotationSpeed;

    this.scene.onBeforeAnimationsObservable.add(() => {
      if (!this.playing && this.planning.length) {
        this.playing = true;
        this.actual = this.planning.shift();
        let obs = this.scene.onBeforeAnimationsObservable.add(() => {
          for (let key in this.animations) {
            if (this.actual != key)
              this.animations[key].weight -= this.animations[key].weight > 0 ? 0.01 : 0;
            else
              this.animations[key].weight += this.animations[key].weight < 1 ? 0.01 : 0;
          }
          if (this.animations[this.actual].weight == 1) {
            this.scene.onBeforeAnimationsObservable.remove(obs);
            this.playing = false;
          }
        });
      }
    });
  }

  play(animation) {
    this.planning.push(animation);
  }

  clear() {
    this.planning = [];
  }

  rotate(direction) {
    BABYLON.Animation.CreateAndStartAnimation("rotate", this.mesh, "rotation.y",
      this.rotationSpeed, 1, this.mesh?.rotation.y, this.mesh?.rotation.y + Math.PI * 2 / 8 * Vectors.distanceBetweenDirections(this.lastDirection, direction),
      BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT, null, () => {
        this.mesh.rotation.y = Math.PI * 2 / 8 * direction;
      });

    this.lastDirection = direction;
  }

}
