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
exports.__esModule = true;
exports.ChatRoom = void 0;
var colyseus_1 = require("colyseus");
var ChatRoom = /** @class */ (function (_super) {
    __extends(ChatRoom, _super);
    function ChatRoom() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        // this room supports only 4 clients connected
        _this.maxClients = 4;
        return _this;
    }
    ChatRoom.prototype.onCreate = function (options) {
        var _this = this;
        console.log("ChatRoom created!", options);
        this.onMessage("message", function (client, message) {
            console.log("ChatRoom received message from", client.sessionId, ":", message);
            _this.broadcast("messages", "(" + client.sessionId + ") " + message);
        });
    };
    ChatRoom.prototype.onJoin = function (client) {
        this.broadcast("messages", client.sessionId + " joined.");
    };
    ChatRoom.prototype.onLeave = function (client) {
        this.broadcast("messages", client.sessionId + " left.");
    };
    ChatRoom.prototype.onDispose = function () {
        console.log("Dispose ChatRoom");
    };
    return ChatRoom;
}(colyseus_1.Room));
exports.ChatRoom = ChatRoom;
