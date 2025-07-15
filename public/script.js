@@ -15,52 +15,57 @@ fetch("/user-info")
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

    document.getElementById("darkModeToggle").addEventListener("click", () => {
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
