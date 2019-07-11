const diff = (from, to) => {
  for (let i of Object.keys(from)) {
    if (to[i] === undefined || typeof from[i] !== 'object' && from[i] !== to[i]) to[i] = from[i];
    else if (typeof from[i] !== 'function') throw new Error("It must to be a function.");
    else to[i] = diff(from[i], to[i]);
  }
  return to;
}

class ExecuterContext {
  constructor(cmds, conn) {
    this.cmdHead = ['data'].concat(cmds);
    this.conn = conn;
    this.userId = conn.userId;
  }

  send = (...args) => {
    let arr = this.cmdHead.concat(args);
    this.conn._sendMessage(arr);
  };
}

export default class PluginDashboard {
  constructor(conn) {
    this.connection = conn;
    this.registerObject = {};
    this.receiveObject = {};
    conn.onmessage = (data) => this._receiveMessagePre(data.data);

    this.userId = null;
    this.buffer = "";
  }

  register = (obj) => {
    PluginDashboard.registerObject = diff(obj, this.registerObject);
  }

  receive = (obj) => {
    console.log(obj);
    PluginDashboard.receiveObject = diff(obj, this.receiveObject);
  }

  send = (...args) => {
    this._sendMessage(args.reduce((prev, next) => {
      if (typeof next == 'string') prev.concat(next.trim().split(' '));
      else if (Array.isArray(next)) prev.concat(next);
      else if (typeof next == 'number' || typeof next == 'bigint') prev.push("" + next);
      else if (typeof next == 'boolean') prev.push(next ? 'true' : 'false');
      else if (typeof next == 'object') prev.push(JSON.stringify(next));
      else throw new Error("Cannot parse the type.");
      return prev;
    }), ['execute']);
  }

  _sendMessage(args) {
    console.log("Client will send:", args);
    let cmd = args.reduce((prev, next) => prev + ' ' + next);
    let type = /^(execute|data).*$/.exec(cmd)[1];

    switch (type) {
      case 'execute':
      case 'data':
        this.connection.send(cmd);
        break;
      default:
        throw new Error("Illegal type!");
    }
  }

  _receiveMessagePre = (str) => {
    console.log("Get the message from the server：", str);
    
    // Heart package check.
    if (str[0] == '@') return;

    this.buffer += str + '\n';
    let cmds = this.buffer.split('\n');
    this.buffer = cmds.pop();
    console.log("[ BUFFER ]", this.buffer);
    console.log("Start running the command:", cmds);
    cmds.forEach(n => this._receiveMessage(n));
  }

  _receiveMessage = (cmd) => {
    console.log(cmd);
    let args = cmd.trim().split(' ');
    let type = args.shift();

    let func = type == 'execute' ? this.registerObject : this.receiveObject;
    let arg = args.shift();
    let cmds = [arg];

    try {
      for (; typeof func[arg] == 'object'; func = func[arg], arg = args.shift(), cmds.push(arg))
        if (func === undefined) throw new Error("Undefined object!");

      if (type == 'execute' && func[arg] === undefined) throw new Error("Undefined object!");
    } catch (e) {
      this._sendMessage(['data', 'system', 'fail']);
    }
    try {
      // Get the function.
      let ret = func[arg].apply(new ExecuterContext(cmds, this), args);
      // If the head is 'execute', it needs a call back 'data' command.
      if (type == 'execute' && ret != null) this._sendMessage(['data'].concat(cmds).concat(ret.trim().split(' ')));
    } catch (e) {
      console.log(e);
      if (type == 'execute') {
        let n = ['data'].concat(cmds);
        n.push("fail");
        this._sendMessage(n);
      }
    }
  }
}



