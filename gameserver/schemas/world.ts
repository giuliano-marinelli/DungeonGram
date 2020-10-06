import { Schema, type, MapSchema, ArraySchema } from '@colyseus/schema';
import { User } from './user';
import { Player } from '../schemas/player';
import { TileMap } from '../schemas/tilemap';
import { Point } from './point';
import { Wall } from './wall';
import { Utils } from '../rooms/game';

export class World extends Schema {
  @type({ map: User })
  users = new MapSchema<User>();
  @type({ map: Player })
  players = new MapSchema<Player>();
  @type({ map: Wall })
  walls = new MapSchema<Wall>();
  @type(TileMap)
  tilemap: TileMap = new TileMap(20, 20);

  command = {
    user: {
      join: {
        do: (client: string, data: any) => {
          this.players[client] = new Player();
          this.users[client] = new User();
          this.users[client].selectedPlayer = client;
        }
      },
      leave: {
        do: (client: string, data: any) => {
          delete this.players[client];
          delete this.users[client];
        }
      },
    },
    player: {
      move: {
        do: (client: string, data: any) => {
          if (this.users[client].selectedPlayer &&
            data.x > 0 && data.y > 0 &&
            data.x < this.tilemap.width && data.y < this.tilemap.height)
            this.players[this.users[client].selectedPlayer].move({ x: data.x, y: data.y });
        },
        validate: (data: any) => { return data.x != null && data.y != null && typeof data.x === "number" && typeof data.y === "number" }
      },
      drag: {
        do: (client: string, data: any) => {
          var point = data.x || data.y ? { x: data.x, y: data.y } : null;
          this.players[data.id].drag(point);
        },
        validate: (data: any) => { return data.id != null && typeof data.id === "string" }
      },
      drop: {
        do: (client: string, data: any) => {
          this.players[data.id].drop();
        },
        validate: (data: any) => { return data.id != null && typeof data.id === "string" }
      },
      select: {
        do: (client: string, data: any) => {
          this.users[client].selectedPlayer = this.users[client].selectedPlayer != data.id ? data.id : null;
        },
        validate: (data: any) => { return data.id != null && typeof data.id === "string" }
      },
    },
    wall: {
      state: { wallFirstPoint: null },
      start: {
        do: (client: string, data: any) => {
          this.command.wall.state.wallFirstPoint = new Point(data.x, data.y);
        },
        validate: (data: any) => { return data.x != null && data.y != null && typeof data.x === "number" && typeof data.y === "number" }
      },
      end: {
        do: (client: string, data: any) => {
          if (this.command.wall.state.wallFirstPoint &&
            (this.command.wall.state.wallFirstPoint.x != data.x
              || this.command.wall.state.wallFirstPoint.y != data.y)) {
            this.walls[Utils.uuidv4()] = new Wall(this.command.wall.state.wallFirstPoint, new Point(data.x, data.y));
          }
          this.command.wall.state.wallFirstPoint = null;
        },
        validate: (data: any) => { return data.x != null && data.y != null && typeof data.x === "number" && typeof data.y === "number" }
      },
      remove: {
        do: (client: string, data: any) => {
          delete this.walls[data.id];
        },
        validate: (data: any) => { return data.id != null && typeof data.id === "string" }
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
            && data.width % 2 == 0 && data.height % 2 == 0)
            this.tilemap.changeSize(data.width, data.height);
        },
        validate: (data: any) => { return data.width != null && data.height != null && typeof data.width === "number" && typeof data.height === "number" }
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
    }
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
    for (var id in this.players) {
      this.players[id].update(deltaTime);
    }
  }
}
