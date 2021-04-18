import { Component, OnDestroy, OnInit } from '@angular/core';
import * as Colyseus from "colyseus.js";
import * as BABYLON from '@babylonjs/core/Legacy/legacy';
import { Controller } from '../shared/controller/controller';
import { GlobalComponent } from '../shared/global/global.component';

//game main schema
import { World } from '../shared/schemas/world';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { environment } from 'client/environments/environment';
import { Shapes } from '../shared/utils/shapes';

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss']
})
export class GameComponent implements OnInit, OnDestroy {
  //babylon
  canvas: HTMLCanvasElement;
  engine: any;
  scene: any;
  optimizer: any;
  assetsManager: any;
  assets: any = {};

  //game
  gameRoom: any;
  controller: any;
  campaign: any;
  access: boolean;
  token: string;

  //game schemas
  world: any;

  constructor(
    private route: ActivatedRoute,
    public auth: AuthService
  ) {
    this.route.params.subscribe(params => {
      this.campaign = params.campaign;
      // this.ngOnInit();
    });
  }

  ngOnInit(): void {
    if (this.campaign && this.access == null) {
      this.canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;

      this.engine = new BABYLON.Engine(this.canvas, true, { stencil: true, doNotHandleContextLost: true });
      //optimizations
      this.engine.enableOfflineSupport = false;

      this.scene = new BABYLON.Scene(this.engine);
      //optimizations
      // var options = new BABYLON.SceneOptimizerOptions();
      // options.addOptimization(new BABYLON.HardwareScalingOptimization(0, 1));
      // this.optimizer = new BABYLON.SceneOptimizer(this.scene, options);
      // BABYLON.SceneOptimizer.OptimizeAsync(this.scene);
      // this.scene.autoClear = false;
      // this.scene.autoClearDepthAndStencil = false;
      // this.scene.blockMaterialDirtyMechanism = true;
      // this.scene.useGeometryIdsMap = true;
      // this.scene.useMaterialMeshMap = true;
      // this.scene.useClonedMeshMap  = true;

      this.scene.actionManager = new BABYLON.ActionManager(this.scene);
      this.assetsManager = new BABYLON.AssetsManager(this.scene);

      this.controller = new Controller();

      var host = window.document.location.host.replace(/:.*/, '');
      // var url = environment.production
      //   ? "wss://dungeongram-gameserver.herokuapp.com"
      //   : location.protocol.replace("http", "ws") + "//" + host + (location.port ? ':' + (Number(location.port) + 1) : '');
      var url = location.protocol.replace("http", "ws") + "//" + host + (location.port ? ':' + location.port : '')
      console.log("Connecting game to: " + url);
      var client = new Colyseus.Client(url);
      client.joinOrCreate("game", { campaign: this.campaign, token: localStorage.getItem('token') })
        .then((room: any) => {
          console.log("Joined to game room", room);
          this.gameRoom = room;
          this.controller.rooms.game = this.gameRoom;
          this.access = true;
          this.initGame();
        })
        .catch((error: any) => {
          console.log("Can't join game room", error);
          this.access = false;
        });

      //resize canvas on resize window
      window.onresize = () => {
        this.engine?.resize();
      };
    }
  }

  ngOnDestroy(): void {
    console.log('game disposed');
    this.scene?.clearCachedVertexData();
    this.scene?.cleanCachedTextureBuffer();
    this.scene?.dispose();
    this.engine?.dispose();
    this.gameRoom?.leave();
  }

  initGame() {
    console.log("Joined Game");
    this.gameRoom.onStateChange.once(() => {
      //after the assetsManager finish to load all meshes
      this.assetsManager.onFinish = (tasks) => {
        //create the root schema object
        this.world = new World(this.gameRoom.state.world, {
          scene: this.scene,
          room: this.gameRoom,
          canvas: this.canvas,
          controller: this.controller,
          token: this.auth.currentUser._id,
          assets: this.assets
        });
        console.log("Initialized game world", this.world);

        //register a render loop to repeatedly render the scene
        this.engine.runRenderLoop(() => {
          this.scene.render();
        });
      }

      //add the task for each mesh to the assetsManager
      this.assetsTasks();

      //call the loading of meshes
      this.assetsManager.load();
    });
  }

  assetsTasks() {
    var collidersVisibility = 0; //all the colliders are not visible by default

    //add base mesh for characters
    this.assetsManager.addMeshTask("base task", "", "assets/meshes/base/", "base.babylon").onSuccess = (task) => {
      task.loadedMeshes[0].setEnabled(false);
      this.assets.base = task.loadedMeshes[0];
      this.assets.baseMaterial = new BABYLON.StandardMaterial("base", this.scene);
      this.assets.base.material = this.assets.baseMaterial;
    };

    //add each wear mesh for characters
    for (let category in GlobalComponent.wearsAvailable) {
      for (let subcategory in GlobalComponent.wearsAvailable[category]) {
        GlobalComponent.wearsAvailable[category][subcategory].forEach((wear) => {
          this.assetsManager.addMeshTask(wear + " task", "", "assets/meshes/wear/" + category + "/" + subcategory + "/", wear + ".babylon").onSuccess = (task) => {
            task.loadedMeshes[0].setEnabled(false);
            if (!this.assets[category]) this.assets[category] = {};
            if (!this.assets[category][subcategory]) this.assets[category][subcategory] = {};
            this.assets[category][subcategory][wear] = task.loadedMeshes[0];
            this.assets[category][subcategory][wear + 'Material'] = new BABYLON.StandardMaterial(wear + "Material", this.scene);
            this.assets[category][subcategory][wear].material = this.assets[category][subcategory][wear + 'Material'];
          };
        });
      }
    }

    //add character selection mesh and material
    this.assets.characterSelection = BABYLON.MeshBuilder.CreateCylinder('', { height: 0.05, diameter: 1.75 }, this.scene);
    this.assets.characterSelection.setEnabled(false);
    this.assets.characterSelectionMaterial = new BABYLON.StandardMaterial("characterSelection", this.scene);
    this.assets.characterSelectionTexture = new BABYLON.Texture("assets/images/game/selection_circle.png", this.scene);
    this.assets.characterSelectionMaterial.diffuseTexture = this.assets.characterSelectionTexture;
    this.assets.characterSelectionMaterial.diffuseTexture.hasAlpha = true;
    this.assets.characterSelectionMaterial.useAlphaFromDiffuseTexture = true;
    this.assets.characterSelectionMaterial.alpha = 0.5;
    this.assets.characterSelection.material = this.assets.characterSelectionMaterial;

    //add character collider mesh (and material if testing)
    this.assets.characterCollider = BABYLON.MeshBuilder.CreateCylinder('', { height: 1.5, diameter: 0.5 }, this.scene);
    this.assets.characterCollider.setEnabled(false);
    this.assets.characterCollider.visibility = collidersVisibility;
    if (collidersVisibility > 0) {
      this.assets.characterColliderMaterial = new BABYLON.StandardMaterial("characterCollider", this.scene);
      this.assets.characterColliderMaterial.diffuseColor = BABYLON.Color3.Blue();
      this.assets.characterCollider.material = this.assets.characterColliderMaterial;
    }

    //add character collider physics mesh and material (if testing)
    if (collidersVisibility > 0) {
      this.assets.characterColliderPhysics = BABYLON.MeshBuilder.CreateBox('', { height: 2, width: 0.9, depth: 0.9 }, this.scene);
      this.assets.characterColliderPhysics.setEnabled(false);
      this.assets.characterColliderPhysics.visibility = collidersVisibility;
      this.assets.characterColliderPhysicsMaterial = new BABYLON.StandardMaterial("characterColliderPhysics", this.scene);
      this.assets.characterColliderPhysicsMaterial.diffuseColor = BABYLON.Color3.Gray();
      this.assets.characterColliderPhysics.material = this.assets.characterColliderPhysicsMaterial;
    }

    //add wall mesh and material
    this.assets.wall = BABYLON.MeshBuilder.CreateBox('', { height: 1, width: 1, depth: 0.01 });
    this.assets.wall.setEnabled(false);
    this.assets.wallMaterial = new BABYLON.StandardMaterial("wall", this.scene);
    this.assets.wallMaterial.diffuseColor = BABYLON.Color3.Gray();
    this.assets.wall.material = this.assets.wallMaterial;

    //add wall collider physics mesh and material (if testing)
    if (collidersVisibility > 0) {
      this.assets.wallCollider = BABYLON.MeshBuilder.CreateBox('', { height: 0.1, width: 0.5, depth: 0.5 }, this.scene)
      this.assets.wallCollider.setEnabled(false);
      this.assets.wallCollider.visibility = collidersVisibility;
      this.assets.wallColliderMaterial = new BABYLON.StandardMaterial("wallCollider", this.scene);
      this.assets.wallColliderMaterial.diffuseColor = BABYLON.Color3.Red();
      this.assets.wallCollider.material = this.assets.wallColliderMaterial;
    }

    //add door mesh and material
    this.assets.door = BABYLON.MeshBuilder.CreateBox('', { height: 1, width: 1, depth: 0.1 });
    this.assets.door.setEnabled(false);
    this.assets.doorMaterial = new BABYLON.StandardMaterial("door", this.scene);
    this.assets.doorTexture = new BABYLON.Texture("assets/images/game/door.png", this.scene);
    this.assets.doorMaterial.diffuseTexture = this.assets.doorTexture;
    this.assets.door.material = this.assets.doorMaterial;

    //add door collider mesh (and material if testing)
    this.assets.doorCollider = BABYLON.MeshBuilder.CreateCylinder('', { height: 1, diameter: 2 }, this.scene);
    this.assets.doorCollider.setEnabled(false);
    this.assets.doorCollider.visibility = collidersVisibility;
    if (collidersVisibility > 0) {
      this.assets.doorColliderMaterial = new BABYLON.StandardMaterial("doorCollider", this.scene);
      this.assets.doorColliderMaterial.diffuseColor = BABYLON.Color3.Red();
      this.assets.doorCollider.material = this.assets.doorColliderMaterial;
    }

    //add temporal wall mesh and material
    this.assets.temporalWall = BABYLON.MeshBuilder.CreateBox('', { height: 1, width: 0.1, depth: 0.1 }, this.scene);
    this.assets.temporalWall.setEnabled(false);
    this.assets.temporalWallMaterial = new BABYLON.StandardMaterial("temporalWall", this.scene);
    this.assets.temporalWallMaterial.diffuseColor = BABYLON.Color3.Yellow();
    this.assets.temporalWall.material = this.assets.temporalWallMaterial;

    //add path mesh and material
    this.assets.pathPoint = BABYLON.MeshBuilder.CreateSphere('', { segments: 16, diameter: 0.4 }, this.scene);
    this.assets.pathPoint.setEnabled(false);
    this.assets.pathPointMaterial = new BABYLON.StandardMaterial("pathPoint", this.scene);
    this.assets.pathPointMaterial.emissiveColor = BABYLON.Color3.White();
    this.assets.pathPoint.material = this.assets.pathPointMaterial;

    //add rule mesh and material
    this.assets.rulePoint = BABYLON.MeshBuilder.CreateSphere('', { segments: 16, diameter: 0.2 }, this.scene);
    this.assets.rulePoint.setEnabled(false);
    this.assets.rulePointMaterial = new BABYLON.StandardMaterial("rulePoint", this.scene);
    this.assets.rulePointMaterial.diffuseColor = BABYLON.Color3.Yellow();
    this.assets.rulePoint.material = this.assets.rulePointMaterial;

    //add figures meshes and materials
    this.assets.triangleFigure = Shapes.createTriangle("triangle", this.scene);
    this.assets.circleFigure = BABYLON.MeshBuilder.CreateDisc("circle", { radius: 1 }, this.scene);
    this.assets.squareFigure = BABYLON.MeshBuilder.CreatePlane("square", { size: 1 }, this.scene);
    this.assets.triangleFigure.setEnabled(false);
    this.assets.circleFigure.setEnabled(false);
    this.assets.squareFigure.setEnabled(false);

    this.assets.figureMaterial = new BABYLON.StandardMaterial("figure", this.scene);
    this.assets.figureMaterial.diffuseColor = BABYLON.Color3.Red();
    this.assets.figureMaterial.emissiveColor = BABYLON.Color3.Red();
    this.assets.figureMaterial.alpha = 0.5;

    this.assets.triangleFigure.material = this.assets.figureMaterial;
    this.assets.circleFigure.material = this.assets.figureMaterial;
    this.assets.squareFigure.material = this.assets.figureMaterial;
  }

  //DESUSED
  createScene(): any {
    //setup the scene
    // var scene = new BABYLON.Scene(this.engine);

    // this.mainCamera = new BABYLON.FreeCamera("mainCamera", new BABYLON.Vector3(0, 30, 0), scene);
    // this.mainCamera.setTarget(BABYLON.Vector3.Zero());
    // this.mainCamera.attachControl(this.canvas, true);

    // var zoom = 15;
    // this.mainCamera = new BABYLON.TargetCamera("mainCamera", new BABYLON.Vector3(zoom, zoom, -zoom), scene);
    // this.mainCamera.mode = BABYLON.Camera.ORTHOGRAPHIC_CAMERA;
    // this.mainCamera.orthoTop = zoom;
    // this.mainCamera.orthoBottom = -zoom;
    // this.mainCamera.orthoLeft = -zoom;
    // this.mainCamera.orthoRight = zoom;
    // this.mainCamera.setTarget(new BABYLON.Vector3(0, 0, 0));

    // var light = new BABYLON.PointLight("mainLight", new BABYLON.Vector3(0, 1, 0), scene);
    // light.intensity = 0.1;

    // this.shadowGenerator = new BABYLON.ShadowGenerator(1024, light);
    // this.shadowGenerator.useExponentialShadowMap = true;

    // var gridMaterial = new GridMaterial("gridMaterial", scene);
    // gridMaterial.mainColor = new BABYLON.Color3(1, 1, 1);
    // gridMaterial.lineColor = new BABYLON.Color3(0.1, 0.1, 0.1);
    // gridMaterial.gridRatio = 1;

    // var ground = BABYLON.Mesh.CreateGround("ground", 100, 100, 2, scene);
    // ground.material = gridMaterial;
    // ground.receiveShadows = true;

    //keyboard events
    // var inputMap = {};
    // scene.actionManager = new BABYLON.ActionManager(scene);
    // scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyDownTrigger, function (evt) {
    //   inputMap[evt.sourceEvent.key] = evt.sourceEvent.type == "keydown";
    // }));
    // scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyUpTrigger, function (evt) {
    //   inputMap[evt.sourceEvent.key] = evt.sourceEvent.type == "keydown";
    // }));

    //game/render loop
    // scene.onBeforeRenderObservable.add(() => {
    //   if (inputMap["w"] || inputMap["ArrowUp"]) {
    //     // socket.send("up");
    //     this.gameRoom.send("move", { x: 0, y: -1 });
    //     //sphere.position.z -= 0.1
    //   }
    //   if (inputMap["a"] || inputMap["ArrowLeft"]) {
    //     // socket.send("left");
    //     this.gameRoom.send("move", { x: 1, y: 0 });
    //     //sphere.position.x += 0.1
    //   }
    //   if (inputMap["s"] || inputMap["ArrowDown"]) {
    //     // socket.send("down");
    //     this.gameRoom.send("move", { x: 0, y: 1 });
    //     //sphere.position.z += 0.1
    //   }
    //   if (inputMap["d"] || inputMap["ArrowRight"]) {
    //     // socket.send("right");
    //     this.gameRoom.send("move", { x: -1, y: 0 });
    //     //sphere.position.x -= 0.1
    //   }
    // })
    // return scene;
  };

}
