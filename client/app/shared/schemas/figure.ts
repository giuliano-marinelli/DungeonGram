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
  meshPoints?: any[] = [];
  rays?: any[] = [];
  sumSign?: any;
  sumSignRectangle?: any;
  sumSignLabel?: any;
  sum?: number = 0;
  figureMesh?: any;

  constructor(schema, parameters) {
    super(parameters);

    this.initActions();

    this.synchronizeSchema(schema,
      {
        points: { type: Point, datatype: Array, onAdd: 'last', onRemove: 'first' }
      }
    );
  }

  update(changes?) {
    changes?.forEach((change) => {
      if (this.shared || this.parameters.userId == this.parameters.room.sessionId) {
        switch (change.field) {
          case 'points':
            this.doMeshPoints();
            break;
        }
      }
    });
  }

  initActions() {
    this.parameters.canvas.removeEventListener("pointermove", dragFigure, false);
    var dragFigure;
    this.parameters.canvas.addEventListener("pointerdown", (e) => {
      if (e.button == 0 && this.parameters.controller.activeTool?.name == 'figure') {
        var pick = this.parameters.scene.pick(this.parameters.scene.pointerX, this.parameters.scene.pointerY, (mesh) => { return mesh.isGround });
        if (pick?.pickedPoint) {
          var adjustedPoint = Vectors.getGridPoint(new BABYLON.Vector3(pick.pickedPoint.x, 0, pick.pickedPoint.z),
            this.parameters.controller.activeTool?.options?.adjustTo);


          dragFigure = () => {
            var pick = this.parameters.scene.pick(this.parameters.scene.pointerX, this.parameters.scene.pointerY, (mesh) => { return mesh.isGround });
            if (pick?.pickedPoint) {
              var adjustedPoint = Vectors.getGridPoint(new BABYLON.Vector3(pick.pickedPoint.x, 0, pick.pickedPoint.z),
                this.parameters.controller.activeTool?.options?.adjustTo);

              this.parameters.controller.send('game', 'figure', { x: adjustedPoint.x, y: adjustedPoint.z, action: 'move' });
            }
          }
          this.parameters.canvas.addEventListener("pointermove", dragFigure, false);
          this.parameters.controller.send('game', 'figure', { x: adjustedPoint.x, y: adjustedPoint.z, action: 'start' });
          e.stopImmediatePropagation();
        }
      }
    }, false);

    this.parameters.canvas.addEventListener("pointerup", (e) => {
      if (e.button == 0 && this.parameters.controller.activeTool?.name == 'figure') {
        this.parameters.canvas.removeEventListener("pointermove", dragFigure, false);
        this.parameters.controller.send('game', 'figure', { action: 'end' });
      }
    }, false);
  }

  doMeshPoints() {
    if (this.meshPoints) {
      this.meshPoints.forEach(meshPoint => {
        meshPoint.dispose();
      });
      this.meshPoints = [];

      this.rays.forEach(ray => {
        ray.dispose();
      });
      this.rays = [];

      this.figureMesh?.dispose();
      this.figureMesh = null;

      this.sum = 0;
    }

    for (let i = 0; i < this.points.length; i++) {
      var point = this.points[i];
      //create mesh
      this.meshPoints.push(BABYLON.MeshBuilder.CreateSphere('', { segments: 16, diameter: 0.2 }, this.parameters.scene));

      //set material
      var material = new BABYLON.StandardMaterial("ground", this.parameters.scene);
      material.diffuseColor = BABYLON.Color3.Yellow();
      material.alpha = 1;
      this.meshPoints[this.meshPoints.length - 1].material = material;

      //positioning mesh
      this.meshPoints[this.meshPoints.length - 1].position.y = 0;
      this.meshPoints[this.meshPoints.length - 1].position.x = point.x;
      this.meshPoints[this.meshPoints.length - 1].position.z = point.y;

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

        this.figureMesh?.dispose();

        switch (this.type) {
          case 'triangle':
            this.figureMesh = Shapes.createTriangle("triangle", this.parameters.scene);
            this.figureMesh.position = origin;
            this.figureMesh.rotation.y = Vectors.Vector3.Angle(origin, target);
            this.figureMesh.scaling.x = this.sum;
            this.figureMesh.scaling.z = this.sum;
            break;
          case 'circle': default:
            this.figureMesh = BABYLON.MeshBuilder.CreateDisc("circle", { radius: this.sum }, this.parameters.scene);
            this.figureMesh.position = origin;
            this.figureMesh.rotation.x = Math.PI * 2 / 4;
            break;
          case 'square':
            this.figureMesh = BABYLON.MeshBuilder.CreatePlane("square", { size: this.sum * 2 }, this.parameters.scene);
            this.figureMesh.position = origin;
            this.figureMesh.rotation.x = Math.PI * 2 / 4;
            this.sum = this.sum * 2;
            break;
        }

        var material = new BABYLON.StandardMaterial("figure", this.parameters.scene);
        material.diffuseColor = BABYLON.Color3.Red();
        material.emissiveColor = BABYLON.Color3.Red();
        material.alpha = 0.5;
        this.figureMesh.material = material;
      }
    }

    if (this.points.length) {
      if (!this.sumSign) {
        this.sumSign = AdvancedDynamicTexture.CreateFullscreenUI("UI");

        this.sumSignRectangle = new Rectangle();
        this.sumSignRectangle.width = "80px";
        this.sumSignRectangle.height = "55px";
        this.sumSignRectangle.cornerRadius = 5;
        this.sumSignRectangle.color = "White";
        this.sumSignRectangle.thickness = 0;
        this.sumSignRectangle.background = "Black";
        this.sumSign.addControl(this.sumSignRectangle);
        this.sumSignRectangle.linkWithMesh(this.meshPoints[this.meshPoints.length - 1]);
        this.sumSignRectangle.linkOffsetY = -55;

        this.sumSignLabel = new TextBlock();
        this.sumSignLabel.text = "0ft\n0sq";
        this.sumSignRectangle.addControl(this.sumSignLabel);
      } else {
        this.sumSignLabel.text = Math.round(this.sum * 5 * 10) / 10 + ' ft\n ' + Math.round(this.sum * 10) / 10 + 'sq';
        this.sumSignRectangle.linkWithMesh(this.meshPoints[this.meshPoints.length - 1]);
      }
    } else {
      this.sumSign?.dispose();
      this.sumSign = null;
    }
  }
}
