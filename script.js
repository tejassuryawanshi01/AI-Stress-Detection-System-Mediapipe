// ---------------- ELEMENTS ----------------
const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const blinkText = document.getElementById("blinkCount");
const emotionText = document.getElementById("emotionText");
const emoji = document.getElementById("emoji");

const gaugeFill = document.getElementById("gaugeFill");
const gaugeText = document.getElementById("gaugeText");

const fpsText = document.getElementById("fps");
const historyTable = document.getElementById("historyTable");

const themeBtn = document.getElementById("themeBtn");
const logoutBtn = document.getElementById("logoutBtn");
const registerBtn = document.getElementById("registerBtn");

// ---------------- THEME ----------------
themeBtn.onclick = () => document.body.classList.toggle("light");

// ---------------- VARIABLES ----------------
let blinkCount = 0, blinkState = false;
let currentStress = 0, smoothStress = 0;
let lastTime = performance.now();
let camera = null;

const stressData = [], labels = [];
let lastGraphUpdate = 0;
let isLoggedIn = false;

// ---------------- CHART ----------------
const chartCtx = document.getElementById("stressChart").getContext("2d");
const stressChart = new Chart(chartCtx, {
  type: "line",
  data: { labels, datasets: [{ data: stressData, borderColor: "#00ffaa", backgroundColor: "rgba(0,255,170,0.1)", borderWidth: 3, fill: true, tension: 0.4 }] },
  options: { animation: false, plugins: { legend: { display: false } }, scales: { y: { min: 0, max: 100 }, x: { display: false } } }
});

// ---------------- MEDIAPIPE ----------------
const faceMesh = new FaceMesh({
  locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
});
faceMesh.setOptions({ maxNumFaces: 1, refineLandmarks: true, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5 });

faceMesh.onResults(results => {
  if (!isLoggedIn) return;

  const now = performance.now();
  const fps = Math.round(1000 / (now - lastTime));
  lastTime = now;
  fpsText.innerText = "FPS: " + fps;

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

  if (!results.multiFaceLandmarks) return;
  const landmarks = results.multiFaceLandmarks[0];

  detectBlink(landmarks);
  calculateStress(landmarks);
  detectEmotion();
  drawConnectors(ctx, landmarks, FACEMESH_TESSELATION, { color: "#00ffaa", lineWidth: 1 });
  updateGauge(currentStress);

  if (Date.now() - lastGraphUpdate > 800) {
    updateGraph(currentStress);
    lastGraphUpdate = Date.now();
  }
});

// ---------------- BLINK ----------------
function detectBlink(landmarks) {
  const eyeTop = landmarks[159], eyeBottom = landmarks[145];
  const dist = Math.abs(eyeTop.y - eyeBottom.y);
  if (dist < 0.012 && !blinkState) {
    blinkCount++;
    blinkState = true;
    blinkText.innerText = blinkCount;
  } else if (dist >= 0.012) blinkState = false;
}

// ---------------- EMOTION ----------------
function detectEmotion() {
  if (currentStress > 80) { emotionText.innerText = "Very Stressed"; emoji.innerText = "😫"; }
  else if (currentStress > 60) { emotionText.innerText = "Angry"; emoji.innerText = "😠"; }
  else if (currentStress > 40) { emotionText.innerText = "Sad"; emoji.innerText = "😟"; }
  else if (currentStress > 20) { emotionText.innerText = "Normal"; emoji.innerText = "🙂"; }
  else { emotionText.innerText = "Relaxed"; emoji.innerText = "😌"; }
}

// ---------------- STRESS CALC ----------------
function calculateStress(landmarks) {
  const eyeOpen = Math.abs(landmarks[159].y - landmarks[145].y);
  const mouthOpen = Math.abs(landmarks[13].y - landmarks[14].y);
  const eyeScore = eyeOpen < 0.015 ? 50 : 10;
  const mouthScore = mouthOpen > 0.04 ? 40 : 10;
  const rawStress = (eyeScore + mouthScore) / 2;
  smoothStress = smoothStress * 0.92 + rawStress * 0.08;
  currentStress = Math.min(100, Math.floor(smoothStress));
}

// ---------------- GAUGE ----------------
function updateGauge(percent) {
  const angle = (Math.max(0, Math.min(100, percent)) / 100) * 180 - 90;
  gaugeFill.style.transform = `rotate(${angle}deg)`;
  gaugeText.innerText = percent + "%";
}

// ---------------- GRAPH ----------------
function updateGraph(value) {
  stressData.push(value);
  labels.push("");
  if (stressData.length > 30) { stressData.shift(); labels.shift(); }
  stressChart.update();
}

// ---------------- HISTORY ----------------
setInterval(() => {
  if (!isLoggedIn) return;
  const row = historyTable.insertRow(1);
  row.insertCell(0).innerText = new Date().toLocaleTimeString();
  row.insertCell(1).innerText = currentStress + "%";
  if (historyTable.rows.length > 8) historyTable.deleteRow(7);
}, 5000);

// ---------------- CAMERA ----------------
function startCamera() {
  if (!isLoggedIn) { alert("Please login first!"); return; }
  if (camera) return;
  camera = new Camera(video, { onFrame: async () => await faceMesh.send({ image: video }), width: 640, height: 480 });
  camera.start();
}

function stopCamera() {
  if (camera) { camera.stop(); camera = null; }
  video.pause();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// ---------------- RESET ----------------
function resetData() {
  stopCamera();
  blinkCount = 0;
  currentStress = 0;
  smoothStress = 0;
  blinkText.innerText = "0";
  gaugeText.innerText = "0%";
  emotionText.innerText = "Relaxed";
  emoji.innerText = "😌";
  stressData.length = 0;
  labels.length = 0;
  stressChart.update();
  while (historyTable.rows.length > 1) historyTable.deleteRow(1);
}

// ---------------- SESSION CHECK ----------------
async function checkSession() {
  try {
    const res = await fetch("http://127.0.0.1:5000/check", { method: "GET", credentials: "include" });
    const data = await res.json();
    if (data.user) {
      isLoggedIn = true;
      logoutBtn.style.display = "inline-block";
      registerBtn.style.display = "none";
      startCamera();
    } else {
      isLoggedIn = false;
      logoutBtn.style.display = "none";
      registerBtn.style.display = "inline-block";
      alert("Please login/register to access the dashboard!");
      window.location.href = "login.html";
    }
  } catch (err) { console.error(err); }
}

// ---------------- LOGOUT ----------------
logoutBtn.onclick = async () => {
  try {
    await fetch("http://127.0.0.1:5000/logout", { method: "POST", credentials: "include" });
    isLoggedIn = false;
    stopCamera();
    resetData();
    logoutBtn.style.display = "none";
    registerBtn.style.display = "inline-block";
    alert("Logged out successfully!");
    window.location.href = "login.html";
  } catch (err) { console.error(err); }
};

// ---------------- INIT ----------------
document.addEventListener("DOMContentLoaded", checkSession);