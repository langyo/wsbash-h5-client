const SocketManager = require('./socketManager.js');
const CommandRegister = require('./commandRegister.js');

module.exports = class SocketClient {
  constructor(url) {
    this.client = new WebSocket(url);

    this.commandRegister = new CommandRegister();
    this.client.onopen = conn => {
      this.manager = new SocketManager(this.client, this.commandRegister);
      for(let i of this.openEventList) i(this);
    };

    this.openEventList = [];
    this.onOpen.bind(this);

    this.register.bind(this);
    this.receive.bind(this);
  }

  onOpen(func) {
    if(!(typeof func === 'function')) throw new Error('You must provide a function!');
    this.openEventList.push(func);
  }

  register() { this.commandRegister.register.apply(this.commandRegister, arguments); };
  receive() { this.commandRegister.receive.apply(this.commandRegister, arguments); };
}
