import { Schema } from './schema';
import { Rule } from './rule';
import { Figure } from './figure';

export class User extends Schema {
  //schema
  id?: string;
  wallsVisibility?: number;
  wallsPickable?: boolean;
  fogOfWarVisibility?: number;
  tilemapShowGrid?: number;
  rule?: Rule;
  figureDrawer?: Figure;
  selectedCharacter?: string;
  addingModeCharacter?: string;
  addingModeModel?: string;
  //global actions registered
  actions: any = {};

  constructor(schema, parameters) {
    super(parameters);

    this.id = parameters.id;

    this.initActions();

    this.synchronizeSchema(schema, {
      rule: {
        type: Rule, datatype: Object, parameters: () => {
          return {
            userId: this.id,
            canvas: parameters.canvas,
            scene: parameters.scene,
            room: parameters.room,
            token: parameters.token,
            controller: parameters.controller
          }
        }
      },
      figureDrawer: {
        type: Figure, datatype: Object, parameters: () => {
          return {
            userId: this.id,
            canvas: parameters.canvas,
            scene: parameters.scene,
            room: parameters.room,
            token: parameters.token,
            controller: parameters.controller
          }
        }
      }
    });
  }

  update(changes?) {
    if (this.id == this.parameters.token) {
      changes?.forEach((change) => {
        switch (change.field) {
          case 'wallsVisibility':
            this.parameters.world.updateWallsVisibility();
            if (this.id == this.parameters.token) this.parameters.controller.updateSetting('wallsVisibility', this.wallsVisibility);
            break;
          case 'wallsPickable':
            this.parameters.world.updateWallsVisibility();
            break;
          case 'fogOfWarVisibility':
            this.parameters.world.updateFogOfWar();
            if (this.id == this.parameters.token) this.parameters.controller.updateSetting('fogOfWarVisibility', this.fogOfWarVisibility);
            break;
          case 'tilemapShowGrid':
            this.parameters.world.updateTilemap();
            if (this.id == this.parameters.token) this.parameters.controller.updateSetting('tilemapShowGrid', this.tilemapShowGrid);
            break;
          case 'selectedCharacter':
            this.parameters.world.updateCharactersVisibility();
            if (change.previousValue && this.parameters.world.map?.characters) this.parameters.world.map?.characters[change.previousValue]?.initVisionLight();
            if (change.value && this.parameters.world.map?.characters) this.parameters.world.map?.characters[change.value]?.initVisionLight();
            if (this.id == this.parameters.token) this.parameters.controller.updateSetting('selectedCharacter', this.selectedCharacter);
            break;
          case 'addingModeCharacter':
            if (this.id == this.parameters.token) {
              this.parameters.controller.updateSetting('addingMode', this.addingModeCharacter != null && this.addingModeCharacter != '');
              if (this.addingModeCharacter) {
                this.parameters.controller.toggleAction('dragCharacter', true);
                this.parameters.canvas.addEventListener("pointermove", this.actions.addingModeActionDrag, false);
                this.parameters.canvas.addEventListener("pointerup", this.actions.addingModeActionAddOrCancel, false);
              } else {
                this.parameters.canvas.removeEventListener("pointermove", this.actions.addingModeActionDrag, false);
                this.parameters.canvas.removeEventListener("pointerup", this.actions.addingModeActionAddOrCancel, false);
                setTimeout(() => {
                  this.parameters.controller.toggleAction('dragCharacter', false);
                }, 10);
              }
            }
            break;
          case 'addingModeModel':
            if (this.id == this.parameters.token) this.parameters.controller.updateSetting('addingModeModel', this.addingModeModel);
            break;
        }
      });
    }
  }

  initActions() {
    this.actions.addingModeActionDrag = (e) => {
      var pick = this.parameters.scene.pick(this.parameters.scene.pointerX, this.parameters.scene.pointerY, (mesh) => { return mesh.isGround });
      if (pick?.pickedPoint) {
        this.parameters.controller.send('game', 'character', { id: this.addingModeCharacter, x: pick.pickedPoint.x, y: pick.pickedPoint.z, action: 'drag' });
      }
    };

    this.actions.addingModeActionAddOrCancel = (e) => {
      if (e.button == 0) {
        var pick = this.parameters.scene.pick(this.parameters.scene.pointerX, this.parameters.scene.pointerY, (mesh) => { return mesh.isGround });
        if (pick?.pickedPoint) {
          this.parameters.controller.send('game', 'character', { x: pick.pickedPoint.x, y: pick.pickedPoint.z, action: 'add' });
        }
      } else if (e.button == 2) {
        this.parameters.controller.send('game', 'character', { action: 'addingModeOff' });
      }
    };
  }
}
