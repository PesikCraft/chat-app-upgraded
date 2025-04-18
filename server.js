const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const session = require("express-session");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const users = {};
const banned = new Set();

app.use(express.static("public"));
app.use(express.json());

app.use(session({
  secret: "secret",
  resave: false,
  saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());

// ТВОЙ ОАКЛИЕНТ
passport.use(new GoogleStrategy({
  clientID: "499495050077-81cjnge0tqljl17g9ngmeqse1hg7im4k.apps.googleusercontent.com",
  clientSecret: "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",
  callbackURL: process.env.GOOGLE_CALLBACK_URL || "https://chat-app-upgraded.onrender.com/auth/google/callback"
}, (accessToken, refreshToken, profile, done) => {
  done(null, profile);
}));


passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

// Роуты Google OAuth
app.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));
app.get("/auth/google/callback", passport.authenticate("google", { failureRedirect: "/" }), (req, res) => {
  res.redirect("/?googleLogin=true");
});





app.get("/logout", (req, res) => {
  req.logout(() => {
    res.redirect("/");
  });
});

app.get("/user-info", (req, res) => {
  if (req.isAuthenticated()) {
    res.json({
      nickname: req.user.displayName,
      isAdmin: req.user.emails[0].value === "persikkopa0@gmail.com"
    });
  } else {
    res.json(null);
  }
});

// Главная страница
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Socket.io
io.on("connection", (socket) => {
  let nickname = null;

  socket.on("kickUser", (data) => {
  for (let [id, user] of Object.entries(users)) {
    if (user.name === data.userToKick) {
      io.to(id).emit("kicked");
      io.emit("chatMessage", { username: "Система", message: `${data.userToKick} был кикнут админом ${data.admin}` });
      delete users[id];
      break;
    }
  }
  io.emit("onlineUsers", Object.values(users).map(u => u.name));
});

socket.on("banUser", (data) => {
  for (let [id, user] of Object.entries(users)) {
    if (user.name === data.userToBan) {
      banned.add(user.name);
      io.to(id).emit("banned");
      io.emit("chatMessage", { username: "Система", message: `${data.userToBan} был забанен админом ${data.admin}` });
      delete users[id];
      break;
    }
  }
  io.emit("onlineUsers", Object.values(users).map(u => u.name));
});



socket.on("unbanUser", (username) => {
    banned.delete(username);
    io.emit("chatMessage", {
        username: "Система",
        message: `${username} был разбанен`
    });
});


  socket.on("setUsername", (name) => {
    nickname = name;
    users[socket.id] = { name: nickname };
    io.emit("chatMessage", { username: "Система", message: `${nickname} подключился к чату` });
    io.emit("onlineUsers", Object.values(users).map(u => u.name));
  });

  socket.on("chatMessage", (data) => {
    if (!banned.has(data.username)) {
      io.emit("chatMessage", { username: data.username, message: data.message });
    }
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
