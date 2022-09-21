const express = require("express");
const app = express();
const { createServer } = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

app.use(cors());

const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "http://localhost:8080",
    },
});

var numClients = {};
var clients = {};
var rooms = {};

io.on("connection", async (socket) => {
    console.log(socket.id, "connected");
    socket.on("room_join", (roomId, username) => {
        if (numClients[roomId] == undefined || numClients[roomId] == 0) {
            numClients[roomId] = 1;
            clients[socket.id] = {
                id: socket.id,
                username: username,
                taps: 0,
                ropPos: null,
                roomId: roomId,
                rematch: false,
            };
            rooms[roomId] = {
                timerId: null,
                fetchTimer: null,
            };
            socket.join(roomId);
            console.log(`${socket.id} created room ${roomId}`);
            io.to(roomId).emit(
                "status",
                `${username} has created the room`,
                "green"
            );
            io.to(roomId).emit("status", `waiting for opponent`, "green");
        } else if (numClients[roomId] < 2) {
            numClients[roomId]++;
            socket.join(roomId);
            clients[socket.id] = {
                id: socket.id,
                username: username,
                taps: 0,
                ropPos: null,
                roomId: roomId,
                rematch: false,
            };
            console.log(`${socket.id} joined room ${roomId}`);
            let timer = 5;
            console.log("starting Game");
            io.to(roomId).emit(
                "status",
                `${username} has joined the room`,
                "green"
            );
            io.to(roomId).emit("timer", "The Game Will Start Soon");
            rooms[roomId].timerId = setInterval(() => {
                io.to(roomId).emit("timer", timer);
                if (timer <= 0) {
                    clearInterval(rooms[roomId].timerId);
                    io.to(roomId).emit("game-start");
                    rooms[roomId].fetchTimer = setInterval(() => {
                        io.to(roomId).emit("fetchTap");
                    }, 1000);
                }
                timer--;
            }, 1000);
        } else {
            socket.emit(
                "server-full",
                "There are already 2 players in this room"
            );
        }
    });

    socket.on("sendTap", (cl) => {
        clients[cl.id].taps = cl.taps;
        clients[cl.id].ropPos = cl.ropPos;
        const roomClients = io.sockets.adapter.rooms.get(cl.roomId);
        let cls = [];

        cls[0] = clients[[...roomClients][0]];
        cls[1] = clients[[...roomClients][1]];

        let diff = cls[0].taps - cls[1].taps;

        io.to(cls[0].id).emit("update-rope", cls[0].ropPos - diff);
        io.to(cls[1].id).emit("update-rope", cls[1].ropPos + diff);
        if (cls[0].ropPos < -48 && cls[1].ropPos > 36) {
            delete numClients[cls[0].roomId];
            io.to(cls[0].id).emit(
                "winlose",
                "win",
                cls[0].username,
                cls[1].username
            );
            io.to(cls[1].id).emit(
                "winlose",
                "lose",
                cls[1].username,
                cls[0].username
            );
            clearInterval(rooms[cls[0].roomId].timerId);
            clearInterval(rooms[cls[0].roomId].fetchTimer);
        }
        if (cls[1].ropPos < -48 && cls[0].ropPos > 36) {
            delete numClients[cls[0].roomId];
            io.to(cls[0].id).emit(
                "winlose",
                "lose",
                cls[0].username,
                cls[1].username
            );
            io.to(cls[1].id).emit(
                "winlose",
                "win",
                cls[1].username,
                cls[0].username
            );
            clearInterval(rooms[cls[0].roomId].timerId);
            clearInterval(rooms[cls[0].roomId].fetchTimer);
        }
    });
    socket.on("exit", () => {
        io.to(clients[socket.id].roomId).emit(
            "status",
            `${clients[socket.id].username} left the room`,
            "red"
        );
        io.to(clients[socket.id].roomId).emit(
            "status",
            `Clearing Room!!`,
            "red"
        );
        setTimeout(() => {
            io.to(clients[socket.id].roomId).emit("clear-room");
            io.socketsLeave(clients[socket.id].roomId);
        }, 3000);
    });
    socket.on("rematch", () => {
        clients[socket.id].rematch = true;
        io.to(clients[socket.id].roomId).emit(
            "status",
            `${clients[socket.id].username} wants a rematch!`,
            "green"
        );
        const roomClients = io.sockets.adapter.rooms.get(
            clients[socket.id].roomId
        );
        // result
        let cls = [];

        cls[0] = clients[[...roomClients][0]];
        cls[1] = clients[[...roomClients][1]];

        if ((cls[0].rematch && cls[1].rematch) == true) {
            cls[0].rematch = false;
            cls[1].rematch = false;
            io.to(clients[socket.id].roomId).emit(
                "status",
                `Starting Rematch`,
                "green"
            );
            io.to(clients[socket.id].roomId).emit("start-rematch");
            timer = 5;
            io.to(clients[socket.id].roomId).emit(
                "timer",
                "The Game Will Start Soon"
            );
            rooms[clients[socket.id].roomId].timerId = setInterval(() => {
                io.to(clients[socket.id].roomId).emit("timer", timer);
                if (timer <= 0) {
                    clearInterval(rooms[clients[socket.id].roomId].timerId);
                    io.to(clients[socket.id].roomId).emit("game-start");
                    rooms[clients[socket.id].roomId].fetchTimer = setInterval(
                        () => {
                            io.to(clients[socket.id].roomId).emit("fetchTap");
                        },
                        1000
                    );
                }
                timer--;
            }, 1000);
        } else {
            io.to(clients[socket.id].roomId).emit(
                "status",
                `waiting for opponent`,
                "green"
            );
        }
    });
    socket.on("disconnect", (reason) => {
        if (clients[socket.id] != undefined) {
            io.to(clients[socket.id].roomId).emit(
                "player-leave",
                socket.id,
                reason
            );
            io.to(clients[socket.id].roomId).emit(
                "status",
                `${clients[socket.id].username} has left the game`,
                "red"
            );
            io.to(clients[socket.id].roomId).emit(
                "status",
                `waiting for new player`,
                "yellow"
            );
            numClients[clients[socket.id].roomId]--;
            clearInterval(rooms[clients[socket.id].roomId].timerId);
            clearInterval(rooms[clients[socket.id].roomId].fetchTimer);
            delete clients[socket.id];
        }
    });
});

httpServer.listen(3000, () => {
    console.log("Server is Running");
});
