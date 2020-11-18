import { Schema, type, MapSchema, ArraySchema } from '@colyseus/schema';
import { Character } from './character';
import { TileMap } from '../schemas/tilemap';
import { Wall } from './wall';
import { Utils } from '../utils';
import { WorldPhysics } from '../physics/world.physics';

import { default as MapDB } from '../../database/models/map';
import { default as CharacterDB } from '../../database/models/character';
import { Point } from './point';

export class Map extends Schema {
  @type("string")
  mapId: string;
  @type({ map: Character })
  characters = new MapSchema<Character>();
  @type({ map: Wall })
  walls = new MapSchema<Wall>();
  @type(TileMap)
  tilemap: TileMap;

  //physics
  worldPhysics: WorldPhysics;

  //for destroy the object
  @type("boolean")
  destroy: boolean = false;

  async load(mapId: string) {
    this.mapId = mapId.toString();
    const map = await MapDB.findOne({ _id: this.mapId });

    this.tilemap = new TileMap(map?.tilemap?.width, map?.tilemap?.height, map?.imageUrl);

    this.worldPhysics = new WorldPhysics();
    this.worldPhysics.setGrid({ width: this.tilemap.width, height: this.tilemap.height });

    map?.characters.forEach(character => {
      this.addCharacter(character)
    });

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
    for (let key in this.characters) {
      this.characters[key].remove();
    }
    for (let key in this.walls) {
      this.walls[key].remove();
    }
    this.tilemap.remove();
    this.destroy = true;
  }

  async addCharacter(character) {
    if (!character._id) character._id = Utils.uuidv4();
    if (!character.position) character.position = { x: 0, y: 0 };
    if (!character.direction) character.direction = { x: 1, y: 0 };
    if (!character.visionRange) character.visionRange = 10;
    if (!character.group) character.group = 'Ungrouped';
    if (!character.name) {
      var modelObj = await CharacterDB.findOne({ _id: character.model });
      if (modelObj) {
        const countExistentModels = Object.values(this.characters).filter((c) => c.name.startsWith(modelObj.name)).length;
        character.name = modelObj.name + ' ' + (countExistentModels);
      } else {
        character.name = 'Unnamed';
      }
    }

    this.characters[character._id] = new Character();
    this.characters[character._id].x = character.position.x;
    this.characters[character._id].y = character.position.y;
    this.characters[character._id].direction = new Point(character.direction.x, character.direction.y);
    this.characters[character._id].visionRange = character.visionRange;
    this.characters[character._id].group = character.group;
    this.characters[character._id].name = character.name;
    if (character.model) this.characters[character._id].load(character.model); //load a specific character of db
    this.characters[character._id].characterPhysics = this.worldPhysics.addEntity(character._id, 'character', {
      x: this.characters[character._id].x, y: this.characters[character._id].y
    });

    return character._id;
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

    var charactersOnMap = [];
    for (let characterId in this.characters) {
      if (!this.characters[characterId].addingMode) {
        charactersOnMap.push({
          _id: characterId,
          position: {
            x: this.characters[characterId].x,
            y: this.characters[characterId].y
          },
          direction: {
            x: this.characters[characterId].direction.x,
            y: this.characters[characterId].direction.y
          },
          name: this.characters[characterId].name,
          group: this.characters[characterId].group,
          visionRange: this.characters[characterId].visionRange,
          model: this.characters[characterId].dbId
        });
      }
    }
    map.characters = charactersOnMap;

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
