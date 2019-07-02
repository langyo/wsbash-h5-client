import PluginDashboard from "./pluginDashboard";
import { EventEmitter } from 'events';

let client = new WebSocket("ws://127.0.0.1:2333");

let dashboard;

let connectionEmitter = new EventEmitter().setMaxListeners(0);
let dashboardEmitter = new EventEmitter().setMaxListeners(0);

client.onopen = () => {
    Actions.view.system.toggleNetworkState("success");
    client.send("execute system register h5");
};

client.onmessage = (data) => {
    if (data.data == "data system register ok") {
        dashboard = new PluginDashboard(client);
        dashboardEmitter.on('send', (msg) => dashboard.send(msg));
        dashboardEmitter.on('register', (obj) => dashboard.register(obj));
        dashboardEmitter.on('receive', (obj) => dashboard.receive(obj));
        connectionEmitter.emit("load");
    }
};

client.onerror = (err) => console.error(err);

export let send = (...data) => {
    if(dashboard) dashboardEmitter.emit('send', data);
    else connectionEmitter.on('ready', () => dashboardEmitter.emit('send', data));
};

export let register = (obj) => {
    if(dashboard) dashboardEmitter.emit('register', obj);
    else connectionEmitter.on('ready', () => dashboardEmitter.emit('register', obj));
};

export let receive = (obj) => {
    if(dashboard) dashboardEmitter.emit('receive', obj);
    else connectionEmitter.on('ready', () => dashboardEmitter.emit('receive', obj));
};

export let connectionEvents = connectionEmitter;