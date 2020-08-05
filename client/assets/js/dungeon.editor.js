var DungeonEditorArr = new Object();

var DungeonEditor = function (config) {
  this.id = uuidv4();
  this.config = config;
  DungeonEditorArr[this.config.selector] = this;
  this.init();
}

DungeonEditor.prototype.init = function () {
  var host = window.document.location.host.replace(/:.*/, '');

  var client = new Colyseus.Client(location.protocol.replace("http", "ws") + "//" + host + ':3001');
  client.joinOrCreate("chat").then(room => {
    console.log("joined");
    room.onStateChange.once(function (state) {
      console.log("initial room state:", state);
    });

    // new room state
    room.onStateChange(function (state) {
      // this signal is triggered on each patch
    });

    // listen to patches coming from the server
    room.onMessage("messages", function (message) {
      var p = document.createElement("p");
      p.innerText = message;
      document.querySelector("#messages").appendChild(p);
      document.querySelector("#messages").scrollTop = document.querySelector("#messages").scrollHeight;
    });

    // send message to room on submit
    document.querySelector("#form").onsubmit = function (e) {
      e.preventDefault();

      var input = document.querySelector("#input");

      console.log("input:", input.value);

      // send data to room
      room.send("message", input.value);

      // clear input
      input.value = "";
    }
  });
}
