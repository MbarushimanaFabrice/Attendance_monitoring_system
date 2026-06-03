const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");
const { initDB } = require("./db");

// Import routes
const deviceRoutes = require("./routes/device");
const attendanceRoutes = require("./routes/attendance");
const enrollmentRoutes = require("./routes/enrollment");
const dashboardRoutes = require("./routes/dashboard");

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Middleware ────────────────────────────────────────────
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Raw body needed for biometric device payloads (binary + JSON mixed)
app.use((req, res, next) => {
  if (req.headers["request_code"]) {
    let chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => {
      req.rawBody = Buffer.concat(chunks);
      next();
    });
  } else {
    next();
  }
});

// ─── Static (Dashboard UI) ────────────────────────────────
app.use(express.static(path.join(__dirname, "../public")));

// ─── API Routes ───────────────────────────────────────────
app.use("/api/attendance", attendanceRoutes);
app.use("/api/enrollments", enrollmentRoutes);
app.use("/api/devices", deviceRoutes);
app.use("/api/dashboard", dashboardRoutes);

// ─── Biometric Device Endpoint ────────────────────────────
// Devices POST to root "/" with request_code header
const biometricHandler = require("./routes/biometric");
app.get("/", (req, res) => res.json({ status: "running", version: "1.0.0" }));
app.post("/", biometricHandler);

// ─── Global Error Handler ─────────────────────────────────
app.use((err, req, res, next) => {
  console.error("❌ Error:", err.message);
  res.status(500).json({ error: err.message });
});

// ─── Boot ─────────────────────────────────────────────────
initDB();
app.listen(PORT, () => {
  console.log(`\n🟢 Attendance Server running on http://localhost:${PORT}`);
  console.log(`📡 Biometric device endpoint: POST http://localhost:${PORT}/`);
  console.log(`📊 Dashboard: http://localhost:${PORT}\n`);
});

module.exports = app;
