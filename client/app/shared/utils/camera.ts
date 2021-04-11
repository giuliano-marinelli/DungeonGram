import * as BABYLON from '@babylonjs/core/Legacy/legacy';

export class Camera {

  static PanningAsDefaultCameraInput() {
    BABYLON.ArcRotateCameraKeyboardMoveInput.prototype.checkInputs = function () {
      if (this._onKeyboardObserver) {
        var camera = this.camera;
        for (var index = 0; index < this._keys.length; index++) {
          var keyCode = this._keys[index];
          if (this.keysLeft.indexOf(keyCode) !== -1) {
            if (this._ctrlPressed && this.camera._useCtrlForPanning) {
              camera.inertialAlphaOffset -= this.angularSpeed;
            }
            else {
              camera.inertialPanningX -= 1 / this.panningSensibility;
            }
          }
          else if (this.keysUp.indexOf(keyCode) !== -1) {
            if (this._ctrlPressed && this.camera._useCtrlForPanning) {
              camera.inertialBetaOffset -= this.angularSpeed;
            }
            else if (this._altPressed && this.useAltToZoom) {
              camera.inertialRadiusOffset += 1 / this.zoomingSensibility;
            }
            else {
              camera.inertialPanningY += 1 / this.panningSensibility;
            }
          }
          else if (this.keysRight.indexOf(keyCode) !== -1) {
            if (this._ctrlPressed && this.camera._useCtrlForPanning) {
              camera.inertialAlphaOffset += this.angularSpeed;
            }
            else {
              camera.inertialPanningX += 1 / this.panningSensibility;

            }
          }
          else if (this.keysDown.indexOf(keyCode) !== -1) {
            if (this._ctrlPressed && this.camera._useCtrlForPanning) {
              camera.inertialBetaOffset += this.angularSpeed;
            }
            else if (this._altPressed && this.useAltToZoom) {
              camera.inertialRadiusOffset -= 1 / this.zoomingSensibility;
            }
            else {
              camera.inertialPanningY -= 1 / this.panningSensibility;
            }
          }
          else if (this.keysReset.indexOf(keyCode) !== -1) {
            if (camera.useInputToRestoreState) {
              camera.restoreState();
            }
          }
        }
      }
    }
  }

  static AddPanningCamera(camera: BABYLON.ArcRotateCamera, panningSensibility: number = 50, keys: Array<string> = ["w", "a", "s", "d"]) {
    document.addEventListener("keydown", event => {
      if (event.key == keys[0]) {
        camera.inertialPanningY += 1 / panningSensibility;
      }
      if (event.key == keys[1]) {
        camera.inertialPanningX -= 1 / panningSensibility;
      }
      if (event.key == keys[2]) {
        camera.inertialPanningY -= 1 / panningSensibility;
      }
      if (event.key == keys[3]) {
        camera.inertialPanningX += 1 / panningSensibility;
      }
    });
  }

}
