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
import { default as CharacterDB } from '../../database/models/character';

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

  //physics
  worldPhysics: WorldPhysics;

  loadTimer: number = 0;

  command = {
    user: {
      join: {
        do: async (client: string, data: any) => {
          if (!this.users[client]) {
            const campaign = await CampaignDB.findOne({ _id: this.campaignId });
            var campaignUser = campaign.users.find((u) => u.ref == client);
            this.users[client] = new User();
            this.users[client].isDM = client == campaign.owner; //set as DM to the owner
            if (campaignUser) {
              this.users[client].wallsVisibility = campaignUser.settings.wallsVisibility;
              this.users[client].fogOfWarVisibility = campaignUser.settings.fogOfWarVisibility;
              this.users[client].tilemapShowGrid = campaignUser.settings.tilemapShowGrid;
              this.users[client].selectedCharacter = campaignUser.settings.selectedCharacter;
              this.users[client].isDM = campaignUser.settings.isDM || client == campaign.owner;
            }
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
          return data.x != null && data.y != null && typeof data.x === "number" && typeof data.y === "number"
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
            var id = await this.addCharacter({ model: data.model })
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
            console.log("addingModeCharacter.dbId", this.characters[this.users[client].addingModeCharacter].dbId)

            //find the character model of the character to add and transform toJSON (this last is for deleting the _id)
            var addingCharacterModel = await CharacterDB.findOne({ _id: this.characters[this.users[client].addingModeCharacter].dbId });
            addingCharacterModel = addingCharacterModel.toJSON();
            if (addingCharacterModel) {
              addingCharacterModel.copyOf = addingCharacterModel._id;
              delete addingCharacterModel._id;

              console.log("addingCharacterModel", addingCharacterModel._id)
              //add a copy of the model but onCampaign
              var characterModel = await new CharacterDB(addingCharacterModel).save();

              console.log("characterModel", characterModel._id)

              //add character to the map
              this.addCharacter({
                model: characterModel._id,
                position: { x: data.x, y: data.y }
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
          this.worldPhysics.removeEntity(data.id, 'character');
          //remove character model from db
          await CharacterDB.findOneAndRemove({ _id: this.characters[data.id].dbId });
          //remove character from campaign
          delete this.characters[data.id];
        },
        validate: (client: string, data: any) => {
          return this.map != null && data.id != null && typeof data.id === "string" && this.users[client].isDM
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
          this.users[data.user].selectedCharacter = data.character;
        },
        validate: (client: string, data: any) => {
          return data.character != null && typeof data.character === "string" && data.user != null && typeof data.user === "string" && this.users[client].isDM
        }
      },
      moveToMap: {
        do: (client: string, data: any) => {
          this.characters[data.character].map = data.map;
        },
        validate: (client: string, data: any) => {
          return data.character != null && typeof data.character === "string" && data.map != null && typeof data.map === "string" && this.users[client].isDM
        }
      }
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
            var wallId = Utils.uuidv4();
            this.map.walls[wallId] = new Wall(this.command.wall.state.wallFirstPoint, { x: data.x, y: data.y }, data.size);
            this.map.walls[wallId].wallPhysics = this.map.worldPhysics.addEntity(wallId, 'wall',
              { from: this.command.wall.state.wallFirstPoint, to: { x: data.x, y: data.y } }); //add physics wall
            this.map.walls[wallId].updatePhysics();
          }
          this.command.wall.state.wallFirstPoint = null;
        },
        validate: (client: string, data: any) => {
          return this.map != null && data.x != null && data.y != null && data.size != null &&
            typeof data.x === "number" && typeof data.y === "number" && typeof data.size === "string" && this.users[client].isDM
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
          delete this.map.walls[data.id];
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
      }
    },
    tilemap: {
      resize: {
        do: (client: string, data: any) => {
          if (data.width >= 2 && data.width <= 1000 && data.height >= 2 && data.height <= 1000
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
        validate: (client: string, data: any) => { return data.x != null && data.y != null && typeof data.x === "number" && typeof data.y === "number" }
      },
      move: {
        do: (client: string, data: any) => {
          this.users[client].rule.move({ x: data.x, y: data.y });
        },
        validate: (client: string, data: any) => { return data.x != null && data.y != null && typeof data.x === "number" && typeof data.y === "number" }
      },
      add: {
        do: (client: string, data: any) => {
          this.users[client].rule.add({ x: data.x, y: data.y });
        },
        validate: (client: string, data: any) => { return data.x != null && data.y != null && typeof data.x === "number" && typeof data.y === "number" }
      },
      end: {
        do: (client: string, data: any) => {
          this.users[client].rule.end();
        }
      },
      share: {
        do: (client: string, data: any) => {
          this.users[client].rule.shared = data.value;
        },
        validate: (client: string, data: any) => { return data.value != null && typeof data.value === "boolean" }
      },
      normalizeUnit: {
        do: (client: string, data: any) => {
          this.users[client].rule.normalizeUnit = data.value;
        },
        validate: (client: string, data: any) => { return data.value != null && typeof data.value === "boolean" }
      }
    },
    figure: {
      start: {
        do: (client: string, data: any) => {
          this.users[client].figureDrawer.start({ x: data.x, y: data.y });
        },
        validate: (client: string, data: any) => { return data.x != null && data.y != null && typeof data.x === "number" && typeof data.y === "number" }
      },
      move: {
        do: (client: string, data: any) => {
          this.users[client].figureDrawer.move({ x: data.x, y: data.y });
        },
        validate: (client: string, data: any) => { return data.x != null && data.y != null && typeof data.x === "number" && typeof data.y === "number" }
      },
      end: {
        do: (client: string, data: any) => {
          this.users[client].figureDrawer.end();
        }
      },
      share: {
        do: (client: string, data: any) => {
          this.users[client].figureDrawer.shared = data.value;
        },
        validate: (client: string, data: any) => { return data.value != null && typeof data.value === "boolean" }
      },
      type: {
        do: (client: string, data: any) => {
          this.users[client].figureDrawer.type = data.value;
        },
        validate: (client: string, data: any) => {
          return data.value != null &&
            (data.value == 'triangle' || data.value == 'circle' || data.value == 'square')
        }
      },
      normalizeUnit: {
        do: (client: string, data: any) => {
          this.users[client].figureDrawer.normalizeUnit = data.value;
        },
        validate: (client: string, data: any) => { return data.value != null && typeof data.value === "boolean" }
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
        validate: (client: string, data: any) => { return data.map != null && typeof data.map === "string" && this.users[client].isDM }
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
        validate: (client: string, data: any) => { return this.map != null && this.users[client].isDM }
      },
      discard: {
        do: async (client: string, data: any) => {
          this.map.remove();
          this.map = null;
          await CampaignDB.update({ _id: this.campaignId }, { $set: { openedMap: null } });
          this.execCommand(client, 'character', { action: 'addingModeOff' });
          data.roomRef?.broadcast('mapUpdate');
        },
        validate: (client: string, data: any) => { return this.map != null && this.users[client].isDM }
      },
      updateTilemap: {
        do: async (client: string, data: any) => {
          this.map.updateTilemap();
        },
        validate: (client: string, data: any) => { return this.map != null && this.users[client].isDM }
      },
      update: {
        do: (client: string, data: any) => {
          data.roomRef?.broadcast('mapUpdate');
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

    campaign.characters.forEach(character => {
      this.addCharacter(character)
    });

    if (campaign.openedMap)
      this.command.map.open.do(null, { map: campaign.openedMap });

    this.fogOfWarVisibilityPlayers = campaign.settings?.fogOfWarVisibilityPlayers != null
      ? campaign.settings?.fogOfWarVisibilityPlayers : 0;
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
      usersOnCampaign.push({
        ref: userId,
        settings: {
          wallsVisibility: this.users[userId].wallsVisibility,
          fogOfWarVisibility: this.users[userId].fogOfWarVisibility,
          tilemapShowGrid: this.users[userId].tilemapShowGrid,
          selectedCharacter: this.users[userId].selectedCharacter,
          isDM: this.users[userId].isDM
        }
      });
    }

    var charactersOnCampaign = [];
    for (let characterId in this.characters) {
      if (!this.characters[characterId].addingMode) {
        charactersOnCampaign.push({
          _id: characterId,
          map: this.characters[characterId].map,
          position: {
            x: this.characters[characterId].x,
            y: this.characters[characterId].y
          },
          direction: {
            x: this.characters[characterId].direction.x,
            y: this.characters[characterId].direction.y
          },
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
      fogOfWarVisibilityPlayers: this.fogOfWarVisibilityPlayers
    }

    await CampaignDB.findOneAndUpdate({ _id: campaign._id }, campaign);

    //persist actual map before dispose room
    this.map?.persist();
  }

  async addCharacter(character) {
    if (!character._id) character._id = Utils.uuidv4();
    if (!character.map) character.map = this.map?.mapId;
    if (!character.position) character.position = { x: 0, y: 0 };
    if (!character.direction) character.direction = { x: 1, y: 0 };
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
    this.characters[character._id].map = character.map;
    this.characters[character._id].x = character.position.x;
    this.characters[character._id].y = character.position.y;
    this.characters[character._id].direction = new Point(character.direction.x, character.direction.y);
    // this.characters[character._id].visionRange = character.visionRange;
    // this.characters[character._id].group = character.group;
    // this.characters[character._id].name = character.name;
    if (character.model) this.characters[character._id].load(character.model); //load a specific character of db

    if (this.characters[character._id].map == this.map?.mapId) {
      this.characters[character._id].characterPhysics = this.worldPhysics.addEntity(character._id, 'character', {
        x: this.characters[character._id].x, y: this.characters[character._id].y
      });
    }

    return character._id;
  }
}
