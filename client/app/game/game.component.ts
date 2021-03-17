import { Component, OnInit } from '@angular/core';
import * as Colyseus from "colyseus.js";
import * as BABYLON from '@babylonjs/core/Legacy/legacy';
import { Controller } from '../shared/controller/controller';
import { GlobalComponent } from '../shared/global/global.component';

//game main schema
import { World } from '../shared/schemas/world';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss']
})
export class GameComponent implements OnInit {
  //babylon
  canvas: HTMLCanvasElement;
  engine: any;
  scene: any;
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

      this.engine = new BABYLON.Engine(this.canvas, true);
      this.scene = new BABYLON.Scene(this.engine);
      this.scene.actionManager = new BABYLON.ActionManager(this.scene);
      this.assetsManager = new BABYLON.AssetsManager(this.scene);

      this.controller = new Controller();

      var host = window.document.location.host.replace(/:.*/, '');
      var client = new Colyseus.Client(location.protocol.replace("http", "ws") + "//" + host + ':3001');
      client.joinOrCreate("game", { campaign: this.campaign, token: localStorage.getItem('token') })
        .then((room: any) => {
          this.gameRoom = room;
          this.controller.rooms.game = this.gameRoom;
          this.access = true;
          this.initGame();
        }).catch((err: any) => {
          this.access = false;
        });

      //resize canvas on resize window
      window.onresize = () => {
        this.engine?.resize();
      };
    }
  }

  ngOnDestroy(): void {
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
    //add base mesh for characters
    this.assetsManager.addMeshTask("base task", "", "assets/meshes/base/", "base.babylon").onSuccess = (task) => {
      task.loadedMeshes[0].setEnabled(false);
      this.assets.base = task.loadedMeshes[0];
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
          };
        });
      }
    }
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
