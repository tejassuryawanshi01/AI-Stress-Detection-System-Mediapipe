# 🧠 AI Stress Detection System

![HTML5](https://img.shields.io/badge/HTML5-Frontend-orange)
![CSS3](https://img.shields.io/badge/CSS3-Styling-blue)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6-yellow)
![Python](https://img.shields.io/badge/Python-Backend-green)
![MediaPipe](https://img.shields.io/badge/MediaPipe-FaceMesh-success)
![Chart.js](https://img.shields.io/badge/Chart.js-Visualization-red)

## 📌 Overview

AI Stress Detection System is a real-time web application that uses Artificial Intelligence, Computer Vision, and Facial Landmark Analysis to estimate a user's stress level through webcam input.

The system detects facial landmarks using MediaPipe Face Mesh, analyzes blink activity and facial movements, calculates stress levels, and displays results through an interactive medical-style dashboard.

---

## 📸 Project Screenshots

### Dashboard Interface

![Dashboard](assets/dashboard.png)

### Face Mesh Detection

![Face Mesh](assets/facemesh.png)

### Stress Monitoring

![Stress Monitor](assets/stress-monitor.png)

> Replace these images with your actual project screenshots.

---

## ✨ Features

* Real-Time Face Detection
* MediaPipe Face Mesh Integration
* Facial Landmark Tracking
* Blink Detection
* Emotion Detection
* Stress Level Estimation
* Stress Meter (Gauge)
* Live Stress Graph
* Stress History Tracking
* FPS Monitor
* Dark / Light Theme
* Camera Start / Stop Controls
* Reset Functionality
* Medical Dashboard UI

---

## 🛠 Technologies Used

### Frontend

* HTML5
* CSS3
* JavaScript
* Chart.js

### Backend

* Python
* Flask
* SQLite

### AI & Computer Vision

* MediaPipe Face Mesh
* Facial Landmark Detection

---

## 📂 Project Structure

```text
Stress Detection (MediaPipe) project/
│
├── Backend/
│   ├── app.py
│   ├── database.py
│   └── modals.py
│
├── index.html
├── style.css
├── script.js
├── README.md
│
└── assets/
    ├── dashboard.png
    ├── facemesh.png
    └── stress-monitor.png
```

---

## ⚙️ System Workflow

```text
Webcam Input
      ↓
Face Detection
      ↓
Face Mesh Detection
      ↓
Facial Landmark Analysis
      ↓
Stress Calculation
      ↓
Dashboard Visualization
```

---

## 🚀 How to Run

### Frontend

1. Download or clone the repository.
2. Open the project folder.
3. Open `index.html` in your browser.
4. Allow camera access.
5. Click **Start Camera**.

### Backend

1. Navigate to Backend folder.

```bash
cd Backend
```

2. Install dependencies.

```bash
pip install flask
```

3. Run the Flask application.

```bash
python app.py
```

---

## 📊 Dashboard Components

### Camera Panel

Displays live webcam feed and face mesh detection.

### Status Panel

* Emotion Detection
* Blink Count
* Stress Meter

### Stress Graph

Displays real-time stress level trends.

### Stress History

Stores previous stress records.

### FPS Monitor

Shows processing speed and performance.

---

## 🎯 Applications

* Mental Health Monitoring
* Student Stress Analysis
* Workplace Wellness Monitoring
* Human Behavior Analysis
* Academic Research Projects

---

## ⚠️ Limitations

* Works best under proper lighting conditions.
* Supports one face at a time.
* Stress estimation is not a medical diagnosis.
* Results may vary among users.

---

## 🔮 Future Enhancements

* Multi-Face Detection
* Machine Learning Based Prediction
* Mobile Application
* Cloud Database Integration
* Advanced Emotion Analytics
* Health Monitoring Platform

---

## 🎓 Academic Purpose

This project was developed as a Final Year Academic Project to demonstrate the practical implementation of Artificial Intelligence, Computer Vision, and Web Technologies for real-time stress monitoring.

---

## 👨‍💻 Developer

**Tejas Baliram Suryawanshi**

B.Tech Computer Science & Engineering
Sandip University, Nashik

GitHub: https://github.com/tejassuryawanshi01

---

## ⭐ Support

If you found this project useful, please consider giving it a ⭐ on GitHub.

---

## 📄 License

This project is developed for educational and academic purposes.

© 2026 Tejas Baliram Suryawanshi. All Rights Reserved.
