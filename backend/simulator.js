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

