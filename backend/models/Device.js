const mongoose = require("mongoose");

const deviceSchema = new mongoose.Schema({
  name: String,
  powerPerHour: Number, // in Watts
  status: {
    type: String,
    enum: ["ON", "OFF"],
    default: "OFF"
  },
  totalUsageToday: {
    type: Number,
    default: 0 // in kWh
  }
});

module.exports = mongoose.model("Device", deviceSchema);
