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
}

// ===== 🔥 SAFE API CALL (FINAL FIX) =====
async function enhanceTextHandler() {
    const text = ttsInput.value.trim();

    if (!text) {
        alert("⚠️ Enter text first!");
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

        console.log("STATUS:", response.status);

        const data = await response.json().catch(() => {
            throw new Error("Server returned HTML instead of JSON");
        });

        if (!response.ok) {
            throw new Error(data.error || "API failed");
        }

        if (data.success) {
            enhancedText = data.enhanced;

            ttsOutput.innerHTML = `<p>${enhancedText}</p>`;

            speakBtn.disabled = false;
            copyBtn.disabled = false;
            downloadBtn.disabled = false;
        }

    } catch (err) {
        console.error(err);
        alert("Server Error: " + err.message);
    } finally {
        enhanceBtn.disabled = false;
        enhanceBtn.innerText = "✨ Enhance Text";
    }
}

// ===== SPEAK =====
function speakText() {
    if (!enhancedText) return;

    const speech = new SpeechSynthesisUtterance(enhancedText);
    speech.lang = voiceLang.value;
    speech.rate = parseFloat(voiceSpeed.value);

    speechSynthesis.cancel();
    speechSynthesis.speak(speech);
}

// ===== COPY =====
function copyText() {
    if (!enhancedText) return;
    navigator.clipboard.writeText(enhancedText);
    alert("Copied!");
}

// ===== DOWNLOAD =====
function downloadText() {
    if (!enhancedText) return;

    const blob = new Blob([enhancedText], { type: "text/plain" });
    const a = document.createElement("a");

    a.href = URL.createObjectURL(blob);
    a.download = "tts-output.txt";
    a.click();
}

// ===== CLEAR =====
function clearAll() {
    ttsInput.value = "";
    ttsOutput.innerHTML = "Output will appear here...";
    enhancedText = "";
}

// ===== READY =====
console.log("✅ TTS Ready");