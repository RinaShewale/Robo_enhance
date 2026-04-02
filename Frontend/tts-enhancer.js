// ===== TTS ENHANCER APPLICATION =====

const API_BASE = "https://robo-enhance.onrender.com";

let enhancedText = "";

// ===== DOM ELEMENTS =====
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

// ===== INIT =====
document.addEventListener("DOMContentLoaded", setupEventListeners);

// ===== EVENTS =====
function setupEventListeners() {
    enhanceBtn.addEventListener("click", enhanceTextHandler);
    clearBtn.addEventListener("click", clearAll);
    speakBtn.addEventListener("click", speakText);
    copyBtn.addEventListener("click", copyText);
    downloadBtn.addEventListener("click", downloadText);

    voiceSpeed.addEventListener("input", (e) => {
        speedDisplay.textContent = e.target.value + "x";
    });

    // preload voices
    speechSynthesis.onvoiceschanged = () => {
        speechSynthesis.getVoices();
    };
}

// ================================
// 🔥 ENHANCE API CALL
// ================================
async function enhanceTextHandler() {
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
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                text,
                mode: ttsMode.value,
                personality: ttsPersonality.value,
                emotion: ttsEmotion.value,
                action: ttsAction.value
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Server Error: ${response.status}`);
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

// ================================
// 🔊 SPEAK TEXT (MULTILINGUAL + GENDER)
// ================================
function speakText() {
    if (!enhancedText) return;

    const speech = new SpeechSynthesisUtterance(enhancedText);

    const lang = voiceLang.value;
    const gender = voiceGender.value;
    const rate = parseFloat(voiceSpeed.value);

    speech.lang = lang;
    speech.rate = rate;

    const voices = speechSynthesis.getVoices();

    let selectedVoice = null;

    if (voices.length > 0) {

        // 1️⃣ match language first
        let langVoices = voices.filter(v => v.lang.includes(lang.split("-")[0]));

        // 2️⃣ try gender match
        if (gender === "male") {
            selectedVoice = langVoices.find(v =>
                v.name.toLowerCase().includes("male") ||
                v.name.toLowerCase().includes("david") ||
                v.name.toLowerCase().includes("alex") ||
                v.name.toLowerCase().includes("daniel")
            );
        } else {
            selectedVoice = langVoices.find(v =>
                v.name.toLowerCase().includes("female") ||
                v.name.toLowerCase().includes("zira") ||
                v.name.toLowerCase().includes("samantha") ||
                v.name.toLowerCase().includes("anna")
            );
        }

        // 3️⃣ fallback
        if (!selectedVoice) {
            selectedVoice = langVoices[0] || voices[0];
        }

        if (selectedVoice) {
            speech.voice = selectedVoice;
        }
    }

    speechSynthesis.cancel();
    speechSynthesis.speak(speech);
}

// ========================
// COPY
// ========================
function copyText() {
    if (!enhancedText) return;
    navigator.clipboard.writeText(enhancedText);
    alert("Copied! ✅");
}

// ========================
// DOWNLOAD
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
// CLEAR
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
function escapeHTML(str) {
    return str
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;");
}

// ========================
console.log("🔥 FULL TTS ENHANCER LOADED");