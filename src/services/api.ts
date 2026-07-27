import { Application, SystemSettings, JobPosition, ApplicationStats } from '../types.js';
import { DEFAULT_JOBS, DEFAULT_SETTINGS } from '../constants/defaultData.js';

function getLocalApplications(): Application[] {
  try {
    const raw = localStorage.getItem('jobshub_local_applications');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalApplication(app: Application) {
  try {
    const existing = getLocalApplications();
    const updated = [app, ...existing.filter(a => a.id !== app.id)];
    localStorage.setItem('jobshub_local_applications', JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save application to localStorage', e);
  }
}

export async function fetchConfig(): Promise<SystemSettings> {
  try {
    const res = await fetch('/api/config');
    if (res.ok) {
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        if (data && typeof data === 'object' && data.applicationFee) {
          return data;
        }
      }
    }
  } catch (err) {
    console.warn('API /api/config failed, trying fallback', err);
  }

  try {
    const resStatic = await fetch('/config.json');
    if (resStatic.ok) {
      const dataStatic = await resStatic.json();
      if (dataStatic && typeof dataStatic === 'object' && dataStatic.applicationFee) {
        return dataStatic;
      }
    }
  } catch (err) {
    console.warn('Fallback /config.json failed', err);
  }

  return DEFAULT_SETTINGS;
}

export async function fetchJobs(): Promise<JobPosition[]> {
  try {
    const res = await fetch('/api/jobs');
    if (res.ok) {
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          return data;
        }
      }
    }
  } catch (err) {
    console.warn('API /api/jobs failed, trying fallback', err);
  }

  try {
    const resStatic = await fetch('/jobs.json');
    if (resStatic.ok) {
      const dataStatic = await resStatic.json();
      if (Array.isArray(dataStatic) && dataStatic.length > 0) {
        return dataStatic;
      }
    }
  } catch (err) {
    console.warn('Fallback /jobs.json failed', err);
  }

  return DEFAULT_JOBS;
}

export async function uploadImageFile(file: File): Promise<string> {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });

    if (res.ok) {
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        if (data && data.fileUrl) return data.fileUrl;
      }
    }
  } catch {
    // Fallback to client data URL
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(file);
  });
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
  try {
    const res = await fetch('/api/applications/step1', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        if (data && data.application) {
          saveLocalApplication(data.application);
          return data;
        }
      }
    }
  } catch {
    // Fallback to local submission
  }

  const refNum = `JH-2026-${Math.floor(10000 + Math.random() * 90000)}`;
  const now = new Date().toISOString();
  const localApp: Application = {
    id: `app-${Date.now()}`,
    referenceNo: refNum,
    fullName: payload.fullName,
    fatherName: payload.fatherName,
    cnic: payload.cnic,
    email: payload.email,
    mobile: payload.mobile,
    qualification: payload.qualification,
    address: payload.address,
    postalCode: payload.postalCode,
    jobPosition: payload.jobPosition,
    cnicFrontUrl: payload.cnicFrontUrl,
    cnicBackUrl: payload.cnicBackUrl,
    paymentScreenshotUrl: null,
    paymentMethod: null,
    paymentTxnId: null,
    status: 'Payment Pending',
    rejectionReason: null,
    createdAt: now,
    updatedAt: now
  };

  saveLocalApplication(localApp);
  return {
    message: 'Application submitted successfully',
    application: localApp
  };
}

export async function submitPaymentProof(
  applicationId: string,
  payload: {
    paymentMethod: 'JazzCash' | 'Easypaisa';
    paymentScreenshotUrl: string;
    paymentTxnId?: string;
  }
): Promise<{ message: string; application: Application }> {
  try {
    const res = await fetch(`/api/applications/${applicationId}/payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        if (data && data.application) {
          saveLocalApplication(data.application);
          return data;
        }
      }
    }
  } catch {
    // Fallback
  }

  const localApps = getLocalApplications();
  const existing = localApps.find(a => a.id === applicationId || a.referenceNo === applicationId);
  if (existing) {
    const updatedApp: Application = {
      ...existing,
      status: 'Payment Verification Pending',
      paymentMethod: payload.paymentMethod,
      paymentScreenshotUrl: payload.paymentScreenshotUrl,
      paymentTxnId: payload.paymentTxnId || null,
      updatedAt: new Date().toISOString()
    };
    saveLocalApplication(updatedApp);
    return {
      message: 'Payment details submitted successfully',
      application: updatedApp
    };
  }

  throw new Error('Application record not found');
}

export async function trackApplication(query: string): Promise<Application[]> {
  try {
    const res = await fetch(`/api/applications/track?query=${encodeURIComponent(query)}`);
    if (res.ok) {
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        if (data && Array.isArray(data.applications) && data.applications.length > 0) {
          return data.applications;
        }
      }
    }
  } catch {
    // Fallback
  }

  const cleanQuery = query.trim().toLowerCase();
  const localApps = getLocalApplications();
  const matched = localApps.filter(
    a => (a.cnic && a.cnic.toLowerCase() === cleanQuery) ||
         (a.referenceNo && a.referenceNo.toLowerCase() === cleanQuery) ||
         (a.id && a.id.toLowerCase() === cleanQuery)
  );

  if (matched.length > 0) {
    return matched;
  }

  throw new Error('No records found matching your CNIC or Reference Number');
}

export async function fetchApplicationById(id: string): Promise<Application> {
  try {
    const res = await fetch(`/api/applications/${id}`);
    if (res.ok) {
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        if (data && data.id) {
          return data;
        }
      }
    }
  } catch {
    // Fallback
  }

  const localApps = getLocalApplications();
  const found = localApps.find(a => a.id === id || a.referenceNo === id);
  if (found) {
    return found;
  }

  throw new Error('Application not found');
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
