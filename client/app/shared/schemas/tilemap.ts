import * as BABYLON from '@babylonjs/core/Legacy/legacy';
import { Schema } from './schema';
import { Tile } from './tile';
import {
  GridMaterial,
  ShadowOnlyMaterial
} from '@babylonjs/materials';
import { Vectors } from '../utils/vectors';

export class TileMap extends Schema {
  //schema
  width?: number;
  height?: number;
  // tiles?: Tile[];
  //game objects
  ground?: any;
  baseTileMesh?: any;
  terrain?: any;
  terrainShadows?: any;
  gridMaterial?: any;

  constructor(schema, parameters) {
    super(parameters);

    // this.doBaseTileMesh();

    this.synchronizeSchema(schema,
      {
        // tiles: { type: Tile, datatype: Array, parameters: (key) => { return { scene: parameters.scene, room: parameters.room, id: key, baseTileMesh: this.baseTileMesh } } }
      }
    );

    this.initGround();

    this.initActions();

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
    this.ground.isGround = true;

    //grid material
    this.gridMaterial = new GridMaterial("gridMaterial", this.parameters.scene);
    this.gridMaterial.mainColor = BABYLON.Color3.Black();
    this.gridMaterial.lineColor = BABYLON.Color3.White();
    this.gridMaterial.opacity = 0.5;
    this.gridMaterial.gridRatio = 1;
    this.gridMaterial.minorUnitVisibility = 1;
    this.gridMaterial.majorUnitFrequency = 0;

    //standard material
    var material = new BABYLON.StandardMaterial("ground", this.parameters.scene);
    material.diffuseColor = BABYLON.Color3.Black();
    material.alpha = 0.5;

    //set material of ground
    this.ground.material = this.gridMaterial;
  }

  initActions() {
    var temporalWallStartPoint;
    var temporalWallEndPoint;
    var temporalWallRay;
    var dragWall;

    //click action on ground for move player
    this.ground.actionManager = new BABYLON.ActionManager(this.parameters.scene);
    this.ground.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickDownTrigger, (e) => {
      //only works with left click (left: 0, middle: 1, right: 2)
      if (e.sourceEvent.button == 0) {
        var pick = this.parameters.scene.pick(this.parameters.scene.pointerX, this.parameters.scene.pointerY, (mesh) => { return mesh.isGround });
        if (this.parameters.controller.activeTool?.name == 'walls') {
          var x = pick.pickedPoint.x;
          var z = pick.pickedPoint.z;
          if (this.parameters.controller.activeTool?.options?.adjustToGrid) {
            x = Math.round(pick.pickedPoint.x * 2) / 2;
            x = x % 1 == 0 ? x + 0.5 : x;
            z = Math.round(pick.pickedPoint.z * 2) / 2;
            z = z % 1 == 0 ? z + 0.5 : z;
          }
          if (!temporalWallStartPoint && !temporalWallEndPoint) {
            temporalWallStartPoint = BABYLON.MeshBuilder.CreateBox('', { height: 2.55, width: 0.1, depth: 0.1 }, this.parameters.scene);
            temporalWallStartPoint.position = new BABYLON.Vector3(x, 1.25, z);
            temporalWallStartPoint.isPickable = false;
            temporalWallEndPoint = BABYLON.MeshBuilder.CreateBox('', { height: 2.55, width: 0.1, depth: 0.1 }, this.parameters.scene);
            temporalWallEndPoint.position = new BABYLON.Vector3(x, 1.25, z);
            temporalWallEndPoint.isPickable = false;
            dragWall = () => {
              temporalWallRay?.dispose();
              var pick = this.parameters.scene.pick(this.parameters.scene.pointerX, this.parameters.scene.pointerY, (mesh) => { return mesh.isGround });
              if (pick.pickedPoint) {
                var x = pick.pickedPoint?.x;
                var z = pick.pickedPoint?.z;
                if (this.parameters.controller.activeTool?.options?.adjustToGrid) {
                  x = Math.round(pick.pickedPoint.x * 2) / 2;
                  x = x % 1 == 0 ? x + 0.5 : x;
                  z = Math.round(pick.pickedPoint.z * 2) / 2;
                  z = z % 1 == 0 ? z + 0.5 : z;
                }
                var origin = new BABYLON.Vector3(temporalWallStartPoint.position.x, 0, temporalWallStartPoint.position.z);
                var target = new BABYLON.Vector3(temporalWallEndPoint.position.x, 0, temporalWallEndPoint.position.z);
                var targetNormalized = BABYLON.Vector3.Normalize(target.subtract(origin));
                var ray = new BABYLON.Ray(
                  origin,
                  targetNormalized,
                  BABYLON.Vector3.Distance(origin, target)
                );
                temporalWallRay = BABYLON.RayHelper.CreateAndShow(ray, this.parameters.scene, new BABYLON.Color3(1, 1, 0.1));
                temporalWallEndPoint.position = new BABYLON.Vector3(x, 1.25, z);
              }
            }
            this.parameters.canvas.addEventListener("pointermove", dragWall, false);
          }
          this.parameters.controller.send('game', 'wall', { x: x, y: z, action: 'start' });
        }
      }
    }));
    // this.ground.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickUpTrigger, (e) => {
    this.parameters.canvas.addEventListener("pointerup", (e) => {
      //only works with left click (left: 0, middle: 1, right: 2)
      if (e.button == 0) {
        var pick = this.parameters.scene.pick(this.parameters.scene.pointerX, this.parameters.scene.pointerY, (mesh) => { return mesh.isGround });
        if (pick.pickedPoint) {
          if (!this.parameters.controller.activeTool && !this.parameters.controller.activeAction)
            this.parameters.controller.send('game', 'move', { x: Math.round(pick.pickedPoint.x), y: Math.round(pick.pickedPoint.z) });
          else if (this.parameters.controller.activeTool?.name == 'walls') {
            var x = pick.pickedPoint?.x;
            var z = pick.pickedPoint?.z;
            if (this.parameters.controller.activeTool?.options?.adjustToGrid) {
              x = Math.round(pick.pickedPoint.x * 2) / 2;
              x = x % 1 == 0 ? x + 0.5 : x;
              z = Math.round(pick.pickedPoint.z * 2) / 2;
              z = z % 1 == 0 ? z + 0.5 : z;
            }
            this.parameters.canvas.removeEventListener("pointermove", dragWall, false);
            temporalWallStartPoint?.dispose();
            temporalWallEndPoint?.dispose();
            temporalWallRay?.dispose();
            temporalWallStartPoint = null;
            temporalWallEndPoint = null;
            temporalWallRay = null;
            this.parameters.controller.send('game', 'wall', { x: x, y: z, action: 'end' });
          }
        }
      }
    }, false);
  }

  initTerrain() {
    if (this.terrain) {
      this.terrain.scaling.x = this.width;
      this.terrain.scaling.z = this.height;
      this.terrain.position = new BABYLON.Vector3(this.width / 2 - 0.5, -0.05, this.height / 2 - 0.5);

      this.terrainShadows.scaling.x = this.width;
      this.terrainShadows.scaling.z = this.height;
      this.terrainShadows.position = new BABYLON.Vector3(this.width / 2 - 0.5, -0.025, this.height / 2 - 0.5);
    } else {
      this.terrain = BABYLON.MeshBuilder.CreateGround('terrain', { width: 1, height: 1 }, this.parameters.scene);
      this.terrain.position = new BABYLON.Vector3(this.width / 2 - 0.5, -0.05, this.height / 2 - 0.5);
      this.terrain.scaling.x = this.width;
      this.terrain.scaling.z = this.height;

      this.terrainShadows = BABYLON.MeshBuilder.CreateGround('terrainShadows', { width: 1, height: 1 }, this.parameters.scene);
      this.terrainShadows.position = new BABYLON.Vector3(this.width / 2 - 0.5, -0.025, this.height / 2 - 0.5);
      this.terrainShadows.scaling.x = this.width;
      this.terrainShadows.scaling.z = this.height;

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

      this.terrainShadows.material = new ShadowOnlyMaterial('shadowOnly', this.parameters.scene)

      //receive shadows
      this.terrain.receiveShadows = true;

      this.terrainShadows.receiveShadows = true;

      //update lights casted on it
      this.parameters.world.updateLights();
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
