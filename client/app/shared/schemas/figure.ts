import * as BABYLON from '@babylonjs/core/Legacy/legacy';
import { Vectors } from '../utils/vectors';
import { Shapes } from '../utils/shapes';
import { Point } from './point';
import { Schema } from './schema';
import {
  AdvancedDynamicTexture,
  Rectangle,
  TextBlock
} from '@babylonjs/gui';

export class Figure extends Schema {
  //schema
  points?: Point[];
  type?: string;
  shared?: boolean;
  normalizeUnit?: boolean;
  //game objects
  meshFigure?: any;
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
    this.removeMeshFigure();
    this.removeMeshPoints();
    this.removeRays();
    this.removeSigns();
  }

  removeActions() {
    Object.entries(this.actions)?.forEach(([key, value]) => {
      this.parameters.canvas?.removeEventListener("pointermove", value, false);
      this.parameters.canvas?.removeEventListener("pointerup", value, false);
      this.parameters.canvas?.removeEventListener("pointerdown", value, false);
    });
  }

  removeMeshFigure() {
    this.meshFigure?.dispose();
    this.meshFigure = null;
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
    //action for start the figure drawing
    this.actions.startFigure = (e) => {
      if (e.button == 0 && this.parameters.controller.activeTool?.name == 'figure') {
        var pick = this.parameters.scene.pick(this.parameters.scene.pointerX, this.parameters.scene.pointerY, (mesh) => { return mesh.isGround });
        if (pick?.pickedPoint) {
          var adjustedPoint = Vectors.getGridPoint(new BABYLON.Vector3(pick.pickedPoint.x, 0, pick.pickedPoint.z),
            this.parameters.controller.activeTool?.options?.adjustTo);

          this.actions.dragFigure = () => {
            var pick = this.parameters.scene.pick(this.parameters.scene.pointerX, this.parameters.scene.pointerY, (mesh) => { return mesh.isGround });
            if (pick?.pickedPoint) {
              var adjustedPoint = Vectors.getGridPoint(new BABYLON.Vector3(pick.pickedPoint.x, 0, pick.pickedPoint.z),
                this.parameters.controller.activeTool?.options?.adjustTo);

              this.parameters.controller.send('game', 'figure', { x: adjustedPoint.x, y: adjustedPoint.z, action: 'move' });
            }
          };
          this.parameters.canvas.addEventListener("pointermove", this.actions.dragFigure, false);
          this.parameters.controller.send('game', 'figure', { x: adjustedPoint.x, y: adjustedPoint.z, action: 'start' });
          e.stopImmediatePropagation();
        }
      }
    };
    this.parameters.canvas.addEventListener("pointerdown", this.actions.startFigure, false);

    //action for stop the figure drawing
    this.actions.stopFigure = (e) => {
      if (e.button == 0 /*&& this.parameters.controller.activeTool?.name == 'figure'*/) {
        this.parameters.canvas.removeEventListener("pointermove", this.actions.dragFigure, false);
        this.parameters.controller.send('game', 'figure', { action: 'end' });
      }
    }
    this.parameters.canvas.addEventListener("pointerup", this.actions.stopFigure, false);
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
    this.removeMeshFigure();
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
            distance
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

      switch (this.type) {
        case 'triangle': default:
          this.meshFigure = this.parameters.assets.triangleFigure.createInstance();
          this.meshFigure.position = origin;
          this.meshFigure.rotation.y = Vectors.Vector3.Angle(origin, target);
          this.meshFigure.scaling.x = this.sum;
          this.meshFigure.scaling.z = this.sum;
          break;
        case 'circle':
          this.meshFigure = this.parameters.assets.circleFigure.createInstance();
          this.meshFigure.position = origin;
          this.meshFigure.rotation.x = Math.PI * 2 / 4;
          this.meshFigure.scaling.x = this.sum;
          this.meshFigure.scaling.y = this.sum;
          break;
        case 'square':
          this.sum = this.sum * 2;

          this.meshFigure = this.parameters.assets.squareFigure.createInstance();
          this.meshFigure.position = origin;
          this.meshFigure.rotation.x = Math.PI * 2 / 4;
          this.meshFigure.scaling.x = this.sum;
          this.meshFigure.scaling.y = this.sum;
          break;
      }
      this.meshFigure.setEnabled(true);

      this.sumSignText.text = Math.round(this.sum * 5 * 10) / 10 + ' ft\n ' + Math.round(this.sum * 10) / 10 + 'sq';
      this.sumSign.linkWithMesh(this.meshPoints[this.meshPoints.length - 1]);
      this.sumSign.alpha = 1;
    } else {
      this.sumSign.alpha = 0;
    }
  }
}
