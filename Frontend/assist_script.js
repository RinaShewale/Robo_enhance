// ===== TTS + VOICE + MESSAGES (FULL SECURE VERSION) =====

const API_BASE = "https://robo-enhance.onrender.com";

let voices = [];
let selectedLang = "en-US";
let selectedGender = "female";
let userId = null;

// ========================
// 🔐 AUTH HELPERS
// ========================
function getToken() {
    return localStorage.getItem("token");
}

function requireLogin() {
    const token = getToken();

    if (!token || token === "null") {
        window.location.href = "login.html";
        throw new Error("No token");
    }

    return token;
}

// decode JWT (simple payload extract)
function parseUserFromToken(token) {
    try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        return payload.user_id || payload.id;
    } catch (e) {
        return null;
    }
}

// ========================
// 🚀 INIT
// ========================
document.addEventListener("DOMContentLoaded", () => {
    const token = getToken();

    if (!token) {
        alert("⚠️ Please login first!");
        window.location.href = "login.html";
        return;
    }

    userId = parseUserFromToken(token);

    loadVoices();
    loadMessages();
});

// ========================
// 🎤 LOAD VOICES
// ========================
function loadVoices() {
    voices = speechSynthesis.getVoices();
}
speechSynthesis.onvoiceschanged = loadVoices;
loadVoices();

// ========================
// 🎯 DOM ELEMENTS
// ========================
const overlay = document.getElementById("overlay");
const voicePopup = document.createElement("div");
voicePopup.id = "voicePopup";
document.body.appendChild(voicePopup);

voicePopup.innerHTML = `
<h3>Select Language</h3>
<div class="option-group">
    <button onclick="setLang('en-US')">English</button>
    <button onclick="setLang('hi-IN')">Hindi</button>
    <button onclick="setLang('mr-IN')">Marathi</button>
</div>

<h3>Select Voice</h3>
<div class="option-group">
    <button onclick="setGender('male')">👨 Male</button>
    <button onclick="setGender('female')">👩 Female</button>
</div>

<div class="option-group">
    <button onclick="closePopup()">Apply</button>
</div>
`;

// ========================
// 🎯 DOUBLE TAP MIC
// ========================
let clickTimer = null;

function micAction() {
    if (clickTimer !== null) {
        clearTimeout(clickTimer);
        clickTimer = null;
        showVoicePopup();
        return;
    }

    clickTimer = setTimeout(() => {
        speakAndSave();
        clickTimer = null;
    }, 300);
}

// ========================
// 🎛️ POPUP CONTROL
// ========================
function showVoicePopup() {
    voicePopup.style.display = "flex";
    overlay.style.display = "block";
    document.querySelector(".main-content").style.filter = "blur(5px)";
}

function closePopup() {
    voicePopup.style.display = "none";
    overlay.style.display = "none";
    document.querySelector(".main-content").style.filter = "none";
}

function setLang(lang) {
    selectedLang = lang;
    notify("Language: " + lang);
}

function setGender(g) {
    selectedGender = g;
    notify("Voice: " + g);
}

// ========================
// 🔔 NOTIFICATION
// ========================
function notify(msg) {
    const n = document.createElement("div");
    n.className = "notification";
    n.innerText = msg;
    document.body.appendChild(n);

    setTimeout(() => (n.style.opacity = "1"), 100);
    setTimeout(() => {
        n.style.opacity = "0";
        setTimeout(() => n.remove(), 300);
    }, 2000);
}

// ========================
// 💾 SAVE LOCAL STATS
// ========================
function saveVoiceMessage(text) {
    const arr = JSON.parse(localStorage.getItem("voiceMessages")) || [];
    arr.push(text);
    localStorage.setItem("voiceMessages", JSON.stringify(arr));
}

function saveLanguage(lang) {
    const arr = JSON.parse(localStorage.getItem("languagesUsed")) || [];
    if (!arr.includes(lang)) {
        arr.push(lang);
        localStorage.setItem("languagesUsed", JSON.stringify(arr));
    }
}

// ========================
// 📩 LOAD MESSAGES (SECURE)
// ========================
const messagesContainer = document.getElementById("messages-container");
const msgCountEl = document.getElementById("msg-count");
const voiceCountEl = document.getElementById("voice-count");
const langCountEl = document.getElementById("lang-count");

async function loadMessages() {
    const token = requireLogin();

    try {
        const res = await fetch(
            `${API_BASE}/messages/get_messages/${userId}?t=${Date.now()}`,
            {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );

        const messages = await res.json();

        messagesContainer.innerHTML = "";

        messages.forEach(msg => {
            const div = document.createElement("div");
            div.classList.add("message", "user");

            const time = new Date().toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
                hour12: true
            });

            div.innerHTML = `
                <div>${msg.message}</div>
                <div class="msg-time">${time}</div>
            `;

            messagesContainer.appendChild(div);
        });

        if (msgCountEl) msgCountEl.textContent = messages.length;
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

    } catch (err) {
        console.error("Load error:", err);
    }

    // stats update
    const voicesLS = JSON.parse(localStorage.getItem("voiceMessages")) || [];
    const langsLS = JSON.parse(localStorage.getItem("languagesUsed")) || [];

    if (voiceCountEl) voiceCountEl.textContent = voicesLS.length;
    if (langCountEl) langCountEl.textContent = langsLS.length;
}

// refresh loop
setInterval(loadMessages, 5000);

// ========================
// 🔊 SPEAK + SAVE (SECURE)
// ========================
async function speakAndSave() {
    const input = document.getElementById("inputMessage");
    const text = input.value.trim();

    if (!text) return alert("Type something 😅");

    // ===== SPEECH =====
    const speech = new SpeechSynthesisUtterance(text);
    speech.lang = selectedLang;

    const voiceList = speechSynthesis.getVoices();

    let voice;
    if (selectedGender === "female") {
        voice = voiceList.find(v =>
            v.name.toLowerCase().includes("female") ||
            v.name.toLowerCase().includes("google")
        );
    } else {
        voice = voiceList.find(v =>
            v.name.toLowerCase().includes("male") ||
            v.name.toLowerCase().includes("alex")
        );
    }

    speech.voice = voice || voiceList[0];

    speechSynthesis.cancel();
    speechSynthesis.speak(speech);

    // fallback TTS
    setTimeout(() => {
        if (!speechSynthesis.speaking) {
            const fallbackVoice = selectedGender === "female" ? "Emma" : "Brian";

            const audio = new Audio(
                `https://api.streamelements.com/kappa/v2/speech?voice=${fallbackVoice}&text=${encodeURIComponent(text)}`
            );

            audio.play();
        }
    }, 1000);

    // ===== SAVE TO BACKEND (SECURE) =====
    try {
        const token = requireLogin();

        const res = await fetch(`${API_BASE}/messages/save_message`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                message: text
            })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Save failed");

        loadMessages();
    } catch (err) {
        console.error("Save error:", err);
    }

    // local stats
    saveVoiceMessage(text);
    saveLanguage(selectedLang);

    input.value = "";
}