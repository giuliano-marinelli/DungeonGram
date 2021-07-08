# DungeonGram

It's an Agnostic Rol 3D Tabletop on Web. You can create and manage campaigns, characters and maps. Play with your friends in an online environment were the DM leads the history and the players can interact with their characters on map.

![image](https://user-images.githubusercontent.com/5109640/124859549-87176080-df86-11eb-9083-e5cf713ae52f.png)


## Prerequisites
1. Install [Node.js](https://nodejs.org) and [MongoDB](https://www.mongodb.com)
2. Install Angular CLI: `npm i -g @angular/cli`
3. From project root folder install all the dependencies: `npm i`

## Run
### Development mode
`npm run dev`: [concurrently](https://github.com/kimmobrunfeldt/concurrently) execute MongoDB, Angular build, TypeScript compiler and Express server.

A window will automatically open at [localhost:4200](http://localhost:3000). Angular and Express files are being watched. Any change automatically creates a new bundle, restart Express server and reload your browser.

### Production mode
`npm run prod`: run the project with a production bundle and AOT compilation listening at [localhost:3000](http://localhost:3000) 
