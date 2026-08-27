const API_BASE_URL =
  "https://ai-stress-detection-system-mediapipe-urkh.onrender.com";

const AUTH_TOKEN_KEY = "stress_auth_token";

const USERNAME_KEY = "stress_username";

// =========================================================
// MESSAGE
// =========================================================

function showMessage(msgElem, text, color = "red") {
  if (!msgElem) return;

  msgElem.textContent = text;
  msgElem.style.color = color;
}

// =========================================================
// REGISTER
// =========================================================

async function register() {
  const username = document.getElementById("username").value.trim();

  const email = document.getElementById("email").value.trim();

  const password = document.getElementById("password").value.trim();

  const msg = document.getElementById("msg");

  if (!username || !email || !password) {
    return showMessage(msg, "All fields are required!");
  }

  try {
    const res = await fetch(`${API_BASE_URL}/register`, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        username,
        email,
        password,
      }),
    });

    const data = await res.json();

    if (res.status === 201) {
      showMessage(msg, data.message, "green");

      document.getElementById("username").value = "";

      document.getElementById("email").value = "";

      document.getElementById("password").value = "";

      setTimeout(() => {
        window.location.replace("login.html");
      }, 1000);
    } else {
      showMessage(msg, data.message || "Registration failed!");
    }
  } catch (error) {
    console.error("Register Error:", error);

    showMessage(msg, "Server error!");
  }
}

// =========================================================
// LOGIN
// =========================================================

async function login() {
  const username = document.getElementById("loginUsername").value.trim();

  const password = document.getElementById("loginPassword").value.trim();

  const msg = document.getElementById("msg");

  if (!username || !password) {
    return showMessage(msg, "All fields are required!");
  }

  try {
    const res = await fetch(`${API_BASE_URL}/login`, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        username,
        password,
      }),
    });

    const data = await res.json();

    if (res.status !== 200) {
      return showMessage(msg, data.message || "Login failed!");
    }

    if (!data.token) {
      console.error("❌ No authentication token received");

      return showMessage(msg, "Login successful, but token was not received.");
    }

    // SAVE TOKEN
    localStorage.setItem(AUTH_TOKEN_KEY, data.token);

    // SAVE USERNAME
    localStorage.setItem(USERNAME_KEY, data.user || username);

    console.log("✅ Login successful");

    console.log("✅ Token saved");

    showMessage(msg, "Login successful! Redirecting...", "green");

    document.getElementById("loginUsername").value = "";

    document.getElementById("loginPassword").value = "";

    setTimeout(() => {
      window.location.replace("index.html");
    }, 500);
  } catch (error) {
    console.error("Login Error:", error);

    showMessage(msg, "Server error!");
  }
}

// =========================================================
// LOGOUT
// =========================================================

async function logout() {
  try {
    await fetch(`${API_BASE_URL}/logout`, {
      method: "POST",
    });
  } catch (error) {
    console.error("Logout Error:", error);
  }

  localStorage.removeItem(AUTH_TOKEN_KEY);

  localStorage.removeItem(USERNAME_KEY);

  window.location.replace("login.html");
}
