import axios from 'axios';

// 1. Base URL set karo (VITE_API_URL from environment, or production render fallback, or local '/api' dev proxy)
export const BACKEND_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '/api' : 'https://intellihire-backend-6uq4.onrender.com'); 
const API = axios.create({ baseURL: BACKEND_URL });

console.log("!!! API CONNECTIVITY CHECK !!!");
console.log("Current Backend URL:", BACKEND_URL);
console.log("Axios BaseURL:", API.defaults.baseURL);

// 2. TOKEN AUTOMATION (Ye Jadoo hai)
// Har request se pehle yeh check karega ke localStorage mein token hai ya nahi.
// Agar hai, to khud ba khud header mein laga dega.
API.interceptors.request.use((req) => {
  const token = localStorage.getItem('token');
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

// --- SAARI APIS EK JAGAH ---

// A. AUTHENTICATION
export const signup = (data) => API.post('/employee/signup', data);
export const login = (data) => API.post('/employee/login', data);
export const googleLogin = (token) => API.post('/auth/google', { token });
export const completeOnboarding = (data) => API.patch('/employee/onboarding/complete', data);
export const getMyProfile = () => API.get('/employee/me');

// B. EMPLOYEES
export const getAllEmployees = () => API.get('/employee/all');
export const getEmployee = (employeeCode) => API.get(`/employee/${employeeCode}`);
export const updateEmployee = (employeeCode, data) => API.patch(`/employee/${employeeCode}`, data);
export const addEmployee = (data) => API.post('/employee/add', data);
export const uploadCv = (formData) => API.post('/employee/upload-cv', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});

// C. AI & ANALYSIS
export const distillOnboarding = (formData) => API.post('/ai/distill-onboarding', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});

// B. JOBS (HR Jobs post karega, Candidates dekhenge)
export const createJob = (jobData) => API.post('/jobs/create', jobData);
export const getAllJobs = () => API.get('/jobs/all');
export const getJobRecommendations = () => API.get('/jobs/recommendations');
export const deleteJob = (jobId) => API.delete(`/jobs/delete/${jobId}`);

// C. LEAVES (Employee request karega, HR dekhega)
export const requestLeave = (leaveData) => API.post('/leaves/request', leaveData);
export const getMyLeaves = (employeeId) => API.get(`/leaves/employee/${employeeId}`);
export const getAllLeaves = () => API.get('/leaves/all');
export const updateLeaveStatus = (leaveId, status, admin_comments) =>
  API.patch(`/leaves/status/${leaveId}`, { status, admin_comments });

// E. ATTENDANCE (monthly summary)
export const getAttendanceAll = (month, year) =>
  API.get('/attendance/all', { params: { month, year } });
export const getEmployeeAttendance = (employeeId, month, year) =>
  API.get(`/attendance/employee/${employeeId}`, { params: { month, year } });
export const upsertAttendance = (data) => API.post('/attendance/upsert', data);
export const markAttendance = (data) => API.post('/attendance/mark', data);
export const getTodayAttendanceStatus = (employeeId) => API.get(`/attendance/today-status/${employeeId}`);
export const getDailyAttendanceLogs = (month, year) => API.get(`/attendance/daily-logs/${month}/${year}`);
export const autoClockIn = (data) => API.post('/attendance/auto-clock-in', data);
export const resetTodayAttendance = () => API.delete('/attendance/reset-today');

// G. SETTINGS (IP Configuration)
export const getSettings = () => API.get('/settings/');
export const updateSettings = (data) => API.put('/settings/', data);
export const getMyIp = () => API.get('/settings/my-ip');

// H. STATS
export const getAdminStats = () => API.get('/stats/admin-dashboard');

// D. APPLICATIONS (CV Upload karna)
export const applyForJob = (applicationData) => API.post('/applications/apply-file', applicationData);
export const applyForJobJson = (applicationData) => API.post('/applications/apply', applicationData);
export const getApplicationsForJob = (jobId) => API.get(`/applications/${jobId}`);
export const getApplicationsByCandidate = (candidateEmail) => API.get(`/applications/candidate/${candidateEmail}`);
export const getAllApplications = () => API.get('/applications/all');
export const updateApplicationStatus = (applicationId, status) =>
  API.patch(`/applications/${applicationId}/status`, { status });
export const deleteApplication = (applicationId) => API.delete(`/applications/${applicationId}`);


// F. AI ANALYSIS
export const analyzeCVs = (formData) => API.post('/ai/analyze-cvs', formData, {
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});

// H. WORK FROM HOME (WFH)
export const requestWFH = (data) => API.post('/wfh/request', data);
export const getMyWFHRequests = (employeeId) => API.get(`/wfh/employee/${employeeId}`);
export const getAllWFHRequests = () => API.get('/wfh/all');
export const updateWFHStatus = (requestId, status, admin_comments) =>
  API.patch(`/wfh/status/${requestId}`, { status, admin_comments });

// I. PAYROLL
export const getPayrollPreview = (month, year) => API.get(`/payroll/generate/${month}/${year}`);
export const processPayroll = (data) => API.post('/payroll/process', data);
export const getMyPayroll = (employeeId, month, year) => 
  API.get(`/payroll/employee/${employeeId}`, { params: { month, year } });

// J. EXTRA (Projects, Timesheets, Messages)
export const getProjects = () => API.get('/extra/projects');
export const createProject = (data) => API.post('/extra/projects', data);
export const deleteProject = (id) => API.delete(`/extra/projects/${id}`);

export const getTimeSheets = (week) => API.get(`/extra/timesheets/${week}`);
export const upsertTimeSheet = (data) => API.post('/extra/timesheets/upsert', data);

export const getMessages = () => API.get('/extra/messages');
export const createMessage = (data) => API.post('/extra/messages', data);
export const markMessageRead = (id) => API.patch(`/extra/messages/${id}/read`);

// K. INTERVIEW MANAGEMENT
export const scheduleManualInterview = (data) => API.post('/interviews/schedule-manual', data);
export const initiateInterviewAutomation = (data) => API.post('/interviews/initiate-automation', data);
export const confirmInterviewSlot = (data) => API.patch('/interviews/confirm-slot', data);
export const getAllInterviews = () => API.get('/interviews/all');
export const getApplicantInterview = (applicantId) => API.get(`/interviews/applicant/${applicantId}`);
export const scheduleSequentialInterview = (data) => API.post('/interviews/schedule-sequential', data);

export default API;