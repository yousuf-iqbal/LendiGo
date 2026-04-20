import axios from 'axios';
import { getAuth } from 'firebase/auth';

const API = axios.create({ baseURL: 'http://localhost:5000/api' });

API.interceptors.request.use(async (config) => {
  const auth = getAuth();
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken(false);
    localStorage.setItem('token', token);
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

API.interceptors.response.use(
  res => res,
  async (err) => {
    const auth = getAuth();
    if (err.response?.data?.error === 'token-expired' && auth.currentUser) {
      const fresh = await auth.currentUser.getIdToken(true);
      localStorage.setItem('token', fresh);
      err.config.headers.Authorization = `Bearer ${fresh}`;
      return axios(err.config);
    }
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('udhaari_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default API;
