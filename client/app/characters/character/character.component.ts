import { ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, NgZone, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import * as BABYLON from '@babylonjs/core/Legacy/legacy';
import { ShadowOnlyMaterial, SkyMaterial } from '@babylonjs/materials';
import "@babylonjs/loaders/glTF/2.0/glTFLoader";
import { Animator } from '../../shared/utils/animator';
import { AuthService } from '../../services/auth.service';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CharacterService } from 'client/app/services/character.service';
import { Character } from 'client/app/shared/models/character.model';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { GlobalComponent } from '../../shared/global/global.component';
import { Vectors } from '../../shared/utils/vectors';
import Compressor from 'compressorjs';

declare var $;
declare var iziToast;
declare var ng;

@Component({
  selector: 'app-character',
  templateUrl: './character.component.html',
  styleUrls: ['./character.component.scss']
})
export class CharacterComponent implements OnInit, OnDestroy {
  @Input() public character: Character | string;
  @Input() public viewOnly: boolean;
  @Output("getCharacters") getCharacters: EventEmitter<any> = new EventEmitter();
  @ViewChild("front_image_img") frontImageElem: ElementRef;
  @ViewChild("back_image_img") backImageElem: ElementRef;

  //babylon
  @ViewChild('renderCanvasCharacter') canvasRef: ElementRef;
  canvas: HTMLCanvasElement;
  engine: any;
  scene: any;
  assetsManager: any;
  assets: any = {};

  //editor
  scenario: any;
  wearsAvailable: any = GlobalComponent.wearsAvailable;
  portraitSize: number = 400;

  //form
  formSended: boolean = false;
  characterForm: FormGroup;
  _id;
  // owner;
  name = new FormControl('', [
    Validators.required,
    Validators.minLength(1),
    Validators.maxLength(50)
  ]);
  description = new FormControl('', [
    Validators.minLength(0),
    Validators.maxLength(200)
  ]);
  wears = new FormControl([], []);
  height = new FormControl(1, [
    Validators.required
  ]);
  visionRange = new FormControl(10, [
    Validators.required,
    Validators.min(1),
    Validators.max(200)
  ]);
  private = new FormControl(false, []);
  mode2D = new FormControl(false, []);
  disableBack = new FormControl(false, []);
  frontImage = new FormControl('', []);
  backImage = new FormControl('', []);
  frontImageFile = new FormControl('', []);
  backImageFile = new FormControl('', []);

  constructor(
    private formBuilder: FormBuilder,
    public auth: AuthService,
    private characterService: CharacterService,
    public activeModal: NgbActiveModal,
    private modalService: NgbModal,
    private changeDetector: ChangeDetectorRef,
    private ngZone: NgZone
  ) { }

  ngOnInit(): void {
    this.characterForm = this.formBuilder.group({
      _id: this._id,
      // owner: this.owner,
      name: this.name,
      description: this.description,
      wears: this.wears,
      height: this.height,
      visionRange: this.visionRange,
      private: this.private,
      mode2D: this.mode2D,
      disableBack: this.disableBack,
      frontImage: this.frontImage,
      frontImageFile: this.frontImageFile,
      backImage: this.backImage,
      backImageFile: this.backImageFile
    });

    this.initEditor();
  }

  ngOnDestroy(): void {
    console.log('character component disposed')
    this.scene?.clearCachedVertexData();
    this.scene?.cleanCachedTextureBuffer();
    this.scene?.dispose();
    this.engine?.dispose();
  }

  initEditor() {
    // this.canvas = document.getElementById("renderCanvasCharacter") as HTMLCanvasElement;
    setTimeout(() => {
      this.canvas = this.canvasRef?.nativeElement;

      if (this.canvas) {
        this.engine = new BABYLON.Engine(this.canvas, true, { stencil: true, doNotHandleContextLost: true });
        //optimizations
        // this.engine.enableOfflineSupport = false;

        this.scene = new BABYLON.Scene(this.engine);

        this.scene.actionManager = new BABYLON.ActionManager(this.scene);
        this.assetsManager = new BABYLON.AssetsManager(this.scene);

        this.initScenario();

        //resize canvas on resize window
        window.onresize = () => {
          this.engine?.resize();
        };
      } else {
        this.initEditor();
      }
    }, 100);
  }

  initScenario() {
    //after the assetsManager finish to load all meshes
    this.assetsManager.onFinish = (tasks) => {
      this.scenario = new Scenario({
        component: this,
        scene: this.scene,
        canvas: this.canvas,
        assets: this.assets,
        character: this.characterForm
      });

      // ignore the change events from the Engine in the Angular ngZone
      this.ngZone.runOutsideAngular(() => {
        // start the render loop and therefore start the Engine
        this.engine.runRenderLoop(() => this.scene.render())
      });

      //load the input character
      if (this.character) this.getCharacter();
    }

    //add the task for each mesh to the assetsManager and other assets to be cloned
    GlobalComponent.assetsTasks(this.assetsManager, this.assets, this.scene, { characterMode: true });

    //call the loading of meshes
    this.assetsManager.load();
  }

  getCharacter(): void {
    var characterId = this.character instanceof Object ? this.character._id : this.character;
    this.characterService.getCharacterById(characterId).subscribe(
      data => {
        this.characterForm.patchValue(data);
        this.scenario?.loadCharacter();
      },
      error => console.log(error)
    );
  }

  async saveCharacter() {
    this.characterForm.markAllAsTouched();
    if (this.characterForm.valid) {
      var characterValue = this.characterForm.value;
      // characterValue.wears = this.getSelectedWears();
      characterValue.portrait = GlobalComponent.dataURLtoFile(await this.getPortrait(), "portrait");
      characterValue.facePortrait = GlobalComponent.dataURLtoFile(await this.getFacePortrait(), "facePortrait");
      this.formSended = true;
      if (!this.character) {
        this.characterService.addCharacter(characterValue).subscribe(
          res => {
            iziToast.success({ message: 'Character created correctly, now you can use it on your campaigns!' });
            // this.router.navigate(['/login']);
            this.getCharacters.emit();
            this.modalService.dismissAll();
          },
          error => iziToast.error({ message: 'There was an error, character can\'t be created.' })
        );
      } else {
        this.characterService.editCharacter(characterValue).subscribe(
          res => {
            iziToast.success({ message: 'Character was changed correctly.' });
            // this.router.navigate(['/login']);
            this.getCharacters.emit();
            this.modalService.dismissAll();
          },
          error => iziToast.error({ message: 'There was an error, character can\'t be changed.' })
        );
      }
    } else {
      iziToast.error({ message: 'Some values are invalid, please check the information tab of the character.' });
    }
  }

  getPortrait() {
    return new Promise(resolve => {
      BABYLON.Tools.CreateScreenshotUsingRenderTarget(this.engine, this.scenario.photoCamera, this.portraitSize, (image) => resolve(image));
    });
  }

  getFacePortrait() {
    this.scenario.facePhotoCamera._target = new BABYLON.Vector3(0, this.height.value * 2, 0);
    return new Promise(resolve => {
      BABYLON.Tools.CreateScreenshotUsingRenderTarget(this.engine, this.scenario.facePhotoCamera, this.portraitSize, (image) => {
        GlobalComponent.cropImage(image, this.portraitSize / 4, this.portraitSize / 2, this.portraitSize / 2, this.portraitSize / 2).then((croppedImage: any) => {
          resolve(croppedImage);
        });
      });
    });
  }

  onChangeFrontImage(files: File[]): void {
    const reader = new FileReader();
    if (files && files.length) {
      const [file] = files;
      new Compressor(file, {
        quality: 0.2,
        maxWidth: 1000,
        maxHeight: 1000,
        // convertSize: 1000000,
        success: (compressedFile) => {
          this.characterForm.patchValue({
            frontImageFile: compressedFile
          });
          reader.readAsDataURL(compressedFile);
          reader.onload = () => {
            //here the file can be showed (base 64 is on reader.result)
            this.frontImageElem.nativeElement.src = reader.result;
            //need to run change detector since file load runs outside of zone
            this.changeDetector.markForCheck();
            this.scenario.mode2DChangeFront();
          };
        }
      });
    }
  }

  onChangeBackImage(files: File[]): void {
    const reader = new FileReader();
    if (files && files.length) {
      const [file] = files;
      new Compressor(file, {
        quality: 0.2,
        maxWidth: 1000,
        maxHeight: 1000,
        // convertSize: 1000000,
        success: (compressedFile) => {
          this.characterForm.patchValue({
            backImageFile: compressedFile
          });
          reader.readAsDataURL(compressedFile);
          reader.onload = () => {
            //here the file can be showed (base 64 is on reader.result)
            this.backImageElem.nativeElement.src = reader.result;
            //need to run change detector since file load runs outside of zone
            this.changeDetector.markForCheck();
            this.scenario.mode2DChangeBack();
          };
        }
      });
    }
  }

  /*AUXILIAR*/

  setColorPicker(id, color) {
    var colorPicker = ng.getComponent($("#" + id)[0]);
    if (colorPicker.color != color.hex) {
      colorPicker.color = color.hex;
      colorPicker.currentColor = color.hex;
      colorPicker.ngOnChanges();
      colorPicker.handleChange(colorPicker);
    }
  }

  setValid(control): object {
    return {
      'is-invalid': this[control].touched && !this[control].valid,
      'is-valid': this[control].touched && this[control].valid
    };
  }

  imageExists(url, callback) {
    var img = new Image();
    img.onload = function () { callback(true); };
    img.onerror = function () { callback(false); };
    img.src = url;
  }

  onImageError($event, defaultImage?) {
    if (defaultImage) {
      this.imageExists(defaultImage, (exists) => {
        if (exists)
          $event.target.src = defaultImage;
        else
          $event.target.src = "assets/images/character/default.png";
      });
    } else {
      $event.target.src = "assets/images/character/default.png";
    }
  }
}

export class Scenario {
  parameters?: any;

  //game objects
  camera?: any;
  photoCamera?: any;
  facePhotoCamera?: any;
  lights?: any = {};
  skybox?: any;
  ground?: any;

  //character 3D
  character3D?: any = {
    mesh: null,
    animator: null,
  };

  //character 2D
  character2D?: any = {
    direction: new BABYLON.Vector3(0, 0, 1),
    frontMaterial: null,
    backMaterial: null
  };

  constructor(parameters) {
    this.parameters = parameters;
    this.initCamera();
    this.initLights();
    this.initGround();

    this.initCharacter3D();
    this.initCharacter2D();

    this.heightChange();
    this.mode2DChange();
    this.mode2DChangeFront();
    this.mode2DChangeBack();
  }

  loadCharacter() {
    //set character form getted wears
    this.parameters.character?.controls?.wears?.value?.forEach(wear => {
      this.wearChange(wear.category, wear.subcategory, wear.name, wear.color);
    });

    setTimeout(() => {
      this.heightChange();
      this.mode2DChange();
      this.mode2DChangeFront();
      this.mode2DChangeBack();
    })
  }

  initCamera() {
    //creates, angles, distances and targets the camera
    this.camera = new BABYLON.ArcRotateCamera("Camera", 0, 0, 0, new BABYLON.Vector3(0, 0.75, 0), this.parameters.scene);
    this.camera.wheelPrecision = 40;
    //this positions the camera
    this.camera.setPosition(new BABYLON.Vector3(0, 1.5, 5));
    //this attaches the camera to the canvas
    this.camera.attachControl(this.parameters.canvas, true);
    //detach right click from camera control
    this.camera.inputs.attached.pointers.buttons[2] = null;

    //for limit how much the camera can rotate to bottom
    this.camera.upperBetaLimit = 1.3
    //for limit how much the camera can rotate to top
    this.camera.lowerBetaLimit = 0.75
    //for limit how much the camera zoom in
    this.camera.lowerRadiusLimit = 1.5
    //for limit how much the camera zoom out
    this.camera.upperRadiusLimit = 10

    this.camera.onViewMatrixChangedObservable.add(() => {
      if (this.camera.radius <= 3 && this.parameters.character?.controls?.height)
        this.camera._target = new BABYLON.Vector3(0, 1.5 * this.parameters.character.controls.height.value, 0);
      else
        this.camera._target = new BABYLON.Vector3(0, 0.75, 0);
    });

    this.photoCamera = new BABYLON.ArcRotateCamera("PhotoCamera", 0, 0, 0, new BABYLON.Vector3(0, 0.75, 0), this.parameters.scene);
    this.photoCamera.setPosition(new BABYLON.Vector3(0, 1.5, 5));

    this.facePhotoCamera = new BABYLON.ArcRotateCamera("PhotoCamera", 0, 0, 0, new BABYLON.Vector3(0, 0.75, 0), this.parameters.scene);
    this.facePhotoCamera.alpha = 1.5;
    this.facePhotoCamera.beta = 1.5;
    this.facePhotoCamera.radius = 1.5;
  }

  initLights() {
    //init lights
    this.lights.baseLight = new BABYLON.DirectionalLight("baseLight", new BABYLON.Vector3(-1, -2, -1), this.parameters.scene);
    this.lights.baseLight.position = new BABYLON.Vector3(50, 100, 50);
    this.lights.baseLight.intensity = 1;
    this.lights.baseLight.specular = new BABYLON.Color3(0, 0, 0);

    this.lights.secondLight = new BABYLON.DirectionalLight("secondLight", new BABYLON.Vector3(1, -2, 1), this.parameters.scene);
    this.lights.secondLight.position = new BABYLON.Vector3(-50, 100, -50);
    this.lights.secondLight.intensity = 1;
    this.lights.secondLight.specular = new BABYLON.Color3(0, 0, 0);

    this.lights.hemisphericLight = new BABYLON.HemisphericLight("hemisphericLight", new BABYLON.Vector3(0, 3, 0), this.parameters.scene);

    //init shadow generator for base light
    new BABYLON.ShadowGenerator(4096, this.lights.baseLight);
    this.lights.baseLight._shadowGenerator.useBlurExponentialShadowMap = true;
    this.lights.baseLight._shadowGenerator.darkness = 0.5;

    //init background color
    this.parameters.scene.clearColor = new BABYLON.Color3(0.1, 0.1, 0.1);

    this.skybox = BABYLON.Mesh.CreateBox('SkyBox', 1000, this.parameters.scene, false, BABYLON.Mesh.BACKSIDE);
    this.skybox.material = new SkyMaterial('sky', this.parameters.scene);
    this.skybox.material.inclination = -0.35;
  }

  initGround() {
    this.ground = BABYLON.MeshBuilder.CreateSphere('ground', { segments: 16, diameter: 20 }, this.parameters.scene);
    this.ground.position.y = -10;
    this.ground.rotation.x = 1;
    // this.ground.material = new ShadowOnlyMaterial('shadowOnly', this.parameters.scene);
    this.ground.material = new BABYLON.StandardMaterial("groundMaterial", this.parameters.scene);
    this.ground.material.diffuseTexture = new BABYLON.Texture('assets/images/game/ground.jpg', this.parameters.scene);
    this.ground.material.diffuseTexture.uScale = 2;
    this.ground.material.diffuseTexture.vScale = 2;
    this.ground.receiveShadows = true;

    this.lights.secondLight.excludedMeshes.push(this.ground);
    this.lights.hemisphericLight.excludedMeshes.push(this.ground);
  }

  initCharacter3D() {
    //set mesh
    this.character3D.mesh = this.parameters.assets.base;
    // this.character.mesh.skeleton = this.parameters.assets.base.skeleton.clone();
    // this.character.mesh.material = this.parameters.assets.baseMaterial.clone();

    //create the animator to manage the animations
    this.character3D.animator = new Animator(this.character3D.mesh, this.character3D.mesh.skeleton, { actual: 'Idle' });

    //cast shadows with base light
    this.lights.baseLight._shadowGenerator.addShadowCaster(this.character3D.mesh);

    //exclude from hemispheric light
    this.lights.hemisphericLight.excludedMeshes.push(this.character3D.mesh);

    //set skin default color
    this.wearChange("skin", "color", "none", "#dc9b78");
  }

  initCharacter2D() {
    this.character2D.mesh = this.parameters.assets.base2D;
    this.character2D.frontMaterial = this.parameters.assets.base2DFrontMaterial;
    this.character2D.backMaterial = this.parameters.assets.base2DBackMaterial;

    this.lights.baseLight._shadowGenerator.addShadowCaster(this.character2D.mesh);
    this.lights.secondLight.excludedMeshes.push(this.character2D.mesh);

    this.camera.onViewMatrixChangedObservable.add(() => {
      this.updateCharacter2D();
    });
  }

  wearChange(category, subcategory, name, color) {
    //get actual equiped wear from character form
    var actualWear = this.parameters.character?.controls?.wears?.value?.findIndex(wear => {
      return wear.category == category && wear.subcategory == subcategory
    });

    //get actual wear name
    var actualWearName = this.parameters.character?.controls?.wears?.value[actualWear]?.name;

    //remove actual equipped wear (if is not the same as the sended)
    if (actualWear >= 0 && actualWearName != name) {
      //remove actual equiped wear from character form
      this.parameters.character?.controls?.wears?.value.splice(actualWear, 1);

      if (actualWearName != "none") {
        //unparent actual equiped wear
        this.parameters.assets[category][subcategory][actualWearName].setEnabled(false);
        this.character3D?.animator?.unparent(this.parameters.assets[category][subcategory][actualWearName]);
      }
    }

    if ((name != "none" && GlobalComponent.wearsAvailable[category][subcategory].includes(name))
      || (category == "skin" && subcategory == "color")) {
      //change wear menu selection
      $('[name="ce-' + subcategory + '-radio"][value="' + name + '"]').attr('checked', true);

      var skinWear = this.parameters.character?.controls?.wears?.value?.find(wear => {
        return wear.category == "skin" && wear.subcategory == "color"
      });

      color = (category == "head" && subcategory == "ears")
        ? (skinWear ? skinWear.color : "#dc9b78")
        : color;

      //add new equiped wear to character form (if is not the same as the actual)
      if (actualWearName != name) {
        this.parameters.character?.controls?.wears?.value.push(
          { category: category, subcategory: subcategory, name: name, color: color }
        );
      }

      if (name != "none") {
        //parent new equiped wear
        this.parameters.assets[category][subcategory][name].setEnabled(true);
        this.character3D?.animator?.parent(this.parameters.assets[category][subcategory][name]);
      }

      this.wearColorChange(category, subcategory, color);
    }
  }

  wearColorChange(category, subcategory, color) {
    //change wear color menu selection
    this.parameters.component.setColorPicker('ce-' + subcategory + '-color', { hex: color });

    //get actual equiped wear from character form
    var actualWear = this.parameters.character?.controls?.wears?.value?.findIndex(wear => {
      return wear.category == category && wear.subcategory == subcategory
    });

    if (actualWear >= 0) {
      //get actual wear name
      var actualWearName = this.parameters.character?.controls?.wears?.value[actualWear].name;

      //set actual wear color
      this.parameters.character.controls.wears.value[actualWear].color = color;

      if (category == "skin" && subcategory == "color") {
        //set color of base mesh
        this.character3D.mesh.material.diffuseColor = BABYLON.Color3.FromHexString(color);

        //get actual equiped ears wear from character form
        var earsWear = this.parameters.character?.controls?.wears?.value?.findIndex(wear => {
          return wear.category == "head" && wear.subcategory == "ears"
        });

        if (earsWear >= 0) {
          //get ears wear name
          var earsWearName = this.parameters.character?.controls?.wears?.value[earsWear].name;

          //set ears wear color
          this.parameters.character.controls.wears.value[earsWear].color = color;

          //set color of ears mesh
          this.parameters.assets["head"]["ears"][earsWearName].material.diffuseColor = BABYLON.Color3.FromHexString(color);
        }
      } else {
        //set color of actual wear mesh
        this.parameters.assets[category][subcategory][actualWearName].material.diffuseColor = BABYLON.Color3.FromHexString(color);
      }
    }
  }

  heightChange() {
    //get actual height from character form
    var newHeight = this.parameters.character?.controls?.height?.value;

    //change height menu selection
    $('[name="height"][value="' + newHeight + '"]')[0].checked = true;

    //set height for character 3D/2D meshes
    this.character3D.mesh.scaling.y = parseFloat(newHeight);
    this.character2D.mesh.scaling.y = parseFloat(newHeight);
  }

  mode2DChange() {
    this.character3D.mesh.setEnabled(!this.parameters.character?.controls?.mode2D.value);
    this.character2D.mesh.setEnabled(this.parameters.character?.controls?.mode2D.value);
  }

  mode2DChangeFront() {
    this.character2D.frontMaterial.diffuseTexture = new BABYLON.Texture(this.parameters.component.frontImageElem.nativeElement.src, this.parameters.scene);
    this.character2D.frontMaterial.diffuseTexture.hasAlpha = true;
    this.character2D.frontMaterial.useAlphaFromDiffuseTexture = true;

    this.updateCharacter2D();
  }

  mode2DChangeBack() {
    var backImage = !this.parameters.character?.controls?.disableBack.value
      ? this.parameters.component.backImageElem.nativeElement.src
      : this.parameters.component.frontImageElem.nativeElement.src;
    this.character2D.backMaterial.diffuseTexture = new BABYLON.Texture(backImage, this.parameters.scene);
    this.character2D.backMaterial.diffuseTexture.hasAlpha = true;
    this.character2D.backMaterial.useAlphaFromDiffuseTexture = true;

    this.updateCharacter2D();
  }

  mode2DDisableBack() {
    this.mode2DChangeBack();
  }

  updateCharacter2D() {
    var camera = new BABYLON.Vector3(this.camera.position.x, 0, this.camera.position.z);
    // var position = new BABYLON.Vector3(this.character2D.position.x, 0, this.character2D.position.z);
    // var cameraDir = BABYLON.Vector3.Normalize(camera.subtract(position));

    var angle = Vectors.angle({ x: this.character2D.direction.x, y: this.character2D.direction.z }, { x: camera.x, y: camera.z });
    // console.log(
    //   "dir:", { x: this.character2DDirection.x, y: this.character2DDirection.z },
    //   "cam:", { x: camera.x, y: camera.z }
    // );
    // console.log("rad:", angle, "deg:", angle * 180 / Math.PI);
    if (angle >= 0 && angle < 1.5) {
      this.character2D.mesh.material = this.character2D.backMaterial;
      if (this.character2D.mesh.material.diffuseTexture) this.character2D.mesh.material.diffuseTexture.uScale = -1;
    } else if (angle >= 1.5 && angle < 3) {
      this.character2D.mesh.material = this.character2D.backMaterial;
      if (this.character2D.mesh.material.diffuseTexture) this.character2D.mesh.material.diffuseTexture.uScale = 1;
    } else if (angle <= 0 && angle > -1.5) {
      this.character2D.mesh.material = this.character2D.frontMaterial;
      if (this.character2D.mesh.material.diffuseTexture) this.character2D.mesh.material.diffuseTexture.uScale = -1;
    } else if (angle <= -1.5 && angle > -3) {
      this.character2D.mesh.material = this.character2D.frontMaterial;
      if (this.character2D.mesh.material.diffuseTexture) this.character2D.mesh.material.diffuseTexture.uScale = 1;
    }
  }
}
