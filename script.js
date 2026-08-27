const API_BASE_URL =
  "https://ai-stress-detection-system-mediapipe-urkh.onrender.com";

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
const startBtn = document.getElementById("startBtn");

// ---------------- THEME ----------------
if (themeBtn) {
  themeBtn.onclick = () => {
    document.body.classList.toggle("light");
  };
}

// ---------------- VARIABLES ----------------
let blinkCount = 0;
let blinkState = false;

let currentStress = 0;
let smoothStress = 0;

let lastTime = performance.now();
let camera = null;

const stressData = [];
const labels = [];

let lastGraphUpdate = 0;
let isLoggedIn = false;

// ---------------- CHART ----------------
const chartElement = document.getElementById("stressChart");

let stressChart = null;

if (chartElement) {
  const chartCtx = chartElement.getContext("2d");

  stressChart = new Chart(chartCtx, {
    type: "line",

    data: {
      labels: labels,

      datasets: [
        {
          data: stressData,
          borderColor: "#00ffaa",
          backgroundColor: "rgba(0,255,170,0.1)",
          borderWidth: 3,
          fill: true,
          tension: 0.4,
        },
      ],
    },

    options: {
      animation: false,

      plugins: {
        legend: {
          display: false,
        },
      },

      scales: {
        y: {
          min: 0,
          max: 100,
        },

        x: {
          display: false,
        },
      },
    },
  });
}

// ---------------- MEDIAPIPE ----------------
const faceMesh = new FaceMesh({
  locateFile: (file) =>
    `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
});

faceMesh.setOptions({
  maxNumFaces: 1,
  refineLandmarks: true,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5,
});

faceMesh.onResults((results) => {
  if (!isLoggedIn) return;

  const now = performance.now();

  const fps = Math.round(1000 / (now - lastTime));

  lastTime = now;

  if (fpsText) {
    fpsText.innerText = "FPS: " + fps;
  }

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

  if (!results.multiFaceLandmarks) {
    return;
  }

  const landmarks = results.multiFaceLandmarks[0];

  detectBlink(landmarks);
  calculateStress(landmarks);
  detectEmotion();

  drawConnectors(ctx, landmarks, FACEMESH_TESSELATION, {
    color: "#00ffaa",
    lineWidth: 1,
  });

  updateGauge(currentStress);

  if (Date.now() - lastGraphUpdate > 800) {
    updateGraph(currentStress);
    lastGraphUpdate = Date.now();
  }
});

// ---------------- BLINK ----------------
function detectBlink(landmarks) {
  const eyeTop = landmarks[159];
  const eyeBottom = landmarks[145];

  const dist = Math.abs(eyeTop.y - eyeBottom.y);

  if (dist < 0.012 && !blinkState) {
    blinkCount++;
    blinkState = true;

    if (blinkText) {
      blinkText.innerText = blinkCount;
    }
  } else if (dist >= 0.012) {
    blinkState = false;
  }
}

// ---------------- EMOTION ----------------
function detectEmotion() {
  if (!emotionText || !emoji) return;

  if (currentStress > 80) {
    emotionText.innerText = "Very Stressed";
    emoji.innerText = "😫";
  } else if (currentStress > 60) {
    emotionText.innerText = "Angry";
    emoji.innerText = "😠";
  } else if (currentStress > 40) {
    emotionText.innerText = "Sad";
    emoji.innerText = "😟";
  } else if (currentStress > 20) {
    emotionText.innerText = "Normal";
    emoji.innerText = "🙂";
  } else {
    emotionText.innerText = "Relaxed";
    emoji.innerText = "😌";
  }
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
  if (!gaugeFill || !gaugeText) {
    return;
  }

  const angle = (Math.max(0, Math.min(100, percent)) / 100) * 180 - 90;

  gaugeFill.style.transform = `rotate(${angle}deg)`;

  gaugeText.innerText = percent + "%";
}

// ---------------- GRAPH ----------------
function updateGraph(value) {
  if (!stressChart) {
    return;
  }

  stressData.push(value);
  labels.push("");

  if (stressData.length > 30) {
    stressData.shift();
    labels.shift();
  }

  stressChart.update();
}

// ---------------- HISTORY ----------------
setInterval(() => {
  if (!isLoggedIn) return;
  if (!historyTable) return;

  const row = historyTable.insertRow(1);

  row.insertCell(0).innerText = new Date().toLocaleTimeString();

  row.insertCell(1).innerText = currentStress + "%";

  if (historyTable.rows.length > 8) {
    historyTable.deleteRow(7);
  }
}, 5000);

// ---------------- CAMERA ----------------
function startCamera() {
  if (!isLoggedIn) {
    alert("Please login first!");
    window.location.href = "login.html";
    return;
  }

  if (camera) {
    return;
  }

  camera = new Camera(video, {
    onFrame: async () => {
      await faceMesh.send({
        image: video,
      });
    },

    width: 640,
    height: 480,
  });

  camera.start();
}

// ---------------- STOP CAMERA ----------------
function stopCamera() {
  if (camera) {
    camera.stop();
    camera = null;
  }

  if (video) {
    video.pause();
  }

  if (ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
}

// ---------------- RESET ----------------
function resetData() {
  stopCamera();

  blinkCount = 0;
  currentStress = 0;
  smoothStress = 0;
  blinkState = false;

  if (blinkText) {
    blinkText.innerText = "0";
  }

  if (gaugeText) {
    gaugeText.innerText = "0%";
  }

  if (gaugeFill) {
    gaugeFill.style.transform = "rotate(-90deg)";
  }

  if (emotionText) {
    emotionText.innerText = "Relaxed";
  }

  if (emoji) {
    emoji.innerText = "😌";
  }

  stressData.length = 0;
  labels.length = 0;

  if (stressChart) {
    stressChart.update();
  }

  if (historyTable) {
    while (historyTable.rows.length > 1) {
      historyTable.deleteRow(1);
    }
  }
}

// ---------------- SESSION CHECK ----------------
async function checkDashboardSession() {
  try {
    const res = await fetch(`${API_BASE_URL}/check`, {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error("Session request failed");
    }

    const data = await res.json();

    console.log("Dashboard session:", data);

    if (data.user) {
      isLoggedIn = true;

      if (logoutBtn) {
        logoutBtn.style.display = "inline-block";
      }

      if (startBtn) {
        startBtn.style.display = "inline-block";
      }

      return;
    }

    isLoggedIn = false;

    if (logoutBtn) {
      logoutBtn.style.display = "none";
    }

    window.location.replace("login.html");
  } catch (error) {
    console.error("Session Check Error:", error);

    isLoggedIn = false;

    window.location.replace("login.html");
  }
}

// ---------------- LOGOUT ----------------
if (logoutBtn) {
  logoutBtn.onclick = async () => {
    try {
      await fetch(`${API_BASE_URL}/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout Error:", error);
    }

    isLoggedIn = false;

    stopCamera();
    resetData();

    window.location.replace("login.html");
  };
}

// ---------------- INIT ----------------
document.addEventListener("DOMContentLoaded", () => {
  if (document.body.id === "dashboardPage") {
    checkDashboardSession();
  }
});
