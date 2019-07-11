(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _webSocketClient = require("./webSocketClient");

_webSocketClient.connectionEvents.on("load", function () {
  (0, _webSocketClient.receive)({});

  _webSocketClient.connectionEvents.emit('ready');
});

var _default = {
  send: _webSocketClient.send,
  register: _webSocketClient.register,
  receive: _webSocketClient.receive
};
exports.default = _default;

},{"./webSocketClient":4}],2:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var objectCreate = Object.create || objectCreatePolyfill
var objectKeys = Object.keys || objectKeysPolyfill
var bind = Function.prototype.bind || functionBindPolyfill

function EventEmitter() {
  if (!this._events || !Object.prototype.hasOwnProperty.call(this, '_events')) {
    this._events = objectCreate(null);
    this._eventsCount = 0;
  }

  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
var defaultMaxListeners = 10;

var hasDefineProperty;
try {
  var o = {};
  if (Object.defineProperty) Object.defineProperty(o, 'x', { value: 0 });
  hasDefineProperty = o.x === 0;
} catch (err) { hasDefineProperty = false }
if (hasDefineProperty) {
  Object.defineProperty(EventEmitter, 'defaultMaxListeners', {
    enumerable: true,
    get: function() {
      return defaultMaxListeners;
    },
    set: function(arg) {
      // check whether the input is a positive number (whose value is zero or
      // greater and not a NaN).
      if (typeof arg !== 'number' || arg < 0 || arg !== arg)
        throw new TypeError('"defaultMaxListeners" must be a positive number');
      defaultMaxListeners = arg;
    }
  });
} else {
  EventEmitter.defaultMaxListeners = defaultMaxListeners;
}

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function setMaxListeners(n) {
  if (typeof n !== 'number' || n < 0 || isNaN(n))
    throw new TypeError('"n" argument must be a positive number');
  this._maxListeners = n;
  return this;
};

function $getMaxListeners(that) {
  if (that._maxListeners === undefined)
    return EventEmitter.defaultMaxListeners;
  return that._maxListeners;
}

EventEmitter.prototype.getMaxListeners = function getMaxListeners() {
  return $getMaxListeners(this);
};

// These standalone emit* functions are used to optimize calling of event
// handlers for fast cases because emit() itself often has a variable number of
// arguments and can be deoptimized because of that. These functions always have
// the same number of arguments and thus do not get deoptimized, so the code
// inside them can execute faster.
function emitNone(handler, isFn, self) {
  if (isFn)
    handler.call(self);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].call(self);
  }
}
function emitOne(handler, isFn, self, arg1) {
  if (isFn)
    handler.call(self, arg1);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].call(self, arg1);
  }
}
function emitTwo(handler, isFn, self, arg1, arg2) {
  if (isFn)
    handler.call(self, arg1, arg2);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].call(self, arg1, arg2);
  }
}
function emitThree(handler, isFn, self, arg1, arg2, arg3) {
  if (isFn)
    handler.call(self, arg1, arg2, arg3);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].call(self, arg1, arg2, arg3);
  }
}

function emitMany(handler, isFn, self, args) {
  if (isFn)
    handler.apply(self, args);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].apply(self, args);
  }
}

EventEmitter.prototype.emit = function emit(type) {
  var er, handler, len, args, i, events;
  var doError = (type === 'error');

  events = this._events;
  if (events)
    doError = (doError && events.error == null);
  else if (!doError)
    return false;

  // If there is no 'error' event listener then throw.
  if (doError) {
    if (arguments.length > 1)
      er = arguments[1];
    if (er instanceof Error) {
      throw er; // Unhandled 'error' event
    } else {
      // At least give some kind of context to the user
      var err = new Error('Unhandled "error" event. (' + er + ')');
      err.context = er;
      throw err;
    }
    return false;
  }

  handler = events[type];

  if (!handler)
    return false;

  var isFn = typeof handler === 'function';
  len = arguments.length;
  switch (len) {
      // fast cases
    case 1:
      emitNone(handler, isFn, this);
      break;
    case 2:
      emitOne(handler, isFn, this, arguments[1]);
      break;
    case 3:
      emitTwo(handler, isFn, this, arguments[1], arguments[2]);
      break;
    case 4:
      emitThree(handler, isFn, this, arguments[1], arguments[2], arguments[3]);
      break;
      // slower
    default:
      args = new Array(len - 1);
      for (i = 1; i < len; i++)
        args[i - 1] = arguments[i];
      emitMany(handler, isFn, this, args);
  }

  return true;
};

function _addListener(target, type, listener, prepend) {
  var m;
  var events;
  var existing;

  if (typeof listener !== 'function')
    throw new TypeError('"listener" argument must be a function');

  events = target._events;
  if (!events) {
    events = target._events = objectCreate(null);
    target._eventsCount = 0;
  } else {
    // To avoid recursion in the case that type === "newListener"! Before
    // adding it to the listeners, first emit "newListener".
    if (events.newListener) {
      target.emit('newListener', type,
          listener.listener ? listener.listener : listener);

      // Re-assign `events` because a newListener handler could have caused the
      // this._events to be assigned to a new object
      events = target._events;
    }
    existing = events[type];
  }

  if (!existing) {
    // Optimize the case of one listener. Don't need the extra array object.
    existing = events[type] = listener;
    ++target._eventsCount;
  } else {
    if (typeof existing === 'function') {
      // Adding the second element, need to change to array.
      existing = events[type] =
          prepend ? [listener, existing] : [existing, listener];
    } else {
      // If we've already got an array, just append.
      if (prepend) {
        existing.unshift(listener);
      } else {
        existing.push(listener);
      }
    }

    // Check for listener leak
    if (!existing.warned) {
      m = $getMaxListeners(target);
      if (m && m > 0 && existing.length > m) {
        existing.warned = true;
        var w = new Error('Possible EventEmitter memory leak detected. ' +
            existing.length + ' "' + String(type) + '" listeners ' +
            'added. Use emitter.setMaxListeners() to ' +
            'increase limit.');
        w.name = 'MaxListenersExceededWarning';
        w.emitter = target;
        w.type = type;
        w.count = existing.length;
        if (typeof console === 'object' && console.warn) {
          console.warn('%s: %s', w.name, w.message);
        }
      }
    }
  }

  return target;
}

EventEmitter.prototype.addListener = function addListener(type, listener) {
  return _addListener(this, type, listener, false);
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.prependListener =
    function prependListener(type, listener) {
      return _addListener(this, type, listener, true);
    };

function onceWrapper() {
  if (!this.fired) {
    this.target.removeListener(this.type, this.wrapFn);
    this.fired = true;
    switch (arguments.length) {
      case 0:
        return this.listener.call(this.target);
      case 1:
        return this.listener.call(this.target, arguments[0]);
      case 2:
        return this.listener.call(this.target, arguments[0], arguments[1]);
      case 3:
        return this.listener.call(this.target, arguments[0], arguments[1],
            arguments[2]);
      default:
        var args = new Array(arguments.length);
        for (var i = 0; i < args.length; ++i)
          args[i] = arguments[i];
        this.listener.apply(this.target, args);
    }
  }
}

function _onceWrap(target, type, listener) {
  var state = { fired: false, wrapFn: undefined, target: target, type: type, listener: listener };
  var wrapped = bind.call(onceWrapper, state);
  wrapped.listener = listener;
  state.wrapFn = wrapped;
  return wrapped;
}

EventEmitter.prototype.once = function once(type, listener) {
  if (typeof listener !== 'function')
    throw new TypeError('"listener" argument must be a function');
  this.on(type, _onceWrap(this, type, listener));
  return this;
};

EventEmitter.prototype.prependOnceListener =
    function prependOnceListener(type, listener) {
      if (typeof listener !== 'function')
        throw new TypeError('"listener" argument must be a function');
      this.prependListener(type, _onceWrap(this, type, listener));
      return this;
    };

// Emits a 'removeListener' event if and only if the listener was removed.
EventEmitter.prototype.removeListener =
    function removeListener(type, listener) {
      var list, events, position, i, originalListener;

      if (typeof listener !== 'function')
        throw new TypeError('"listener" argument must be a function');

      events = this._events;
      if (!events)
        return this;

      list = events[type];
      if (!list)
        return this;

      if (list === listener || list.listener === listener) {
        if (--this._eventsCount === 0)
          this._events = objectCreate(null);
        else {
          delete events[type];
          if (events.removeListener)
            this.emit('removeListener', type, list.listener || listener);
        }
      } else if (typeof list !== 'function') {
        position = -1;

        for (i = list.length - 1; i >= 0; i--) {
          if (list[i] === listener || list[i].listener === listener) {
            originalListener = list[i].listener;
            position = i;
            break;
          }
        }

        if (position < 0)
          return this;

        if (position === 0)
          list.shift();
        else
          spliceOne(list, position);

        if (list.length === 1)
          events[type] = list[0];

        if (events.removeListener)
          this.emit('removeListener', type, originalListener || listener);
      }

      return this;
    };

EventEmitter.prototype.removeAllListeners =
    function removeAllListeners(type) {
      var listeners, events, i;

      events = this._events;
      if (!events)
        return this;

      // not listening for removeListener, no need to emit
      if (!events.removeListener) {
        if (arguments.length === 0) {
          this._events = objectCreate(null);
          this._eventsCount = 0;
        } else if (events[type]) {
          if (--this._eventsCount === 0)
            this._events = objectCreate(null);
          else
            delete events[type];
        }
        return this;
      }

      // emit removeListener for all listeners on all events
      if (arguments.length === 0) {
        var keys = objectKeys(events);
        var key;
        for (i = 0; i < keys.length; ++i) {
          key = keys[i];
          if (key === 'removeListener') continue;
          this.removeAllListeners(key);
        }
        this.removeAllListeners('removeListener');
        this._events = objectCreate(null);
        this._eventsCount = 0;
        return this;
      }

      listeners = events[type];

      if (typeof listeners === 'function') {
        this.removeListener(type, listeners);
      } else if (listeners) {
        // LIFO order
        for (i = listeners.length - 1; i >= 0; i--) {
          this.removeListener(type, listeners[i]);
        }
      }

      return this;
    };

function _listeners(target, type, unwrap) {
  var events = target._events;

  if (!events)
    return [];

  var evlistener = events[type];
  if (!evlistener)
    return [];

  if (typeof evlistener === 'function')
    return unwrap ? [evlistener.listener || evlistener] : [evlistener];

  return unwrap ? unwrapListeners(evlistener) : arrayClone(evlistener, evlistener.length);
}

EventEmitter.prototype.listeners = function listeners(type) {
  return _listeners(this, type, true);
};

EventEmitter.prototype.rawListeners = function rawListeners(type) {
  return _listeners(this, type, false);
};

EventEmitter.listenerCount = function(emitter, type) {
  if (typeof emitter.listenerCount === 'function') {
    return emitter.listenerCount(type);
  } else {
    return listenerCount.call(emitter, type);
  }
};

EventEmitter.prototype.listenerCount = listenerCount;
function listenerCount(type) {
  var events = this._events;

  if (events) {
    var evlistener = events[type];

    if (typeof evlistener === 'function') {
      return 1;
    } else if (evlistener) {
      return evlistener.length;
    }
  }

  return 0;
}

EventEmitter.prototype.eventNames = function eventNames() {
  return this._eventsCount > 0 ? Reflect.ownKeys(this._events) : [];
};

// About 1.5x faster than the two-arg version of Array#splice().
function spliceOne(list, index) {
  for (var i = index, k = i + 1, n = list.length; k < n; i += 1, k += 1)
    list[i] = list[k];
  list.pop();
}

function arrayClone(arr, n) {
  var copy = new Array(n);
  for (var i = 0; i < n; ++i)
    copy[i] = arr[i];
  return copy;
}

function unwrapListeners(arr) {
  var ret = new Array(arr.length);
  for (var i = 0; i < ret.length; ++i) {
    ret[i] = arr[i].listener || arr[i];
  }
  return ret;
}

function objectCreatePolyfill(proto) {
  var F = function() {};
  F.prototype = proto;
  return new F;
}
function objectKeysPolyfill(obj) {
  var keys = [];
  for (var k in obj) if (Object.prototype.hasOwnProperty.call(obj, k)) {
    keys.push(k);
  }
  return k;
}
function functionBindPolyfill(context) {
  var fn = this;
  return function () {
    return fn.apply(context, arguments);
  };
}

},{}],3:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

var diff = function diff(from, to) {
  for (var _i = 0, _Object$keys = Object.keys(from); _i < _Object$keys.length; _i++) {
    var i = _Object$keys[_i];
    if (to[i] === undefined || _typeof(from[i]) !== 'object' && from[i] !== to[i]) to[i] = from[i];else if (typeof from[i] !== 'function') throw new Error("It must to be a function.");else to[i] = diff(from[i], to[i]);
  }

  return to;
};

var ExecuterContext = function ExecuterContext(cmds, conn) {
  var _this = this;

  _classCallCheck(this, ExecuterContext);

  _defineProperty(this, "send", function () {
    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    var arr = _this.cmdHead.concat(args);

    _this.conn._sendMessage(arr);
  });

  this.cmdHead = ['data'].concat(cmds);
  this.conn = conn;
  this.userId = conn.userId;
};

var PluginDashboard =
/*#__PURE__*/
function () {
  function PluginDashboard(conn) {
    var _this2 = this;

    _classCallCheck(this, PluginDashboard);

    _defineProperty(this, "register", function (obj) {
      PluginDashboard.registerObject = diff(obj, _this2.registerObject);
    });

    _defineProperty(this, "receive", function (obj) {
      console.log(obj);
      PluginDashboard.receiveObject = diff(obj, _this2.receiveObject);
    });

    _defineProperty(this, "send", function () {
      for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
        args[_key2] = arguments[_key2];
      }

      _this2._sendMessage(args.reduce(function (prev, next) {
        if (typeof next == 'string') prev.concat(next.trim().split(' '));else if (Array.isArray(next)) prev.concat(next);else if (typeof next == 'number' || typeof next == 'bigint') prev.push("" + next);else if (typeof next == 'boolean') prev.push(next ? 'true' : 'false');else if (_typeof(next) == 'object') prev.push(JSON.stringify(next));else throw new Error("Cannot parse the type.");
        return prev;
      }), ['execute']);
    });

    _defineProperty(this, "_receiveMessagePre", function (str) {
      console.log("Get the message from the server：", str); // Heart package check.

      if (str[0] == '@') return;
      _this2.buffer += str + '\n';

      var cmds = _this2.buffer.split('\n');

      _this2.buffer = cmds.pop();
      console.log("[ BUFFER ]", _this2.buffer);
      console.log("Start running the command:", cmds);
      cmds.forEach(function (n) {
        return _this2._receiveMessage(n);
      });
    });

    _defineProperty(this, "_receiveMessage", function (cmd) {
      console.log(cmd);
      var args = cmd.trim().split(' ');
      var type = args.shift();
      var func = type == 'execute' ? _this2.registerObject : _this2.receiveObject;
      var arg = args.shift();
      var cmds = [arg];

      try {
        for (; _typeof(func[arg]) == 'object'; func = func[arg], arg = args.shift(), cmds.push(arg)) {
          if (func === undefined) throw new Error("Undefined object!");
        }

        if (type == 'execute' && func[arg] === undefined) throw new Error("Undefined object!");
      } catch (e) {
        _this2._sendMessage(['data', 'system', 'fail']);
      }

      try {
        // Get the function.
        var ret = func[arg].apply(new ExecuterContext(cmds, _this2), args); // If the head is 'execute', it needs a call back 'data' command.

        if (type == 'execute' && ret != null) _this2._sendMessage(['data'].concat(cmds).concat(ret.trim().split(' ')));
      } catch (e) {
        console.log(e);

        if (type == 'execute') {
          var n = ['data'].concat(cmds);
          n.push("fail");

          _this2._sendMessage(n);
        }
      }
    });

    this.connection = conn;
    this.registerObject = {};
    this.receiveObject = {};

    conn.onmessage = function (data) {
      return _this2._receiveMessagePre(data.data);
    };

    this.userId = null;
    this.buffer = "";
  }

  _createClass(PluginDashboard, [{
    key: "_sendMessage",
    value: function _sendMessage(args) {
      console.log("Client will send:", args);
      var cmd = args.reduce(function (prev, next) {
        return prev + ' ' + next;
      });
      var type = /^(execute|data).*$/.exec(cmd)[1];

      switch (type) {
        case 'execute':
        case 'data':
          this.connection.send(cmd);
          break;

        default:
          throw new Error("Illegal type!");
      }
    }
  }]);

  return PluginDashboard;
}();

exports.default = PluginDashboard;

},{}],4:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.connectionEvents = exports.receive = exports.register = exports.send = void 0;

var _pluginDashboard = _interopRequireDefault(require("./pluginDashboard"));

var _events = require("events");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var client = new WebSocket("ws://127.0.0.1:2333");
var dashboard;
var connectionEmitter = new _events.EventEmitter().setMaxListeners(0);
var dashboardEmitter = new _events.EventEmitter().setMaxListeners(0);

client.onopen = function () {
  Actions.view.system.toggleNetworkState("success");
  client.send("execute system register h5");
};

client.onmessage = function (data) {
  if (data.data == "data system register ok") {
    dashboard = new _pluginDashboard.default(client);
    dashboardEmitter.on('send', function (msg) {
      return dashboard.send(msg);
    });
    dashboardEmitter.on('register', function (obj) {
      return dashboard.register(obj);
    });
    dashboardEmitter.on('receive', function (obj) {
      return dashboard.receive(obj);
    });
    connectionEmitter.emit("load");
  }
};

client.onerror = function (err) {
  return console.error(err);
};

var send = function send() {
  for (var _len = arguments.length, data = new Array(_len), _key = 0; _key < _len; _key++) {
    data[_key] = arguments[_key];
  }

  if (dashboard) dashboardEmitter.emit('send', data);else connectionEmitter.on('ready', function () {
    return dashboardEmitter.emit('send', data);
  });
};

exports.send = send;

var register = function register(obj) {
  if (dashboard) dashboardEmitter.emit('register', obj);else connectionEmitter.on('ready', function () {
    return dashboardEmitter.emit('register', obj);
  });
};

exports.register = register;

var receive = function receive(obj) {
  if (dashboard) dashboardEmitter.emit('receive', obj);else connectionEmitter.on('ready', function () {
    return dashboardEmitter.emit('receive', obj);
  });
};

exports.receive = receive;
var connectionEvents = connectionEmitter;
exports.connectionEvents = connectionEvents;

},{"./pluginDashboard":3,"events":2}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJleHBvcnQuanMiLCJub2RlX21vZHVsZXMvZXZlbnRzL2V2ZW50cy5qcyIsInBsdWdpbkRhc2hib2FyZC5qcyIsIndlYlNvY2tldENsaWVudC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7QUNBQTs7QUFFQSxrQ0FBaUIsRUFBakIsQ0FBb0IsTUFBcEIsRUFBNEIsWUFBTTtBQUNoQyxnQ0FBUSxFQUFSOztBQUdBLG9DQUFpQixJQUFqQixDQUFzQixPQUF0QjtBQUNELENBTEQ7O2VBT2U7QUFDYixFQUFBLElBQUksRUFBRSxxQkFETztBQUViLEVBQUEsUUFBUSxFQUFFLHlCQUZHO0FBR2IsRUFBQSxPQUFPLEVBQUU7QUFISSxDOzs7O0FDVGY7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtB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QWpCLENBQXNCLFNBQXRCLEVBQWlDLEdBQWpDLENBQU47QUFBQSxHQUE5QjtBQUNSLENBSE07OztBQUtBLElBQUksZ0JBQWdCLEdBQUcsaUJBQXZCIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtmdW5jdGlvbiByKGUsbix0KXtmdW5jdGlvbiBvKGksZil7aWYoIW5baV0pe2lmKCFlW2ldKXt2YXIgYz1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlO2lmKCFmJiZjKXJldHVybiBjKGksITApO2lmKHUpcmV0dXJuIHUoaSwhMCk7dmFyIGE9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitpK1wiJ1wiKTt0aHJvdyBhLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsYX12YXIgcD1uW2ldPXtleHBvcnRzOnt9fTtlW2ldWzBdLmNhbGwocC5leHBvcnRzLGZ1bmN0aW9uKHIpe3ZhciBuPWVbaV1bMV1bcl07cmV0dXJuIG8obnx8cil9LHAscC5leHBvcnRzLHIsZSxuLHQpfXJldHVybiBuW2ldLmV4cG9ydHN9Zm9yKHZhciB1PVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmUsaT0wO2k8dC5sZW5ndGg7aSsrKW8odFtpXSk7cmV0dXJuIG99cmV0dXJuIHJ9KSgpIiwiaW1wb3J0IHsgc2VuZCwgcmVnaXN0ZXIsIHJlY2VpdmUsIGNvbm5lY3Rpb25FdmVudHMgfSBmcm9tIFwiLi93ZWJTb2NrZXRDbGllbnRcIjtcclxuXHJcbmNvbm5lY3Rpb25FdmVudHMub24oXCJsb2FkXCIsICgpID0+IHtcclxuICByZWNlaXZlKHtcclxuICB9KTtcclxuXHJcbiAgY29ubmVjdGlvbkV2ZW50cy5lbWl0KCdyZWFkeScpO1xyXG59KTtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IHtcclxuICBzZW5kOiBzZW5kLFxyXG4gIHJlZ2lzdGVyOiByZWdpc3RlcixcclxuICByZWNlaXZlOiByZWNlaXZlXHJcbn07IiwiLy8gQ29weXJpZ2h0IEpveWVudCwgSW5jLiBhbmQgb3RoZXIgTm9kZSBjb250cmlidXRvcnMuXG4vL1xuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGFcbi8vIGNvcHkgb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGVcbi8vIFwiU29mdHdhcmVcIiksIHRvIGRlYWwgaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZ1xuLy8gd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLFxuLy8gZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdFxuLy8gcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpcyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlXG4vLyBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZFxuLy8gaW4gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTU1xuLy8gT1IgSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRlxuLy8gTUVSQ0hBTlRBQklMSVRZLCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTlxuLy8gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sXG4vLyBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1Jcbi8vIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEVcbi8vIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXG5cbnZhciBvYmplY3RDcmVhdGUgPSBPYmplY3QuY3JlYXRlIHx8IG9iamVjdENyZWF0ZVBvbHlmaWxsXG52YXIgb2JqZWN0S2V5cyA9IE9iamVjdC5rZXlzIHx8IG9iamVjdEtleXNQb2x5ZmlsbFxudmFyIGJpbmQgPSBGdW5jdGlvbi5wcm90b3R5cGUuYmluZCB8fCBmdW5jdGlvbkJpbmRQb2x5ZmlsbFxuXG5mdW5jdGlvbiBFdmVudEVtaXR0ZXIoKSB7XG4gIGlmICghdGhpcy5fZXZlbnRzIHx8ICFPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwodGhpcywgJ19ldmVudHMnKSkge1xuICAgIHRoaXMuX2V2ZW50cyA9IG9iamVjdENyZWF0ZShudWxsKTtcbiAgICB0aGlzLl9ldmVudHNDb3VudCA9IDA7XG4gIH1cblxuICB0aGlzLl9tYXhMaXN0ZW5lcnMgPSB0aGlzLl9tYXhMaXN0ZW5lcnMgfHwgdW5kZWZpbmVkO1xufVxubW9kdWxlLmV4cG9ydHMgPSBFdmVudEVtaXR0ZXI7XG5cbi8vIEJhY2t3YXJkcy1jb21wYXQgd2l0aCBub2RlIDAuMTAueFxuRXZlbnRFbWl0dGVyLkV2ZW50RW1pdHRlciA9IEV2ZW50RW1pdHRlcjtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5fZXZlbnRzID0gdW5kZWZpbmVkO1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5fbWF4TGlzdGVuZXJzID0gdW5kZWZpbmVkO1xuXG4vLyBCeSBkZWZhdWx0IEV2ZW50RW1pdHRlcnMgd2lsbCBwcmludCBhIHdhcm5pbmcgaWYgbW9yZSB0aGFuIDEwIGxpc3RlbmVycyBhcmVcbi8vIGFkZGVkIHRvIGl0LiBUaGlzIGlzIGEgdXNlZnVsIGRlZmF1bHQgd2hpY2ggaGVscHMgZmluZGluZyBtZW1vcnkgbGVha3MuXG52YXIgZGVmYXVsdE1heExpc3RlbmVycyA9IDEwO1xuXG52YXIgaGFzRGVmaW5lUHJvcGVydHk7XG50cnkge1xuICB2YXIgbyA9IHt9O1xuICBpZiAoT2JqZWN0LmRlZmluZVByb3BlcnR5KSBPYmplY3QuZGVmaW5lUHJvcGVydHkobywgJ3gnLCB7IHZhbHVlOiAwIH0pO1xuICBoYXNEZWZpbmVQcm9wZXJ0eSA9IG8ueCA9PT0gMDtcbn0gY2F0Y2ggKGVycikgeyBoYXNEZWZpbmVQcm9wZXJ0eSA9IGZhbHNlIH1cbmlmIChoYXNEZWZpbmVQcm9wZXJ0eSkge1xuICBPYmplY3QuZGVmaW5lUHJvcGVydHkoRXZlbnRFbWl0dGVyLCAnZGVmYXVsdE1heExpc3RlbmVycycsIHtcbiAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgIGdldDogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gZGVmYXVsdE1heExpc3RlbmVycztcbiAgICB9LFxuICAgIHNldDogZnVuY3Rpb24oYXJnKSB7XG4gICAgICAvLyBjaGVjayB3aGV0aGVyIHRoZSBpbnB1dCBpcyBhIHBvc2l0aXZlIG51bWJlciAod2hvc2UgdmFsdWUgaXMgemVybyBvclxuICAgICAgLy8gZ3JlYXRlciBhbmQgbm90IGEgTmFOKS5cbiAgICAgIGlmICh0eXBlb2YgYXJnICE9PSAnbnVtYmVyJyB8fCBhcmcgPCAwIHx8IGFyZyAhPT0gYXJnKVxuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdcImRlZmF1bHRNYXhMaXN0ZW5lcnNcIiBtdXN0IGJlIGEgcG9zaXRpdmUgbnVtYmVyJyk7XG4gICAgICBkZWZhdWx0TWF4TGlzdGVuZXJzID0gYXJnO1xuICAgIH1cbiAgfSk7XG59IGVsc2Uge1xuICBFdmVudEVtaXR0ZXIuZGVmYXVsdE1heExpc3RlbmVycyA9IGRlZmF1bHRNYXhMaXN0ZW5lcnM7XG59XG5cbi8vIE9idmlvdXNseSBub3QgYWxsIEVtaXR0ZXJzIHNob3VsZCBiZSBsaW1pdGVkIHRvIDEwLiBUaGlzIGZ1bmN0aW9uIGFsbG93c1xuLy8gdGhhdCB0byBiZSBpbmNyZWFzZWQuIFNldCB0byB6ZXJvIGZvciB1bmxpbWl0ZWQuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnNldE1heExpc3RlbmVycyA9IGZ1bmN0aW9uIHNldE1heExpc3RlbmVycyhuKSB7XG4gIGlmICh0eXBlb2YgbiAhPT0gJ251bWJlcicgfHwgbiA8IDAgfHwgaXNOYU4obikpXG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignXCJuXCIgYXJndW1lbnQgbXVzdCBiZSBhIHBvc2l0aXZlIG51bWJlcicpO1xuICB0aGlzLl9tYXhMaXN0ZW5lcnMgPSBuO1xuICByZXR1cm4gdGhpcztcbn07XG5cbmZ1bmN0aW9uICRnZXRNYXhMaXN0ZW5lcnModGhhdCkge1xuICBpZiAodGhhdC5fbWF4TGlzdGVuZXJzID09PSB1bmRlZmluZWQpXG4gICAgcmV0dXJuIEV2ZW50RW1pdHRlci5kZWZhdWx0TWF4TGlzdGVuZXJzO1xuICByZXR1cm4gdGhhdC5fbWF4TGlzdGVuZXJzO1xufVxuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmdldE1heExpc3RlbmVycyA9IGZ1bmN0aW9uIGdldE1heExpc3RlbmVycygpIHtcbiAgcmV0dXJuICRnZXRNYXhMaXN0ZW5lcnModGhpcyk7XG59O1xuXG4vLyBUaGVzZSBzdGFuZGFsb25lIGVtaXQqIGZ1bmN0aW9ucyBhcmUgdXNlZCB0byBvcHRpbWl6ZSBjYWxsaW5nIG9mIGV2ZW50XG4vLyBoYW5kbGVycyBmb3IgZmFzdCBjYXNlcyBiZWNhdXNlIGVtaXQoKSBpdHNlbGYgb2Z0ZW4gaGFzIGEgdmFyaWFibGUgbnVtYmVyIG9mXG4vLyBhcmd1bWVudHMgYW5kIGNhbiBiZSBkZW9wdGltaXplZCBiZWNhdXNlIG9mIHRoYXQuIFRoZXNlIGZ1bmN0aW9ucyBhbHdheXMgaGF2ZVxuLy8gdGhlIHNhbWUgbnVtYmVyIG9mIGFyZ3VtZW50cyBhbmQgdGh1cyBkbyBub3QgZ2V0IGRlb3B0aW1pemVkLCBzbyB0aGUgY29kZVxuLy8gaW5zaWRlIHRoZW0gY2FuIGV4ZWN1dGUgZmFzdGVyLlxuZnVuY3Rpb24gZW1pdE5vbmUoaGFuZGxlciwgaXNGbiwgc2VsZikge1xuICBpZiAoaXNGbilcbiAgICBoYW5kbGVyLmNhbGwoc2VsZik7XG4gIGVsc2Uge1xuICAgIHZhciBsZW4gPSBoYW5kbGVyLmxlbmd0aDtcbiAgICB2YXIgbGlzdGVuZXJzID0gYXJyYXlDbG9uZShoYW5kbGVyLCBsZW4pO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyArK2kpXG4gICAgICBsaXN0ZW5lcnNbaV0uY2FsbChzZWxmKTtcbiAgfVxufVxuZnVuY3Rpb24gZW1pdE9uZShoYW5kbGVyLCBpc0ZuLCBzZWxmLCBhcmcxKSB7XG4gIGlmIChpc0ZuKVxuICAgIGhhbmRsZXIuY2FsbChzZWxmLCBhcmcxKTtcbiAgZWxzZSB7XG4gICAgdmFyIGxlbiA9IGhhbmRsZXIubGVuZ3RoO1xuICAgIHZhciBsaXN0ZW5lcnMgPSBhcnJheUNsb25lKGhhbmRsZXIsIGxlbik7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47ICsraSlcbiAgICAgIGxpc3RlbmVyc1tpXS5jYWxsKHNlbGYsIGFyZzEpO1xuICB9XG59XG5mdW5jdGlvbiBlbWl0VHdvKGhhbmRsZXIsIGlzRm4sIHNlbGYsIGFyZzEsIGFyZzIpIHtcbiAgaWYgKGlzRm4pXG4gICAgaGFuZGxlci5jYWxsKHNlbGYsIGFyZzEsIGFyZzIpO1xuICBlbHNlIHtcbiAgICB2YXIgbGVuID0gaGFuZGxlci5sZW5ndGg7XG4gICAgdmFyIGxpc3RlbmVycyA9IGFycmF5Q2xvbmUoaGFuZGxlciwgbGVuKTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgKytpKVxuICAgICAgbGlzdGVuZXJzW2ldLmNhbGwoc2VsZiwgYXJnMSwgYXJnMik7XG4gIH1cbn1cbmZ1bmN0aW9uIGVtaXRUaHJlZShoYW5kbGVyLCBpc0ZuLCBzZWxmLCBhcmcxLCBhcmcyLCBhcmczKSB7XG4gIGlmIChpc0ZuKVxuICAgIGhhbmRsZXIuY2FsbChzZWxmLCBhcmcxLCBhcmcyLCBhcmczKTtcbiAgZWxzZSB7XG4gICAgdmFyIGxlbiA9IGhhbmRsZXIubGVuZ3RoO1xuICAgIHZhciBsaXN0ZW5lcnMgPSBhcnJheUNsb25lKGhhbmRsZXIsIGxlbik7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47ICsraSlcbiAgICAgIGxpc3RlbmVyc1tpXS5jYWxsKHNlbGYsIGFyZzEsIGFyZzIsIGFyZzMpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGVtaXRNYW55KGhhbmRsZXIsIGlzRm4sIHNlbGYsIGFyZ3MpIHtcbiAgaWYgKGlzRm4pXG4gICAgaGFuZGxlci5hcHBseShzZWxmLCBhcmdzKTtcbiAgZWxzZSB7XG4gICAgdmFyIGxlbiA9IGhhbmRsZXIubGVuZ3RoO1xuICAgIHZhciBsaXN0ZW5lcnMgPSBhcnJheUNsb25lKGhhbmRsZXIsIGxlbik7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47ICsraSlcbiAgICAgIGxpc3RlbmVyc1tpXS5hcHBseShzZWxmLCBhcmdzKTtcbiAgfVxufVxuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmVtaXQgPSBmdW5jdGlvbiBlbWl0KHR5cGUpIHtcbiAgdmFyIGVyLCBoYW5kbGVyLCBsZW4sIGFyZ3MsIGksIGV2ZW50cztcbiAgdmFyIGRvRXJyb3IgPSAodHlwZSA9PT0gJ2Vycm9yJyk7XG5cbiAgZXZlbnRzID0gdGhpcy5fZXZlbnRzO1xuICBpZiAoZXZlbnRzKVxuICAgIGRvRXJyb3IgPSAoZG9FcnJvciAmJiBldmVudHMuZXJyb3IgPT0gbnVsbCk7XG4gIGVsc2UgaWYgKCFkb0Vycm9yKVxuICAgIHJldHVybiBmYWxzZTtcblxuICAvLyBJZiB0aGVyZSBpcyBubyAnZXJyb3InIGV2ZW50IGxpc3RlbmVyIHRoZW4gdGhyb3cuXG4gIGlmIChkb0Vycm9yKSB7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAxKVxuICAgICAgZXIgPSBhcmd1bWVudHNbMV07XG4gICAgaWYgKGVyIGluc3RhbmNlb2YgRXJyb3IpIHtcbiAgICAgIHRocm93IGVyOyAvLyBVbmhhbmRsZWQgJ2Vycm9yJyBldmVudFxuICAgIH0gZWxzZSB7XG4gICAgICAvLyBBdCBsZWFzdCBnaXZlIHNvbWUga2luZCBvZiBjb250ZXh0IHRvIHRoZSB1c2VyXG4gICAgICB2YXIgZXJyID0gbmV3IEVycm9yKCdVbmhhbmRsZWQgXCJlcnJvclwiIGV2ZW50LiAoJyArIGVyICsgJyknKTtcbiAgICAgIGVyci5jb250ZXh0ID0gZXI7XG4gICAgICB0aHJvdyBlcnI7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGhhbmRsZXIgPSBldmVudHNbdHlwZV07XG5cbiAgaWYgKCFoYW5kbGVyKVxuICAgIHJldHVybiBmYWxzZTtcblxuICB2YXIgaXNGbiA9IHR5cGVvZiBoYW5kbGVyID09PSAnZnVuY3Rpb24nO1xuICBsZW4gPSBhcmd1bWVudHMubGVuZ3RoO1xuICBzd2l0Y2ggKGxlbikge1xuICAgICAgLy8gZmFzdCBjYXNlc1xuICAgIGNhc2UgMTpcbiAgICAgIGVtaXROb25lKGhhbmRsZXIsIGlzRm4sIHRoaXMpO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSAyOlxuICAgICAgZW1pdE9uZShoYW5kbGVyLCBpc0ZuLCB0aGlzLCBhcmd1bWVudHNbMV0pO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSAzOlxuICAgICAgZW1pdFR3byhoYW5kbGVyLCBpc0ZuLCB0aGlzLCBhcmd1bWVudHNbMV0sIGFyZ3VtZW50c1syXSk7XG4gICAgICBicmVhaztcbiAgICBjYXNlIDQ6XG4gICAgICBlbWl0VGhyZWUoaGFuZGxlciwgaXNGbiwgdGhpcywgYXJndW1lbnRzWzFdLCBhcmd1bWVudHNbMl0sIGFyZ3VtZW50c1szXSk7XG4gICAgICBicmVhaztcbiAgICAgIC8vIHNsb3dlclxuICAgIGRlZmF1bHQ6XG4gICAgICBhcmdzID0gbmV3IEFycmF5KGxlbiAtIDEpO1xuICAgICAgZm9yIChpID0gMTsgaSA8IGxlbjsgaSsrKVxuICAgICAgICBhcmdzW2kgLSAxXSA9IGFyZ3VtZW50c1tpXTtcbiAgICAgIGVtaXRNYW55KGhhbmRsZXIsIGlzRm4sIHRoaXMsIGFyZ3MpO1xuICB9XG5cbiAgcmV0dXJuIHRydWU7XG59O1xuXG5mdW5jdGlvbiBfYWRkTGlzdGVuZXIodGFyZ2V0LCB0eXBlLCBsaXN0ZW5lciwgcHJlcGVuZCkge1xuICB2YXIgbTtcbiAgdmFyIGV2ZW50cztcbiAgdmFyIGV4aXN0aW5nO1xuXG4gIGlmICh0eXBlb2YgbGlzdGVuZXIgIT09ICdmdW5jdGlvbicpXG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignXCJsaXN0ZW5lclwiIGFyZ3VtZW50IG11c3QgYmUgYSBmdW5jdGlvbicpO1xuXG4gIGV2ZW50cyA9IHRhcmdldC5fZXZlbnRzO1xuICBpZiAoIWV2ZW50cykge1xuICAgIGV2ZW50cyA9IHRhcmdldC5fZXZlbnRzID0gb2JqZWN0Q3JlYXRlKG51bGwpO1xuICAgIHRhcmdldC5fZXZlbnRzQ291bnQgPSAwO1xuICB9IGVsc2Uge1xuICAgIC8vIFRvIGF2b2lkIHJlY3Vyc2lvbiBpbiB0aGUgY2FzZSB0aGF0IHR5cGUgPT09IFwibmV3TGlzdGVuZXJcIiEgQmVmb3JlXG4gICAgLy8gYWRkaW5nIGl0IHRvIHRoZSBsaXN0ZW5lcnMsIGZpcnN0IGVtaXQgXCJuZXdMaXN0ZW5lclwiLlxuICAgIGlmIChldmVudHMubmV3TGlzdGVuZXIpIHtcbiAgICAgIHRhcmdldC5lbWl0KCduZXdMaXN0ZW5lcicsIHR5cGUsXG4gICAgICAgICAgbGlzdGVuZXIubGlzdGVuZXIgPyBsaXN0ZW5lci5saXN0ZW5lciA6IGxpc3RlbmVyKTtcblxuICAgICAgLy8gUmUtYXNzaWduIGBldmVudHNgIGJlY2F1c2UgYSBuZXdMaXN0ZW5lciBoYW5kbGVyIGNvdWxkIGhhdmUgY2F1c2VkIHRoZVxuICAgICAgLy8gdGhpcy5fZXZlbnRzIHRvIGJlIGFzc2lnbmVkIHRvIGEgbmV3IG9iamVjdFxuICAgICAgZXZlbnRzID0gdGFyZ2V0Ll9ldmVudHM7XG4gICAgfVxuICAgIGV4aXN0aW5nID0gZXZlbnRzW3R5cGVdO1xuICB9XG5cbiAgaWYgKCFleGlzdGluZykge1xuICAgIC8vIE9wdGltaXplIHRoZSBjYXNlIG9mIG9uZSBsaXN0ZW5lci4gRG9uJ3QgbmVlZCB0aGUgZXh0cmEgYXJyYXkgb2JqZWN0LlxuICAgIGV4aXN0aW5nID0gZXZlbnRzW3R5cGVdID0gbGlzdGVuZXI7XG4gICAgKyt0YXJnZXQuX2V2ZW50c0NvdW50O1xuICB9IGVsc2Uge1xuICAgIGlmICh0eXBlb2YgZXhpc3RpbmcgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIC8vIEFkZGluZyB0aGUgc2Vjb25kIGVsZW1lbnQsIG5lZWQgdG8gY2hhbmdlIHRvIGFycmF5LlxuICAgICAgZXhpc3RpbmcgPSBldmVudHNbdHlwZV0gPVxuICAgICAgICAgIHByZXBlbmQgPyBbbGlzdGVuZXIsIGV4aXN0aW5nXSA6IFtleGlzdGluZywgbGlzdGVuZXJdO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBJZiB3ZSd2ZSBhbHJlYWR5IGdvdCBhbiBhcnJheSwganVzdCBhcHBlbmQuXG4gICAgICBpZiAocHJlcGVuZCkge1xuICAgICAgICBleGlzdGluZy51bnNoaWZ0KGxpc3RlbmVyKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGV4aXN0aW5nLnB1c2gobGlzdGVuZXIpO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIENoZWNrIGZvciBsaXN0ZW5lciBsZWFrXG4gICAgaWYgKCFleGlzdGluZy53YXJuZWQpIHtcbiAgICAgIG0gPSAkZ2V0TWF4TGlzdGVuZXJzKHRhcmdldCk7XG4gICAgICBpZiAobSAmJiBtID4gMCAmJiBleGlzdGluZy5sZW5ndGggPiBtKSB7XG4gICAgICAgIGV4aXN0aW5nLndhcm5lZCA9IHRydWU7XG4gICAgICAgIHZhciB3ID0gbmV3IEVycm9yKCdQb3NzaWJsZSBFdmVudEVtaXR0ZXIgbWVtb3J5IGxlYWsgZGV0ZWN0ZWQuICcgK1xuICAgICAgICAgICAgZXhpc3RpbmcubGVuZ3RoICsgJyBcIicgKyBTdHJpbmcodHlwZSkgKyAnXCIgbGlzdGVuZXJzICcgK1xuICAgICAgICAgICAgJ2FkZGVkLiBVc2UgZW1pdHRlci5zZXRNYXhMaXN0ZW5lcnMoKSB0byAnICtcbiAgICAgICAgICAgICdpbmNyZWFzZSBsaW1pdC4nKTtcbiAgICAgICAgdy5uYW1lID0gJ01heExpc3RlbmVyc0V4Y2VlZGVkV2FybmluZyc7XG4gICAgICAgIHcuZW1pdHRlciA9IHRhcmdldDtcbiAgICAgICAgdy50eXBlID0gdHlwZTtcbiAgICAgICAgdy5jb3VudCA9IGV4aXN0aW5nLmxlbmd0aDtcbiAgICAgICAgaWYgKHR5cGVvZiBjb25zb2xlID09PSAnb2JqZWN0JyAmJiBjb25zb2xlLndhcm4pIHtcbiAgICAgICAgICBjb25zb2xlLndhcm4oJyVzOiAlcycsIHcubmFtZSwgdy5tZXNzYWdlKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiB0YXJnZXQ7XG59XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuYWRkTGlzdGVuZXIgPSBmdW5jdGlvbiBhZGRMaXN0ZW5lcih0eXBlLCBsaXN0ZW5lcikge1xuICByZXR1cm4gX2FkZExpc3RlbmVyKHRoaXMsIHR5cGUsIGxpc3RlbmVyLCBmYWxzZSk7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uID0gRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5hZGRMaXN0ZW5lcjtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5wcmVwZW5kTGlzdGVuZXIgPVxuICAgIGZ1bmN0aW9uIHByZXBlbmRMaXN0ZW5lcih0eXBlLCBsaXN0ZW5lcikge1xuICAgICAgcmV0dXJuIF9hZGRMaXN0ZW5lcih0aGlzLCB0eXBlLCBsaXN0ZW5lciwgdHJ1ZSk7XG4gICAgfTtcblxuZnVuY3Rpb24gb25jZVdyYXBwZXIoKSB7XG4gIGlmICghdGhpcy5maXJlZCkge1xuICAgIHRoaXMudGFyZ2V0LnJlbW92ZUxpc3RlbmVyKHRoaXMudHlwZSwgdGhpcy53cmFwRm4pO1xuICAgIHRoaXMuZmlyZWQgPSB0cnVlO1xuICAgIHN3aXRjaCAoYXJndW1lbnRzLmxlbmd0aCkge1xuICAgICAgY2FzZSAwOlxuICAgICAgICByZXR1cm4gdGhpcy5saXN0ZW5lci5jYWxsKHRoaXMudGFyZ2V0KTtcbiAgICAgIGNhc2UgMTpcbiAgICAgICAgcmV0dXJuIHRoaXMubGlzdGVuZXIuY2FsbCh0aGlzLnRhcmdldCwgYXJndW1lbnRzWzBdKTtcbiAgICAgIGNhc2UgMjpcbiAgICAgICAgcmV0dXJuIHRoaXMubGlzdGVuZXIuY2FsbCh0aGlzLnRhcmdldCwgYXJndW1lbnRzWzBdLCBhcmd1bWVudHNbMV0pO1xuICAgICAgY2FzZSAzOlxuICAgICAgICByZXR1cm4gdGhpcy5saXN0ZW5lci5jYWxsKHRoaXMudGFyZ2V0LCBhcmd1bWVudHNbMF0sIGFyZ3VtZW50c1sxXSxcbiAgICAgICAgICAgIGFyZ3VtZW50c1syXSk7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICB2YXIgYXJncyA9IG5ldyBBcnJheShhcmd1bWVudHMubGVuZ3RoKTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcmdzLmxlbmd0aDsgKytpKVxuICAgICAgICAgIGFyZ3NbaV0gPSBhcmd1bWVudHNbaV07XG4gICAgICAgIHRoaXMubGlzdGVuZXIuYXBwbHkodGhpcy50YXJnZXQsIGFyZ3MpO1xuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBfb25jZVdyYXAodGFyZ2V0LCB0eXBlLCBsaXN0ZW5lcikge1xuICB2YXIgc3RhdGUgPSB7IGZpcmVkOiBmYWxzZSwgd3JhcEZuOiB1bmRlZmluZWQsIHRhcmdldDogdGFyZ2V0LCB0eXBlOiB0eXBlLCBsaXN0ZW5lcjogbGlzdGVuZXIgfTtcbiAgdmFyIHdyYXBwZWQgPSBiaW5kLmNhbGwob25jZVdyYXBwZXIsIHN0YXRlKTtcbiAgd3JhcHBlZC5saXN0ZW5lciA9IGxpc3RlbmVyO1xuICBzdGF0ZS53cmFwRm4gPSB3cmFwcGVkO1xuICByZXR1cm4gd3JhcHBlZDtcbn1cblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbmNlID0gZnVuY3Rpb24gb25jZSh0eXBlLCBsaXN0ZW5lcikge1xuICBpZiAodHlwZW9mIGxpc3RlbmVyICE9PSAnZnVuY3Rpb24nKVxuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1wibGlzdGVuZXJcIiBhcmd1bWVudCBtdXN0IGJlIGEgZnVuY3Rpb24nKTtcbiAgdGhpcy5vbih0eXBlLCBfb25jZVdyYXAodGhpcywgdHlwZSwgbGlzdGVuZXIpKTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnByZXBlbmRPbmNlTGlzdGVuZXIgPVxuICAgIGZ1bmN0aW9uIHByZXBlbmRPbmNlTGlzdGVuZXIodHlwZSwgbGlzdGVuZXIpIHtcbiAgICAgIGlmICh0eXBlb2YgbGlzdGVuZXIgIT09ICdmdW5jdGlvbicpXG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1wibGlzdGVuZXJcIiBhcmd1bWVudCBtdXN0IGJlIGEgZnVuY3Rpb24nKTtcbiAgICAgIHRoaXMucHJlcGVuZExpc3RlbmVyKHR5cGUsIF9vbmNlV3JhcCh0aGlzLCB0eXBlLCBsaXN0ZW5lcikpO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcblxuLy8gRW1pdHMgYSAncmVtb3ZlTGlzdGVuZXInIGV2ZW50IGlmIGFuZCBvbmx5IGlmIHRoZSBsaXN0ZW5lciB3YXMgcmVtb3ZlZC5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlTGlzdGVuZXIgPVxuICAgIGZ1bmN0aW9uIHJlbW92ZUxpc3RlbmVyKHR5cGUsIGxpc3RlbmVyKSB7XG4gICAgICB2YXIgbGlzdCwgZXZlbnRzLCBwb3NpdGlvbiwgaSwgb3JpZ2luYWxMaXN0ZW5lcjtcblxuICAgICAgaWYgKHR5cGVvZiBsaXN0ZW5lciAhPT0gJ2Z1bmN0aW9uJylcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignXCJsaXN0ZW5lclwiIGFyZ3VtZW50IG11c3QgYmUgYSBmdW5jdGlvbicpO1xuXG4gICAgICBldmVudHMgPSB0aGlzLl9ldmVudHM7XG4gICAgICBpZiAoIWV2ZW50cylcbiAgICAgICAgcmV0dXJuIHRoaXM7XG5cbiAgICAgIGxpc3QgPSBldmVudHNbdHlwZV07XG4gICAgICBpZiAoIWxpc3QpXG4gICAgICAgIHJldHVybiB0aGlzO1xuXG4gICAgICBpZiAobGlzdCA9PT0gbGlzdGVuZXIgfHwgbGlzdC5saXN0ZW5lciA9PT0gbGlzdGVuZXIpIHtcbiAgICAgICAgaWYgKC0tdGhpcy5fZXZlbnRzQ291bnQgPT09IDApXG4gICAgICAgICAgdGhpcy5fZXZlbnRzID0gb2JqZWN0Q3JlYXRlKG51bGwpO1xuICAgICAgICBlbHNlIHtcbiAgICAgICAgICBkZWxldGUgZXZlbnRzW3R5cGVdO1xuICAgICAgICAgIGlmIChldmVudHMucmVtb3ZlTGlzdGVuZXIpXG4gICAgICAgICAgICB0aGlzLmVtaXQoJ3JlbW92ZUxpc3RlbmVyJywgdHlwZSwgbGlzdC5saXN0ZW5lciB8fCBsaXN0ZW5lcik7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAodHlwZW9mIGxpc3QgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgcG9zaXRpb24gPSAtMTtcblxuICAgICAgICBmb3IgKGkgPSBsaXN0Lmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgICAgaWYgKGxpc3RbaV0gPT09IGxpc3RlbmVyIHx8IGxpc3RbaV0ubGlzdGVuZXIgPT09IGxpc3RlbmVyKSB7XG4gICAgICAgICAgICBvcmlnaW5hbExpc3RlbmVyID0gbGlzdFtpXS5saXN0ZW5lcjtcbiAgICAgICAgICAgIHBvc2l0aW9uID0gaTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChwb3NpdGlvbiA8IDApXG4gICAgICAgICAgcmV0dXJuIHRoaXM7XG5cbiAgICAgICAgaWYgKHBvc2l0aW9uID09PSAwKVxuICAgICAgICAgIGxpc3Quc2hpZnQoKTtcbiAgICAgICAgZWxzZVxuICAgICAgICAgIHNwbGljZU9uZShsaXN0LCBwb3NpdGlvbik7XG5cbiAgICAgICAgaWYgKGxpc3QubGVuZ3RoID09PSAxKVxuICAgICAgICAgIGV2ZW50c1t0eXBlXSA9IGxpc3RbMF07XG5cbiAgICAgICAgaWYgKGV2ZW50cy5yZW1vdmVMaXN0ZW5lcilcbiAgICAgICAgICB0aGlzLmVtaXQoJ3JlbW92ZUxpc3RlbmVyJywgdHlwZSwgb3JpZ2luYWxMaXN0ZW5lciB8fCBsaXN0ZW5lcik7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlQWxsTGlzdGVuZXJzID1cbiAgICBmdW5jdGlvbiByZW1vdmVBbGxMaXN0ZW5lcnModHlwZSkge1xuICAgICAgdmFyIGxpc3RlbmVycywgZXZlbnRzLCBpO1xuXG4gICAgICBldmVudHMgPSB0aGlzLl9ldmVudHM7XG4gICAgICBpZiAoIWV2ZW50cylcbiAgICAgICAgcmV0dXJuIHRoaXM7XG5cbiAgICAgIC8vIG5vdCBsaXN0ZW5pbmcgZm9yIHJlbW92ZUxpc3RlbmVyLCBubyBuZWVkIHRvIGVtaXRcbiAgICAgIGlmICghZXZlbnRzLnJlbW92ZUxpc3RlbmVyKSB7XG4gICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgdGhpcy5fZXZlbnRzID0gb2JqZWN0Q3JlYXRlKG51bGwpO1xuICAgICAgICAgIHRoaXMuX2V2ZW50c0NvdW50ID0gMDtcbiAgICAgICAgfSBlbHNlIGlmIChldmVudHNbdHlwZV0pIHtcbiAgICAgICAgICBpZiAoLS10aGlzLl9ldmVudHNDb3VudCA9PT0gMClcbiAgICAgICAgICAgIHRoaXMuX2V2ZW50cyA9IG9iamVjdENyZWF0ZShudWxsKTtcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICBkZWxldGUgZXZlbnRzW3R5cGVdO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgfVxuXG4gICAgICAvLyBlbWl0IHJlbW92ZUxpc3RlbmVyIGZvciBhbGwgbGlzdGVuZXJzIG9uIGFsbCBldmVudHNcbiAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHZhciBrZXlzID0gb2JqZWN0S2V5cyhldmVudHMpO1xuICAgICAgICB2YXIga2V5O1xuICAgICAgICBmb3IgKGkgPSAwOyBpIDwga2V5cy5sZW5ndGg7ICsraSkge1xuICAgICAgICAgIGtleSA9IGtleXNbaV07XG4gICAgICAgICAgaWYgKGtleSA9PT0gJ3JlbW92ZUxpc3RlbmVyJykgY29udGludWU7XG4gICAgICAgICAgdGhpcy5yZW1vdmVBbGxMaXN0ZW5lcnMoa2V5KTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnJlbW92ZUFsbExpc3RlbmVycygncmVtb3ZlTGlzdGVuZXInKTtcbiAgICAgICAgdGhpcy5fZXZlbnRzID0gb2JqZWN0Q3JlYXRlKG51bGwpO1xuICAgICAgICB0aGlzLl9ldmVudHNDb3VudCA9IDA7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgfVxuXG4gICAgICBsaXN0ZW5lcnMgPSBldmVudHNbdHlwZV07XG5cbiAgICAgIGlmICh0eXBlb2YgbGlzdGVuZXJzID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIodHlwZSwgbGlzdGVuZXJzKTtcbiAgICAgIH0gZWxzZSBpZiAobGlzdGVuZXJzKSB7XG4gICAgICAgIC8vIExJRk8gb3JkZXJcbiAgICAgICAgZm9yIChpID0gbGlzdGVuZXJzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgICAgdGhpcy5yZW1vdmVMaXN0ZW5lcih0eXBlLCBsaXN0ZW5lcnNbaV0pO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG5cbmZ1bmN0aW9uIF9saXN0ZW5lcnModGFyZ2V0LCB0eXBlLCB1bndyYXApIHtcbiAgdmFyIGV2ZW50cyA9IHRhcmdldC5fZXZlbnRzO1xuXG4gIGlmICghZXZlbnRzKVxuICAgIHJldHVybiBbXTtcblxuICB2YXIgZXZsaXN0ZW5lciA9IGV2ZW50c1t0eXBlXTtcbiAgaWYgKCFldmxpc3RlbmVyKVxuICAgIHJldHVybiBbXTtcblxuICBpZiAodHlwZW9mIGV2bGlzdGVuZXIgPT09ICdmdW5jdGlvbicpXG4gICAgcmV0dXJuIHVud3JhcCA/IFtldmxpc3RlbmVyLmxpc3RlbmVyIHx8IGV2bGlzdGVuZXJdIDogW2V2bGlzdGVuZXJdO1xuXG4gIHJldHVybiB1bndyYXAgPyB1bndyYXBMaXN0ZW5lcnMoZXZsaXN0ZW5lcikgOiBhcnJheUNsb25lKGV2bGlzdGVuZXIsIGV2bGlzdGVuZXIubGVuZ3RoKTtcbn1cblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5saXN0ZW5lcnMgPSBmdW5jdGlvbiBsaXN0ZW5lcnModHlwZSkge1xuICByZXR1cm4gX2xpc3RlbmVycyh0aGlzLCB0eXBlLCB0cnVlKTtcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUucmF3TGlzdGVuZXJzID0gZnVuY3Rpb24gcmF3TGlzdGVuZXJzKHR5cGUpIHtcbiAgcmV0dXJuIF9saXN0ZW5lcnModGhpcywgdHlwZSwgZmFsc2UpO1xufTtcblxuRXZlbnRFbWl0dGVyLmxpc3RlbmVyQ291bnQgPSBmdW5jdGlvbihlbWl0dGVyLCB0eXBlKSB7XG4gIGlmICh0eXBlb2YgZW1pdHRlci5saXN0ZW5lckNvdW50ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgcmV0dXJuIGVtaXR0ZXIubGlzdGVuZXJDb3VudCh0eXBlKTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gbGlzdGVuZXJDb3VudC5jYWxsKGVtaXR0ZXIsIHR5cGUpO1xuICB9XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmxpc3RlbmVyQ291bnQgPSBsaXN0ZW5lckNvdW50O1xuZnVuY3Rpb24gbGlzdGVuZXJDb3VudCh0eXBlKSB7XG4gIHZhciBldmVudHMgPSB0aGlzLl9ldmVudHM7XG5cbiAgaWYgKGV2ZW50cykge1xuICAgIHZhciBldmxpc3RlbmVyID0gZXZlbnRzW3R5cGVdO1xuXG4gICAgaWYgKHR5cGVvZiBldmxpc3RlbmVyID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICByZXR1cm4gMTtcbiAgICB9IGVsc2UgaWYgKGV2bGlzdGVuZXIpIHtcbiAgICAgIHJldHVybiBldmxpc3RlbmVyLmxlbmd0aDtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gMDtcbn1cblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5ldmVudE5hbWVzID0gZnVuY3Rpb24gZXZlbnROYW1lcygpIHtcbiAgcmV0dXJuIHRoaXMuX2V2ZW50c0NvdW50ID4gMCA/IFJlZmxlY3Qub3duS2V5cyh0aGlzLl9ldmVudHMpIDogW107XG59O1xuXG4vLyBBYm91dCAxLjV4IGZhc3RlciB0aGFuIHRoZSB0d28tYXJnIHZlcnNpb24gb2YgQXJyYXkjc3BsaWNlKCkuXG5mdW5jdGlvbiBzcGxpY2VPbmUobGlzdCwgaW5kZXgpIHtcbiAgZm9yICh2YXIgaSA9IGluZGV4LCBrID0gaSArIDEsIG4gPSBsaXN0Lmxlbmd0aDsgayA8IG47IGkgKz0gMSwgayArPSAxKVxuICAgIGxpc3RbaV0gPSBsaXN0W2tdO1xuICBsaXN0LnBvcCgpO1xufVxuXG5mdW5jdGlvbiBhcnJheUNsb25lKGFyciwgbikge1xuICB2YXIgY29weSA9IG5ldyBBcnJheShuKTtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBuOyArK2kpXG4gICAgY29weVtpXSA9IGFycltpXTtcbiAgcmV0dXJuIGNvcHk7XG59XG5cbmZ1bmN0aW9uIHVud3JhcExpc3RlbmVycyhhcnIpIHtcbiAgdmFyIHJldCA9IG5ldyBBcnJheShhcnIubGVuZ3RoKTtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCByZXQubGVuZ3RoOyArK2kpIHtcbiAgICByZXRbaV0gPSBhcnJbaV0ubGlzdGVuZXIgfHwgYXJyW2ldO1xuICB9XG4gIHJldHVybiByZXQ7XG59XG5cbmZ1bmN0aW9uIG9iamVjdENyZWF0ZVBvbHlmaWxsKHByb3RvKSB7XG4gIHZhciBGID0gZnVuY3Rpb24oKSB7fTtcbiAgRi5wcm90b3R5cGUgPSBwcm90bztcbiAgcmV0dXJuIG5ldyBGO1xufVxuZnVuY3Rpb24gb2JqZWN0S2V5c1BvbHlmaWxsKG9iaikge1xuICB2YXIga2V5cyA9IFtdO1xuICBmb3IgKHZhciBrIGluIG9iaikgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIGspKSB7XG4gICAga2V5cy5wdXNoKGspO1xuICB9XG4gIHJldHVybiBrO1xufVxuZnVuY3Rpb24gZnVuY3Rpb25CaW5kUG9seWZpbGwoY29udGV4dCkge1xuICB2YXIgZm4gPSB0aGlzO1xuICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBmbi5hcHBseShjb250ZXh0LCBhcmd1bWVudHMpO1xuICB9O1xufVxuIiwiY29uc3QgZGlmZiA9IChmcm9tLCB0bykgPT4ge1xyXG4gIGZvciAobGV0IGkgb2YgT2JqZWN0LmtleXMoZnJvbSkpIHtcclxuICAgIGlmICh0b1tpXSA9PT0gdW5kZWZpbmVkIHx8IHR5cGVvZiBmcm9tW2ldICE9PSAnb2JqZWN0JyAmJiBmcm9tW2ldICE9PSB0b1tpXSkgdG9baV0gPSBmcm9tW2ldO1xyXG4gICAgZWxzZSBpZiAodHlwZW9mIGZyb21baV0gIT09ICdmdW5jdGlvbicpIHRocm93IG5ldyBFcnJvcihcIkl0IG11c3QgdG8gYmUgYSBmdW5jdGlvbi5cIik7XHJcbiAgICBlbHNlIHRvW2ldID0gZGlmZihmcm9tW2ldLCB0b1tpXSk7XHJcbiAgfVxyXG4gIHJldHVybiB0bztcclxufVxyXG5cclxuY2xhc3MgRXhlY3V0ZXJDb250ZXh0IHtcclxuICBjb25zdHJ1Y3RvcihjbWRzLCBjb25uKSB7XHJcbiAgICB0aGlzLmNtZEhlYWQgPSBbJ2RhdGEnXS5jb25jYXQoY21kcyk7XHJcbiAgICB0aGlzLmNvbm4gPSBjb25uO1xyXG4gICAgdGhpcy51c2VySWQgPSBjb25uLnVzZXJJZDtcclxuICB9XHJcblxyXG4gIHNlbmQgPSAoLi4uYXJncykgPT4ge1xyXG4gICAgbGV0IGFyciA9IHRoaXMuY21kSGVhZC5jb25jYXQoYXJncyk7XHJcbiAgICB0aGlzLmNvbm4uX3NlbmRNZXNzYWdlKGFycik7XHJcbiAgfTtcclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgUGx1Z2luRGFzaGJvYXJkIHtcclxuICBjb25zdHJ1Y3Rvcihjb25uKSB7XHJcbiAgICB0aGlzLmNvbm5lY3Rpb24gPSBjb25uO1xyXG4gICAgdGhpcy5yZWdpc3Rlck9iamVjdCA9IHt9O1xyXG4gICAgdGhpcy5yZWNlaXZlT2JqZWN0ID0ge307XHJcbiAgICBjb25uLm9ubWVzc2FnZSA9IChkYXRhKSA9PiB0aGlzLl9yZWNlaXZlTWVzc2FnZVByZShkYXRhLmRhdGEpO1xyXG5cclxuICAgIHRoaXMudXNlcklkID0gbnVsbDtcclxuICAgIHRoaXMuYnVmZmVyID0gXCJcIjtcclxuICB9XHJcblxyXG4gIHJlZ2lzdGVyID0gKG9iaikgPT4ge1xyXG4gICAgUGx1Z2luRGFzaGJvYXJkLnJlZ2lzdGVyT2JqZWN0ID0gZGlmZihvYmosIHRoaXMucmVnaXN0ZXJPYmplY3QpO1xyXG4gIH1cclxuXHJcbiAgcmVjZWl2ZSA9IChvYmopID0+IHtcclxuICAgIGNvbnNvbGUubG9nKG9iaik7XHJcbiAgICBQbHVnaW5EYXNoYm9hcmQucmVjZWl2ZU9iamVjdCA9IGRpZmYob2JqLCB0aGlzLnJlY2VpdmVPYmplY3QpO1xyXG4gIH1cclxuXHJcbiAgc2VuZCA9ICguLi5hcmdzKSA9PiB7XHJcbiAgICB0aGlzLl9zZW5kTWVzc2FnZShhcmdzLnJlZHVjZSgocHJldiwgbmV4dCkgPT4ge1xyXG4gICAgICBpZiAodHlwZW9mIG5leHQgPT0gJ3N0cmluZycpIHByZXYuY29uY2F0KG5leHQudHJpbSgpLnNwbGl0KCcgJykpO1xyXG4gICAgICBlbHNlIGlmIChBcnJheS5pc0FycmF5KG5leHQpKSBwcmV2LmNvbmNhdChuZXh0KTtcclxuICAgICAgZWxzZSBpZiAodHlwZW9mIG5leHQgPT0gJ251bWJlcicgfHwgdHlwZW9mIG5leHQgPT0gJ2JpZ2ludCcpIHByZXYucHVzaChcIlwiICsgbmV4dCk7XHJcbiAgICAgIGVsc2UgaWYgKHR5cGVvZiBuZXh0ID09ICdib29sZWFuJykgcHJldi5wdXNoKG5leHQgPyAndHJ1ZScgOiAnZmFsc2UnKTtcclxuICAgICAgZWxzZSBpZiAodHlwZW9mIG5leHQgPT0gJ29iamVjdCcpIHByZXYucHVzaChKU09OLnN0cmluZ2lmeShuZXh0KSk7XHJcbiAgICAgIGVsc2UgdGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IHBhcnNlIHRoZSB0eXBlLlwiKTtcclxuICAgICAgcmV0dXJuIHByZXY7XHJcbiAgICB9KSwgWydleGVjdXRlJ10pO1xyXG4gIH1cclxuXHJcbiAgX3NlbmRNZXNzYWdlKGFyZ3MpIHtcclxuICAgIGNvbnNvbGUubG9nKFwiQ2xpZW50IHdpbGwgc2VuZDpcIiwgYXJncyk7XHJcbiAgICBsZXQgY21kID0gYXJncy5yZWR1Y2UoKHByZXYsIG5leHQpID0+IHByZXYgKyAnICcgKyBuZXh0KTtcclxuICAgIGxldCB0eXBlID0gL14oZXhlY3V0ZXxkYXRhKS4qJC8uZXhlYyhjbWQpWzFdO1xyXG5cclxuICAgIHN3aXRjaCAodHlwZSkge1xyXG4gICAgICBjYXNlICdleGVjdXRlJzpcclxuICAgICAgY2FzZSAnZGF0YSc6XHJcbiAgICAgICAgdGhpcy5jb25uZWN0aW9uLnNlbmQoY21kKTtcclxuICAgICAgICBicmVhaztcclxuICAgICAgZGVmYXVsdDpcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJJbGxlZ2FsIHR5cGUhXCIpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgX3JlY2VpdmVNZXNzYWdlUHJlID0gKHN0cikgPT4ge1xyXG4gICAgY29uc29sZS5sb2coXCJHZXQgdGhlIG1lc3NhZ2UgZnJvbSB0aGUgc2VydmVy77yaXCIsIHN0cik7XHJcbiAgICBcclxuICAgIC8vIEhlYXJ0IHBhY2thZ2UgY2hlY2suXHJcbiAgICBpZiAoc3RyWzBdID09ICdAJykgcmV0dXJuO1xyXG5cclxuICAgIHRoaXMuYnVmZmVyICs9IHN0ciArICdcXG4nO1xyXG4gICAgbGV0IGNtZHMgPSB0aGlzLmJ1ZmZlci5zcGxpdCgnXFxuJyk7XHJcbiAgICB0aGlzLmJ1ZmZlciA9IGNtZHMucG9wKCk7XHJcbiAgICBjb25zb2xlLmxvZyhcIlsgQlVGRkVSIF1cIiwgdGhpcy5idWZmZXIpO1xyXG4gICAgY29uc29sZS5sb2coXCJTdGFydCBydW5uaW5nIHRoZSBjb21tYW5kOlwiLCBjbWRzKTtcclxuICAgIGNtZHMuZm9yRWFjaChuID0+IHRoaXMuX3JlY2VpdmVNZXNzYWdlKG4pKTtcclxuICB9XHJcblxyXG4gIF9yZWNlaXZlTWVzc2FnZSA9IChjbWQpID0+IHtcclxuICAgIGNvbnNvbGUubG9nKGNtZCk7XHJcbiAgICBsZXQgYXJncyA9IGNtZC50cmltKCkuc3BsaXQoJyAnKTtcclxuICAgIGxldCB0eXBlID0gYXJncy5zaGlmdCgpO1xyXG5cclxuICAgIGxldCBmdW5jID0gdHlwZSA9PSAnZXhlY3V0ZScgPyB0aGlzLnJlZ2lzdGVyT2JqZWN0IDogdGhpcy5yZWNlaXZlT2JqZWN0O1xyXG4gICAgbGV0IGFyZyA9IGFyZ3Muc2hpZnQoKTtcclxuICAgIGxldCBjbWRzID0gW2FyZ107XHJcblxyXG4gICAgdHJ5IHtcclxuICAgICAgZm9yICg7IHR5cGVvZiBmdW5jW2FyZ10gPT0gJ29iamVjdCc7IGZ1bmMgPSBmdW5jW2FyZ10sIGFyZyA9IGFyZ3Muc2hpZnQoKSwgY21kcy5wdXNoKGFyZykpXHJcbiAgICAgICAgaWYgKGZ1bmMgPT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IEVycm9yKFwiVW5kZWZpbmVkIG9iamVjdCFcIik7XHJcblxyXG4gICAgICBpZiAodHlwZSA9PSAnZXhlY3V0ZScgJiYgZnVuY1thcmddID09PSB1bmRlZmluZWQpIHRocm93IG5ldyBFcnJvcihcIlVuZGVmaW5lZCBvYmplY3QhXCIpO1xyXG4gICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICB0aGlzLl9zZW5kTWVzc2FnZShbJ2RhdGEnLCAnc3lzdGVtJywgJ2ZhaWwnXSk7XHJcbiAgICB9XHJcbiAgICB0cnkge1xyXG4gICAgICAvLyBHZXQgdGhlIGZ1bmN0aW9uLlxyXG4gICAgICBsZXQgcmV0ID0gZnVuY1thcmddLmFwcGx5KG5ldyBFeGVjdXRlckNvbnRleHQoY21kcywgdGhpcyksIGFyZ3MpO1xyXG4gICAgICAvLyBJZiB0aGUgaGVhZCBpcyAnZXhlY3V0ZScsIGl0IG5lZWRzIGEgY2FsbCBiYWNrICdkYXRhJyBjb21tYW5kLlxyXG4gICAgICBpZiAodHlwZSA9PSAnZXhlY3V0ZScgJiYgcmV0ICE9IG51bGwpIHRoaXMuX3NlbmRNZXNzYWdlKFsnZGF0YSddLmNvbmNhdChjbWRzKS5jb25jYXQocmV0LnRyaW0oKS5zcGxpdCgnICcpKSk7XHJcbiAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgIGNvbnNvbGUubG9nKGUpO1xyXG4gICAgICBpZiAodHlwZSA9PSAnZXhlY3V0ZScpIHtcclxuICAgICAgICBsZXQgbiA9IFsnZGF0YSddLmNvbmNhdChjbWRzKTtcclxuICAgICAgICBuLnB1c2goXCJmYWlsXCIpO1xyXG4gICAgICAgIHRoaXMuX3NlbmRNZXNzYWdlKG4pO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG59XHJcblxyXG5cclxuXHJcbiIsImltcG9ydCBQbHVnaW5EYXNoYm9hcmQgZnJvbSBcIi4vcGx1Z2luRGFzaGJvYXJkXCI7XHJcbmltcG9ydCB7IEV2ZW50RW1pdHRlciB9IGZyb20gJ2V2ZW50cyc7XHJcblxyXG5sZXQgY2xpZW50ID0gbmV3IFdlYlNvY2tldChcIndzOi8vMTI3LjAuMC4xOjIzMzNcIik7XHJcblxyXG5sZXQgZGFzaGJvYXJkO1xyXG5cclxubGV0IGNvbm5lY3Rpb25FbWl0dGVyID0gbmV3IEV2ZW50RW1pdHRlcigpLnNldE1heExpc3RlbmVycygwKTtcclxubGV0IGRhc2hib2FyZEVtaXR0ZXIgPSBuZXcgRXZlbnRFbWl0dGVyKCkuc2V0TWF4TGlzdGVuZXJzKDApO1xyXG5cclxuY2xpZW50Lm9ub3BlbiA9ICgpID0+IHtcclxuICAgIEFjdGlvbnMudmlldy5zeXN0ZW0udG9nZ2xlTmV0d29ya1N0YXRlKFwic3VjY2Vzc1wiKTtcclxuICAgIGNsaWVudC5zZW5kKFwiZXhlY3V0ZSBzeXN0ZW0gcmVnaXN0ZXIgaDVcIik7XHJcbn07XHJcblxyXG5jbGllbnQub25tZXNzYWdlID0gKGRhdGEpID0+IHtcclxuICAgIGlmIChkYXRhLmRhdGEgPT0gXCJkYXRhIHN5c3RlbSByZWdpc3RlciBva1wiKSB7XHJcbiAgICAgICAgZGFzaGJvYXJkID0gbmV3IFBsdWdpbkRhc2hib2FyZChjbGllbnQpO1xyXG4gICAgICAgIGRhc2hib2FyZEVtaXR0ZXIub24oJ3NlbmQnLCAobXNnKSA9PiBkYXNoYm9hcmQuc2VuZChtc2cpKTtcclxuICAgICAgICBkYXNoYm9hcmRFbWl0dGVyLm9uKCdyZWdpc3RlcicsIChvYmopID0+IGRhc2hib2FyZC5yZWdpc3RlcihvYmopKTtcclxuICAgICAgICBkYXNoYm9hcmRFbWl0dGVyLm9uKCdyZWNlaXZlJywgKG9iaikgPT4gZGFzaGJvYXJkLnJlY2VpdmUob2JqKSk7XHJcbiAgICAgICAgY29ubmVjdGlvbkVtaXR0ZXIuZW1pdChcImxvYWRcIik7XHJcbiAgICB9XHJcbn07XHJcblxyXG5jbGllbnQub25lcnJvciA9IChlcnIpID0+IGNvbnNvbGUuZXJyb3IoZXJyKTtcclxuXHJcbmV4cG9ydCBsZXQgc2VuZCA9ICguLi5kYXRhKSA9PiB7XHJcbiAgICBpZihkYXNoYm9hcmQpIGRhc2hib2FyZEVtaXR0ZXIuZW1pdCgnc2VuZCcsIGRhdGEpO1xyXG4gICAgZWxzZSBjb25uZWN0aW9uRW1pdHRlci5vbigncmVhZHknLCAoKSA9PiBkYXNoYm9hcmRFbWl0dGVyLmVtaXQoJ3NlbmQnLCBkYXRhKSk7XHJcbn07XHJcblxyXG5leHBvcnQgbGV0IHJlZ2lzdGVyID0gKG9iaikgPT4ge1xyXG4gICAgaWYoZGFzaGJvYXJkKSBkYXNoYm9hcmRFbWl0dGVyLmVtaXQoJ3JlZ2lzdGVyJywgb2JqKTtcclxuICAgIGVsc2UgY29ubmVjdGlvbkVtaXR0ZXIub24oJ3JlYWR5JywgKCkgPT4gZGFzaGJvYXJkRW1pdHRlci5lbWl0KCdyZWdpc3RlcicsIG9iaikpO1xyXG59O1xyXG5cclxuZXhwb3J0IGxldCByZWNlaXZlID0gKG9iaikgPT4ge1xyXG4gICAgaWYoZGFzaGJvYXJkKSBkYXNoYm9hcmRFbWl0dGVyLmVtaXQoJ3JlY2VpdmUnLCBvYmopO1xyXG4gICAgZWxzZSBjb25uZWN0aW9uRW1pdHRlci5vbigncmVhZHknLCAoKSA9PiBkYXNoYm9hcmRFbWl0dGVyLmVtaXQoJ3JlY2VpdmUnLCBvYmopKTtcclxufTtcclxuXHJcbmV4cG9ydCBsZXQgY29ubmVjdGlvbkV2ZW50cyA9IGNvbm5lY3Rpb25FbWl0dGVyOyJdfQ==
