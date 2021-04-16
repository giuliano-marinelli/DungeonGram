import { Schema, type, MapSchema, ArraySchema } from '@colyseus/schema';
import { Character } from './character';
import { TileMap } from '../schemas/tilemap';
import { Wall } from './wall';
import { Utils } from '../utils';
import { WorldPhysics } from '../physics/world.physics';

import { default as MapDB } from '../../database/models/map';


export class Map extends Schema {
  @type("string")
  mapId: string;
  // @type({ map: Character })
  // characters = new MapSchema<Character>();
  @type({ map: Wall })
  walls = new MapSchema<Wall>();
  @type({ map: Wall })
  doors = new MapSchema<Wall>();
  @type(TileMap)
  tilemap: TileMap;

  //physics
  worldPhysics: WorldPhysics;

  //for destroy the object
  @type("boolean")
  destroy: boolean = false;

  constructor(worldPhysics: WorldPhysics) {
    super();

    this.worldPhysics = worldPhysics;
  }

  async load(mapId: string) {
    this.mapId = mapId.toString();
    const map = await MapDB.findOne({ _id: this.mapId });

    this.tilemap = new TileMap(map?.tilemap?.width, map?.tilemap?.height, map?.terrain);

    this.worldPhysics.setGrid({ width: this.tilemap.width, height: this.tilemap.height });

    // map?.characters.forEach(character => {
    //   this.addCharacter(character)
    // });

    map?.walls.forEach(wall => {
      this.addWall(wall);
    });

    // if (!map?.characters.length) {
    //   this.characters[map?.owner._id] = new Character();
    //   this.characters[map?.owner._id].load("5f8e8799abc1c13d95d786e2"); //load a specific character of db
    //   this.characters[map?.owner._id].characterPhysics = this.worldPhysics.addEntity(map?.owner._id, 'character', {
    //     x: this.characters[map?.owner._id].x, y: this.characters[map?.owner._id].y
    //   }); //add physics character
    // }
  }

  remove() {
    // for (let key in this.characters) {
    //   this.characters[key].remove();
    // }
    for (let key in this.walls) {
      this.walls[key].remove();
    }
    for (let key in this.doors) {
      this.doors[key].remove();
    }
    this.tilemap.remove();
    this.destroy = true;
  }

  addWall(wall) {
    var randomId = Utils.uuidv4();
    var wallObject = new Wall(wall.from, wall.to, wall.defaultTo ? wall.defaultTo : wall.to, wall.size, wall.type, wall.blocked, wall.hidden);
    wallObject.wallPhysics = this.worldPhysics.addEntity(randomId, 'wall', {
      from: wall.from, to: wall.to
    }); //add physics wall
    wallObject.updatePhysics(); //update for share physics data

    if (wall.type == "door") this.doors[randomId] = wallObject;
    else this.walls[randomId] = wallObject;
  }

  getWall(id) {
    if (this.walls[id]) return this.walls[id]
    else return this.doors[id]
  }

  deleleWall(id) {
    if (this.walls[id]) delete this.walls[id]
    else return delete this.doors[id]
  }

  async persist() {
    const map = await MapDB.findOne({ _id: this.mapId });
    map.tilemap.width = this.tilemap.width;
    map.tilemap.height = this.tilemap.height;

    map.walls = [];
    for (let wallId in this.walls) {
      map.walls.push({
        from: {
          x: this.walls[wallId].from.x,
          y: this.walls[wallId].from.y
        },
        to: {
          x: this.walls[wallId].to.x,
          y: this.walls[wallId].to.y
        },
        defaultTo: {
          x: this.walls[wallId].defaultTo.x,
          y: this.walls[wallId].defaultTo.y
        },
        size: this.walls[wallId].size,
        type: this.walls[wallId].type,
        blocked: this.walls[wallId].blocked,
        hidden: this.walls[wallId].hidden
      });
    }

    for (let doorId in this.doors) {
      map.walls.push({
        from: {
          x: this.doors[doorId].from.x,
          y: this.doors[doorId].from.y
        },
        to: {
          x: this.doors[doorId].to.x,
          y: this.doors[doorId].to.y
        },
        defaultTo: {
          x: this.doors[doorId].defaultTo.x,
          y: this.doors[doorId].defaultTo.y
        },
        size: this.doors[doorId].size,
        type: this.doors[doorId].type,
        blocked: this.doors[doorId].blocked,
        hidden: this.doors[doorId].hidden
      });
    }

    var res = await MapDB.updateOne({ _id: this.mapId }, map);
  }

  async updateTilemap() {
    const map = await MapDB.findOne({ _id: this.mapId });

    this.tilemap?.changeTerrain(map?.terrain);
  }

  // async updateDb(attr, value) {
  //   var set = {};
  //   set[attr] = value;
  //   console.log(set);
  //   await MapDB.update({ _id: this.mapId }, { $set: set });
  // }

}
