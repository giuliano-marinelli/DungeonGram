import { Schema, type, MapSchema, ArraySchema } from '@colyseus/schema';
import { Map } from './map';
import { User } from './user';
import { Character } from './character';
import { Wall } from './wall';
import { Point } from './point';
import { Utils } from '../utils';
import { WorldPhysics } from '../physics/world.physics';

import mongoose from 'mongoose';
import { default as CampaignDB } from '../../database/models/campaign';
import { default as InvitationDB } from '../../database/models/invitation';
import { default as CharacterDB } from '../../database/models/character';
import { default as MapDB } from '../../database/models/map';

export class World extends Schema {
  @type("string")
  campaignId: string;
  @type({ map: User })
  users = new MapSchema<User>();
  @type({ map: Character })
  characters = new MapSchema<Character>();
  @type(Map)
  map: Map;
  @type("number")
  fogOfWarVisibilityPlayers: number;
  @type("number")
  maxVisionCharacters: number;
  @type("string")
  publicSelectedCharacter: string;
  //physics
  worldPhysics: WorldPhysics;

  loadTimer: number = 0;

  command = {
    user: {
      join: {
        do: async (client: string, data: any) => {
          if (!this.users[client]) {
            const campaign = await CampaignDB.findOne({ _id: this.campaignId });
            var user = campaign.users.find((u) => u.ref == client);
            this.addUser(user, campaign, client);
          }

          // if (this.map && !this.map.characters[client]) {
          //   this.map.characters[client] = new Character();
          //   this.map.characters[client].characterPhysics = this.map.worldPhysics.addEntity(client, 'character', { x: this.map.characters[client].x, y: this.map.characters[client].y }) //add physics character
          // }
        }
      },
      leave: {
        do: (client: string, data: any) => {
          // delete this.users[client];
          // delete this.characters[client];
          // this.worldPhysics.removeEntity(client, 'character'); //remove physics character
        }
      },
    },
    character: {
      move: {
        do: (client: string, data: any) => {
          if (this.map != null && this.map.mapId == this.characters[this.users[client].selectedCharacter]?.map) {
            if (!this.users[client].addingModeCharacter &&
              this.users[client].selectedCharacter &&
              data.x >= 0 && data.y >= 0 &&
              data.x < this.map.tilemap.width && data.y < this.map.tilemap.height)
              this.characters[this.users[client].selectedCharacter].move({ x: data.x, y: data.y });
          }
        },
        validate: (client: string, data: any) => {
          return data.x != null && data.y != null && typeof data.x === "number" && typeof data.y === "number" && this.users[client].isPlayer
        }
      },
      drag: {
        do: (client: string, data: any) => {
          if (this.map != null && this.map.mapId == this.characters[data.id]?.map) {
            if (!this.users[client].addingModeCharacter || this.users[client].addingModeCharacter == data.id) {
              var point = data.x || data.y ? { x: data.x, y: data.y } : null;
              this.characters[data.id].drag(point);
            }
          }
        },
        validate: (client: string, data: any) => {
          return data.id != null && typeof data.id === "string" && this.users[client].isDM
        }
      },
      drop: {
        do: (client: string, data: any) => {
          if (this.map != null && this.map.mapId == this.characters[data.id]?.map) {
            if (!this.users[client].addingModeCharacter)
              this.characters[data.id].drop(data.snapToGrid);
          }
        },
        validate: (client: string, data: any) => {
          return data.id != null && typeof data.id === "string" && this.users[client].isDM
        }
      },
      select: {
        do: (client: string, data: any) => {
          if (this.map != null && this.map.mapId == this.characters[data.id]?.map) {
            if (!this.users[client].addingModeCharacter)
              this.users[client].selectedCharacter = this.users[client].selectedCharacter != data.id ? data.id : null;
          }
        },
        validate: (client: string, data: any) => {
          return data.id != null && typeof data.id === "string" && this.users[client].isDM
        }
      },
      addingModeOn: {
        do: async (client: string, data: any) => {
          if (!this.users[client].addingModeCharacter) {
            //add adding mode character
            var id = await this.addCharacter({ model: data.model, map: this.map?.mapId })
            this.characters[id].addingMode = true;

            //activate adding mode on user with the created characeter
            this.users[client].addingModeCharacter = id;
            this.users[client].addingModeModel = data.model;

            //drag adding mode character to the point sended
            var point = data.x || data.y ? { x: data.x, y: data.y } : null;
            this.characters[id].drag(point);
          } else {
            var lastAddingModeModel = this.users[client].addingModeModel;
            this.execCommand(client, 'character', { action: 'addingModeOff' });
            if (lastAddingModeModel != data.model)
              this.execCommand(client, 'character', data);
          }
        },
        validate: (client: string, data: any) => {
          return this.map != null && data.model != null && typeof data.model === "string" && this.users[client].isDM
        }
      },
      addingModeOff: {
        do: (client: string, data: any) => {
          //remove adding mode character
          delete this.characters[this.users[client].addingModeCharacter]

          //deactivate adding mode on user
          this.users[client].addingModeCharacter = null;
          this.users[client].addingModeModel = null;
        },
        validate: (client: string, data: any) => { return this.users[client].isDM }
      },
      add: {
        do: async (client: string, data: any) => {
          if (this.users[client].addingModeCharacter) {
            // console.log("addingModeCharacter.dbId", this.characters[this.users[client].addingModeCharacter].dbId)

            //find the character model of the character to add and transform toJSON (this last is for deleting the _id)
            var addingCharacterModel = await CharacterDB.findOne({ _id: this.characters[this.users[client].addingModeCharacter].dbId });
            addingCharacterModel = addingCharacterModel.toJSON();
            if (addingCharacterModel) {
              addingCharacterModel.copyOf = addingCharacterModel._id;
              delete addingCharacterModel._id;

              console.log("addingCharacterModel", addingCharacterModel._id)
              //add a copy of the model but with copyOf
              var characterModel = await new CharacterDB(addingCharacterModel).save();

              // console.log("characterModel", characterModel._id)

              //add character to the map
              this.addCharacter({
                model: characterModel._id,
                position: { x: data.x, y: data.y },
                map: this.map?.mapId
              });
            }
          }
        },
        validate: (client: string, data: any) => {
          return this.map != null && data.x != null && typeof data.x === "number" && data.y != null && typeof data.y === "number" && this.users[client].isDM
        }
      },
      remove: {
        do: async (client: string, data: any) => {
          //remove character physics
          this.worldPhysics?.removeEntity(data.id, 'character');
          //remove character model from db
          await CharacterDB.deleteOne({ _id: this.characters[data.id].dbId });
          //remove character from campaign
          delete this.characters[data.id];
          //deselect the character on users
          for (var user in this.users) {
            if (this.users[user].selectedCharacter == data.id) this.users[user].selectedCharacter = null;
          }
        },
        validate: (client: string, data: any) => {
          return data.id != null && typeof data.id === "string" && this.users[client].isDM
        }
      },
      update: {
        do: (client: string, data: any) => {
          if (data.character) {
            this.characters[data.character].load();
          }
          data.roomRef.broadcast('characterUpdate');
        },
        validate: (client: string, data: any) => {
          return (data.character == null || typeof data.character === "string")
        }
      },
      assignTo: {
        do: (client: string, data: any) => {
          if (data.toPublic) {
            this.publicSelectedCharacter = data.character;
            for (let userId in this.users) {
              if (!this.users[userId].isPlayer) this.users[userId].selectedCharacter = data.character;
            }
          } else {
            this.users[data.user].selectedCharacter = data.character;
          }
        },
        validate: (client: string, data: any) => {
          return data.character != null && typeof data.character === "string" &&
            ((data.user != null && typeof data.user === "string") || (data.toPublic != null && typeof data.toPublic === "boolean"))
            && this.users[client].isDM
        }
      },
      moveToMap: {
        do: (client: string, data: any) => {
          this.characters[data.character].map = data.map ? data.map : null;
        },
        validate: (client: string, data: any) => {
          return data.character != null && typeof data.character === "string" && (!data.map || typeof data.map === "string") && this.users[client].isDM
        }
      },
      lookAt: {
        do: (client: string, data: any) => {
          if (this.map != null &&
            (this.map.mapId == this.characters[this.users[client].selectedCharacter]?.map ||
              this.map.mapId == this.characters[data.id]?.map)) {
            if (!this.users[client].addingModeCharacter &&
              data.x >= 0 && data.y >= 0 &&
              data.x < this.map.tilemap.width && data.y < this.map.tilemap.height) {
              if (data.id)
                this.characters[data.id].lookAt({ x: data.x, y: data.y });
              else if (this.users[client].selectedCharacter)
                this.characters[this.users[client].selectedCharacter].lookAt({ x: data.x, y: data.y });
            }
          }
        },
        validate: (client: string, data: any) => {
          return data.x != null && data.y != null && typeof data.x === "number" && typeof data.y === "number" &&
            (data.id == null || typeof data.id === "string") && this.users[client].isPlayer
        }
      },
      animation: {
        do: (client: string, data: any) => {
          if (this.map != null && this.map.mapId == this.characters[this.users[client].selectedCharacter]?.map) {
            if (!this.users[client].addingModeCharacter &&
              this.users[client].selectedCharacter) {
              this.characters[this.users[client].selectedCharacter].animation = data.animation;
              this.characters[this.users[client].selectedCharacter].stealth = false;
            }
          }
        },
        validate: (client: string, data: any) => {
          return data.animation != null && typeof data.animation === "string" && this.users[client].isPlayer
        }
      },
      stealth: {
        do: (client: string, data: any) => {
          if (this.map != null && this.map.mapId == this.characters[this.users[client].selectedCharacter]?.map) {
            if (!this.users[client].addingModeCharacter &&
              this.users[client].selectedCharacter) {
              this.characters[this.users[client].selectedCharacter].animation = "None";
              this.characters[this.users[client].selectedCharacter].stealth = data.stealth;
            }
          }
        },
        validate: (client: string, data: any) => {
          return data.stealth != null && typeof data.stealth === "boolean" && this.users[client].isPlayer
        }
      },
      hide: {
        do: (client: string, data: any) => {
          if (this.map.mapId == this.characters[data.id]?.map && !this.users[client].addingModeCharacter) {
            this.characters[data.id].hidden = data.hide;
          }
        },
        validate: (client: string, data: any) => {
          return this.map != null && data.id != null && data.hide != null &&
            typeof data.id === "string" && typeof data.hide === "boolean" && this.users[client].isDM
        }
      },
    },
    wall: {
      state: { wallFirstPoint: null },
      start: {
        do: (client: string, data: any) => {
          this.command.wall.state.wallFirstPoint = { x: data.x, y: data.y };
        },
        validate: (client: string, data: any) => {
          return this.map != null && data.x != null && data.y != null && typeof data.x === "number" && typeof data.y === "number" && this.users[client].isDM
        }
      },
      end: {
        do: (client: string, data: any) => {
          if (this.command.wall.state.wallFirstPoint != null &&
            (this.command.wall.state.wallFirstPoint.x != data.x
              || this.command.wall.state.wallFirstPoint.y != data.y)) {
            this.map.addWall({
              from: this.command.wall.state.wallFirstPoint,
              to: { x: data.x, y: data.y },
              defaultTo: { x: data.x, y: data.y },
              size: data.size,
              type: data.type,
              blocked: false,
              hidden: false
            });
          }
          this.command.wall.state.wallFirstPoint = null;
        },
        validate: (client: string, data: any) => {
          return this.map != null && data.x != null && data.y != null && data.size != null && data.type != null &&
            typeof data.x === "number" && typeof data.y === "number" && typeof data.size === "string" && typeof data.type === "string" &&
            this.users[client].isDM
        }
      },
      cancel: {
        do: (client: string, data: any) => {
          this.command.wall.state.wallFirstPoint = null;
        },
        validate: (client: string, data: any) => {
          return this.map != null && this.users[client].isDM;
        }
      },
      remove: {
        do: (client: string, data: any) => {
          this.map.deleleWall(data.id);
          this.map.worldPhysics.removeEntity(data.id, 'wall'); //remove physics wall
        },
        validate: (client: string, data: any) => {
          return this.map != null && data.id != null && typeof data.id === "string" && this.users[client].isDM
        }
      },
      visibility: {
        do: (client: string, data: any) => {
          this.users[client].wallsVisibility = data.value;
        },
        validate: (client: string, data: any) => {
          return data.value != null && typeof data.value === "number" && this.users[client].isDM
        }
      },
      pickable: {
        do: (client: string, data: any) => {
          this.users[client].wallsPickable = data.value;
        },
        validate: (client: string, data: any) => {
          return data.value != null && typeof data.value === "boolean" && this.users[client].isDM
        }
      },
      rotate: {
        do: (client: string, data: any) => {
          if (this.map.getWall(data.id)?.type == "door" &&
            ((!this.map.getWall(data.id)?.blocked && !this.map.getWall(data.id)?.hidden) || this.users[client].isDM)) {
            this.map.getWall(data.id).rotateTo(data.target);
          }
        },
        validate: (client: string, data: any) => {
          return this.map != null && data.id != null && data.target != null &&
            typeof data.id === "string" && typeof data.target.x === "number" && typeof data.target.y === "number" &&
            this.users[client].isPlayer
        }
      },
      endRotate: {
        do: (client: string, data: any) => {
          if (this.map.getWall(data.id)?.type == "door" &&
            ((!this.map.getWall(data.id)?.blocked && !this.map.getWall(data.id)?.hidden) || this.users[client].isDM)) {
            this.worldPhysics.updateGrid();
            this.map.getWall(data.id).updatePhysics();
          }
        },
        validate: (client: string, data: any) => {
          return this.map != null && data.id != null && typeof data.id === "string" && this.users[client].isPlayer
        }
      },
      block: {
        do: (client: string, data: any) => {
          if (this.map.getWall(data.id)?.type == "door") {
            this.map.getWall(data.id).blocked = data.block;
          }
        },
        validate: (client: string, data: any) => {
          return this.map != null && data.id != null && data.block != null &&
            typeof data.id === "string" && typeof data.block === "boolean" && this.users[client].isDM
        }
      },
      hide: {
        do: (client: string, data: any) => {
          if (this.map.getWall(data.id)?.type == "door") {
            this.map.getWall(data.id).hidden = data.hide;
          }
        },
        validate: (client: string, data: any) => {
          return this.map != null && data.id != null && data.hide != null &&
            typeof data.id === "string" && typeof data.hide === "boolean" && this.users[client].isDM
        }
      },
      close: {
        do: (client: string, data: any) => {
          if (this.map.getWall(data.id)?.type == "door" &&
            ((!this.map.getWall(data.id)?.blocked && !this.map.getWall(data.id)?.hidden) || this.users[client].isDM)) {
            this.map.getWall(data.id).rotateTo(this.map.getWall(data.id).defaultTo);
          }
        },
        validate: (client: string, data: any) => {
          return this.map != null && data.id != null && typeof data.id === "string" && this.users[client].isPlayer
        }
      },
      closeAll: {
        do: (client: string, data: any) => {
          for (var door in this.map?.doors) {
            this.map.doors[door].rotateTo(this.map.doors[door].defaultTo);
          }
          this.worldPhysics.updateGrid();
          for (var door in this.map?.doors) {
            this.map.getWall(data.id).updatePhysics();
          }
        },
        validate: (client: string, data: any) => {
          return this.map != null && this.users[client].isDM
        }
      }
    },
    tilemap: {
      resize: {
        do: (client: string, data: any) => {
          if (data.width >= 2 && data.width <= 250 && data.height >= 2 && data.height <= 250
            && data.width % 2 == 0 && data.height % 2 == 0) {
            this.map.tilemap.changeSize(data.width, data.height);
            this.map.worldPhysics.setGrid({ width: data.width, height: data.height });
          }
        },
        validate: (client: string, data: any) => {
          return this.map != null && data.width != null && data.height != null &&
            typeof data.width === "number" && typeof data.height === "number" && this.users[client].isDM
        }
      },
      show: {
        do: (client: string, data: any) => {
          this.users[client].tilemapShowGrid = data.value;
        },
        validate: (client: string, data: any) => { return data.value != null && typeof data.value === "boolean" }
      },
    },
    rule: {
      start: {
        do: (client: string, data: any) => {
          this.users[client].rule.start({ x: data.x, y: data.y });
        },
        validate: (client: string, data: any) => {
          return data.x != null && data.y != null && typeof data.x === "number" && typeof data.y === "number" && this.users[client].isPlayer
        }
      },
      move: {
        do: (client: string, data: any) => {
          this.users[client].rule.move({ x: data.x, y: data.y });
        },
        validate: (client: string, data: any) => {
          return data.x != null && data.y != null && typeof data.x === "number" && typeof data.y === "number" && this.users[client].isPlayer
        }
      },
      add: {
        do: (client: string, data: any) => {
          this.users[client].rule.add({ x: data.x, y: data.y });
        },
        validate: (client: string, data: any) => {
          return data.x != null && data.y != null && typeof data.x === "number" && typeof data.y === "number" && this.users[client].isPlayer
        }
      },
      end: {
        do: (client: string, data: any) => {
          this.users[client].rule.end();
        },
        validate: (client: string, data: any) => {
          return this.users[client].isPlayer
        }
      },
      share: {
        do: (client: string, data: any) => {
          this.users[client].rule.shared = data.value;
        },
        validate: (client: string, data: any) => {
          return data.value != null && typeof data.value === "boolean" && this.users[client].isPlayer
        }
      },
      normalizeUnit: {
        do: (client: string, data: any) => {
          this.users[client].rule.normalizeUnit = data.value;
        },
        validate: (client: string, data: any) => {
          return data.value != null && typeof data.value === "boolean" && this.users[client].isPlayer
        }
      }
    },
    figure: {
      start: {
        do: (client: string, data: any) => {
          this.users[client].figureDrawer.start({ x: data.x, y: data.y });
        },
        validate: (client: string, data: any) => {
          return data.x != null && data.y != null && typeof data.x === "number" && typeof data.y === "number" && this.users[client].isPlayer
        }
      },
      move: {
        do: (client: string, data: any) => {
          this.users[client].figureDrawer.move({ x: data.x, y: data.y });
        },
        validate: (client: string, data: any) => {
          return data.x != null && data.y != null && typeof data.x === "number" && typeof data.y === "number" && this.users[client].isPlayer
        }
      },
      end: {
        do: (client: string, data: any) => {
          this.users[client].figureDrawer.end();
        },
        validate: (client: string, data: any) => {
          return this.users[client].isPlayer
        }
      },
      share: {
        do: (client: string, data: any) => {
          this.users[client].figureDrawer.shared = data.value;
        },
        validate: (client: string, data: any) => {
          return data.value != null && typeof data.value === "boolean" && this.users[client].isPlayer
        }
      },
      type: {
        do: (client: string, data: any) => {
          this.users[client].figureDrawer.type = data.value;
        },
        validate: (client: string, data: any) => {
          return data.value != null &&
            (data.value == 'triangle' || data.value == 'circle' || data.value == 'square') && this.users[client].isPlayer
        }
      },
      normalizeUnit: {
        do: (client: string, data: any) => {
          this.users[client].figureDrawer.normalizeUnit = data.value;
        },
        validate: (client: string, data: any) => {
          return data.value != null && typeof data.value === "boolean" && this.users[client].isPlayer
        }
      }
    },
    fogOfWar: {
      visibility: {
        do: (client: string, data: any) => {
          this.users[client].fogOfWarVisibility = data.value;
        },
        validate: (client: string, data: any) => {
          return data.value != null && typeof data.value === "number" && this.users[client].isDM
        }
      },
      visibilityPlayers: {
        do: (client: string, data: any) => {
          this.fogOfWarVisibilityPlayers = data.value;
        },
        validate: (client: string, data: any) => {
          return data.value != null && typeof data.value === "number" && this.users[client].isDM
        }
      },
      visionCharacters: {
        do: (client: string, data: any) => {
          this.maxVisionCharacters = data.value;
        },
        validate: (client: string, data: any) => {
          return data.value != null && typeof data.value === "number" && this.users[client].isDM
        }
      }
    },
    map: {
      open: {
        do: async (client: string, data: any) => {
          var previousMap = this.map?.mapId;
          if (this.map) {
            this.map.persist();
            this.map.remove();
            this.map = null;
            await CampaignDB.update({ _id: this.campaignId }, { $set: { openedMap: null } });
          }
          if (previousMap != data.map && this.loadTimer == 0) {
            this.loadTimer = 1500;
            await CampaignDB.update({ _id: this.campaignId }, { $set: { openedMap: data.map } });
            setTimeout(() => {
              this.worldPhysics = new WorldPhysics();
              this.map = new Map(this.worldPhysics);
              this.map.load(data.map);
              this.updateCharactersPhysics();
            }, 1000);
          }
          this.execCommand(client, 'character', { action: 'addingModeOff' });
          data.roomRef?.broadcast('mapUpdate');
        },
        validate: (client: string, data: any) => {
          return data.map != null && typeof data.map === "string" && this.users[client].isDM
        }
      },
      close: {
        do: async (client: string, data: any) => {
          this.map.persist();
          this.map.remove();
          this.map = null;
          await CampaignDB.update({ _id: this.campaignId }, { $set: { openedMap: null } });
          this.execCommand(client, 'character', { action: 'addingModeOff' });
          data.roomRef?.broadcast('mapUpdate');
        },
        validate: (client: string, data: any) => {
          return this.map != null && this.users[client].isDM
        }
      },
      discard: {
        do: async (client: string, data: any) => {
          this.map.remove();
          this.map = null;
          await CampaignDB.update({ _id: this.campaignId }, { $set: { openedMap: null } });
          this.execCommand(client, 'character', { action: 'addingModeOff' });
          data.roomRef?.broadcast('mapUpdate');
        },
        validate: (client: string, data: any) => {
          return this.map != null && this.users[client].isDM
        }
      },
      updateTilemap: {
        do: async (client: string, data: any) => {
          this.map.updateTilemap();
        },
        validate: (client: string, data: any) => {
          return this.map != null && this.users[client].isDM
        }
      },
      update: {
        do: (client: string, data: any) => {
          data.roomRef?.broadcast('mapUpdate');
        }
      },
      add: {
        do: async (client: string, data: any) => {
          //find the map model to add and transform toJSON (this last is for deleting the _id)
          var mapModel = await MapDB.findOne({ _id: data.map });
          mapModel = mapModel.toJSON();
          if (mapModel) {
            mapModel.copyOf = mapModel._id;
            delete mapModel._id;

            //add a copy of the model but with copyOf
            const map = await new MapDB(mapModel).save();

            //add map to the campaign
            const campaign = await CampaignDB.findOne({ _id: this.campaignId });
            campaign.maps.push(map._id);
            await campaign.save();
            data.roomRef?.broadcast('mapUpdate');
          }
        },
        validate: (client: string, data: any) => {
          return data.map != null && typeof data.map == "string" && this.users[client].isDM
        }
      },
      remove: {
        do: async (client: string, data: any) => {
          //nullify map on characters on that map
          for (var id in this.characters) {
            if (this.characters[id].map == data.map)
              this.characters[id].map = null;
          }
        },
        validate: (client: string, data: any) => {
          return data.map != null && typeof data.map == "string" && this.users[client].isDM
        }
      }
    }
  }

  constructor() {
    super();

    // this.map = new Map();
    // this.map.tilemap = new TileMap(20, 20);

    // this.map.worldPhysics = new WorldPhysics();
    // this.map.worldPhysics.setGrid({ width: 20, height: 20 });
  }

  execCommand(client?: string, type?: string | number, data?: any) {
    try {
      if (client && type
        && data?.action
        && this.command[type]
        && this.command[type][data?.action]
        && this.command[type][data?.action].do) {
        if (this.command[type][data?.action].validate) {
          if (this.command[type][data?.action].validate(client, data))
            this.command[type][data?.action].do(client, data);
          else
            throw new Error('invalid action params for command "' + type + '"');
        } else {
          this.command[type][data?.action].do(client, data);
        }
      } else {
        throw new Error('inexistent action "' + data?.action + '" for command "' + type + '"');
      }
    } catch (err) {
      delete data.roomRef;
      console.warn('GameRoom: client', client, 'send action that produce an error:', err.message, '... data:', data);
    }
  }

  update(deltaTime: number) {
    this.loadTimer = this.loadTimer - deltaTime >= 0 ? this.loadTimer - deltaTime : 0;

    //udpate physics world
    this.map?.worldPhysics?.update(deltaTime);

    //update each character (each one update their physics individually)
    for (var id in this.characters) {
      if (this.map && this.characters[id].map == this.map.mapId && this.characters[id].characterPhysics)
        this.characters[id].update(deltaTime);
    }
  }

  updateCharactersPhysics() {
    for (let key in this.characters) {
      if (this.characters[key].map == this.map.mapId) {
        this.characters[key].characterPhysics = this.worldPhysics.addEntity(key, 'character', {
          x: this.characters[key].x, y: this.characters[key].y
        });
      } else {
        this.worldPhysics.removeEntity(key, 'character');
      }
    }
  }

  async load(campaignId) {
    this.campaignId = campaignId.toString();

    const campaign = await CampaignDB.findOne({ _id: this.campaignId });

    campaign.users.forEach(user => {
      this.addUser(user, campaign)
    });

    campaign.characters.forEach(character => {
      this.addCharacter(character)
    });

    if (campaign.openedMap)
      this.command.map.open.do(null, { map: campaign.openedMap });

    this.fogOfWarVisibilityPlayers = campaign.settings?.fogOfWarVisibilityPlayers != null
      ? campaign.settings?.fogOfWarVisibilityPlayers : 0;

    this.maxVisionCharacters = campaign.settings?.maxVisionCharacters != null
      ? campaign.settings?.maxVisionCharacters : 200;

    this.publicSelectedCharacter = campaign.settings?.publicSelectedCharacter != null
      ? campaign.settings?.publicSelectedCharacter : null;
  }

  async persist() {
    const campaign = await CampaignDB.findOne({ _id: this.campaignId });

    var usersOnCampaign = [];
    if (campaign.users) {
      usersOnCampaign = campaign.users.filter((u) => {
        for (let userId in this.users) {
          if (u.ref == userId) return false;
        }
        return true;
      });
    }

    for (let userId in this.users) {
      if (this.users[userId].isPlayer) {
        usersOnCampaign.push({
          ref: userId,
          settings: {
            wallsVisibility: this.users[userId].wallsVisibility,
            fogOfWarVisibility: this.users[userId].fogOfWarVisibility,
            tilemapShowGrid: this.users[userId].tilemapShowGrid,
            selectedCharacter: this.users[userId].selectedCharacter,
            isDM: this.users[userId].isDM,
            isPlayer: this.users[userId].isPlayer,
          }
        });
      }
    }

    var charactersOnCampaign = [];
    for (let characterId in this.characters) {
      if (!this.characters[characterId].addingMode) {
        charactersOnCampaign.push({
          _id: characterId,
          map: this.characters[characterId].map ? mongoose.Types.ObjectId(this.characters[characterId].map) : null,
          position: {
            x: this.characters[characterId].x,
            y: this.characters[characterId].y
          },
          direction: {
            x: this.characters[characterId].direction.x,
            y: this.characters[characterId].direction.y
          },
          animation: this.characters[characterId].animation,
          stealth: this.characters[characterId].stealth,
          hidden: this.characters[characterId].hidden,
          // name: this.characters[characterId].name,
          // group: this.characters[characterId].group,
          // visionRange: this.characters[characterId].visionRange,
          model: this.characters[characterId].dbId
        });
      }
    }

    campaign.users = usersOnCampaign;
    campaign.characters = charactersOnCampaign;
    campaign.settings = {
      fogOfWarVisibilityPlayers: this.fogOfWarVisibilityPlayers,
      maxVisionCharacters: this.maxVisionCharacters,
      publicSelectedCharacter: this.publicSelectedCharacter
    }

    await CampaignDB.updateOne({ _id: campaign._id }, campaign);

    //persist actual map before dispose room
    this.map?.persist();
  }

  async addUser(user, campaign, client?) {
    if (!user) user = { settings: {} };
    if (!user?.ref && !client) return;

    if (!user.ref) user.ref = client;
    if (!user.settings.wallsVisibility) user.settings.wallsVisibility = 0;
    if (!user.settings.fogOfWarVisibility) user.settings.fogOfWarVisibility = 0;
    if (!user.settings.tilemapShowGrid) user.settings.tilemapShowGrid = 1;
    if (!user.settings.selectedCharacter) user.settings.selectedCharacter = null;
    if (!user.settings.isDM) user.settings.isDM = client == campaign.owner;

    user.settings.isPlayer = false;
    if (user.settings.isDM) {
      user.settings.isPlayer = true;
    } else {
      const invitation = await InvitationDB.findOne({ recipient: mongoose.Types.ObjectId(user.ref), campaign: campaign._id, accepted: true });
      if (invitation) user.settings.isPlayer = true;
    }
    if (!user.settings.isPlayer) user.settings.selectedCharacter = this.publicSelectedCharacter;

    this.users[user.ref] = new User();
    this.users[user.ref].wallsVisibility = user.settings.wallsVisibility;
    this.users[user.ref].fogOfWarVisibility = user.settings.fogOfWarVisibility;
    this.users[user.ref].tilemapShowGrid = user.settings.tilemapShowGrid;
    this.users[user.ref].selectedCharacter = user.settings.selectedCharacter;
    this.users[user.ref].isDM = user.settings.isDM;
    this.users[user.ref].isPlayer = user.settings.isPlayer;

    if (user.ref) this.users[user.ref].load(user.ref); //load a specific user of db
  }

  async addCharacter(character) {
    if (!character._id) character._id = Utils.uuidv4();
    if (!character.map) character.map = "";
    if (!character.position) character.position = { x: 0, y: 0 };
    if (!character.direction) character.direction = { x: 1, y: 0 };
    if (!character.animation) character.animation = "None";
    if (!character.stealth) character.stealth = false;
    if (!character.hidden) character.hidden = false;
    // if (!character.visionRange) character.visionRange = 10;
    // if (!character.group) character.group = 'Ungrouped';
    // if (!character.name) {
    //   var modelObj = await CharacterDB.findOne({ _id: character.model });
    //   if (modelObj) {
    //     const countExistentModels = Object.values(this.characters).filter((c) => c.name.startsWith(modelObj.name)).length;
    //     character.name = modelObj.name + ' ' + (countExistentModels);
    //   } else {
    //     character.name = 'Unnamed';
    //   }
    // }

    this.characters[character._id] = new Character();
    this.characters[character._id].map = character.map.toString();
    this.characters[character._id].x = character.position.x;
    this.characters[character._id].y = character.position.y;
    this.characters[character._id].direction = new Point(character.direction.x, character.direction.y);
    this.characters[character._id].animation = character.animation;
    this.characters[character._id].stealth = character.stealth;
    this.characters[character._id].hidden = character.hidden;
    // this.characters[character._id].visionRange = character.visionRange;
    // this.characters[character._id].group = character.group;
    // this.characters[character._id].name = character.name;
    if (character.model) this.characters[character._id].load(character.model); //load a specific character of db

    if (this.map && this.characters[character._id].map == this.map?.mapId) {
      this.characters[character._id].characterPhysics = this.worldPhysics.addEntity(character._id, 'character', {
        x: this.characters[character._id].x, y: this.characters[character._id].y
      });
    }

    return character._id;
  }
}
