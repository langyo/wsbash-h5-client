import { send, register, receive, connectionEvents } from "./webSocketClient";

connectionEvents.on("load", () => {
  receive({
  });

  connectionEvents.emit('ready');
});

export default {
  send: send,
  register: register,
  receive: receive
};