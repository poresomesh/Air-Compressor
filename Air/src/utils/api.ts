import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
});

// रिक्वेस्ट पाठवताना आपोआप Bearer Token जोडणे
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("plant_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default API;