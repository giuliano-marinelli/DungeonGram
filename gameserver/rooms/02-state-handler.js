"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
exports.__esModule = true;
exports.StateHandlerRoom = exports.State = exports.Player = void 0;
var colyseus_1 = require("colyseus");
var schema_1 = require("@colyseus/schema");
var Player = /** @class */ (function (_super) {
    __extends(Player, _super);
    function Player() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.x = Math.floor(Math.random() * 400);
        _this.y = Math.floor(Math.random() * 400);
        return _this;
    }
    __decorate([
        schema_1.type("number")
    ], Player.prototype, "x");
    __decorate([
        schema_1.type("number")
    ], Player.prototype, "y");
    return Player;
}(schema_1.Schema));
exports.Player = Player;
var State = /** @class */ (function (_super) {
    __extends(State, _super);
    function State() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.players = new schema_1.MapSchema();
        _this.something = "This attribute won't be sent to the client-side";
        return _this;
    }
    State.prototype.createPlayer = function (id) {
        this.players[id] = new Player();
    };
    State.prototype.removePlayer = function (id) {
        delete this.players[id];
    };
    State.prototype.movePlayer = function (id, movement) {
        if (movement.x) {
            this.players[id].x += movement.x * 10;
        }
        else if (movement.y) {
            this.players[id].y += movement.y * 10;
        }
    };
    __decorate([
        schema_1.type({ map: Player })
    ], State.prototype, "players");
    return State;
}(schema_1.Schema));
exports.State = State;
var StateHandlerRoom = /** @class */ (function (_super) {
    __extends(StateHandlerRoom, _super);
    function StateHandlerRoom() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.maxClients = 4;
        return _this;
    }
    StateHandlerRoom.prototype.onCreate = function (options) {
        var _this = this;
        console.log("StateHandlerRoom created!", options);
        this.setState(new State());
        this.onMessage("move", function (client, data) {
            console.log("StateHandlerRoom received message from", client.sessionId, ":", data);
            _this.state.movePlayer(client.sessionId, data);
        });
    };
    StateHandlerRoom.prototype.onAuth = function (client, options, req) {
        console.log(req.headers.cookie);
        return true;
    };
    StateHandlerRoom.prototype.onJoin = function (client) {
        client.send("hello", "world");
        this.state.createPlayer(client.sessionId);
    };
    StateHandlerRoom.prototype.onLeave = function (client) {
        this.state.removePlayer(client.sessionId);
    };
    StateHandlerRoom.prototype.onDispose = function () {
        console.log("Dispose StateHandlerRoom");
    };
    return StateHandlerRoom;
}(colyseus_1.Room));
exports.StateHandlerRoom = StateHandlerRoom;
