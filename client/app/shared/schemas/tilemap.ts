import * as BABYLON from '@babylonjs/core/Legacy/legacy';
import { Schema } from './schema';
import { Tile } from './tile';
import {
  GridMaterial
} from '@babylonjs/materials';

export class TileMap extends Schema {
  //schema
  width?: number;
  height?: number;
  // tiles?: Tile[];
  //game objects
  ground?: any;
  baseTileMesh?: any;
  terrain?: any;

  constructor(schema, parameters) {
    super(parameters);

    // this.doBaseTileMesh();

    this.synchronizeSchema(schema,
      {
        // tiles: { type: Tile, datatype: Array, parameters: (key) => { return { scene: parameters.scene, room: parameters.room, id: key, baseTileMesh: this.baseTileMesh } } }
      }
    );

    this.initGround();

    this.initTerrain();
  }

  remove() {
    super.remove();
    this.baseTileMesh.dispose();
  }

  update(changes) {
    this.initGround();
    this.initTerrain();
  }

  initGround() {
    if (this.ground) {
      this.ground.dispose();
      // this.ground.scaling.x = this.width;
      // this.ground.scaling.z = this.height;
    }
    this.ground = BABYLON.MeshBuilder.CreateGround('ground', { width: this.width, height: this.height }, this.parameters.scene);
    this.ground.position = new BABYLON.Vector3(this.width / 2 - 0.5, 0, this.height / 2 - 0.5);
    // this.ground.scaling.x = this.width;
    // this.ground.scaling.z = this.height;

    //grid material
    var gridMaterial = new GridMaterial("gridMaterial", this.parameters.scene);
    gridMaterial.mainColor = BABYLON.Color3.Black();
    gridMaterial.lineColor = BABYLON.Color3.White();
    gridMaterial.opacity = 0.5;
    gridMaterial.gridRatio = 1;
    gridMaterial.minorUnitVisibility = 1;
    gridMaterial.majorUnitFrequency = 0;

    //standard material
    var material = new BABYLON.StandardMaterial("ground", this.parameters.scene);
    material.diffuseColor = BABYLON.Color3.Black();
    material.alpha = 0.5;

    //set material of ground
    this.ground.material = gridMaterial;

    //click action on ground for move player
    this.ground.actionManager = new BABYLON.ActionManager(this.parameters.scene);
    this.ground.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickUpTrigger, (e) => {
      //only works with left click (left: 0, middle: 1, right: 2)
      if (e.sourceEvent.button == 0) {
        var pick = this.parameters.scene.pick(this.parameters.scene.pointerX, this.parameters.scene.pointerY);
        if (!this.parameters.controller.activeTool && !this.parameters.controller.activeAction)
          this.parameters.controller.send('game', 'move', { x: Math.round(pick.pickedPoint.x), y: Math.round(pick.pickedPoint.z) });
        else if (this.parameters.controller.activeTool?.name == 'walls') {
          var x = pick.pickedPoint.x;
          var z = pick.pickedPoint.z;
          if (this.parameters.controller.activeTool?.options?.adjustToGrid) {
            x = Math.round(pick.pickedPoint.x * 2) / 2;
            x = x % 1 == 0 ? x + 0.5 : x;
            z = Math.round(pick.pickedPoint.z * 2) / 2;
            z = z % 1 == 0 ? z + 0.5 : z;
          }
          this.parameters.controller.send('game', 'wall', { x: x, y: z, action: 'end' });
        }
      }
    }));
    this.ground.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickDownTrigger, (e) => {
      //only works with left click (left: 0, middle: 1, right: 2)
      if (e.sourceEvent.button == 0) {
        var pick = this.parameters.scene.pick(this.parameters.scene.pointerX, this.parameters.scene.pointerY);
        if (this.parameters.controller.activeTool?.name == 'walls') {
          var x = pick.pickedPoint.x;
          var z = pick.pickedPoint.z;
          if (this.parameters.controller.activeTool?.options?.adjustToGrid) {
            x = Math.round(pick.pickedPoint.x * 2) / 2;
            x = x % 1 == 0 ? x + 0.5 : x;
            z = Math.round(pick.pickedPoint.z * 2) / 2;
            z = z % 1 == 0 ? z + 0.5 : z;
          }
          this.parameters.controller.send('game', 'wall', { x: x, y: z, action: 'start' });
        }
      }
    }));

  }

  initTerrain() {
    if (this.terrain) {
      this.terrain.scaling.x = this.width;
      this.terrain.scaling.z = this.height;
      this.terrain.position = new BABYLON.Vector3(this.width / 2 - 0.5, -0.05, this.height / 2 - 0.5);
    } else {

      this.terrain = BABYLON.MeshBuilder.CreateGround('terrain', { width: 1, height: 1 }, this.parameters.scene);
      this.terrain.position = new BABYLON.Vector3(this.width / 2 - 0.5, -0.05, this.height / 2 - 0.5);
      this.terrain.scaling.x = this.width;
      this.terrain.scaling.z = this.height;

      //standard material
      var material = new BABYLON.StandardMaterial("terrain", this.parameters.scene);
      var texture = new BABYLON.Texture('https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/ff727761-d6b1-4548-916b-3b9033c9149d/ddbvz3t-02a6fb39-0481-46c3-96c2-7eeea043447f.jpg/v1/fill/w_1920,h_1920,q_75,strp/empty_dungeon_map_by_zatnikotel_ddbvz3t-fullview.jpg?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOiIsImlzcyI6InVybjphcHA6Iiwib2JqIjpbW3siaGVpZ2h0IjoiPD0xOTIwIiwicGF0aCI6IlwvZlwvZmY3Mjc3NjEtZDZiMS00NTQ4LTkxNmItM2I5MDMzYzkxNDlkXC9kZGJ2ejN0LTAyYTZmYjM5LTA0ODEtNDZjMy05NmMyLTdlZWVhMDQzNDQ3Zi5qcGciLCJ3aWR0aCI6Ijw9MTkyMCJ9XV0sImF1ZCI6WyJ1cm46c2VydmljZTppbWFnZS5vcGVyYXRpb25zIl19.cLV4Dlz3BMU8z6D7uGnV6HsL37wNFxNLYJOATxYmUDY',
        this.parameters.scene);
      material.diffuseTexture = texture;

      // material = new BABYLON.StandardMaterial("terrain", this.parameters.scene);
      // material.diffuseTexture = new BABYLON.Texture("textures/ground.jpg", this.parameters.scene);
      // material.specularColor = new BABYLON.Color3(0, 0, 0);

      //set material of ground
      this.terrain.material = material;

      //receive shadows
      this.terrain.receiveShadows = true;
    }
  }

  //DESUSED
  doBaseTileMesh() {
    //create base tile mesh
    this.baseTileMesh = BABYLON.MeshBuilder.CreateBox('', { height: 0.1, width: 0.9, depth: 0.9 }, this.parameters.scene);
    this.baseTileMesh.position.y = 10000;

    //set material of base tile mesh
    var material = new BABYLON.StandardMaterial("ground", this.parameters.scene);
    material.diffuseColor = BABYLON.Color3.Black();
    material.alpha = 0.5;
    this.baseTileMesh.material = material;
  }
}
