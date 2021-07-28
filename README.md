# DungeonGram

It's an Agnostic RPG 3D Tabletop running on Web. You can create and manage campaigns, characters and maps. Play with your friends in an online environment were the DM leads the history and the players can interact with their characters on map.

<!---![image](https://user-images.githubusercontent.com/5109640/124859549-87176080-df86-11eb-9083-e5cf713ae52f.png)--->
[![features](https://user-images.githubusercontent.com/5109640/124859549-87176080-df86-11eb-9083-e5cf713ae52f.png)](https://www.youtube.com/watch?v=qggr3zWspa8)

## Features
- Dynamic Lighting.
- Doors, Walls, Windows and Colliders for put on map.
- Open doors progressively.
- Hide, lock and put invisible doors (for secret doors).
- Draw figures and rule (shared with others or not).
- Change Fog of War and Maximum vision ranges of characters.
- Adjust the grid to your map.
- Create and share maps and characters, for reuse.
- Use public maps and characters created by others.
- Basic Dice rolls or complex rolls with /roll command.
- Character animations for sit, sleep, die, etc.
- Stealth mode for characters.
- Hide characters (for invisible or stealth ones).

## Prerequisites
1. Install [Node.js](https://nodejs.org) and [MongoDB](https://www.mongodb.com)
2. Install Angular CLI: `npm i -g @angular/cli`
3. From project root folder install all the dependencies: `npm i`

## Run
### Development mode
`npm run dev`: [concurrently](https://github.com/kimmobrunfeldt/concurrently) execute MongoDB, Angular build, TypeScript compiler and Express server listening at [localhost:3000](http://localhost:3000) .

Angular and Express files are being watched. Any change automatically creates a new bundle and restart Express server.

### Production mode
`npm run prod`: run the project with a production bundle and AOT compilation listening at [localhost:3000](http://localhost:3000).
