import * as BABYLON from '@babylonjs/core/Legacy/legacy';
import { Schema } from './schema';
import { Tile } from './tile';
import { GridMaterial, ShadowOnlyMaterial } from '@babylonjs/materials';
import { Vectors } from '../utils/vectors';

export class TileMap extends Schema {
  //schema
  width?: number;
  height?: number;
  terrain?: string;
  // tiles?: Tile[];
  //game objects
  ground?: any;
  baseTileMesh?: any;
  terrainMesh?: any;
  terrainShadows?: any;
  gridMaterial?: any;
  //game objects for walls
  temporalWallStartPoint?: any;
  temporalWallEndPoint?: any;
  temporalWallRay?: any[] = [];
  //global actions registered
  actions: any = {};

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
    this.initActions();
  }

  remove() {
    super.remove();
    this.removeActions();
    this.removeTemporalWalls();
    this.baseTileMesh?.dispose();
    this.ground?.dispose();
    this.terrainMesh?.dispose();
    this.terrainShadows?.dispose();
    this.gridMaterial?.dispose();
    this.baseTileMesh = null;
    this.ground = null;
    this.terrainMesh = null;
    this.terrainShadows = null;
    this.gridMaterial = null;
  }

  removeActions() {
    Object.entries(this.actions)?.forEach(([key, value]) => {
      this.parameters.canvas?.removeEventListener("pointermove", value, false);
      this.parameters.canvas?.removeEventListener("pointerup", value, false);
      this.parameters.canvas?.removeEventListener("pointerdown", value, false);
      this.parameters.canvas?.removeEventListener("contextmenu", value, false);
    });
  }

  removeTemporalWalls() {
    this.temporalWallStartPoint?.dispose();
    this.temporalWallEndPoint?.dispose();
    this.temporalWallStartPoint = null;
    this.temporalWallEndPoint = null;
  }

  update(changes) {
    changes?.forEach((change) => {
      switch (change.field) {
        case 'terrain':
          this.updateTerrainImage();
          break;
      }
    });

    this.parameters.controller.updateSetting('gridWidth', this.width);
    this.parameters.controller.updateSetting('gridHeight', this.height);
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
    this.gridMaterial.lineColor = BABYLON.Color3.Black();
    this.gridMaterial.opacity = 0.75;
    this.gridMaterial.gridRatio = 1;
    this.gridMaterial.minorUnitVisibility = 1;
    this.gridMaterial.majorUnitFrequency = 0;

    //standard material
    var material = new BABYLON.StandardMaterial("ground", this.parameters.scene);
    material.diffuseColor = BABYLON.Color3.Black();
    material.alpha = 0.5;

    //set material of ground
    this.ground.material = this.gridMaterial;

    //update tilemap visibility
    this.parameters.world.updateTilemap();
  }

  initActions() {
    //set temparal walls meshes
    this.temporalWallStartPoint = this.parameters.assets.temporalWall.clone();
    this.temporalWallStartPoint.setEnabled(true);
    this.temporalWallStartPoint.visibility = 0;
    this.temporalWallEndPoint = this.parameters.assets.temporalWall.clone();
    this.temporalWallEndPoint.setEnabled(true);
    this.temporalWallEndPoint.visibility = 0;

    var addTemporalWall = (adjustedPoint) => {
      var height = 2.55;
      if (this.parameters.controller.activeTool?.options?.size == 'medium')
        height = height / 2;
      if (this.parameters.controller.activeTool?.options?.size == 'small' ||
        (this.parameters.controller.activeTool?.options?.size == 'collider' &&
          this.parameters.controller.activeTool?.options?.type != 'door'))
        height = height / 4;
      this.temporalWallStartPoint.visibility = 1;
      this.temporalWallStartPoint.scaling.y = height;
      this.temporalWallStartPoint.position = new BABYLON.Vector3(adjustedPoint.x, height / 2 - 0.05, adjustedPoint.z);
      this.temporalWallStartPoint.isPickable = false;
      this.temporalWallEndPoint.visibility = 1;
      this.temporalWallEndPoint.scaling.y = height;
      this.temporalWallEndPoint.position = new BABYLON.Vector3(adjustedPoint.x, height / 2 - 0.05, adjustedPoint.z);
      this.temporalWallEndPoint.isPickable = false;
      this.actions.dragWall = () => {
        this.temporalWallRay[0]?.dispose();
        this.temporalWallRay[1]?.dispose();
        var pick = this.parameters.scene.pick(this.parameters.scene.pointerX, this.parameters.scene.pointerY, (mesh) => { return mesh.isGround });
        if (pick.pickedPoint) {
          var adjustedPoint = Vectors.getGridPoint(new BABYLON.Vector3(pick.pickedPoint.x, 0, pick.pickedPoint.z),
            this.parameters.controller.activeTool?.options?.adjustTo);
          var originA = new BABYLON.Vector3(this.temporalWallStartPoint.position.x, 0, this.temporalWallStartPoint.position.z);
          var targetA = new BABYLON.Vector3(this.temporalWallEndPoint.position.x, 0, this.temporalWallEndPoint.position.z);
          var originB = new BABYLON.Vector3(this.temporalWallStartPoint.position.x, height, this.temporalWallStartPoint.position.z);
          var targetB = new BABYLON.Vector3(this.temporalWallEndPoint.position.x, height, this.temporalWallEndPoint.position.z);
          var targetNormalized = BABYLON.Vector3.Normalize(targetA.subtract(originA));
          var rayA = new BABYLON.Ray(originA, targetNormalized, BABYLON.Vector3.Distance(originA, targetA));
          var rayB = new BABYLON.Ray(originB, targetNormalized, BABYLON.Vector3.Distance(originB, targetB));
          this.temporalWallRay[0] = BABYLON.RayHelper.CreateAndShow(rayA, this.parameters.scene, new BABYLON.Color3(1, 1, 0.1));
          this.temporalWallRay[1] = BABYLON.RayHelper.CreateAndShow(rayB, this.parameters.scene, new BABYLON.Color3(1, 1, 0.1));
          this.temporalWallEndPoint.position = new BABYLON.Vector3(adjustedPoint.x, height / 2 - 0.05, adjustedPoint.z);
        }
      }
      this.parameters.canvas.addEventListener("pointermove", this.actions.dragWall, false);
      this.parameters.canvas.addEventListener("contextmenu", this.actions.cancelWall, false);
    };

    var removeTemporalWall = () => {
      this.parameters.canvas.removeEventListener("pointermove", this.actions.dragWall, false);
      this.temporalWallStartPoint.visibility = 0;
      this.temporalWallEndPoint.visibility = 0;
      this.temporalWallRay[0]?.dispose();
      this.temporalWallRay[1]?.dispose();
      this.temporalWallRay = [];
    };

    this.actions.cancelWall = (e) => {
      if (e.button == 2) {
        removeTemporalWall();
        this.parameters.controller.send('game', 'wall', { action: 'cancel' });
        this.parameters.canvas.removeEventListener("pointermove", this.actions.dragWall, false);
        this.parameters.canvas.removeEventListener("contextmenu", this.actions.cancelWall, false);
      }
    };

    this.actions.startWall = (e) => {
      //only works with left click (left: 0, middle: 1, right: 2)
      if (e.button == 0) {
        var pick = this.parameters.scene.pick(this.parameters.scene.pointerX, this.parameters.scene.pointerY, (mesh) => { return mesh.isGround || mesh.isWall });
        if (pick.pickedPoint) {
          if (this.parameters.controller.activeTool?.name == 'walls' &&
            (!this.parameters.controller.activeTool?.options.remove || !pick.pickedMesh.isWall)) {
            var adjustedPoint = Vectors.getGridPoint(new BABYLON.Vector3(pick.pickedPoint.x, 0, pick.pickedPoint.z),
              this.parameters.controller.activeTool?.options?.adjustTo);

            addTemporalWall(adjustedPoint);
            this.parameters.controller.send('game', 'wall', { x: adjustedPoint.x, y: adjustedPoint.z, action: 'start' });
          }
        }
      }
    };
    this.parameters.canvas.addEventListener("pointerdown", this.actions.startWall, false);

    this.actions.stopWallMoveLookAt = (e) => {
      //only works with left click (left: 0, middle: 1, right: 2)
      if (e.button == 0 && !e.ctrlKey) {
        var pick = this.parameters.scene.pick(this.parameters.scene.pointerX, this.parameters.scene.pointerY, (mesh) => { return mesh.isGround });
        var pickCharacter = this.parameters.scene.pick(this.parameters.scene.pointerX, this.parameters.scene.pointerY, (mesh) => { return mesh.isCharacter });
        if (pick.pickedPoint && !pickCharacter?.pickedPoint) {
          if (!this.parameters.controller.activeTool && !this.parameters.controller.activeAction) {
            var xToMove = pick.pickedPoint.x;
            var zToMove = pick.pickedPoint.z;
            if (!e.altKey) {
              xToMove = Math.round(pick.pickedPoint.x);
              zToMove = Math.round(pick.pickedPoint.z);
            }
            if (e.shiftKey) {
              this.parameters.controller.send('game', 'character', { x: xToMove, y: zToMove, action: 'lookAt' });
            } else {
              this.parameters.controller.send('game', 'character', { x: xToMove, y: zToMove, action: 'move' });
            }
          } else if (this.parameters.controller.activeTool?.name == 'walls' && !e.shiftKey) {
            var adjustedPoint = Vectors.getGridPoint(new BABYLON.Vector3(pick.pickedPoint.x, 0, pick.pickedPoint.z),
              this.parameters.controller.activeTool?.options?.adjustTo);
            this.parameters.controller.send('game', 'wall', {
              x: adjustedPoint.x, y: adjustedPoint.z,
              size: this.parameters.controller.activeTool?.options?.size,
              type: this.parameters.controller.activeTool?.options?.type,
              action: 'end'
            });
          }
          //clear wall events and temporal meshes
          this.parameters.canvas.removeEventListener("pointermove", this.actions.dragWall, false);
          this.parameters.canvas.removeEventListener("contextmenu", this.actions.cancelWall, false);
          removeTemporalWall();
        }
      }
    };
    this.parameters.canvas.addEventListener("pointerup", this.actions.stopWallMoveLookAt, false);
  }

  initTerrain() {
    if (this.terrainMesh) {
      this.terrainMesh.scaling.x = this.width;
      this.terrainMesh.scaling.z = this.height;
      this.terrainMesh.position = new BABYLON.Vector3(this.width / 2 - 0.5, -0.05, this.height / 2 - 0.5);

      this.terrainShadows.scaling.x = this.width;
      this.terrainShadows.scaling.z = this.height;
      this.terrainShadows.position = new BABYLON.Vector3(this.width / 2 - 0.5, -0.025, this.height / 2 - 0.5);
    } else {
      this.terrainMesh = BABYLON.MeshBuilder.CreateGround('terrain', { width: 1, height: 1 }, this.parameters.scene);
      this.terrainMesh.position = new BABYLON.Vector3(this.width / 2 - 0.5, -0.05, this.height / 2 - 0.5);
      this.terrainMesh.scaling.x = this.width;
      this.terrainMesh.scaling.z = this.height;

      this.terrainShadows = BABYLON.MeshBuilder.CreateGround('terrainShadows', { width: 1, height: 1 }, this.parameters.scene);
      this.terrainShadows.position = new BABYLON.Vector3(this.width / 2 - 0.5, -0.025, this.height / 2 - 0.5);
      this.terrainShadows.scaling.x = this.width;
      this.terrainShadows.scaling.z = this.height;

      //standard material
      var material = new BABYLON.StandardMaterial("terrain", this.parameters.scene);
      // var texture = new BABYLON.Texture('https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/ff727761-d6b1-4548-916b-3b9033c9149d/ddbvz3t-02a6fb39-0481-46c3-96c2-7eeea043447f.jpg/v1/fill/w_1920,h_1920,q_75,strp/empty_dungeon_map_by_zatnikotel_ddbvz3t-fullview.jpg?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOiIsImlzcyI6InVybjphcHA6Iiwib2JqIjpbW3siaGVpZ2h0IjoiPD0xOTIwIiwicGF0aCI6IlwvZlwvZmY3Mjc3NjEtZDZiMS00NTQ4LTkxNmItM2I5MDMzYzkxNDlkXC9kZGJ2ejN0LTAyYTZmYjM5LTA0ODEtNDZjMy05NmMyLTdlZWVhMDQzNDQ3Zi5qcGciLCJ3aWR0aCI6Ijw9MTkyMCJ9XV0sImF1ZCI6WyJ1cm46c2VydmljZTppbWFnZS5vcGVyYXRpb25zIl19.cLV4Dlz3BMU8z6D7uGnV6HsL37wNFxNLYJOATxYmUDY',
      // var texture = new BABYLON.Texture('https://i.imgur.com/bc3ECkA.jpg',
      // var texture = new BABYLON.Texture('../uploads/414828b4b8adbd332c9d5d6043ab5809.jpg',
      var texture = new BABYLON.Texture('assets/images/game/default_terrain.png', this.parameters.scene);
      if (this.terrain)
        texture = new BABYLON.Texture(this.terrain, this.parameters.scene);
      material.diffuseTexture = texture;

      // material = new BABYLON.StandardMaterial("terrain", this.parameters.scene);
      // material.diffuseTexture = new BABYLON.Texture("textures/ground.jpg", this.parameters.scene);
      // material.specularColor = new BABYLON.Color3(0, 0, 0);

      //set material of ground
      this.terrainMesh.material = material;

      this.terrainShadows.material = new ShadowOnlyMaterial('shadowOnly', this.parameters.scene)

      //receive shadows
      this.terrainMesh.receiveShadows = true;

      this.terrainShadows.receiveShadows = true;

      //update global lights to exclude or include only: terrain and terrainShadows
      this.parameters.world.lights.baseLight.excludedMeshes.push(this.terrainMesh);
      this.parameters.world.lights.secondLight.excludedMeshes.push(this.terrainMesh);
      this.parameters.world.lights.fogLight.includedOnlyMeshes.push(this.terrainMesh);
      this.parameters.world.lights.characterLight.includedOnlyMeshes.push(this.terrainMesh);
    }
  }

  updateTerrainImage() {
    if (this.terrainMesh?.material) {
      var texture = new BABYLON.Texture('assets/images/game/default_terrain.png', this.parameters.scene);
      if (this.terrain)
        texture = new BABYLON.Texture(this.terrain, this.parameters.scene);
      this.terrainMesh.material.diffuseTexture = texture;
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
