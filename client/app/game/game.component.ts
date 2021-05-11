import { AfterViewChecked, Component, ElementRef, NgZone, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { GlobalComponent } from '../shared/global/global.component';
import { Controller } from '../shared/controller/controller';
import * as Colyseus from "colyseus.js";
import * as BABYLON from '@babylonjs/core/Legacy/legacy';

//game main schema
import { World } from '../shared/schemas/world';

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss']
})
export class GameComponent implements OnInit, OnDestroy, AfterViewChecked {
  //babylon
  // @ViewChild('renderCanvas', { static: true })
  // canvasRef: ElementRef<HTMLCanvasElement>;
  canvas: any;
  engine: any;
  scene: any;
  optimizer: any;
  assetsManager: any;
  assets: any = {};
  fps: number = 0;
  latency: any;

  //game
  gameRoom: any;
  controller: any;
  campaign: any;
  access: boolean;
  token: string;
  test: boolean = false;
  //game schemas
  world: any;

  constructor(
    private route: ActivatedRoute,
    public auth: AuthService,
    private ngZone: NgZone
  ) {
    this.route.params.subscribe(params => {
      this.campaign = params.campaign;
      // this.ngOnInit();
    });
  }

  ngOnInit(): void {
    if (this.campaign && this.access == null) {
      this.ngZone.runOutsideAngular(() => {
        this.controller = new Controller({ ping: { rooms: ['game'], interval: 5000 } });
        this.latency = this.controller.initSetting("latency", 0);

        var host = window.document.location.host.replace(/:.*/, '');
        // var url = environment.production
        //   ? "wss://dungeongram-gameserver.herokuapp.com"
        //   : location.protocol.replace("http", "ws") + "//" + host + (location.port ? ':' + (Number(location.port) + 1) : '');
        var url = location.protocol.replace("http", "ws") + "//" + host + (location.port ? ':' + location.port : '')
        console.log("Connecting game to: " + url);
        var client = new Colyseus.Client(url);
        client.joinOrCreate("game", { campaign: this.campaign, token: localStorage.getItem('token') })
          .then((room: any) => {
            this.ngZone.runOutsideAngular(() => {
              console.log("Joined to game room", room);
              this.gameRoom = room;
              this.controller.rooms.game = this.gameRoom;
              this.initGame();
            });
            this.ngZone.run(() => {
              this.access = true;
            });
          })
          .catch((error: any) => {
            console.log("Can't join game room", error);
            this.ngZone.run(() => {
              this.access = false;
            });
          });
      });
    }
  }

  ngOnDestroy(): void {
    console.log('game component disposed');
    this.scene?.clearCachedVertexData();
    this.scene?.cleanCachedTextureBuffer();
    this.scene?.dispose();
    this.engine?.stopRenderLoop();
    this.engine?.dispose();
    this.gameRoom?.leave();
  }

  ngAfterViewChecked() {
    // console.log('Change detection triggered!');
  }

  initGame() {
    console.log("Joined Game");
    // ignore the Angular change events of all outside the zone
    this.ngZone.runOutsideAngular(() => {
      this.canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;
      // this.canvas = this.canvasRef.nativeElement;

      this.engine = new BABYLON.Engine(this.canvas, false, { stencil: true, doNotHandleContextLost: true }, true);
      //optimizations
      // this.engine.enableOfflineSupport = false;

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

      //set stencil
      // this.scene.setRenderingAutoClearDepthStencil(1, false);
      // this.engine.setStencilBuffer(true);
      // this.scene.onBeforeRenderingGroupObservable.add((groupInfo) => {
      //   switch (groupInfo.renderingGroupId) {
      //     case 1:
      //       this.engine.setDepthFunction(BABYLON.Engine.ALWAYS);
      //       this.engine.setStencilFunction(BABYLON.Engine.EQUAL);
      //       break;
      //     case 0:
      //       this.engine.setDepthFunction(BABYLON.Engine.LESS);
      //       this.engine.setStencilFunction(BABYLON.Engine.ALWAYS);
      //       break;
      //   }
      // });

      this.scene.actionManager = new BABYLON.ActionManager(this.scene);
      this.assetsManager = new BABYLON.AssetsManager(this.scene);

      //resize canvas on resize window
      window.onresize = () => {
        this.engine?.resize();
      };

      this.gameRoom.onStateChange.once(() => {
        this.ngZone.runOutsideAngular(() => {
          //after the assetsManager finish to load all meshes
          this.assetsManager.onFinish = (tasks) => {
            this.ngZone.runOutsideAngular(() => {
              //create the root schema object
              this.world = new World(this.gameRoom.state.world, {
                engine: this.engine,
                scene: this.scene,
                room: this.gameRoom,
                canvas: this.canvas,
                controller: this.controller,
                token: this.auth.currentUser._id,
                assets: this.assets,
                test: this.test
              });
              console.log("Initialized game world", this.world);

              // start the render loop and therefore start the Engine
              this.engine.runRenderLoop(() => {
                this.ngZone.run(() => {
                  this.fps = this.engine?.getFps().toFixed();
                });
                this.scene.render();
              });
            });
          }

          //add the task for each mesh to the assetsManager and other assets to be cloned
          GlobalComponent.assetsTasks(this.assetsManager, this.assets, this.scene, { test: this.test });

          //call the loading of meshes
          this.assetsManager.load();
        });
      });
    });
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
