const socket = io();
let username = "";
let isAdmin = false;

// Получаем данные пользователя
fetch("/user-info")
  .then(res => res.json())
  .then(data => {
    if (data && data.nickname) {
      username = data.nickname;
      isAdmin = data.isAdmin;
      initChat();
    } else {
      document.getElementById("authOverlay").style.display = "flex";
    }
  });

// Вход по нику
document.getElementById("nicknameLoginBtn").addEventListener("click", () => {
    const input = document.getElementById("nicknameInput").value.trim();
    if (!input) {
        alert("❗ Введите ник!");
        return;
    }
    username = input;
    document.getElementById("authOverlay").style.display = "none";
    initChat();
});

// Запускаем чат
function initChat() {
    document.getElementById("authOverlay").style.display = "none";

    if (isAdmin) {
        document.getElementById("adminControls").style.display = "flex";
    }

    socket.emit("setUsername", username);

    const darkToggle = document.getElementById("darkModeToggle");
    if (localStorage.getItem("dark-mode") === "true") {
        document.body.classList.add("dark-mode");
    }
    darkToggle.addEventListener("click", () => {
        document.body.classList.toggle("dark-mode");
        localStorage.setItem("dark-mode", document.body.classList.contains("dark-mode"));
    });

    document.getElementById("searchInput").addEventListener("input", () => {
        const query = document.getElementById("searchInput").value.toLowerCase();
        document.querySelectorAll("#messages .message").forEach(msg => {
            msg.style.display = msg.textContent.toLowerCase().includes(query) ? "" : "none";
        });
    });

    document.getElementById("messageForm").addEventListener("submit", (e) => {
        e.preventDefault();
        const message = document.getElementById("messageInput").value.trim();
        if (message !== "") {
            socket.emit("chatMessage", { username, message });
            document.getElementById("messageInput").value = "";
        }
    });

    document.getElementById("inviteButton").addEventListener("click", () => {
        const inviteLink = `${window.location.origin}`;
        navigator.clipboard.writeText(inviteLink).then(() => {
            alert("📩 Ссылка на чат скопирована! Отправьте её друзьям.");
        });
    });

    const burgerButton = document.getElementById('burgerButton');
    const onlinePanel = document.getElementById('onlinePanel');
    if (burgerButton && onlinePanel) {
        burgerButton.addEventListener('click', () => {
            onlinePanel.classList.toggle('active');
        });
    }

    document.getElementById("messageInput").addEventListener("input", () => {
        socket.emit("typing", username);
    });

    let typingTimeout;
    document.getElementById("messageInput").addEventListener("keyup", () => {
        clearTimeout(typingTimeout);
        typingTimeout = setTimeout(() => {
            socket.emit("stopTyping");
        }, 3000);
    });
}

// === Сокет события ===
socket.on('onlineUsers', (users) => {
    const list = document.getElementById('onlineUsersList');
    list.innerHTML = '';
    users.forEach(user => {
        const li = document.createElement('li');
        li.textContent = user;
        list.appendChild(li);
    });
});

socket.on("chatMessage", (data) => {
    const messages = document.getElementById("messages");
    const messageElement = document.createElement("div");
    messageElement.classList.add("message");
    messageElement.dataset.id = data.id;
    messageElement.innerHTML = `<strong>${data.username}</strong> <span class="time">${data.time}</span>: ${data.message}`;
    if (data.username === username || isAdmin) {
        const delBtn = document.createElement("button");
        delBtn.textContent = "✖";
        delBtn.classList.add("delete-btn");
        delBtn.onclick = () => socket.emit("deleteMessage", data.id);
        messageElement.appendChild(delBtn);
    }
    messages.appendChild(messageElement);
});

socket.on("deleteMessage", (id) => {
    const el = document.querySelector(`.message[data-id='${id}']`);
    if (el) el.remove();
});

socket.on("clearChat", (admin) => {
    document.getElementById("messages").innerHTML = "";
    addSystemMessage(`🧹 Чат был очищен администратором ${admin}`);
});

socket.on("banned", () => {
    document.body.innerHTML = `<h2 style="color: red; text-align: center;">🚫 Вы забанены в чате</h2>`;
});

socket.on("kicked", () => {
    alert("🚪 Вас кикнули из чата!");
    location.reload();
});

socket.on("userKicked", (data) => {
    addSystemMessage(`🚪 Пользователь ${data.userToKick} был кикнут админом ${data.admin}`);
});

socket.on("userBanned", (data) => {
    addSystemMessage(`⛔ Пользователь ${data.userToBan} был забанен админом ${data.admin}`);
});

socket.on("displayTyping", (username) => {
    let typingIndicator = document.getElementById("typingIndicator");
    if (typingIndicator) typingIndicator.remove();
    typingIndicator = document.createElement("div");
    typingIndicator.id = "typingIndicator";
    typingIndicator.style.fontStyle = "italic";
    typingIndicator.style.opacity = "0.7";
    typingIndicator.style.marginTop = "5px";
    typingIndicator.textContent = `${username} печатает...`;
    document.getElementById("messages").appendChild(typingIndicator);
});

socket.on("hideTyping", () => {
    const typingElement = document.getElementById("typingIndicator");
    if (typingElement) typingElement.remove();
});

// === Админ-функции ===
function clearChat() {
    socket.emit("clearChat", username);
}

function kickUser() {
    const userToKick = prompt("Введите ник для кика:");
    if (userToKick) socket.emit("kickUser", { userToKick, admin: username });
}

function banUser() {
    const userToBan = prompt("Введите ник для бана:");
    if (userToBan) socket.emit("banUser", { userToBan, admin: username });
}



function addSystemMessage(message) {
    const messages = document.getElementById("messages");
    const messageElement = document.createElement("div");
    messageElement.innerHTML = `<i>${message}</i>`;
    messages.appendChild(messageElement);
}

function unbanUser() {
    const userToUnban = prompt("Введите ник для разбана:");
    if (userToUnban) socket.emit("unbanUser", userToUnban); // просто строка
}
