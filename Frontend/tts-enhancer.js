// ===== TTS ENHANCER APPLICATION (FULL SECURE VERSION) =====

const API_BASE = "https://robo-enhance.onrender.com";

let enhancedText = "";

// ========================
// 🔐 AUTH
// ========================
function getToken() {
    return localStorage.getItem("token");
}

function logout() {
    localStorage.removeItem("token");
    window.location.href = "login.html";
}

function requireLogin() {
    const token = getToken();

    if (!token || token === "null") {
        disableUI();
        window.location.href = "login.html";
        throw new Error("No token found");
    }

    return token;
}

// ========================
// 🎯 DOM ELEMENTS
// ========================
const ttsInput = document.getElementById("tts-input");
const ttsMode = document.getElementById("tts-mode");
const ttsPersonality = document.getElementById("tts-personality");
const ttsEmotion = document.getElementById("tts-emotion");
const ttsAction = document.getElementById("tts-action");

const enhanceBtn = document.getElementById("tts-enhance-btn");
const clearBtn = document.getElementById("tts-clear-btn");

const ttsOutput = document.getElementById("tts-output");

const speakBtn = document.getElementById("tts-speak-btn");
const copyBtn = document.getElementById("tts-copy-btn");
const downloadBtn = document.getElementById("tts-download-btn");

const voiceLang = document.getElementById("voice-lang");
const voiceSpeed = document.getElementById("voice-speed");
const voiceGender = document.getElementById("voice-gender");
const speedDisplay = document.getElementById("speed-display");

// ========================
// 🚫 DISABLE UI
// ========================
function disableUI() {
    enhanceBtn.disabled = true;
    clearBtn.disabled = true;
    speakBtn.disabled = true;
    copyBtn.disabled = true;
    downloadBtn.disabled = true;

    if (ttsInput) ttsInput.disabled = true;
}

// ========================
// 🚀 INIT
// ========================
document.addEventListener("DOMContentLoaded", () => {
    const token = getToken();

    if (!token) {
        alert("⚠️ Please login first!");
        disableUI();
        window.location.href = "login.html";
        return;
    }

    setupEventListeners();
});

// ========================
// 🎧 EVENTS
// ========================
function setupEventListeners() {
    enhanceBtn.addEventListener("click", enhanceTextHandler);
    clearBtn.addEventListener("click", clearAll);
    speakBtn.addEventListener("click", speakText);
    copyBtn.addEventListener("click", copyText);
    downloadBtn.addEventListener("click", downloadText);

    voiceSpeed.addEventListener("input", (e) => {
        speedDisplay.textContent = e.target.value + "x";
    });

    speechSynthesis.onvoiceschanged = () => {
        speechSynthesis.getVoices();
    };
}

// ================================
// 🔥 ENHANCE TEXT (JWT SAFE)
// ================================
async function enhanceTextHandler() {
    const token = requireLogin();
    const text = ttsInput.value.trim();

    if (!text) {
        alert("⚠️ Please enter some text!");
        return;
    }

    enhanceBtn.disabled = true;
    enhanceBtn.innerText = "✨ Enhancing...";

    try {
        const response = await fetch(`${API_BASE}/tts/enhance`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                text,
                mode: ttsMode.value,
                personality: ttsPersonality.value,
                emotion: ttsEmotion.value,
                action: ttsAction.value
            })
        });

        const contentType = response.headers.get("content-type");

        if (!response.ok) {
            const errText = await response.text();
            console.error("Server error:", errText);
            throw new Error("Server error or invalid route");
        }

        if (!contentType || !contentType.includes("application/json")) {
            const raw = await response.text();
            console.error("Invalid response:", raw);
            throw new Error("Server returned invalid response");
        }

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || "Enhancement failed");
        }

        enhancedText = data.enhanced || "";

        ttsOutput.innerHTML = `
            <p>${escapeHTML(enhancedText).replace(/\n/g, "<br>")}</p>
        `;

        speakBtn.disabled = false;
        copyBtn.disabled = false;
        downloadBtn.disabled = false;

    } catch (err) {
        console.error(err);
        alert("❌ " + err.message);
    } finally {
        enhanceBtn.disabled = false;
        enhanceBtn.innerText = "✨ Enhance Text";
    }
}

// ========================
// 🔊 SPEAK
// ========================
function speakText() {
    if (!enhancedText) return;

    const speech = new SpeechSynthesisUtterance(enhancedText);

    speech.lang = voiceLang.value;
    speech.rate = parseFloat(voiceSpeed.value);

    const voices = speechSynthesis.getVoices();
    let langVoices = voices.filter(v =>
        v.lang.includes(speech.lang.split("-")[0])
    );

    speech.voice = langVoices[0] || voices[0];

    speechSynthesis.cancel();
    speechSynthesis.speak(speech);
}

// ========================
// 📋 COPY
// ========================
function copyText() {
    if (!enhancedText) return;
    navigator.clipboard.writeText(enhancedText);
    alert("Copied! ✅");
}

// ========================
// ⬇️ DOWNLOAD
// ========================
function downloadText() {
    if (!enhancedText) return;

    const blob = new Blob([enhancedText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "tts-enhanced.txt";
    a.click();

    URL.revokeObjectURL(url);
}

// ========================
// 🧹 CLEAR
// ========================
function clearAll() {
    ttsInput.value = "";
    ttsOutput.innerHTML = "<p class='placeholder'>Your enhanced text will appear here...</p>";
    enhancedText = "";

    speakBtn.disabled = true;
    copyBtn.disabled = true;
    downloadBtn.disabled = true;
}

// ========================
// 🔐 HTML ESCAPE
// ========================
function escapeHTML(str) {
    return str
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;");
}

console.log("🔥 TTS ENHANCER FULLY SECURE ");