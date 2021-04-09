import { Component, Input, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { Messenger } from '../shared/schemas/messenger';
import { Message } from '../shared/schemas/message';
import { AuthService } from '../services/auth.service';
import { Controller } from '../shared/controller/controller';
import { AngularResizeElementDirection, AngularResizeElementEvent } from 'angular-resize-element';
import * as Colyseus from "colyseus.js";
import * as moment from 'moment';
import { environment } from 'client/environments/environment';

declare var $;
@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss']
})
export class ChatComponent implements OnInit, OnDestroy {
  @Input() controller: Controller;
  @Input() campaign: any;

  //chat
  chatRoom: any;
  messages: any;
  users: any;
  message: string;
  minimized: boolean = false;

  //chat schemas
  messenger: any;

  public readonly AngularResizeElementDirection = AngularResizeElementDirection;
  @ViewChild('chat') chatEl: ElementRef;
  chatHeight: number = 140;

  ObjectValues = Object.values; //for get values of object

  constructor(
    public auth: AuthService
  ) { }

  ngOnInit(): void {
    if (this.campaign) {
      var host = window.document.location.host.replace(/:.*/, '');
      // var url = environment.production
      //   ? "wss://dungeongram-gameserver.herokuapp.com"
      //   : location.protocol.replace("http", "ws") + "//" + host + (location.port ? ':' + (Number(location.port) + 1) : '');
      var url = location.protocol.replace("http", "ws") + "//" + host + (location.port ? ':' + location.port : '')
      console.log("Connecting chat to: " + url);
      var client = new Colyseus.Client(url);
      client.joinOrCreate("chat", { campaign: this.campaign, token: localStorage.getItem('token') })
        .then((room: any) => {
          console.log("Joined to chat room", room);
          this.chatRoom = room;
          this.controller.rooms.chat = this.chatRoom;
          this.initChat();
        })
        .catch((error: any) => {
          console.log("Can't join chat room", error);
        });
    }
  }

  ngOnDestroy(): void {
    this.chatRoom?.leave();
  }

  initChat() {
    console.log("Joined Chat");
    this.messages = this.controller.initSetting("messages", [], () => {
      this.scrollDown();
    });
    this.users = this.controller.initSetting("usersOnCampaign", []);
    this.chatRoom.onStateChange.once(() => {
      //create the root schema object
      this.messenger = new Messenger(this.chatRoom.state.messenger, {
        room: this.chatRoom,
        controller: this.controller,
        token: this.auth.currentUser._id
      });

      console.log("Initialized chat messenger", this.messenger);
    });
    // listen to patches coming from the server
    // this.chatRoom.onMessage("messages", function (message) {
    //   var p = document.createElement("p");
    //   p.innerHTML = message;
    //   document.querySelector("#chat-messages").appendChild(p);
    //   document.querySelector("#chat-messages").scrollTop = document.querySelector("#chat-messages").scrollHeight;
    // });
  }


  sendMessage(message?) {
    if (message)
      this.controller.send('chat', 'message', { content: message });
    else {
      this.controller.send('chat', 'message', { content: this.message });
      // clear input
      this.message = "";
    }
  }

  scrollDown(): void {
    setTimeout(() => {
      document.querySelector("#chat-messages").scrollTop = document.querySelector("#chat-messages").scrollHeight;
    })
  }

  getLastMessage() {
    return Object.values(this.messages.value).pop();
  }

  getTime(date): string {
    return moment(new Date(date)).fromNow();
  }

  getShortContent(message: any): string {
    var parts = message.content.split('<p>');
    return parts[parts.length - 1].replaceAll('<br>', ' ');
  }

  getFirstParagraph(message: any): string {
    return $(message.content)[0].outerHTML;
  }

  getRestParagraphs(message: any): Array<string> {
    var contents = $(message.content);
    var rest = [];
    for (var i = 1; i < contents.length; i++) {
      rest[i - 1] = contents[i].outerHTML;
    }
    return rest;
  }

  public onResize(evt: AngularResizeElementEvent): void {
    if (evt.currentHeightValue > 140 && evt.currentHeightValue < window.innerHeight - 400) {
      this.chatHeight = evt.currentHeightValue;
    }
  }
}
