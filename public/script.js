const socket = io();

let username;
while (!username) {
    username = prompt("Введите ваш ник:");
    if (!username) alert("❗ Ник обязателен!");
}


if (username === "Narek") {
    let password = prompt("Введите пароль:");
    if (password !== "Nelli2015$") {
        alert("❌ Неверный пароль! Вход как гость.");
        username = "Гость";
    } else {
        document.getElementById("adminControls").style.display = "flex";
    }
}

socket.emit("setUsername", username);

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

function unbanUser() {
    const userToUnban = prompt("Введите ник для разбана:");
    if (userToUnban) socket.emit("unbanUser", userToUnban);
}

socket.on("chatMessage", (data) => {
    const messages = document.getElementById("messages");
    const messageElement = document.createElement("div");
    messageElement.classList.add("message");
    messageElement.innerHTML = `<strong>${data.username}:</strong> ${data.message}`;
    messages.appendChild(messageElement);
});


socket.on("clearChat", (admin) => {
    document.getElementById("messages").innerHTML = "";
    addSystemMessage(`🧹 Чат был очищен администратором ${admin}`);
});

socket.on("banned", () => {
    localStorage.setItem("banned", "true");
    document.body.innerHTML = `<h2 style="color: red; text-align: center;">🚫 Вы забанены в чате</h2>`;
});

socket.on("kicked", () => {
    localStorage.setItem("kicked", "true");
    alert("🚪 Вас кикнули из чата!");
    location.reload();
});


socket.on("userKicked", (data) => {
    addSystemMessage(`🚪 Пользователь ${data.userToKick} был кикнут админом ${data.admin}`);
});

socket.on("userBanned", (data) => {
    addSystemMessage(`⛔ Пользователь ${data.userToBan} был забанен админом ${data.admin}`);
});

function addSystemMessage(message) {
    const messages = document.getElementById("messages");
    const messageElement = document.createElement("div");
    messageElement.innerHTML = `<i>${message}</i>`;
    messages.appendChild(messageElement);
}
function generateInviteLink() {
    const inviteLink = window.location.href;
    navigator.clipboard.writeText(inviteLink).then(() => {
        alert("🔗 Ссылка на чат скопирована! Отправьте её друзьям.");
    }).catch(err => {
        console.error("Ошибка при копировании: ", err);
    });
}
// Отправка события при вводе текста
document.getElementById("messageInput").addEventListener("input", () => {
    socket.emit("typing", username);
});

// Убираем "печатает..." после паузы (например, 3 сек)
let typingTimeout;
document.getElementById("messageInput").addEventListener("keyup", () => {
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
        socket.emit("stopTyping");
    }, 3000);
});

socket.on("displayTyping", (username) => {
    let typingIndicator = document.getElementById("typingIndicator");

    if (typingIndicator) {
        typingIndicator.remove(); // Удаляем старый индикатор, если есть
    }

    typingIndicator = document.createElement("div");
    typingIndicator.id = "typingIndicator";
    typingIndicator.style.fontStyle = "italic";
    typingIndicator.style.opacity = "0.7";
    typingIndicator.style.marginTop = "5px";
    typingIndicator.textContent = `${username} печатает...`;

    document.getElementById("messages").appendChild(typingIndicator);
});

// Скрываем индикатор после паузы
socket.on("hideTyping", () => {
    const typingElement = document.getElementById("typingIndicator");
    if (typingElement) typingElement.remove();
});
