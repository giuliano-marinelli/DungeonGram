import * as BABYLON from '@babylonjs/core/Legacy/legacy';
import { Vectors } from '../utils/vectors';
import { Point } from './point';
import { Schema } from './schema';
import { AdvancedDynamicTexture, Rectangle, TextBlock } from '@babylonjs/gui';

export class Rule extends Schema {
  //schema
  points?: Point[];
  shared?: boolean;
  normalizeUnit?: boolean;
  //game objects
  meshPoints?: any[] = [];
  rays?: any[] = [];
  sumSign?: any;
  sumSignText?: any;
  sum?: number = 0;
  //global actions registered
  actions: any = {};

  constructor(schema, parameters) {
    super(parameters);

    this.initActions();

    this.initSigns();

    this.synchronizeSchema(schema,
      {
        points: { type: Point, datatype: Array, onAdd: 'last', onRemove: 'first' }
      }
    );
  }

  update(changes?) {
    changes?.forEach((change) => {
      if (this.shared || this.parameters.userId == this.parameters.token) {
        switch (change.field) {
          case 'points':
            this.doMeshPoints();
            break;
        }
      }
    });
  }

  remove() {
    super.remove();
    this.removeActions();
    this.removeMeshPoints();
    this.removeRays();
    this.removeSigns();
  }

  removeActions() {
    Object.entries(this.actions)?.forEach(([key, value]) => {
      this.parameters.canvas?.removeEventListener("pointermove", value, false);
      this.parameters.canvas?.removeEventListener("pointerup", value, false);
      this.parameters.canvas?.removeEventListener("pointerdown", value, false);
      this.parameters.canvas?.removeEventListener("contextmenu", value, false);
    });
  }

  removeMeshPoints() {
    this.meshPoints?.forEach(meshPoint => {
      meshPoint.dispose();
    });
    this.meshPoints = [];
  }

  removeRays() {
    this.rays?.forEach(ray => {
      ray.dispose();
    });
    this.rays = [];
  }

  removeSigns() {
    this.sumSign?.dispose();
    this.sumSignText?.dispose();
    this.sumSign = null;
    this.sumSignText = null;
  }

  initActions() {
    //action for start the rule drawing
    this.actions.startRule = (e) => {
      if (e.button == 0 && this.parameters.controller.activeTool?.name == 'rule') {
        var pick = this.parameters.scene.pick(this.parameters.scene.pointerX, this.parameters.scene.pointerY, (mesh) => { return mesh.isGround });
        if (pick?.pickedPoint) {
          var adjustedPoint = Vectors.getGridPoint(new BABYLON.Vector3(pick.pickedPoint.x, 0, pick.pickedPoint.z),
            this.parameters.controller.activeTool?.options?.adjustTo);


          this.actions.dragRule = () => {
            var pick = this.parameters.scene.pick(this.parameters.scene.pointerX, this.parameters.scene.pointerY, (mesh) => { return mesh.isGround });
            if (pick?.pickedPoint) {
              var adjustedPoint = Vectors.getGridPoint(new BABYLON.Vector3(pick.pickedPoint.x, 0, pick.pickedPoint.z),
                this.parameters.controller.activeTool?.options?.adjustTo);

              this.parameters.controller.send('game', 'rule', { x: adjustedPoint.x, y: adjustedPoint.z, action: 'move' });
            }
          }
          this.actions.addRule = (e) => {
            if (e.button == 2) {
              var pick = this.parameters.scene.pick(this.parameters.scene.pointerX, this.parameters.scene.pointerY, (mesh) => { return mesh.isGround });
              if (pick?.pickedPoint) {
                var adjustedPoint = Vectors.getGridPoint(new BABYLON.Vector3(pick.pickedPoint.x, 0, pick.pickedPoint.z),
                  this.parameters.controller.activeTool?.options?.adjustTo);
                this.parameters.controller.send('game', 'rule', { x: adjustedPoint.x, y: adjustedPoint.z, action: 'add' });
              }
            }
          }
          this.parameters.canvas.addEventListener("pointermove", this.actions.dragRule, false);
          this.parameters.canvas.addEventListener("contextmenu", this.actions.addRule, false);
          this.parameters.controller.send('game', 'rule', { x: adjustedPoint.x, y: adjustedPoint.z, action: 'start' });
          e.stopImmediatePropagation();
        }
      }
    };
    this.parameters.canvas.addEventListener("pointerdown", this.actions.startRule, false);

    //action for stop the rule drawing
    this.actions.stopRule = (e) => {
      if (e.button == 0 /*&& this.parameters.controller.activeTool?.name == 'rule'*/) {
        this.parameters.canvas.removeEventListener("pointermove", this.actions.dragRule, false);
        this.parameters.canvas.removeEventListener("contextmenu", this.actions.addRule, false);
        this.parameters.controller.send('game', 'rule', { action: 'end' });
      }
    }
    this.parameters.canvas.addEventListener("pointerup", this.actions.stopRule, false);
  }

  initSigns() {
    this.sumSign = new Rectangle();
    this.sumSign.width = "80px";
    this.sumSign.height = "55px";
    this.sumSign.cornerRadius = 5;
    this.sumSign.color = "White";
    this.sumSign.thickness = 0;
    this.sumSign.background = "Black";
    this.sumSign.linkOffsetY = -55;
    this.parameters.world.ui.addControl(this.sumSign);

    this.sumSignText = new TextBlock();
    this.sumSignText.text = "0ft\n0sq";
    this.sumSign.addControl(this.sumSignText);

    this.sumSign.alpha = 0;
  }

  doMeshPoints() {
    this.removeMeshPoints();
    this.removeRays();
    this.sum = 0;

    if (this.points.length) {
      for (let i = 0; i < this.points.length; i++) {
        var point = this.points[i];
        //create mesh
        this.meshPoints.push(this.parameters.assets.rulePoint.createInstance());

        //positioning mesh
        this.meshPoints[this.meshPoints.length - 1].position.y = 0;
        this.meshPoints[this.meshPoints.length - 1].position.x = point.x;
        this.meshPoints[this.meshPoints.length - 1].position.z = point.y;

        //enable mesh
        this.meshPoints[this.meshPoints.length - 1].setEnabled(true);

        if (i > 0) {
          var origin = new BABYLON.Vector3(this.points[i - 1].x, 0, this.points[i - 1].y);
          var target = new BABYLON.Vector3(point.x, 0, point.y);
          var targetNormalized = BABYLON.Vector3.Normalize(target.subtract(origin));
          var distance = BABYLON.Vector3.Distance(origin, target);
          var ray = new BABYLON.Ray(
            origin,
            targetNormalized,
            BABYLON.Vector3.Distance(origin, target)
          );
          this.rays.push(BABYLON.RayHelper.CreateAndShow(ray, this.parameters.scene, BABYLON.Color3.Yellow()));

          if (this.normalizeUnit) {
            var xDistance = Math.abs(origin.x - target.x);
            var zDistance = Math.abs(origin.z - target.z);
            this.sum += xDistance > zDistance ? xDistance : zDistance;
          } else {
            this.sum += distance;
          }
        }
      }

      this.sumSignText.text = Math.round(this.sum * 5 * 10) / 10 + ' ft\n ' + Math.round(this.sum * 10) / 10 + 'sq';
      this.sumSign.linkWithMesh(this.meshPoints[this.meshPoints.length - 1]);
      this.sumSign.alpha = 1;
    } else {
      this.sumSign.alpha = 0;
    }
  }
}
