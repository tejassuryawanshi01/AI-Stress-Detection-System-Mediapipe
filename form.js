// ---------------- API BASE ----------------

const API_BASE_URL = "http://127.0.0.1:5000";

// ---------------- REGEX PATTERNS ----------------

const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/;

// ---------------- MESSAGE HELPER ----------------

function showMessage(msgElem, text, color = "red") {
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
      credentials: "include",
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
    console.error(error);
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
      credentials: "include",
      body: JSON.stringify({
        username,
        password,
      }),
    });

    const data = await res.json();

    if (res.status === 200) {
      showMessage(msg, data.message, "green");

      document.getElementById("loginUsername").value = "";
      document.getElementById("loginPassword").value = "";

      setTimeout(() => {
        window.location.href = "index.html";
      }, 500);
    } else {
      showMessage(msg, data.message || "Login failed!");
    }
  } catch (error) {
    console.error(error);
    showMessage(msg, "Server error!");
  }
}

// ---------------- SESSION CHECK ----------------

async function checkSession() {
  try {
    const res = await fetch(`${API_BASE_URL}/check`, {
      method: "GET",
      credentials: "include",
    });

    const data = await res.json();

    return data.user || null;
  } catch (error) {
    console.error(error);
    return null;
  }
}

// ---------------- REDIRECT HELPERS ----------------

async function requireLogin() {
  const user = await checkSession();

  if (!user) {
    alert("Please login first!");
    window.location.href = "login.html";
  }
}

async function redirectIfLoggedIn() {
  const user = await checkSession();

  if (user) {
    window.location.href = "index.html";
  }
}

// ---------------- AUTO REDIRECT ----------------

if (document.body.id === "loginPage" || document.body.id === "registerPage") {
  redirectIfLoggedIn();
}

// ---------------- LOGOUT ----------------

async function logout() {
  try {
    const res = await fetch(`${API_BASE_URL}/logout`, {
      method: "POST",
      credentials: "include",
    });

    const data = await res.json();

    alert(data.message || "Logged out!");

    window.location.href = "login.html";
  } catch (err) {
    console.error(err);
    alert("Server error!");
  }
}
