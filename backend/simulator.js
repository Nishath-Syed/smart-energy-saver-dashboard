/*const axios = require("axios");
const cron = require("node-cron");

const runSimulation = async () => {
  try {
    const { data: devices } = await axios.get("http://localhost:5000/api/devices");
    const { data: schedules } = await axios.get("http://localhost:5000/api/schedules");

    const now = new Date();
    const currentTime = now.toTimeString().substring(0, 5); // HH:MM

    for (let device of devices) {
      const schedule = schedules.find(s => s.deviceId === device._id);
      if (!schedule) continue;

      const isWithinTime = currentTime >= schedule.startTime && currentTime < schedule.endTime;

      const status = isWithinTime ? "ON" : "OFF";
      await axios.put(`http://localhost:5000/api/devices/${device._id}`, {
        status,
        addUsage: isWithinTime ? device.powerPerHour / 1000 / 60 : 0 // add per min in kWh
      });
    }
  } catch (err) {
    console.error("Simulation error:", err.message);
  }
};

cron.schedule("* * * * *", runSimulation); // every minute

// === backend/server.js ===
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error(err));

const Device = require("./models/Device");
const Schedule = require("./models/Schedule");

app.get("/api/devices", async (req, res) => {
  const devices = await Device.find();
  res.json(devices);
});

app.post("/api/devices", async (req, res) => {
  const device = new Device(req.body);
  await device.save();
  res.status(201).json(device);
});

app.put("/api/devices/:id", async (req, res) => {
  const { status, addUsage } = req.body;
  const device = await Device.findById(req.params.id);
  if (!device) return res.status(404).json({ message: "Device not found" });
  device.status = status;
  device.totalUsageToday += addUsage || 0;
  await device.save();
  res.json(device);
});

app.post("/api/schedules", async (req, res) => {
  const schedule = new Schedule(req.body);
  await schedule.save();
  res.status(201).json(schedule);
});

app.get("/api/schedules", async (req, res) => {
  const schedules = await Schedule.find();
  res.json(schedules);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));*/


const axios = require("axios");
const cron = require("node-cron");

const runSimulation = async () => {
  try {
    const { data: devices } = await axios.get("http://localhost:5000/api/devices");
    const { data: schedules } = await axios.get("http://localhost:5000/api/schedules");

    const now = new Date();
    const currentTime = now.toTimeString().substring(0, 5); // HH:MM

    for (let device of devices) {
      const deviceSchedules = schedules.filter(s => String(s.deviceId) === String(device._id));

      let shouldBeOn = false;
      for (let sched of deviceSchedules) {
        if (currentTime >= sched.startTime && currentTime < sched.endTime) {
          shouldBeOn = true;
          break;
        }
      }

      const newStatus = shouldBeOn ? "ON" : "OFF";

      // If status already correct and no usage to add, skip
      if (device.status === newStatus && !shouldBeOn) continue;

      const usageIncrement = shouldBeOn ? device.powerPerHour / 1000 / 60 : 0; // kWh per minute

      await axios.put(`http://localhost:5000/api/devices/${device._id}`, {
        status: newStatus,
        addUsage: usageIncrement
      });

      console.log(`[${currentTime}] ${device.name} → ${newStatus}`);
    }
  } catch (err) {
    console.error("Simulation error:", err.message);
  }
};

cron.schedule("* * * * *", runSimulation); // every minute
// Reset usage at midnight
cron.schedule("0 0 * * *", async () => {
  try {
    const { data: devices } = await axios.get("http://localhost:5000/api/devices");

    for (let device of devices) {
      await axios.put(`http://localhost:5000/api/devices/${device._id}`, {
        status: "OFF",
        addUsage: -device.totalUsageToday // reset to 0
      });
      console.log(`[00:00] ${device.name} usage reset.`);
    }
  } catch (err) {
    console.error("Reset error:", err.message);
  }
});

