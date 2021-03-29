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

    this.tilemap = new TileMap(map?.tilemap?.width, map?.tilemap?.height, map?.imageUrl);

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
    this.tilemap.remove();
    this.destroy = true;
  }

  addWall(wall) {
    var randomId = Utils.uuidv4();
    this.walls[randomId] = new Wall(wall.from, wall.to, wall.size);
    this.walls[randomId].wallPhysics = this.worldPhysics.addEntity(randomId, 'wall', {
      from: wall.from, to: wall.to
    }); //add physics wall
    this.walls[randomId].updatePhysics(); //update for share physics data
  }

  async persist() {
    const map = await MapDB.findOne({ _id: this.mapId });
    map.tilemap.width = this.tilemap.width;
    map.tilemap.height = this.tilemap.height;

    var wallsOnMap = [];
    for (let wallId in this.walls) {
      wallsOnMap.push({
        from: {
          x: this.walls[wallId].from.x,
          y: this.walls[wallId].from.y
        },
        to: {
          x: this.walls[wallId].to.x,
          y: this.walls[wallId].to.y
        },
        size: this.walls[wallId].size
      })
    }
    map.walls = wallsOnMap;

    await MapDB.findOneAndUpdate({ _id: this.mapId }, map);
  }

  async updateTilemap() {
    const map = await MapDB.findOne({ _id: this.mapId });

    this.tilemap?.changeImage(map?.imageUrl);
  }

  // async updateDb(attr, value) {
  //   var set = {};
  //   set[attr] = value;
  //   console.log(set);
  //   await MapDB.update({ _id: this.mapId }, { $set: set });
  // }

}
