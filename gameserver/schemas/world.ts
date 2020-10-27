import { Schema, type, MapSchema, ArraySchema } from '@colyseus/schema';
import { User } from './user';
import { Map } from './map';
import { Character } from './character';
import { TileMap } from '../schemas/tilemap';
import { Wall } from './wall';
import { Utils } from '../utils';
import { WorldPhysics } from '../physics/world.physics';

import mongoose from 'mongoose';
import { default as CampaignDB } from '../../database/models/campaign';

export class World extends Schema {
  @type("string")
  campaignId: string;
  @type({ map: User })
  users = new MapSchema<User>();
  @type(Map)
  map: Map;

  loadTimer: number = 0;

  command = {
    user: {
      join: {
        do: async (client: string, data: any) => {
          if (!this.users[client]) {
            const campaign = await CampaignDB.findOne({ _id: this.campaignId });
            var campaignUser = campaign.users.find((u) => u.ref == client);
            this.users[client] = new User();
            if (campaignUser) {
              this.users[client].wallsVisibility = campaignUser.settings.wallsVisibility;
              this.users[client].fogOfWarVisibility = campaignUser.settings.fogOfWarVisibility;
              this.users[client].tilemapShowGrid = campaignUser.settings.tilemapShowGrid;
              this.users[client].selectedCharacter = campaignUser.settings.selectedCharacter;
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
          if (this.users[client].selectedCharacter &&
            data.x >= 0 && data.y >= 0 &&
            data.x < this.map.tilemap.width && data.y < this.map.tilemap.height)
            this.map.characters[this.users[client].selectedCharacter].move({ x: data.x, y: data.y });
        },
        validate: (data: any) => { return this.map != null && data.x != null && data.y != null && typeof data.x === "number" && typeof data.y === "number" }
      },
      drag: {
        do: (client: string, data: any) => {
          var point = data.x || data.y ? { x: data.x, y: data.y } : null;
          this.map.characters[data.id].drag(point);
        },
        validate: (data: any) => { return this.map != null && data.id != null && typeof data.id === "string" }
      },
      drop: {
        do: (client: string, data: any) => {
          this.map.characters[data.id].drop(data.snapToGrid);
        },
        validate: (data: any) => { return this.map != null && data.id != null && typeof data.id === "string" }
      },
      select: {
        do: (client: string, data: any) => {
          this.users[client].selectedCharacter = this.users[client].selectedCharacter != data.id ? data.id : null;
        },
        validate: (data: any) => { return this.map != null && data.id != null && typeof data.id === "string" }
      },
    },
    wall: {
      state: { wallFirstPoint: null },
      start: {
        do: (client: string, data: any) => {
          this.command.wall.state.wallFirstPoint = { x: data.x, y: data.y };
        },
        validate: (data: any) => { return this.map != null && data.x != null && data.y != null && typeof data.x === "number" && typeof data.y === "number" }
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
        validate: (data: any) => {
          return this.map != null && data.x != null && data.y != null && data.size != null &&
            typeof data.x === "number" && typeof data.y === "number" && typeof data.size === "string"
        }
      },
      remove: {
        do: (client: string, data: any) => {
          delete this.map.walls[data.id];
          this.map.worldPhysics.removeEntity(data.id, 'wall'); //remove physics wall
        },
        validate: (data: any) => { return this.map != null && data.id != null && typeof data.id === "string" }
      },
      visibility: {
        do: (client: string, data: any) => {
          this.users[client].wallsVisibility = data.value;
        },
        validate: (data: any) => { return data.value != null && typeof data.value === "number" }
      },
      pickable: {
        do: (client: string, data: any) => {
          this.users[client].wallsPickable = data.value;
        },
        validate: (data: any) => { return data.value != null && typeof data.value === "boolean" }
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
        validate: (data: any) => { return this.map != null && data.width != null && data.height != null && typeof data.width === "number" && typeof data.height === "number" }
      },
      show: {
        do: (client: string, data: any) => {
          this.users[client].tilemapShowGrid = data.value;
        },
        validate: (data: any) => { return data.value != null && typeof data.value === "boolean" }
      },
    },
    rule: {
      start: {
        do: (client: string, data: any) => {
          this.users[client].rule.start({ x: data.x, y: data.y });
        },
        validate: (data: any) => { return data.x != null && data.y != null && typeof data.x === "number" && typeof data.y === "number" }
      },
      move: {
        do: (client: string, data: any) => {
          this.users[client].rule.move({ x: data.x, y: data.y });
        },
        validate: (data: any) => { return data.x != null && data.y != null && typeof data.x === "number" && typeof data.y === "number" }
      },
      add: {
        do: (client: string, data: any) => {
          this.users[client].rule.add({ x: data.x, y: data.y });
        },
        validate: (data: any) => { return data.x != null && data.y != null && typeof data.x === "number" && typeof data.y === "number" }
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
        validate: (data: any) => { return data.value != null && typeof data.value === "boolean" }
      },
      normalizeUnit: {
        do: (client: string, data: any) => {
          this.users[client].rule.normalizeUnit = data.value;
        },
        validate: (data: any) => { return data.value != null && typeof data.value === "boolean" }
      }
    },
    figure: {
      start: {
        do: (client: string, data: any) => {
          this.users[client].figureDrawer.start({ x: data.x, y: data.y });
        },
        validate: (data: any) => { return data.x != null && data.y != null && typeof data.x === "number" && typeof data.y === "number" }
      },
      move: {
        do: (client: string, data: any) => {
          this.users[client].figureDrawer.move({ x: data.x, y: data.y });
        },
        validate: (data: any) => { return data.x != null && data.y != null && typeof data.x === "number" && typeof data.y === "number" }
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
        validate: (data: any) => { return data.value != null && typeof data.value === "boolean" }
      },
      type: {
        do: (client: string, data: any) => {
          this.users[client].figureDrawer.type = data.value;
        },
        validate: (data: any) => {
          return data.value != null &&
            (data.value == 'triangle' || data.value == 'circle' || data.value == 'square')
        }
      },
      normalizeUnit: {
        do: (client: string, data: any) => {
          this.users[client].figureDrawer.normalizeUnit = data.value;
        },
        validate: (data: any) => { return data.value != null && typeof data.value === "boolean" }
      }
    },
    fogOfWar: {
      visibility: {
        do: (client: string, data: any) => {
          this.users[client].fogOfWarVisibility = data.value;
        },
        validate: (data: any) => { return data.value != null && typeof data.value === "number" }
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
              this.map = new Map();
              this.map.load(data.map);
            }, 1000);
          }
        },
        validate: (data: any) => { return data.map != null && typeof data.map === "string" }
      },
      close: {
        do: async (client: string, data: any) => {
          this.map.persist();
          this.map.remove();
          this.map = null;
          await CampaignDB.update({ _id: this.campaignId }, { $set: { openedMap: null } });
        },
        validate: (data: any) => { return this.map != null }
      },
      discard: {
        do: async (client: string, data: any) => {
          if (this.map) {
            this.map.remove();
            this.map = null;
            await CampaignDB.update({ _id: this.campaignId }, { $set: { openedMap: null } });
          }
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

  async load(campaignId) {
    this.campaignId = campaignId.toString();

    const campaign = await CampaignDB.findOne({ _id: this.campaignId });

    if (campaign.openedMap)
      this.command.map.open.do(null, { map: campaign.openedMap });
  }

  execCommand(client?: string, type?: string | number, data?: any) {
    try {
      if (client && type
        && data?.action
        && this.command[type]
        && this.command[type][data?.action]
        && this.command[type][data?.action].do) {
        if (this.command[type][data?.action].validate) {
          if (this.command[type][data?.action].validate(data))
            this.command[type][data?.action].do(client, data);
          else
            throw new Error('invalid action params for command "' + type + '"');
        } else {
          this.command[type][data?.action].do(client, data);
        }
      } else
        throw new Error('inexistent action "' + data?.action + '" for command "' + type + '"');
    } catch (err) {
      console.warn('GameRoom: client', client, 'send', err.message, '=>', data);
    }
  }

  update(deltaTime: number) {
    this.loadTimer = this.loadTimer - deltaTime >= 0 ? this.loadTimer - deltaTime : 0;

    //udpate physics world
    this.map?.worldPhysics?.update(deltaTime);

    //update each character (each one update their physics individually)
    for (var id in this.map?.characters) {
      this.map?.characters[id].update(deltaTime);
    }
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
          selectedCharacter: this.users[userId].selectedCharacter
        }
      });
    }
    campaign.users = usersOnCampaign;

    await CampaignDB.findOneAndUpdate({ _id: campaign._id }, campaign);

    //persist actual map before dispose room
    this.map?.persist();
  }
}
