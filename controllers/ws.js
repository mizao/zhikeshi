
// 导入WebSocket模块:
const WebSocket = require('ws');

// 引用Server类:
const WebSocketServer = WebSocket.Server;

// 实例化:
const wss = new WebSocketServer({
    port: 3000
});

wss.on('connection', function (ws, request) {
    console.log(request.headers);
    console.log(`[SERVER] connection()`);
    ws.x = "wewewewewewe";
    ws.on('message', function (message) {
        console.log(`[SERVER] Received: ${message}`);
        wss.clients.forEach(function each(client) {
            console.log(client.x);
        });
        ws.send(`ECHO: ${message}`, (err) => {
            if (err) {
                console.log(`[SERVER] error: ${err}`);
            }
        });
    })
});