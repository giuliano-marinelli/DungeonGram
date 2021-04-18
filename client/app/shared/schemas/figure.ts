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
  meshFigureTriangle?: any;
  meshFigureCircle?: any;
  meshFigureSquare?: any;
  meshPoints?: any[] = [];
  line?: any;
  sumSign?: any;
  sumSignText?: any;
  sum?: number = 0;
  //global actions registered
  actions: any = {};

  constructor(schema, parameters) {
    super(parameters);

    this.initActions();
    this.initSigns();
    this.init();

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
    this.removeMeshFigures();
    this.removeMeshPoints();
    this.removeLine();
    this.removeSigns();
  }

  removeActions() {
    Object.entries(this.actions)?.forEach(([key, value]) => {
      this.parameters.canvas?.removeEventListener("pointermove", value, false);
      this.parameters.canvas?.removeEventListener("pointerup", value, false);
      this.parameters.canvas?.removeEventListener("pointerdown", value, false);
    });
  }

  removeMeshFigures() {
    this.meshFigureTriangle?.dispose();
    this.meshFigureCircle?.dispose();
    this.meshFigureSquare?.dispose();
    this.meshFigureTriangle = null;
    this.meshFigureCircle = null;
    this.meshFigureSquare = null;
  }

  removeMeshPoints() {
    this.meshPoints?.forEach(meshPoint => {
      meshPoint.dispose();
    });
    this.meshPoints = [];
  }

  removeLine() {
    this.line?.dispose();
    this.line = null;
  }

  removeSigns() {
    this.sumSign?.dispose();
    this.sumSignText?.dispose();
    this.sumSign = null;
    this.sumSignText = null;
  }

  reset() {
    this.meshFigureTriangle.visibility = 0;
    this.meshFigureCircle.visibility = 0;
    this.meshFigureSquare.visibility = 0;
    this.meshPoints.forEach((meshPoint) => {
      meshPoint.visibility = 0;
    });
    this.removeLine();
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

  init() {
    //create mesh figure triangle
    this.meshFigureTriangle = this.parameters.assets.triangleFigure.clone();
    this.meshFigureTriangle.setEnabled(true);
    this.meshFigureTriangle.visibility = 0;

    //create mesh figure circle
    this.meshFigureCircle = this.parameters.assets.circleFigure.clone();
    this.meshFigureCircle.setEnabled(true);
    this.meshFigureCircle.visibility = 0;

    //create mesh figure square
    this.meshFigureSquare = this.parameters.assets.squareFigure.clone();
    this.meshFigureSquare.setEnabled(true);
    this.meshFigureSquare.visibility = 0;

    //create mesh to
    for (let i = 0; i <= 2; i++) {
      this.meshPoints.push(this.parameters.assets.rulePoint.clone());
      this.meshPoints[i].setEnabled(true);
      this.meshPoints[i].visibility = 0;
    }
  }

  doMeshPoints() {
    this.reset()
    this.sum = 0;

    if (this.points.length) {
      var points3D = [];
      var colors = [];
      for (let i = 0; i < this.points.length; i++) {
        points3D.push(new BABYLON.Vector3(this.points[i].x, 0, this.points[i].y));
        colors.push(BABYLON.Color3.Yellow().toColor4());

        //show mesh point
        this.meshPoints[i].visibility = 1;

        //positioning mesh point
        this.meshPoints[i].position = points3D[i];

        if (i > 0) {
          if (this.normalizeUnit) {
            var xDistance = Math.abs(this.points[i - 1].x - this.points[i].x);
            var zDistance = Math.abs(this.points[i - 1].y - this.points[i].y);
            this.sum += xDistance > zDistance ? xDistance : zDistance;
          } else {
            this.sum += BABYLON.Vector3.Distance(points3D[i - 1], points3D[i]);
          }
        }
      }

      //show the figure shape mesh
      switch (this.type) {
        case 'triangle': default:
          this.meshFigureTriangle.visibility = 1;
          this.meshFigureTriangle.position = points3D[0];
          this.meshFigureTriangle.rotation.y = Vectors.Vector3.Angle(points3D[0], points3D[1]);
          this.meshFigureTriangle.scaling.x = this.sum;
          this.meshFigureTriangle.scaling.z = this.sum;
          break;
        case 'circle':
          this.meshFigureCircle.visibility = 1;
          this.meshFigureCircle.position = points3D[0];
          this.meshFigureCircle.rotation.x = Math.PI * 2 / 4;
          this.meshFigureCircle.scaling.x = this.sum;
          this.meshFigureCircle.scaling.y = this.sum;
          break;
        case 'square':
          this.sum = this.sum * 2;

          this.meshFigureSquare.visibility = 1;
          this.meshFigureSquare.position = points3D[0];
          this.meshFigureSquare.rotation.x = Math.PI * 2 / 4;
          this.meshFigureSquare.scaling.x = this.sum;
          this.meshFigureSquare.scaling.y = this.sum;
          break;
      }

      //create line based on the points
      this.line = BABYLON.MeshBuilder.CreateLines("lines", { points: points3D, colors: colors }, this.parameters.scene);

      //show signs with the measures
      this.sumSignText.text = Math.round(this.sum * 5 * 10) / 10 + ' ft\n ' + Math.round(this.sum * 10) / 10 + 'sq';
      this.sumSign.linkWithMesh(this.meshPoints[this.points.length - 1]);
      this.sumSign.alpha = 1;
    } else {
      this.sumSign.alpha = 0;
    }
  }
}
