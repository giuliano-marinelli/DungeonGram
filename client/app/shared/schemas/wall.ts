import * as BABYLON from '@babylonjs/core/Legacy/legacy';
import { Point } from './point';
import { Schema } from './schema';
import { Vectors } from '../utils/vectors';

export class Wall extends Schema {
  //schema
  id?: string;
  from?: Point;
  to?: Point;
  size?: string;
  //game objects
  mesh?: any;
  //physics
  tilesPhysics?: Point[];
  tilesPhysicsColliders?: any[] = [];

  constructor(schema, parameters) {
    super(parameters);

    this.id = parameters.id;

    this.synchronizeSchema(schema,
      {
        from: { type: Point, datatype: Object },
        to: { type: Point, datatype: Object },
        tilesPhysics: { type: Point, datatype: Array, onAdd: 'last', onRemove: 'first' }
      }
    );

    this.doMesh();
  }

  doMesh() {
    var height = 2.55;
    if (this.size == 'medium') height = height / 2;
    if (this.size == 'small' || this.size == 'collider') height = height / 4;
    this.mesh = BABYLON.MeshBuilder.CreateBox('', { height: height, width: 1, depth: 0.01 }, this.parameters.scene);
    // this.mesh = BABYLON.MeshBuilder.CreateBox('', { height: 1, width: 1, depth: 0.01 }, this.parameters.scene);
    this.mesh.scaling.x = Vectors.distance(this.from, this.to);
    //set material of base tile mesh
    var material = new BABYLON.StandardMaterial("wall", this.parameters.scene);
    material.diffuseColor = BABYLON.Color3.Gray();
    this.mesh.material = material;
    // this.mesh.visibility = this.visibility;
    // this.mesh.isPickable = this.pickable;

    //positioning mesh
    var middlePoint = Vectors.middlePoint(this.from, this.to);
    this.mesh.position.y = height / 2 - 0.05;
    // this.mesh.position.y = 0.45;
    this.mesh.position.x = middlePoint.x;
    this.mesh.position.z = middlePoint.y;
    this.mesh.isCollible = true;
    this.mesh.isWall = true;

    //rotate relative to orientation
    // if (this.from.x == this.to.x)
    this.mesh.rotate(BABYLON.Axis.Y, Vectors.angle(this.from, this.to), BABYLON.Space.WORLD);

    this.tilesPhysics.forEach((tile) => {
      var tileCollider = BABYLON.MeshBuilder.CreateBox('', { height: 0.1, width: 0.5, depth: 0.5 }, this.parameters.scene);
      this.tilesPhysicsColliders.push(tileCollider);
      var material = new BABYLON.StandardMaterial('', this.parameters.scene);
      material.diffuseColor = BABYLON.Color3.Red();
      tileCollider.material = material;
      tileCollider.visibility = 0;
      tileCollider.position.x = tile.x;
      tileCollider.position.z = tile.y;
      tileCollider.position.y = 0.05;
    });

    //set action on mouse in/out
    this.mesh.actionManager = new BABYLON.ActionManager(this.parameters.scene);
    this.mesh.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOutTrigger, () => {
      this.mesh.material.emissiveColor = BABYLON.Color3.Black();
    }));
    this.mesh.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOverTrigger, () => {
      if (this.parameters.controller.activeTool?.name == 'walls')
        this.mesh.material.emissiveColor = BABYLON.Color3.White();
    }));
    this.mesh.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnLeftPickTrigger, (e) => {
      if (this.parameters.controller.activeTool?.name == 'walls'
        && this.parameters.controller.activeTool?.options?.remove
        && e.sourceEvent.ctrlKey)
        this.parameters.controller.send('game', 'wall', { id: this.id, action: 'remove' });
    }));

    //cast shadows with character light (if it's not an only collider wall)
    if (this.size != 'collider')
      this.parameters.world.lights.characterLight._shadowGenerator.addShadowCaster(this.mesh);
    this.parameters.world.updateCharactersVisibility();
    this.parameters.world.updateWallVisibility(this);
  }

  remove() {
    super.remove();
    this.mesh.dispose();
    this.tilesPhysicsColliders.forEach((tilesPhysicsCollider) => {
      tilesPhysicsCollider.dispose();
    })
    this.parameters.world.updateCharactersVisibility();
  }
}
