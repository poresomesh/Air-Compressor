import axios from "axios";

// Environment variable असेल तर ती URL घेईल, नाहीतर लोकल डेव्हलपमेंटसाठी localhost घेईल
const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api",
});

// Request interceptor (जर टोकन लावत असाल तर)
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default API;