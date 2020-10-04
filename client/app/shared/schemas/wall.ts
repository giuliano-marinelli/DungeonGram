import * as BABYLON from '@babylonjs/core/Legacy/legacy';
import { Point } from './point';
import { Schema } from './schema';
import { Vectors } from '../utils/vectors';

export class Wall extends Schema {
  //schema
  id?: string;
  from?: Point;
  to?: Point;
  //game objects
  mesh?: any;

  constructor(schema, parameters) {
    super(parameters);

    this.id = parameters.id;

    this.synchronizeSchema(schema,
      {
        from: { type: Point, datatype: Object },
        to: { type: Point, datatype: Object }
      }
    );

    this.doMesh();
  }

  doMesh() {
    this.mesh = BABYLON.MeshBuilder.CreateBox('', { height: 2.55, width: 1, depth: 0.01 }, this.parameters.scene);
    this.mesh.scaling.x = Vectors.distance(this.from, this.to);
    //set material of base tile mesh
    var material = new BABYLON.StandardMaterial("wall", this.parameters.scene);
    material.diffuseColor = BABYLON.Color3.Gray();
    this.mesh.material = material;
    // this.mesh.visibility = this.visibility;
    // this.mesh.isPickable = this.pickable;

    //positioning mesh
    var middlePoint = Vectors.middlePoint(this.from, this.to);
    this.mesh.position.y = 1.25;
    this.mesh.position.x = middlePoint.x;
    this.mesh.position.z = middlePoint.y;
    this.mesh.isCollible = true;

    //rotate relative to orientation
    // if (this.from.x == this.to.x)
    this.mesh.rotate(BABYLON.Axis.Y, Vectors.angle(this.from, this.to), BABYLON.Space.WORLD);

    //set action on mouse in/out
    this.mesh.actionManager = new BABYLON.ActionManager(this.parameters.scene);
    this.mesh.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOutTrigger, () => {
      this.mesh.material.emissiveColor = BABYLON.Color3.Black();
    }));
    this.mesh.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOverTrigger, () => {
      if (this.parameters.controller.activeTool?.name == 'walls')
        this.mesh.material.emissiveColor = BABYLON.Color3.White();
    }));
    this.mesh.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnLeftPickTrigger, () => {
      if (this.parameters.controller.activeTool?.name == 'walls' && this.parameters.controller.activeTool?.options?.remove)
        this.parameters.controller.send('game', 'wall', { id: this.id, action: 'remove' });
    }));

    this.parameters.world.updatePlayersVisibility();
    this.parameters.world.updateShadows();
    this.parameters.world.updateWalls();
  }

  remove() {
    super.remove();
    this.mesh.dispose();
    this.parameters.world.updatePlayersVisibility();
  }
}
