import axios from 'axios';

export const api = axios.create({
  baseURL: 'http://localhost:5000'
});

// Attach Authorization header from localStorage for all requests when token exists
api.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (e) {
    // ignore
  }
  return config;
}, (error) => Promise.reject(error));