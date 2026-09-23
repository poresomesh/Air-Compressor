import axios from "axios";

// Jar Render/Production URL asel tar ti vapara, nahi tar fallback sathi Render chi live backend URL dya
const API = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    "https://air-compressor-1.onrender.com/api", // Tumchi actual live backend render URL ithe dya
});

// Request Interceptor: LocalStorage madhun token pathvnyasathi
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default API;



