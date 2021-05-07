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
  maxPoints?: number;
  //game objects
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
          case 'maxPoints':
            this.init();
            break;
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
    this.removeLine();
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
    this.meshPoints.forEach((meshPoint) => {
      meshPoint.visibility = 0;
    });
    this.removeLine();
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
      if (e.button == 0) {
        this.parameters.canvas.removeEventListener("pointermove", this.actions.dragRule, false);
        this.parameters.canvas.removeEventListener("contextmenu", this.actions.addRule, false);
        if (this.parameters.controller.activeTool?.name == 'rule')
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

  init() {
    this.removeMeshPoints();
    //create mesh points
    for (let i = 0; i <= this.maxPoints; i++) {
      this.meshPoints.push(this.parameters.assets.rulePoint.clone());
      this.meshPoints[i].setEnabled(true);
      this.meshPoints[i].visibility = 0;
    }
  }

  doMeshPoints() {
    this.reset();
    this.sum = 0;

    if (!this.meshPoints?.length) this.init();
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
