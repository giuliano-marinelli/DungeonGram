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
  isDM?: boolean;
  isPlayer?: boolean;
  avatar?: string;
  username?: string;
  email?: string;
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
            world: parameters.world,
            canvas: parameters.canvas,
            scene: parameters.scene,
            room: parameters.room,
            token: parameters.token,
            controller: parameters.controller,
            assets: parameters.assets
          }
        }
      },
      figureDrawer: {
        type: Figure, datatype: Object, parameters: () => {
          return {
            userId: this.id,
            world: parameters.world,
            canvas: parameters.canvas,
            scene: parameters.scene,
            room: parameters.room,
            token: parameters.token,
            controller: parameters.controller,
            assets: parameters.assets
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
          case 'isDM':
            if (this.id == this.parameters.token) this.parameters.controller.updateSetting('isDM', this.isDM);
            break;
          case 'isPlayer':
            if (this.id == this.parameters.token) this.parameters.controller.updateSetting('isPlayer', this.isPlayer);
            break;
          case 'selectedCharacter':
            this.parameters.world.updateCharactersVisibility();
            if (change.previousValue && this.parameters.world.characters) this.parameters.world.characters[change.previousValue]?.initSelection();
            if (change.value && this.parameters.world.characters) this.parameters.world.characters[change.value]?.initSelection();
            if (this.id == this.parameters.token) {
              this.parameters.controller.updateSetting('selectedCharacter', this.selectedCharacter);
              setTimeout(() => {
                if (this.selectedCharacter)
                  this.parameters.controller.updateSetting('selectedCharacterObj', this.parameters.world.characters[this.selectedCharacter])
                else
                  setTimeout(() => { if (!this.selectedCharacter) this.parameters.controller.updateSetting('selectedCharacterObj', null) }, 800);
              }, 400);

              if (change.value && this.parameters.world.characters) {
                this.parameters.world.camera?.focusOnMesh(this.parameters.world.characters[change.value].mesh);
              }
            }
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

  remove() {
    super.remove();
    this.removeActions();
  }

  removeActions() {
    Object.entries(this.actions)?.forEach(([key, value]) => {
      this.parameters.canvas?.removeEventListener("pointermove", value, false);
      this.parameters.canvas?.removeEventListener("pointerup", value, false);
    });
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
