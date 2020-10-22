import { Component, Input, OnInit } from '@angular/core';
import * as Colyseus from "colyseus.js";
import { Controller } from '../shared/controller/controller';

declare var $;
@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss']
})
export class ChatComponent implements OnInit {
  @Input() controller: Controller;
  @Input() campaign: any;

  chatRoom: any;
  message: string;

  constructor() { }

  ngOnInit(): void {
    if (this.campaign) {
      var host = window.document.location.host.replace(/:.*/, '');
      var client = new Colyseus.Client(location.protocol.replace("http", "ws") + "//" + host + ':3001');
      client.joinOrCreate("chat", { campaign: this.campaign, token: localStorage.getItem('token') }).then((room: any) => {
        this.chatRoom = room;
        this.controller.rooms.chat = this.chatRoom;
        this.initChat();
      });
    }
  }

  ngOnDestroy(): void {
    this.chatRoom?.leave();
  }

  initChat() {
    console.log("Joined Chat");
    this.chatRoom.onStateChange.once(function (state) {
      console.log("ChatRoom: initial state", state);
    });

    // new room state
    this.chatRoom.onStateChange(function (state) {
      // this signal is triggered on each patch
    });

    // listen to patches coming from the server
    this.chatRoom.onMessage("messages", function (message) {
      var p = document.createElement("p");
      p.innerHTML = message;
      document.querySelector("#chat-messages").appendChild(p);
      document.querySelector("#chat-messages").scrollTop = document.querySelector("#chat-messages").scrollHeight;
    });
  }

  sendMessage(message?) {
    if (message)
      this.chatRoom.send("message", message);
    else {
      this.chatRoom.send("message", this.message);
      // clear input
      this.message = "";
    }
  }

  toggleChat() {
    $('#chat-messages').toggle();
    $('#chat-buttons').toggle();
    $('#chat-send').toggle();
    if ($("#chat-header .btn").attr('data-original-title') == 'Maximize Chat') {
      $("#chat-header .btn").attr('data-original-title', 'Minimize Chat');
      $("#chat-header .btn .material-icons").html('keyboard_arrow_down');
    } else {
      $("#chat-header .btn").attr('data-original-title', 'Maximize Chat');
      $("#chat-header .btn .material-icons").html('keyboard_arrow_up');
    }

    $('[data-toggle-tooltip="tooltip"]').tooltip('hide');
    $('[data-toggle-tooltip="tooltip"]').tooltip({ html: true });
  }

}
