import { Application, SystemSettings, JobPosition, ApplicationStats } from '../types.js';

export async function fetchConfig(): Promise<SystemSettings> {
  const res = await fetch('/api/config');
  if (!res.ok) throw new Error('Failed to load system settings');
  return res.json();
}

export async function fetchJobs(): Promise<JobPosition[]> {
  const res = await fetch('/api/jobs');
  if (!res.ok) throw new Error('Failed to load job vacancies');
  return res.json();
}

export async function uploadImageFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch('/api/upload', {
    method: 'POST',
    body: formData
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to upload image file');
  }

  const data = await res.json();
  return data.fileUrl;
}

export async function submitApplicationStep1(payload: {
  fullName: string;
  fatherName: string;
  cnic: string;
  email: string;
  mobile: string;
  qualification: string;
  address: string;
  postalCode: string;
  jobPosition: string;
  cnicFrontUrl: string;
  cnicBackUrl: string;
}): Promise<{ message: string; application: Application }> {
  const res = await fetch('/api/applications/step1', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to submit application information');
  }
  return data;
}

export async function submitPaymentProof(
  applicationId: string,
  payload: {
    paymentMethod: 'JazzCash' | 'Easypaisa';
    paymentScreenshotUrl: string;
    paymentTxnId?: string;
  }
): Promise<{ message: string; application: Application }> {
  const res = await fetch(`/api/applications/${applicationId}/payment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to submit payment screenshot');
  }
  return data;
}

export async function trackApplication(query: string): Promise<Application[]> {
  const res = await fetch(`/api/applications/track?query=${encodeURIComponent(query)}`);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'No records found matching your CNIC or Reference Number');
  }
  return data.applications;
}

export async function fetchApplicationById(id: string): Promise<Application> {
  const res = await fetch(`/api/applications/${id}`);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Application not found');
  }
  return data;
}

// USER AUTH SERVICES

export async function registerUser(payload: {
  fullName: string;
  email: string;
  cnic: string;
  password: string;
}): Promise<{ token: string; user: { id: string; fullName: string; email: string; cnic: string; role: 'user' } }> {
  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Registration failed.');
  }
  return data;
}

export async function loginUser(payload: {
  loginInput: string;
  password: string;
}): Promise<{ token: string; user: { id: string; fullName: string; email: string; cnic: string; role: 'user' } }> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Login failed.');
  }
  return data;
}

export async function fetchUserProfile(token: string): Promise<{ user: { id: string; fullName: string; email: string; cnic: string; role: 'user' } }> {
  const res = await fetch('/api/auth/me', {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch profile.');
  return data;
}

export async function fetchUserApplications(token: string): Promise<Application[]> {
  const res = await fetch('/api/user/applications', {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch user applications.');
  return data;
}

// ADMIN API SERVICES

export async function adminLogin(username: string, password: string): Promise<{ token: string; user: { username: string } }> {
  const res = await fetch('/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Admin authentication failed');
  }
  return data;
}

export async function fetchAdminStats(token: string): Promise<ApplicationStats> {
  const res = await fetch('/api/admin/stats', {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to load stats');
  return data;
}

export async function fetchAdminApplications(
  token: string,
  status: string = 'all',
  search: string = ''
): Promise<Application[]> {
  const url = `/api/admin/applications?status=${encodeURIComponent(status)}&search=${encodeURIComponent(search)}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to load applications');
  return data;
}

export async function verifyApplicationPayment(
  token: string,
  id: string,
  action: 'approve' | 'reject',
  rejectionReason?: string
): Promise<{ message: string; application: Application }> {
  const res = await fetch(`/api/admin/applications/${id}/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ action, rejectionReason })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Verification action failed');
  return data;
}

export async function updateSystemSettings(
  token: string,
  settings: Partial<SystemSettings>
): Promise<SystemSettings> {
  const res = await fetch('/api/admin/settings', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(settings)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update settings');
  return data.settings;
}

export async function changeAdminPassword(
  token: string,
  currentPassword: string,
  newPassword: string
): Promise<void> {
  const res = await fetch('/api/admin/change-password', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ currentPassword, newPassword })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update password');
}

export async function createAdminJob(
  token: string,
  jobData: Partial<JobPosition>
): Promise<{ message: string; job: JobPosition }> {
  const res = await fetch('/api/admin/jobs', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(jobData)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to create job vacancy');
  return data;
}

export async function updateAdminJob(
  token: string,
  id: string,
  jobData: Partial<JobPosition>
): Promise<{ message: string; job: JobPosition }> {
  const res = await fetch(`/api/admin/jobs/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(jobData)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update job vacancy');
  return data;
}

export async function deleteAdminJob(
  token: string,
  id: string
): Promise<{ message: string }> {
  const res = await fetch(`/api/admin/jobs/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to delete job vacancy');
  return data;
}
