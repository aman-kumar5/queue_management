const API_BASE_URL = 'http://localhost:5000/api';

import axios from 'axios';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getPatients = async () => {
  const response = await api.get('/patients');
  return response.data;
};

export const createPatient = async (name, phone) => {
  const response = await api.post('/patients', { name, phone });
  return response.data;
};

export const getQueueStatus = async () => {
  const response = await api.get('/queue/status');
  return response.data;
};

export const updateAverageTime = async (minutes) => {
  const response = await api.post('/queue/settings', { averageConsultationTime: minutes });
  return response.data;
};

export const callNext = async () => {
  const response = await api.post('/queue/call-next');
  return response.data;
};

export const markCompleted = async () => {
  const response = await api.post('/queue/mark-completed');
  return response.data;
};

export const skipCurrent = async () => {
  const response = await api.post('/queue/skip-current');
  return response.data;
};

export const resetQueue = async () => {
  const response = await api.post('/queue/reset');
  return response.data;
};

export const loginReceptionist = async (employeeId, password) => {
  const response = await api.post('/auth/reception', { employeeId, password });
  return response.data;
};

export const loginPatient = async (name, phone) => {
  const response = await api.post('/auth/patient', { name, phone });
  return response.data;
};

export const verifyPatient = async (id) => {
  const response = await api.get(`/auth/verify/${id}`);
  return response.data;
};

export default {
  getPatients,
  createPatient,
  getQueueStatus,
  updateAverageTime,
  callNext,
  markCompleted,
  skipCurrent,
  resetQueue,
  loginReceptionist,
  loginPatient,
  verifyPatient,
};
