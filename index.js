import { send, register, receive, connectionEvents } from "./socketMessageManager/webSocketClient";

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