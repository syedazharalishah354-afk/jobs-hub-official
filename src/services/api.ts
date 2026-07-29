import { Application, SystemSettings, JobPosition, ApplicationStats } from '../types.js';
import { DEFAULT_JOBS, DEFAULT_SETTINGS } from '../constants/defaultData.js';
import { JOB_CAMPAIGNS } from '../constants/campaigns.js';

export function normalizeApplication(a: any): Application {
  if (!a) return a;
  const fullName = a.fullName || a.candidateName || '';
  const fatherName = a.fatherName || '';
  const mobile = a.mobile || a.mobileNumber || '';
  const jobPosition = a.jobPosition || a.jobTitle || 'General Application';
  const referenceNo = a.referenceNo || a.rollNumber || a.id || '';
  const paymentScreenshotUrl = a.paymentScreenshotUrl || a.paymentScreenshot || null;
  const paymentTxnId = a.paymentTxnId || a.trxId || a.transactionId || null;
  const createdAt = a.createdAt || a.appliedAt || new Date().toISOString();
  const cnicFrontUrl = a.cnicFrontUrl || a.cnicFront || '';
  const cnicBackUrl = a.cnicBackUrl || a.cnicBack || '';
  const applicantPhotoUrl = a.applicantPhotoUrl || a.applicantPhoto || a.photoUrl || null;
  const status = a.status || 'Payment Pending';

  let paymentStatus = a.paymentStatus || 'pending';
  if (status === 'Payment Approved' || status === 'Submitted Successfully' || a.paymentStatus === 'approved') {
    paymentStatus = 'approved';
  } else if (status === 'Payment Rejected' || a.paymentStatus === 'rejected') {
    paymentStatus = 'rejected';
  } else {
    paymentStatus = 'pending';
  }

  return {
    ...a,
    id: a.id || `app-${Date.now()}`,
    referenceNo,
    rollNumber: referenceNo,
    fullName,
    candidateName: fullName,
    fatherName,
    cnic: a.cnic || '',
    dob: a.dob || a.dateOfBirth || '',
    gender: a.gender || 'Male',
    email: a.email || '',
    mobile,
    mobileNumber: mobile,
    whatsapp: a.whatsapp || mobile,
    qualification: a.qualification || '',
    address: a.address || '',
    city: a.city || '',
    province: a.province || '',
    postalCode: a.postalCode || '',
    jobPosition,
    jobTitle: jobPosition,
    jobCategory: a.jobCategory || a.category || a.department || 'General',
    cnicFrontUrl,
    cnicBackUrl,
    applicantPhotoUrl,
    paymentScreenshotUrl,
    paymentScreenshot: paymentScreenshotUrl,
    paymentMethod: a.paymentMethod || null,
    paymentTxnId,
    trxId: paymentTxnId,
    transactionId: paymentTxnId,
    status,
    paymentStatus,
    rejectionReason: a.rejectionReason || null,
    createdAt,
    appliedAt: createdAt,
    updatedAt: a.updatedAt || new Date().toISOString()
  };
}

function getLocalApplications(): Application[] {
  try {
    const raw = localStorage.getItem('jobshub_local_applications');
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.map(normalizeApplication) : [];
  } catch {
    return [];
  }
}

function saveLocalApplication(app: Application) {
  try {
    const normalized = normalizeApplication(app);
    const existing = getLocalApplications();
    const updated = [normalized, ...existing.filter(a => a.id !== normalized.id)];
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

export async function fetchJobs(campaignSlug?: string): Promise<JobPosition[]> {
  const isKnownCampaign = campaignSlug && campaignSlug !== 'all' && JOB_CAMPAIGNS.some(c => c.slug === campaignSlug);
  const targetSlug = isKnownCampaign ? campaignSlug : 'all';
  const url = targetSlug !== 'all' ? `/api/jobs?campaign=${encodeURIComponent(targetSlug)}` : '/api/jobs';

  const filterByCampaign = (jobList: JobPosition[]) => {
    if (targetSlug === 'all') return jobList;
    const filtered = jobList.filter((j: JobPosition) =>
      (Array.isArray(j.campaigns) && j.campaigns.includes(targetSlug)) ||
      (j as any).campaign === targetSlug
    );
    return filtered.length > 0 ? filtered : jobList;
  };

  try {
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json().catch(() => null);
      if (Array.isArray(data) && data.length > 0) {
        return filterByCampaign(data);
      }
    }
  } catch (err) {
    console.warn('API /api/jobs failed, trying fallback', err);
  }

  try {
    const resStatic = await fetch('/jobs.json');
    if (resStatic.ok) {
      const dataStatic = await resStatic.json().catch(() => null);
      if (Array.isArray(dataStatic) && dataStatic.length > 0) {
        return filterByCampaign(dataStatic);
      }
    }
  } catch (err) {
    console.warn('Fallback /jobs.json failed', err);
  }

  return filterByCampaign(DEFAULT_JOBS);
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
  dob?: string;
  gender?: string;
  email: string;
  mobile: string;
  whatsapp?: string;
  qualification: string;
  address: string;
  city?: string;
  province?: string;
  postalCode: string;
  jobPosition: string;
  jobCategory?: string;
  cnicFrontUrl: string;
  cnicBackUrl: string;
  applicantPhotoUrl?: string;
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
          const normalized = normalizeApplication(data.application);
          saveLocalApplication(normalized);
          return { ...data, application: normalized };
        }
      }
    }
  } catch {
    // Fallback to local submission
  }

  const refNum = `JH-2026-${Math.floor(10000 + Math.random() * 90000)}`;
  const now = new Date().toISOString();
  const rawApp: any = {
    id: `app-${Date.now()}`,
    referenceNo: refNum,
    fullName: payload.fullName,
    fatherName: payload.fatherName,
    cnic: payload.cnic,
    dob: payload.dob || '',
    gender: payload.gender || 'Male',
    email: payload.email,
    mobile: payload.mobile,
    whatsapp: payload.whatsapp || payload.mobile,
    qualification: payload.qualification,
    address: payload.address,
    city: payload.city || '',
    province: payload.province || '',
    postalCode: payload.postalCode,
    jobPosition: payload.jobPosition,
    jobCategory: payload.jobCategory || 'General',
    cnicFrontUrl: payload.cnicFrontUrl,
    cnicBackUrl: payload.cnicBackUrl,
    applicantPhotoUrl: payload.applicantPhotoUrl || null,
    paymentScreenshotUrl: null,
    paymentMethod: null,
    paymentTxnId: null,
    status: 'Payment Pending',
    rejectionReason: null,
    createdAt: now,
    updatedAt: now
  };

  const localApp = normalizeApplication(rawApp);
  saveLocalApplication(localApp);

  return {
    message: 'Application details saved successfully',
    application: localApp
  };
}

export async function autoApproveApplication(
  applicationId: string
): Promise<{ message: string; application: Application }> {
  try {
    const res = await fetch(`/api/applications/${applicationId}/auto-approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
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
      status: 'Submitted Successfully',
      rejectionReason: null,
      updatedAt: new Date().toISOString()
    };
    saveLocalApplication(updatedApp);
    return {
      message: 'Application auto-approved successfully',
      application: updatedApp
    };
  }

  throw new Error('Application record not found');
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
  try {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const contentType = res.headers.get('content-type') || '';
    if (res.ok && contentType.includes('application/json')) {
      const data = await res.json();
      if (data && data.user && data.user.username && data.token) {
        return data;
      }
    } else if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Invalid username or password.');
    }
  } catch (err: any) {
    if (err.message && err.message !== 'Failed to fetch' && !err.message.includes('Unexpected')) {
      throw err;
    }
  }

  // Safe fallback for client / static deployment
  const expectedUser = 'umar';
  const expectedPass = 'Sho2026@';

  if (username.trim() === expectedUser && password === expectedPass) {
    return {
      token: 'admin-session-token-2026',
      user: { username: 'umar' }
    };
  }

  throw new Error('Invalid username or password.');
}

export async function fetchAdminStats(token: string): Promise<ApplicationStats> {
  try {
    const res = await fetch('/api/admin/stats', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      if (data && typeof data.totalApplications === 'number') {
        return data;
      }
    }
  } catch {
    // Fallback
  }

  const localApps = getLocalApplications();
  return {
    totalUsers: 1,
    totalJobs: DEFAULT_JOBS.length,
    totalApplications: localApps.length,
    pendingPayments: localApps.filter(a => a.status === 'Payment Verification Pending' || a.status === 'Payment Pending').length,
    approvedPayments: localApps.filter(a => a.status === 'Submitted Successfully').length,
    rejectedPayments: localApps.filter(a => a.status === 'Payment Rejected').length,
    submittedSuccessfully: localApps.filter(a => a.status === 'Submitted Successfully').length
  };
}

export async function fetchAdminApplications(
  token: string,
  status: string = 'all',
  search: string = ''
): Promise<Application[]> {
  try {
    const url = `/api/admin/applications?status=${encodeURIComponent(status)}&search=${encodeURIComponent(search)}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        return data.map(normalizeApplication);
      }
    }
  } catch {
    // Fallback
  }

  let localApps = getLocalApplications();
  if (status && status !== 'all') {
    localApps = localApps.filter(a => a.status === status);
  }
  if (search && search.trim()) {
    const s = search.toLowerCase().trim();
    localApps = localApps.filter(a =>
      (a.fullName && a.fullName.toLowerCase().includes(s)) ||
      (a.candidateName && a.candidateName.toLowerCase().includes(s)) ||
      (a.cnic && a.cnic.toLowerCase().includes(s)) ||
      (a.referenceNo && a.referenceNo.toLowerCase().includes(s)) ||
      (a.jobPosition && a.jobPosition.toLowerCase().includes(s))
    );
  }
  return localApps.map(normalizeApplication);
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

export async function fetchAdminJobs(token: string): Promise<JobPosition[]> {
  try {
    const res = await fetch('/api/admin/jobs', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) return data;
    }
  } catch (err) {
    console.warn('Failed to fetch admin jobs from API, falling back', err);
  }
  return fetchJobs();
}

export async function createAdminJob(
  token: string,
  jobData: Partial<JobPosition> & { allowDuplicate?: boolean }
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
  if (!res.ok) {
    const err = new Error(data.error || 'Failed to create job vacancy') as any;
    err.isDuplicate = data.isDuplicate;
    err.duplicateId = data.duplicateId;
    throw err;
  }
  return data;
}

export async function updateAdminJob(
  token: string,
  id: string,
  jobData: Partial<JobPosition> & { allowDuplicate?: boolean }
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
  if (!res.ok) {
    const err = new Error(data.error || 'Failed to update job vacancy') as any;
    err.isDuplicate = data.isDuplicate;
    err.duplicateId = data.duplicateId;
    throw err;
  }
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

export async function togglePublishAdminJob(
  token: string,
  id: string,
  newStatus: 'published' | 'unpublished' | 'active' | 'draft'
): Promise<{ message: string; job: JobPosition }> {
  return updateAdminJob(token, id, { status: newStatus as any });
}

export async function bulkPublishAdminJobs(
  token: string,
  ids: string[]
): Promise<{ message: string }> {
  const res = await fetch('/api/admin/jobs/bulk-publish', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ ids })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to bulk publish jobs');
  return data;
}

export async function bulkUnpublishAdminJobs(
  token: string,
  ids: string[]
): Promise<{ message: string }> {
  const res = await fetch('/api/admin/jobs/bulk-unpublish', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ ids })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to bulk unpublish jobs');
  return data;
}

export async function bulkDeleteAdminJobs(
  token: string,
  ids: string[]
): Promise<{ message: string }> {
  const res = await fetch('/api/admin/jobs/bulk-delete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ ids })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to bulk delete jobs');
  return data;
}
