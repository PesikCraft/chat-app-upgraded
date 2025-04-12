const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const path = require("path");
const useragent = require("useragent");
const os = require("os");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static(path.join(__dirname, "public")));

const users = {};
const bannedUsers = new Set();




io.on("connection", (socket) => {

    let currentUser;

    socket.on('setUsername', (username) => {
        currentUser = username;
        users[socket.id] = username;
        io.emit('onlineUsers', Object.values(users));
    });

    socket.on('disconnect', () => {
        delete users[socket.id];
        io.emit('onlineUsers', Object.values(users));
    });


    socket.on("setUsername", (username) => {
        socket.username = username;
        onlineUsers[socket.id] = username;

        // Отправить всем обновлённый список юзеров
        io.emit("onlineUsers", Object.values(onlineUsers));
    });

    socket.on("disconnect", () => {
        delete onlineUsers[socket.id];
        io.emit("onlineUsers", Object.values(onlineUsers));
    });

    // Получение информации об устройстве
    const agent = useragent.parse(socket.handshake.headers["user-agent"]);
    const deviceInfo = `${agent.family} ${agent.major} (OS: ${os.type()} ${os.release()})`;

    // Получение IP-адреса
    let userIP = socket.handshake.address;
    if (userIP === "::1" || userIP === "127.0.0.1") {
        userIP = "Локальный IP (Тест)";
    } else {
        userIP = socket.request.connection.remoteAddress;
    }

    socket.on('onlineUsers', (users) => {
    io.emit('onlineUsers', onlineUsersArray);

    updateOnlineUsers(users);
});


    socket.on("setUsername", (username) => {
        if (bannedUsers.has(username)) {
            socket.emit("banned");
            return;
        }

        console.log(`📌 Новый пользователь: ${username}`);
        console.log(`📱 Устройство: ${deviceInfo}`);
        console.log(`🌍 IP-адрес: ${userIP}`);

        users[socket.id] = username;
        io.emit("chatMessage", { username: "Система", message: `👤 ${username} присоединился к чату` });
        io.emit("updateUserList", Object.values(users));
    });

    // Обработчик сообщений
    socket.on("chatMessage", (data) => {
        io.emit("chatMessage", data);
    });

    // Очистка чата
    socket.on("clearChat", (admin) => {
        io.emit("clearChat", admin);
    });

    // Кик пользователя
    socket.on("kickUser", (data) => {
        const { userToKick, admin } = data;
        const kickedSocketId = Object.keys(users).find((id) => users[id] === userToKick);
        if (kickedSocketId) {
            io.to(kickedSocketId).emit("kicked");
            io.emit("chatMessage", { username: "Система", message: `🚪 ${userToKick} был кикнут администратором ${admin}` });
            io.sockets.sockets.get(kickedSocketId).disconnect();
        }
    });

    // Бан пользователя
    socket.on("banUser", (data) => {
        const { userToBan, admin } = data;
        bannedUsers.add(userToBan);
        const bannedSocketId = Object.keys(users).find((id) => users[id] === userToBan);
        if (bannedSocketId) {
            io.to(bannedSocketId).emit("banned");
            io.emit("chatMessage", { username: "Система", message: `⛔ ${userToBan} был забанен администратором ${admin}` });
            io.sockets.sockets.get(bannedSocketId).disconnect();
        }
    });

    // Разбан пользователя
    socket.on("unbanUser", (userToUnban) => {
        bannedUsers.delete(userToUnban);
        io.emit("chatMessage", { username: "Система", message: `🔓 ${userToUnban} был разбанен` });
    });

    // Обработка ввода (кто печатает)
    socket.on("typing", (username) => {
        socket.broadcast.emit("displayTyping", username);
    });

    socket.on("stopTyping", () => {
        socket.broadcast.emit("hideTyping");
    });

    // Отключение пользователя
    socket.on("disconnect", () => {
        if (users[socket.id]) {
            io.emit("chatMessage", { username: "Система", message: `🚪 ${users[socket.id]} покинул чат` });
            delete users[socket.id]; // СНАЧАЛА удалить
            io.emit("updateUserList", Object.values(users)); // ПОТОМ обновить список
        }
    });
});

server.listen(3000, () => {
    console.log("🚀 Сервер запущен на порту 3000");
});
let onlineUsers = {};
