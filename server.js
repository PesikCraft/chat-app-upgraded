@@ -119,73 +119,44 @@ socket.on("unbanUser", (username) => {

  socket.on("chatMessage", (data) => {
    if (!banned.has(data.username)) {
      const msg = {
        id: Date.now() + Math.random().toString(36).substr(2,5),
        username: data.username,
        message: data.message,
        time: new Date().toLocaleTimeString()
      };
      io.emit("chatMessage", msg);
    }
  });

  socket.on("deleteMessage", (id) => {
    io.emit("deleteMessage", id);
  });

  socket.on("typing", (name) => {
    socket.broadcast.emit("displayTyping", name);
  });

  socket.on("stopTyping", () => {
    socket.broadcast.emit("hideTyping");
  });

  socket.on("kickUser", (data) => {
    for (let [id, user] of Object.entries(users)) {
      if (user.name === data.user) {
        io.to(id).emit("kicked");
        io.emit("chatMessage", { username: "Система", message: `${data.user} был кикнут` });
        delete users[id];
        break;
      }
    }
    io.emit("onlineUsers", Object.values(users).map(u => u.name));
  });

  socket.on("banUser", (data) => {
    for (let [id, user] of Object.entries(users)) {
      if (user.name === data.user) {
        banned.add(user.name);
        io.to(id).emit("banned");
        io.emit("chatMessage", { username: "Система", message: `${data.user} был забанен` });
        delete users[id];
        break;
      }
    }
    io.emit("onlineUsers", Object.values(users).map(u => u.name));
  });

  socket.on("unbanUser", (data) => {
    banned.delete(data.user);
    io.emit("chatMessage", { username: "Система", message: `${data.user} был разбанен` });
  });

  socket.on("clearChat", (admin) => {
    io.emit("clearChat", admin);
  });

  socket.on("disconnect", () => {
    if (users[socket.id]) {
      io.emit("chatMessage", { username: "Система", message: `${users[socket.id].name} покинул чат` });
      delete users[socket.id];
      io.emit("onlineUsers", Object.values(users).map(u => u.name));
    }
  });
});



server.listen(3000, () => {
  console.log("🚀 Сервер запущен на порту 3000");
});
