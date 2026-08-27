// ---------------- API BASE ----------------

const API_BASE_URL =
  "https://ai-stress-detection-system-mediapipe-urkh.onrender.com";

// ---------------- REGEX PATTERNS ----------------

const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/;

// ---------------- MESSAGE HELPER ----------------

function showMessage(msgElem, text, color = "red") {
  if (!msgElem) return;

  msgElem.textContent = text;
  msgElem.style.color = color;
}

// ---------------- REGISTER ----------------

async function register() {
  const username = document.getElementById("username").value.trim();

  const email = document.getElementById("email").value.trim();

  const password = document.getElementById("password").value.trim();

  const msg = document.getElementById("msg");

  if (!username || !email || !password) {
    return showMessage(msg, "All fields are required!");
  }

  if (!usernameRegex.test(username)) {
    return showMessage(
      msg,
      "Username must be 3-20 characters, letters/numbers/_ only.",
    );
  }

  if (!emailRegex.test(email)) {
    return showMessage(msg, "Invalid email format!");
  }

  if (!passwordRegex.test(password)) {
    return showMessage(
      msg,
      "Password must be at least 6 characters with 1 letter and 1 number.",
    );
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
        window.location.href = "login.html";
      }, 1000);
    } else {
      showMessage(msg, data.message || "Registration failed!");
    }
  } catch (error) {
    console.error("Register Error:", error);

    showMessage(msg, "Server error!");
  }
}

// ---------------- LOGIN ----------------

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

    // ---------------- SAVE JWT TOKEN ----------------

    if (!data.token) {
      console.error("❌ No token received from backend");

      return showMessage(
        msg,
        "Login successful, but authentication token was not received.",
      );
    }

    localStorage.setItem("stress_auth_token", data.token);

    localStorage.setItem("stress_username", data.user);

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

// ---------------- LOGOUT ----------------

async function logout() {
  try {
    await fetch(`${API_BASE_URL}/logout`, {
      method: "POST",
    });
  } catch (error) {
    console.error("Logout Error:", error);
  }

  // Remove authentication
  localStorage.removeItem("stress_auth_token");

  localStorage.removeItem("stress_username");

  window.location.replace("login.html");
}
