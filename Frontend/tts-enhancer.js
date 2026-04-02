// ===== TTS ENHANCER APPLICATION (FULL SECURE FIXED VERSION) =====

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
// 🚫 SAFE DISABLE UI
// ========================
function disableUI() {
    const safeDisable = (el) => {
        if (el) el.disabled = true;
    };

    safeDisable(enhanceBtn);
    safeDisable(clearBtn);
    safeDisable(speakBtn);
    safeDisable(copyBtn);
    safeDisable(downloadBtn);

    if (ttsInput) ttsInput.disabled = true;
}

// ========================
// 🎯 DOM ELEMENTS (SAFE CHECK)
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
    if (enhanceBtn) enhanceBtn.addEventListener("click", enhanceTextHandler);
    if (clearBtn) clearBtn.addEventListener("click", clearAll);
    if (speakBtn) speakBtn.addEventListener("click", speakText);
    if (copyBtn) copyBtn.addEventListener("click", copyText);
    if (downloadBtn) downloadBtn.addEventListener("click", downloadText);

    if (voiceSpeed) {
        voiceSpeed.addEventListener("input", (e) => {
            if (speedDisplay) speedDisplay.textContent = e.target.value + "x";
        });
    }
}

// ================================
// 🔥 ENHANCE TEXT (FIXED)
// ================================
async function enhanceTextHandler() {
    const token = requireLogin();
    const text = (ttsInput?.value || "").trim();

    if (!text) {
        alert("⚠️ Please enter some text!");
        return;
    }

    if (enhanceBtn) {
        enhanceBtn.disabled = true;
        enhanceBtn.innerText = "✨ Enhancing...";
    }

    try {
        const response = await fetch(`${API_BASE}/tts/enhance`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                text,
                mode: ttsMode?.value || "default",
                personality: ttsPersonality?.value || "neutral",
                emotion: ttsEmotion?.value || "neutral",
                action: ttsAction?.value || "none"
            })
        });

        const rawText = await response.text();

        if (!response.ok) {
            console.error("Server error:", rawText);
            throw new Error("Server error or invalid route");
        }

        let data;
        try {
            data = JSON.parse(rawText);
        } catch (e) {
            console.error("Invalid JSON:", rawText);
            throw new Error("Server returned invalid JSON");
        }

        if (!data.success) {
            throw new Error(data.error || "Enhancement failed");
        }

        enhancedText = data.enhanced || "";

        if (ttsOutput) {
            ttsOutput.innerHTML = `
                <p>${escapeHTML(enhancedText).replace(/\n/g, "<br>")}</p>
            `;
        }

        if (speakBtn) speakBtn.disabled = false;
        if (copyBtn) copyBtn.disabled = false;
        if (downloadBtn) downloadBtn.disabled = false;

    } catch (err) {
        console.error(err);
        alert("❌ " + err.message);
    } finally {
        if (enhanceBtn) {
            enhanceBtn.disabled = false;
            enhanceBtn.innerText = "✨ Enhance Text";
        }
    }
}

// ========================
// 🔊 SPEAK (FIXED)
// ========================
function speakText() {
    if (!enhancedText) return;

    const speech = new SpeechSynthesisUtterance(enhancedText);

    speech.lang = voiceLang?.value || "en-US";
    speech.rate = parseFloat(voiceSpeed?.value || 1);

    const voices = speechSynthesis.getVoices();

    let langVoices = voices.filter(v =>
        v.lang?.includes(speech.lang.split("-")[0])
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
    if (ttsInput) ttsInput.value = "";

    if (ttsOutput) {
        ttsOutput.innerHTML = "<p class='placeholder'>Your enhanced text will appear here...</p>";
    }

    enhancedText = "";

    if (speakBtn) speakBtn.disabled = true;
    if (copyBtn) copyBtn.disabled = true;
    if (downloadBtn) downloadBtn.disabled = true;
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

console.log("🔥 TTS ENHANCER FIXED + SECURE VERSION LOADED");