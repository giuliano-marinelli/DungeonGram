import { Component, OnInit } from '@angular/core';
import * as Colyseus from "colyseus.js";

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss']
})
export class ChatComponent implements OnInit {
  roomChat: any;
  message: string;

  constructor() { }

  ngOnInit(): void {
    var host = window.document.location.host.replace(/:.*/, '');
    var client = new Colyseus.Client(location.protocol.replace("http", "ws") + "//" + host + ':3001');
    client.joinOrCreate("chat").then((room: any) => {
      this.roomChat = room;
      this.joinedRoomChat();
    });
  }

  ngOnDestroy(): void {
    this.roomChat.leave();
  }

  joinedRoomChat() {
    console.log("joined chat");
    this.roomChat.onStateChange.once(function (state) {
      console.log("initial chat state:", state);
    });

    // new room state
    this.roomChat.onStateChange(function (state) {
      // this signal is triggered on each patch
    });

    // listen to patches coming from the server
    this.roomChat.onMessage("messages", function (message) {
      var p = document.createElement("p");
      p.innerText = message;
      document.querySelector("#chat-messages").appendChild(p);
      document.querySelector("#chat-messages").scrollTop = document.querySelector("#chat-messages").scrollHeight;
    });
  }

  sendMessage() {
    console.log("input:", this.message);

    // send data to room
    this.roomChat.send("message", this.message);

    // clear input
    this.message = "";
  }

}
