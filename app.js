const Koa = require('koa');

const bodyParser = require('koa-bodyparser');

const controller = require('./controller');

const rest = require('./rest');

const uuidv1 = require("uuid/v1");

const model  =require("./models");
const usereModel = model.user;

const ws = require('ws');
const WebSocketServer = ws.Server;

const app = new Koa();

// log request URL:
app.use(async (ctx, next) => {
    console.log(`Process ${ctx.request.method} ${ctx.request.url}...`);
    await next();
});

// parse request body:
app.use(bodyParser());

app.use(rest.restify());

// add controller:
app.use(controller());

var server = app.listen(30000);

function parseUser(obj) {
    let data ;
    console.log(obj.data);
    if (obj.data) {
        data = JSON.parse(obj.data);
        return data;
    }
    else{
        console.log("webSocketConnect without info");
        return;
    }
}

function createWebSocketServer(server, onConnection, onMessage, onClose, onError) {
    let wss = new WebSocketServer({
        server: server
    });
    wss.broadcast = function broadcast(type, from, msg, fromUuid) {
        from.isSelf = false;
        let messageNotSelf = createMessage("chat", from, msg);
        console.log(messageNotSelf);
        from.isSelf = true;
        let messageSelf = createMessage("chat", from, msg);
        console.log(messageSelf);
        wss.clients.forEach(function each(client) {
            if(client.userData.chatRooms.indexOf(from.chatRoomId) != -1){
                if(fromUuid===client.userData.uuid) {
                    client.send(messageSelf);
                }else {
                    client.send(messageNotSelf);
                }
            }
        });
    };
    onConnection = onConnection || function () {
        console.log('[WebSocket] connected.');
    };
    onMessage = onMessage || function (msg) {
        console.log('[WebSocket] message received: ' + msg);
    };
    onClose = onClose || function (code, message) {
        console.log(`[WebSocket] closed: ${code} - ${message}`);
    };
    onError = onError || function (err) {
        console.log('[WebSocket] error: ' + err);
    };
    wss.on('connection', function (ws, request) {
        console.log('[WebSocketServer] connection: ' + request.url);
        ws.on('message', onMessage);
        ws.on('close', onClose);
        ws.on('error', onError);
        // check user:
        let data = parseUser(request.headers);
        if (!data) {
            ws.close(4001, 'Invalid data');
        }
        ws.userData = data;
        ws.wss = wss;
        onConnection.apply(ws);
    });
    console.log('WebSocketServer was attached.');
    return wss;
}

function createMessage(type, from, msg) {
    return JSON.stringify({
        id: uuidv1(),
        type: type,
        from: from,
        msg: msg
    });
}

function onConnect() {
    // this.wss.broadcast("join", this.data.chatRoomId,"joined");
}

async function onMessage(data) {
    let recData = JSON.parse(data);
    console.log(recData);
    var userEntity = await usereModel.findByUuid(recData.uuid);
    console.log(userEntity);
    var from = {
        nickName:userEntity.nickName,
        avatarUrl:userEntity.avatarUrl,
        chatRoomId:recData.chatRoomId,
    };
    if (recData.message && recData.message.trim()) {
        this.wss.broadcast("chat", from, recData.message, recData.uuid);
    }
}

function onClose() {
    console.log(this.userData.uuid + "closed webSocket");
}

app.wss = createWebSocketServer(server, onConnect, onMessage, onClose);

console.log('app started at port 3000...');