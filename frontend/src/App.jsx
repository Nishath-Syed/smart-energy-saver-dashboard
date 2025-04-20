import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer
} from "recharts";

const API = "http://localhost:5000/api";
const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7f7f", "#a4de6c", "#d0ed57"];

function App() {
  const [devices, setDevices] = useState([]);
  const [form, setForm] = useState({ name: "", powerPerHour: 0 });
  const [schedules, setSchedules] = useState([]);
  const [scheduleForm, setScheduleForm] = useState({ deviceId: "", startTime: "", endTime: "" });

  const fetchDevices = async () => {
    const res = await axios.get(`${API}/devices`);
    setDevices(res.data);
  };

  const fetchSchedules = async () => {
    const res = await axios.get(`${API}/schedules`);
    setSchedules(res.data);
  };

  useEffect(() => {
    fetchDevices();
    fetchSchedules();

    const interval = setInterval(() => {
      fetchDevices();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleAddDevice = async (e) => {
    e.preventDefault();
    await axios.post(`${API}/devices`, form);
    setForm({ name: "", powerPerHour: 0 });
    fetchDevices();
  };

  const handleAddSchedule = async (e) => {
    e.preventDefault();
    await axios.post(`${API}/schedules`, scheduleForm);
    setScheduleForm({ deviceId: "", startTime: "", endTime: "" });
    fetchSchedules();
  };

  /*const deleteDevice = async (id) => {
    
    const confirm = window.confirm("Are you sure you want to delete this device and its schedules?");
    if (!confirm) return;
  
    try {
      
      await axios.delete(`http://localhost:5000/api/devices/${id}`);
      fetchDevices();
      fetchSchedules();
    } catch (error) {
      alert("Failed to delete device. Check console for details.");
      console.error("Delete error:", error);
    }
  };*/
  

  return (
    <div style={{ padding: "2rem", fontFamily: "Arial" }}>
      <h2>Smart Energy Saver Dashboard</h2>

      {devices.some((d) => d.totalUsageToday >= 20) && (
        <div style={{ backgroundColor: "#ffcccc", padding: "1rem", marginBottom: "1rem" }}>
          ⚠️ Alert: One or more devices have crossed the usage threshold (20 kWh)!
        </div>
      )}

      {/* Add Device */}
      <h3>Add Device</h3>
      <form onSubmit={handleAddDevice} style={{ marginBottom: "1rem" }}>
        <input
          type="text"
          placeholder="Device Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
        <input
          type="number"
          placeholder="Power per Hour (W)"
          value={form.powerPerHour}
          onChange={(e) => setForm({ ...form, powerPerHour: e.target.value })}
          required
        />
        <button type="submit">Add</button>
      </form>

      {/* Set Schedule */}
      <h3>Set Schedule</h3>
      <form onSubmit={handleAddSchedule} style={{ marginBottom: "1rem" }}>
        <select
          value={scheduleForm.deviceId}
          onChange={(e) => setScheduleForm({ ...scheduleForm, deviceId: e.target.value })}
          required
        >
          <option value="">--Select Device--</option>
          {devices.map((d) => (
            <option key={d._id} value={d._id}>{d.name}</option>
          ))}
        </select>
        <input
          type="time"
          value={scheduleForm.startTime}
          onChange={(e) => setScheduleForm({ ...scheduleForm, startTime: e.target.value })}
          required
        />
        <input
          type="time"
          value={scheduleForm.endTime}
          onChange={(e) => setScheduleForm({ ...scheduleForm, endTime: e.target.value })}
          required
        />
        <button type="submit">Set</button>
      </form>

      {/* Device Table */}
      <h3>Device Status & Usage</h3>
      <table border="1" cellPadding="10">
        <thead>
          <tr>
            <th>Name</th>
            <th>Status</th>
            <th>Power/Hour (W)</th>
            <th>Usage Today (kWh)</th>
          </tr>
        </thead>
        <tbody>
          {devices.map((device) => (
            <tr key={device._id} style={{ backgroundColor: device.totalUsageToday >= 20 ? '#ffe5e5' : 'white' }}>
              <td>{device.name}</td>
              <td>{device.status}</td>
              <td>{device.powerPerHour}</td>
              <td style={{ color: device.totalUsageToday >= 20 ? "red" : "black" }}>
                {device.totalUsageToday.toFixed(3)}
                {device.totalUsageToday >= 20 && " ⚠️"}
              </td>
              {/*<td>
              <button onClick={() => {
  console.log("Deleting device with id:", device._id);
  deleteDevice(device._id);
}}>🗑️ Delete</button>

              </td>*/}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Charts */}
      <h3>Energy Usage by Device (Bar Chart)</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={devices} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="totalUsageToday" fill="#8884d8" name="Usage (kWh)" />
        </BarChart>
      </ResponsiveContainer>

      <h3>Device Usage Share (Pie Chart)</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={devices}
            dataKey="totalUsageToday"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={100}
            label
          >
            {devices.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export default App;
