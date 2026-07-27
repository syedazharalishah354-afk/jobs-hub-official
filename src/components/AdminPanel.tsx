import React, { useState, useEffect } from 'react';
import { SystemSettings, Application, ApplicationStats, JobPosition } from '../types.js';
import {
  adminLogin,
  fetchAdminStats,
  fetchAdminApplications,
  verifyApplicationPayment,
  updateSystemSettings,
  changeAdminPassword,
  fetchJobs,
  createAdminJob,
  updateAdminJob,
  deleteAdminJob
} from '../services/api.js';
import {
  Lock,
  LogOut,
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  Search,
  Filter,
  Eye,
  ShieldCheck,
  Settings,
  Key,
  DollarSign,
  Upload,
  RefreshCw,
  AlertCircle,
  ChevronRight,
  ExternalLink,
  X,
  Plus,
  Trash2,
  Edit3,
  Briefcase,
  GraduationCap,
  MapPin
} from 'lucide-react';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshConfig?: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ isOpen, onClose, onRefreshConfig }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('admin_token'));
  const [adminUsername, setAdminUsername] = useState<string>('umar');

  // Login Form State
  const [loginUser, setLoginUser] = useState('umar');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);

  // Active Admin Tab
  const [activeTab, setActiveTab] = useState<'dashboard' | 'applications' | 'jobs' | 'settings' | 'security'>('dashboard');

  // Stats & Applications State
  const [stats, setStats] = useState<ApplicationStats | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loadingApps, setLoadingApps] = useState(false);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Job Management State
  const [jobs, setJobs] = useState<JobPosition[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [jobSearchQuery, setJobSearchQuery] = useState('');
  const [jobQualFilter, setJobQualFilter] = useState('all');
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Partial<JobPosition> | null>(null);
  const [savingJob, setSavingJob] = useState(false);

  // Selected Application for Review Modal
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [zoomImage, setZoomImage] = useState<string | null>(null);

  // Settings Form State
  const [settingsForm, setSettingsForm] = useState<SystemSettings | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState<string | null>(null);

  // Password Form State
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [passSuccess, setPassSuccess] = useState<string | null>(null);
  const [passError, setPassError] = useState<string | null>(null);
  const [changingPass, setChangingPass] = useState(false);

  // Load Admin Data on Auth
  useEffect(() => {
    if (token) {
      loadStats();
      loadApplications();
      loadSettings();
      loadAdminJobs();
    }
  }, [token, selectedStatusFilter]);

  const loadAdminJobs = async () => {
    setLoadingJobs(true);
    try {
      const data = await fetchJobs();
      setJobs(data);
    } catch (err) {
      console.error('Error fetching jobs in admin', err);
    } finally {
      setLoadingJobs(false);
    }
  };

  const handleOpenAddJob = () => {
    setEditingJob({
      title: '',
      department: 'Digital Support Services',
      minQualification: 'Primary',
      qualificationRequired: 'Primary / Middle or Higher',
      jobType: 'Freelance / Remote',
      ageLimit: '18 - 40 Years',
      vacancies: 10,
      location: 'Remote / Online',
      salaryRange: 'PKR 25,000 - 35,000 / month',
      deadline: '2026-12-31',
      description: '',
      requiredSkills: [],
      status: 'active'
    });
    setIsJobModalOpen(true);
  };

  const handleOpenEditJob = (job: JobPosition) => {
    setEditingJob({ ...job });
    setIsJobModalOpen(true);
  };

  const handleSaveJobSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !editingJob || !editingJob.title) return;

    setSavingJob(true);
    try {
      if (editingJob.id) {
        await updateAdminJob(token, editingJob.id, editingJob);
      } else {
        await createAdminJob(token, editingJob);
      }
      setIsJobModalOpen(false);
      setEditingJob(null);
      await loadAdminJobs();
      if (onRefreshConfig) onRefreshConfig();
      alert('Job vacancy saved successfully.');
    } catch (err: any) {
      alert(err.message || 'Failed to save job');
    } finally {
      setSavingJob(false);
    }
  };

  const handleDeleteJob = async (jobId: string, jobTitle: string) => {
    if (!token) return;
    if (!confirm(`Are you sure you want to delete job "${jobTitle}"?`)) return;

    try {
      await deleteAdminJob(token, jobId);
      await loadAdminJobs();
      if (onRefreshConfig) onRefreshConfig();
      alert(`Job "${jobTitle}" deleted successfully.`);
    } catch (err: any) {
      alert(err.message || 'Failed to delete job');
    }
  };

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoggingIn(true);
    setLoginError(null);
    try {
      const res = await adminLogin(loginUser, loginPass);
      localStorage.setItem('admin_token', res.token);
      setToken(res.token);
      setAdminUsername(res.user.username);
    } catch (err: any) {
      setLoginError(err.message || 'Invalid username or password.');
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    setToken(null);
    setSelectedApp(null);
  };

  const loadStats = async () => {
    if (!token) return;
    try {
      const data = await fetchAdminStats(token);
      setStats(data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadApplications = async () => {
    if (!token) return;
    setLoadingApps(true);
    try {
      const data = await fetchAdminApplications(token, selectedStatusFilter, searchQuery);
      setApplications(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingApps(false);
    }
  };

  const loadSettings = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/admin/settings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSettingsForm(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleVerify = async (action: 'approve' | 'reject') => {
    if (!token || !selectedApp) return;
    if (action === 'reject' && !rejectionReason.trim()) {
      alert('Please provide a reason for payment rejection.');
      return;
    }

    setVerifying(true);
    try {
      const res = await verifyApplicationPayment(token, selectedApp.id, action, rejectionReason);
      setSelectedApp(res.application);
      setRejectionReason('');
      await loadStats();
      await loadApplications();
      alert(res.message);
    } catch (err: any) {
      alert(err.message || 'Verification failed');
    } finally {
      setVerifying(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !settingsForm) return;

    setSavingSettings(true);
    setSettingsSuccess(null);

    try {
      await updateSystemSettings(token, settingsForm);
      setSettingsSuccess('Payment configuration and application fee updated successfully.');
      if (onRefreshConfig) onRefreshConfig();
    } catch (err: any) {
      alert(err.message || 'Failed to save settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleChangePass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setChangingPass(true);
    setPassError(null);
    setPassSuccess(null);

    try {
      await changeAdminPassword(token, currentPass, newPass);
      setPassSuccess('Admin password updated successfully.');
      setCurrentPass('');
      setNewPass('');
    } catch (err: any) {
      setPassError(err.message || 'Password update failed.');
    } finally {
      setChangingPass(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6 flex flex-col max-h-[92vh]">
        
        {/* Top Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base tracking-tight">JobsHubOfficial Admin Control Portal</h3>
              <p className="text-xs text-slate-400">Application Management &amp; Payment Verification</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {token && (
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ================= LOGIN FORM IF NOT AUTHENTICATED ================= */}
        {!token ? (
          <div className="p-8 max-w-md mx-auto w-full space-y-6 my-auto">
            <div className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-extrabold text-slate-900">Administrator Login</h4>
              <p className="text-xs text-slate-500 mt-1">Authorized personnel authentication required</p>
            </div>

            {loginError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Admin Username</label>
                <input
                  type="text"
                  required
                  value={loginUser}
                  onChange={(e) => setLoginUser(e.target.value)}
                  placeholder="Enter admin username"
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={loginPass}
                  onChange={(e) => setLoginPass(e.target.value)}
                  placeholder="Enter password"
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <button
                type="submit"
                disabled={loggingIn}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                {loggingIn ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                <span>Login to Admin Panel</span>
              </button>
            </form>
          </div>
        ) : (
          /* ================= MAIN ADMIN DASHBOARD CONTENT ================= */
          <div className="flex-1 flex flex-col overflow-hidden">
            
            {/* Admin Tabs Bar */}
            <div className="bg-slate-100 border-b border-slate-200 px-6 py-2 flex gap-2 overflow-x-auto text-xs font-semibold shrink-0">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`px-4 py-2 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
                  activeTab === 'dashboard' ? 'bg-white text-blue-900 shadow-xs font-bold' : 'text-slate-600 hover:bg-slate-200/60'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Dashboard Overview</span>
              </button>

              <button
                onClick={() => setActiveTab('applications')}
                className={`px-4 py-2 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
                  activeTab === 'applications' ? 'bg-white text-blue-900 shadow-xs font-bold' : 'text-slate-600 hover:bg-slate-200/60'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Manage Applications</span>
              </button>

              <button
                onClick={() => setActiveTab('jobs')}
                className={`px-4 py-2 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
                  activeTab === 'jobs' ? 'bg-white text-blue-900 shadow-xs font-bold' : 'text-slate-600 hover:bg-slate-200/60'
                }`}
              >
                <Briefcase className="w-4 h-4" />
                <span>Manage Job Vacancies ({jobs.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('settings')}
                className={`px-4 py-2 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
                  activeTab === 'settings' ? 'bg-white text-blue-900 shadow-xs font-bold' : 'text-slate-600 hover:bg-slate-200/60'
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>Payment &amp; Fee Setup</span>
              </button>

              <button
                onClick={() => setActiveTab('security')}
                className={`px-4 py-2 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
                  activeTab === 'security' ? 'bg-white text-blue-900 shadow-xs font-bold' : 'text-slate-600 hover:bg-slate-200/60'
                }`}
              >
                <Key className="w-4 h-4" />
                <span>Security Settings</span>
              </button>
            </div>

            {/* Scrollable Tab Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">

              {/* ----------------- TAB 1: DASHBOARD STATS ----------------- */}
              {activeTab === 'dashboard' && stats && (
                <div className="space-y-6">
                  
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    
                    <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-200">
                      <span className="text-[11px] font-semibold text-indigo-800 block">Total Registered Users</span>
                      <div className="text-2xl font-black text-indigo-950 mt-1">{stats.totalUsers || 0}</div>
                    </div>

                    <div className="bg-purple-50 p-4 rounded-xl border border-purple-200">
                      <span className="text-[11px] font-semibold text-purple-800 block">Total Job Openings</span>
                      <div className="text-2xl font-black text-purple-950 mt-1">{stats.totalJobs || jobs.length || 0}</div>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <span className="text-[11px] font-semibold text-slate-500 block">Total Applications</span>
                      <div className="text-2xl font-black text-slate-900 mt-1">{stats.totalApplications}</div>
                    </div>

                    <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
                      <span className="text-[11px] font-semibold text-amber-800 block">Pending Payments</span>
                      <div className="text-2xl font-black text-amber-950 mt-1">{stats.pendingPayments}</div>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                      <span className="text-[11px] font-semibold text-blue-800 block">Approved Payments</span>
                      <div className="text-2xl font-black text-blue-950 mt-1">{stats.approvedPayments}</div>
                    </div>

                    <div className="bg-rose-50 p-4 rounded-xl border border-rose-200">
                      <span className="text-[11px] font-semibold text-rose-800 block">Rejected Payments</span>
                      <div className="text-2xl font-black text-rose-950 mt-1">{stats.rejectedPayments}</div>
                    </div>

                    <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 col-span-2">
                      <span className="text-[11px] font-semibold text-emerald-800 block">Submitted Successfully</span>
                      <div className="text-2xl font-black text-emerald-950 mt-1">{stats.submittedSuccessfully}</div>
                    </div>

                  </div>

                  {/* Quick Action Banner */}
                  <div className="bg-blue-900 text-white p-6 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                      <h4 className="font-bold text-base">Pending Verification Queue</h4>
                      <p className="text-xs text-blue-200 mt-1">
                        There are {stats.pendingPayments} applications waiting for payment screenshot verification.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedStatusFilter('Payment Verification Pending');
                        setActiveTab('applications');
                      }}
                      className="px-5 py-2.5 bg-white text-blue-900 font-bold text-xs rounded-xl hover:bg-blue-50 transition-colors shrink-0 cursor-pointer"
                    >
                      Review Pending Applications
                    </button>
                  </div>

                </div>
              )}

              {/* ----------------- TAB 2: APPLICATION MANAGEMENT TABLE ----------------- */}
              {activeTab === 'applications' && (
                <div className="space-y-4">
                  
                  {/* Search and Filter Controls */}
                  <div className="flex flex-col sm:flex-row gap-3 justify-between items-center bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <div className="relative w-full sm:w-80">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyUp={(e) => e.key === 'Enter' && loadApplications()}
                        placeholder="Search name, CNIC, or Ref #..."
                        className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-300 bg-white"
                      />
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
                      <span className="text-xs text-slate-500 font-medium">Status:</span>
                      <select
                        value={selectedStatusFilter}
                        onChange={(e) => setSelectedStatusFilter(e.target.value)}
                        className="text-xs px-3 py-2 rounded-lg border border-slate-300 bg-white font-medium text-slate-800"
                      >
                        <option value="all">All Statuses</option>
                        <option value="Payment Verification Pending">Pending Verification</option>
                        <option value="Submitted Successfully">Submitted Successfully</option>
                        <option value="Payment Rejected">Payment Rejected</option>
                        <option value="Payment Pending">Payment Pending</option>
                      </select>
                      <button
                        onClick={loadApplications}
                        className="p-2 rounded-lg bg-blue-600 text-white"
                        title="Reload"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Table */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
                          <tr>
                            <th className="p-3">Ref #</th>
                            <th className="p-3">Applicant Name</th>
                            <th className="p-3">CNIC &amp; Mobile</th>
                            <th className="p-3">Job Position</th>
                            <th className="p-3">Method</th>
                            <th className="p-3">Status</th>
                            <th className="p-3 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {loadingApps ? (
                            <tr>
                              <td colSpan={7} className="text-center py-8 text-slate-500">
                                <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-1 text-blue-600" />
                                Loading application records...
                              </td>
                            </tr>
                          ) : applications.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="text-center py-8 text-slate-500">
                                No applications match the selected criteria.
                              </td>
                            </tr>
                          ) : (
                            applications.map((app) => (
                              <tr key={app.id} className="hover:bg-slate-50/80 transition-colors">
                                <td className="p-3 font-bold text-blue-900">{app.referenceNo}</td>
                                <td className="p-3 font-medium text-slate-900">
                                  {app.fullName}
                                  <span className="block text-[10px] text-slate-400">Father: {app.fatherName}</span>
                                </td>
                                <td className="p-3 text-slate-700">
                                  {app.cnic}
                                  <span className="block text-[10px] text-slate-400">{app.mobile}</span>
                                </td>
                                <td className="p-3 font-medium text-slate-800">{app.jobPosition}</td>
                                <td className="p-3 text-slate-600 font-semibold">{app.paymentMethod || 'N/A'}</td>
                                <td className="p-3">
                                  {app.status === 'Submitted Successfully' && (
                                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">Submitted</span>
                                  )}
                                  {app.status === 'Payment Verification Pending' && (
                                    <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold text-[10px]">Pending Verification</span>
                                  )}
                                  {app.status === 'Payment Rejected' && (
                                    <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-bold text-[10px]">Rejected</span>
                                  )}
                                  {app.status === 'Payment Pending' && (
                                    <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[10px]">Payment Pending</span>
                                  )}
                                </td>
                                <td className="p-3 text-right">
                                  <button
                                    onClick={() => setSelectedApp(app)}
                                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded text-[11px] flex items-center gap-1 ml-auto cursor-pointer"
                                  >
                                    <Eye className="w-3 h-3" />
                                    Review
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>
              )}

              {/* ----------------- TAB: JOB VACANCIES MANAGEMENT ----------------- */}
              {activeTab === 'jobs' && (
                <div className="space-y-6">
                  {/* Top Action & Filter Header */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <div className="relative w-full sm:w-64">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          placeholder="Search job title or skills..."
                          value={jobSearchQuery}
                          onChange={(e) => setJobSearchQuery(e.target.value)}
                          className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-200 bg-white"
                        />
                      </div>

                      <select
                        value={jobQualFilter}
                        onChange={(e) => setJobQualFilter(e.target.value)}
                        className="text-xs px-3 py-2 rounded-lg border border-slate-200 bg-white font-medium"
                      >
                        <option value="all">All Qualifications</option>
                        <option value="Primary">Primary / Middle</option>
                        <option value="Matric">Matric</option>
                        <option value="Intermediate">Intermediate &amp; Above</option>
                      </select>
                    </div>

                    <button
                      onClick={handleOpenAddJob}
                      className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add New Job Vacancy</span>
                    </button>
                  </div>

                  {/* Jobs List Table */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100 border-b border-slate-200 text-slate-600 uppercase text-[10px] font-bold tracking-wider">
                          <tr>
                            <th className="p-3">Job Title &amp; Dept</th>
                            <th className="p-3">Min Qualification</th>
                            <th className="p-3">Type &amp; Vacancies</th>
                            <th className="p-3">Salary Range</th>
                            <th className="p-3">Status</th>
                            <th className="p-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {jobs
                            .filter(j => {
                              const matchQ = jobSearchQuery.toLowerCase();
                              const matchesSearch =
                                j.title.toLowerCase().includes(matchQ) ||
                                j.department.toLowerCase().includes(matchQ) ||
                                (j.requiredSkills && j.requiredSkills.some(s => s.toLowerCase().includes(matchQ)));

                              if (!matchesSearch) return false;
                              if (jobQualFilter === 'Primary') return j.minQualification === 'Primary' || j.minQualification === 'Middle';
                              if (jobQualFilter === 'Matric') return j.minQualification === 'Matric';
                              if (jobQualFilter === 'Intermediate') return j.minQualification !== 'Primary' && j.minQualification !== 'Middle' && j.minQualification !== 'Matric';
                              return true;
                            })
                            .map(job => (
                              <tr key={job.id} className="hover:bg-slate-50 transition-colors">
                                <td className="p-3">
                                  <div className="font-bold text-slate-900">{job.title}</div>
                                  <div className="text-[10px] text-slate-500">{job.department}</div>
                                </td>
                                <td className="p-3">
                                  <span className="px-2.5 py-1 bg-blue-50 text-blue-900 font-bold rounded-md border border-blue-100 text-[11px]">
                                    {job.minQualification}
                                  </span>
                                </td>
                                <td className="p-3">
                                  <div className="text-slate-800 font-medium">{job.jobType}</div>
                                  <div className="text-[10px] text-emerald-700 font-bold">{job.vacancies} Posts</div>
                                </td>
                                <td className="p-3 font-semibold text-slate-700">
                                  {job.salaryRange}
                                </td>
                                <td className="p-3">
                                  {job.status === 'active' ? (
                                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">Active</span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-bold text-[10px]">Closed</span>
                                  )}
                                </td>
                                <td className="p-3 text-right space-x-1 whitespace-nowrap">
                                  <button
                                    onClick={() => handleOpenEditJob(job)}
                                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded text-[11px] inline-flex items-center gap-1 cursor-pointer"
                                  >
                                    <Edit3 className="w-3 h-3 text-blue-600" />
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDeleteJob(job.id, job.title)}
                                    className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded text-[11px] inline-flex items-center gap-1 cursor-pointer"
                                  >
                                    <Trash2 className="w-3 h-3 text-rose-600" />
                                    Delete
                                  </button>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ----------------- TAB 3: SETTINGS FORM ----------------- */}
              {activeTab === 'settings' && settingsForm && (
                <form onSubmit={handleSaveSettings} className="space-y-6 max-w-2xl text-xs">
                  
                  {settingsSuccess && (
                    <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{settingsSuccess}</span>
                    </div>
                  )}

                  {/* Application Fee */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                    <label className="block font-bold text-slate-900 text-sm">Application Fee Amount (PKR)</label>
                    <input
                      type="number"
                      min={0}
                      value={settingsForm.applicationFee}
                      onChange={(e) => setSettingsForm({ ...settingsForm, applicationFee: Number(e.target.value) })}
                      className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white"
                    />
                  </div>

                  {/* JazzCash Configuration */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                    <h4 className="font-bold text-blue-900 text-sm">JazzCash Payment Details</h4>
                    
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Account Title</label>
                      <input
                        type="text"
                        value={settingsForm.jazzcash.accountTitle}
                        onChange={(e) => setSettingsForm({
                          ...settingsForm,
                          jazzcash: { ...settingsForm.jazzcash, accountTitle: e.target.value }
                        })}
                        className="w-full text-xs px-3.5 py-2 rounded-lg border border-slate-300 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Account Number</label>
                      <input
                        type="text"
                        value={settingsForm.jazzcash.accountNumber}
                        onChange={(e) => setSettingsForm({
                          ...settingsForm,
                          jazzcash: { ...settingsForm.jazzcash, accountNumber: e.target.value }
                        })}
                        className="w-full text-xs px-3.5 py-2 rounded-lg border border-slate-300 bg-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Payment Instructions</label>
                      <textarea
                        rows={2}
                        value={settingsForm.jazzcash.instructions}
                        onChange={(e) => setSettingsForm({
                          ...settingsForm,
                          jazzcash: { ...settingsForm.jazzcash, instructions: e.target.value }
                        })}
                        className="w-full text-xs p-3 rounded-lg border border-slate-300 bg-white"
                      />
                    </div>
                  </div>

                  {/* Easypaisa Configuration */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                    <h4 className="font-bold text-emerald-900 text-sm">Easypaisa Payment Details</h4>
                    
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Account Title</label>
                      <input
                        type="text"
                        value={settingsForm.easypaisa.accountTitle}
                        onChange={(e) => setSettingsForm({
                          ...settingsForm,
                          easypaisa: { ...settingsForm.easypaisa, accountTitle: e.target.value }
                        })}
                        className="w-full text-xs px-3.5 py-2 rounded-lg border border-slate-300 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Account Number</label>
                      <input
                        type="text"
                        value={settingsForm.easypaisa.accountNumber}
                        onChange={(e) => setSettingsForm({
                          ...settingsForm,
                          easypaisa: { ...settingsForm.easypaisa, accountNumber: e.target.value }
                        })}
                        className="w-full text-xs px-3.5 py-2 rounded-lg border border-slate-300 bg-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Payment Instructions</label>
                      <textarea
                        rows={2}
                        value={settingsForm.easypaisa.instructions}
                        onChange={(e) => setSettingsForm({
                          ...settingsForm,
                          easypaisa: { ...settingsForm.easypaisa, instructions: e.target.value }
                        })}
                        className="w-full text-xs p-3 rounded-lg border border-slate-300 bg-white"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={savingSettings}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
                  >
                    {savingSettings && <RefreshCw className="w-4 h-4 animate-spin" />}
                    <span>Save Payment Configuration</span>
                  </button>

                </form>
              )}

              {/* ----------------- TAB 4: SECURITY / CHANGE PASSWORD ----------------- */}
              {activeTab === 'security' && (
                <form onSubmit={handleChangePass} className="space-y-4 max-w-md text-xs">
                  <h4 className="font-bold text-slate-900 text-sm">Update Admin Account Password</h4>

                  {passSuccess && (
                    <div className="p-3 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-200">
                      {passSuccess}
                    </div>
                  )}

                  {passError && (
                    <div className="p-3 rounded-xl bg-rose-50 text-rose-900 border border-rose-200">
                      {passError}
                    </div>
                  )}

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Current Password</label>
                    <input
                      type="password"
                      required
                      value={currentPass}
                      onChange={(e) => setCurrentPass(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-300"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">New Password</label>
                    <input
                      type="password"
                      required
                      value={newPass}
                      onChange={(e) => setNewPass(e.target.value)}
                      placeholder="Minimum 6 characters"
                      className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-300"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={changingPass}
                    className="px-6 py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 cursor-pointer"
                  >
                    {changingPass ? 'Updating Password...' : 'Update Password'}
                  </button>
                </form>
              )}

            </div>

          </div>
        )}

        {/* ================= APPLICATION REVIEW DETAIL MODAL ================= */}
        {selectedApp && (
          <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden my-6 flex flex-col max-h-[90vh]">
              
              <div className="bg-blue-900 text-white px-5 py-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-200 block">Reviewing Application</span>
                  <h3 className="text-base font-bold">REF: {selectedApp.referenceNo}</h3>
                </div>
                <button
                  onClick={() => setSelectedApp(null)}
                  className="p-1 rounded text-blue-200 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-800">
                
                {/* Dossier Details */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Applicant Name</span>
                    <strong className="text-slate-900 font-bold">{selectedApp.fullName}</strong>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px]">Father's Name</span>
                    <strong className="text-slate-900 font-bold">{selectedApp.fatherName}</strong>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px]">CNIC Number</span>
                    <strong className="text-slate-900 font-bold">{selectedApp.cnic}</strong>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px]">Email Address</span>
                    <span>{selectedApp.email}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px]">Mobile Number</span>
                    <span>{selectedApp.mobile}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px]">Qualification</span>
                    <span>{selectedApp.qualification}</span>
                  </div>

                  <div className="col-span-2">
                    <span className="text-slate-400 block text-[10px]">Complete Address</span>
                    <span>{selectedApp.address} ({selectedApp.postalCode})</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px]">Applied Position</span>
                    <strong className="text-blue-900 font-bold">{selectedApp.jobPosition}</strong>
                  </div>
                </div>

                {/* Document Images */}
                <div>
                  <h4 className="font-bold text-slate-900 text-xs mb-3">Uploaded Verification Documents</h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* CNIC Front */}
                    <div className="border border-slate-200 p-2 rounded-xl bg-slate-50 text-center">
                      <span className="text-[10px] font-bold text-slate-600 block mb-1">CNIC Front Picture</span>
                      {selectedApp.cnicFrontUrl ? (
                        <img
                          src={selectedApp.cnicFrontUrl}
                          alt="CNIC Front"
                          onClick={() => setZoomImage(selectedApp.cnicFrontUrl)}
                          className="h-28 w-full object-cover rounded border cursor-pointer hover:opacity-90"
                        />
                      ) : (
                        <p className="text-slate-400 text-[10px] py-8">Not Provided</p>
                      )}
                    </div>

                    {/* CNIC Back */}
                    <div className="border border-slate-200 p-2 rounded-xl bg-slate-50 text-center">
                      <span className="text-[10px] font-bold text-slate-600 block mb-1">CNIC Back Picture</span>
                      {selectedApp.cnicBackUrl ? (
                        <img
                          src={selectedApp.cnicBackUrl}
                          alt="CNIC Back"
                          onClick={() => setZoomImage(selectedApp.cnicBackUrl)}
                          className="h-28 w-full object-cover rounded border cursor-pointer hover:opacity-90"
                        />
                      ) : (
                        <p className="text-slate-400 text-[10px] py-8">Not Provided</p>
                      )}
                    </div>

                    {/* Payment Screenshot */}
                    <div className="border border-blue-200 p-2 rounded-xl bg-blue-50/50 text-center">
                      <span className="text-[10px] font-bold text-blue-900 block mb-1">Payment Screenshot Proof</span>
                      {selectedApp.paymentScreenshotUrl ? (
                        <img
                          src={selectedApp.paymentScreenshotUrl}
                          alt="Payment Proof"
                          onClick={() => setZoomImage(selectedApp.paymentScreenshotUrl)}
                          className="h-28 w-full object-cover rounded border border-blue-300 cursor-pointer hover:opacity-90"
                        />
                      ) : (
                        <p className="text-slate-400 text-[10px] py-8">No Proof Uploaded</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Verification Action Box */}
                <div className="bg-slate-100 p-4 rounded-xl border border-slate-300 space-y-3">
                  <h4 className="font-bold text-slate-900 text-xs">Admin Verification Actions</h4>
                  
                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    
                    <button
                      onClick={() => handleVerify('approve')}
                      disabled={verifying}
                      className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Approve Payment &amp; Mark Submitted</span>
                    </button>

                    <div className="flex-1 w-full space-y-1">
                      <input
                        type="text"
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="Rejection reason (e.g. Blurry image, Fee incomplete)"
                        className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 bg-white"
                      />
                    </div>

                    <button
                      onClick={() => handleVerify('reject')}
                      disabled={verifying}
                      className="w-full sm:w-auto px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-xs shrink-0"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Reject Payment</span>
                    </button>

                  </div>
                </div>

              </div>

            </div>
          </div>
        )}

        {/* Zoom Image Viewer Modal */}
        {zoomImage && (
          <div
            onClick={() => setZoomImage(null)}
            className="fixed inset-0 z-70 bg-black/90 flex items-center justify-center p-4 cursor-zoom-out"
          >
            <img src={zoomImage} alt="Zoomed Document" className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg" />
          </div>
        )}

        {/* Job Vacancy Add / Edit Modal */}
        {isJobModalOpen && editingJob && (
          <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6 flex flex-col max-h-[90vh]">
              <div className="bg-blue-950 text-white p-5 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold">
                    {editingJob.id ? 'Edit Job Vacancy' : 'Create New Job Vacancy'}
                  </h3>
                  <p className="text-xs text-blue-200">
                    Configure qualification access rules and vacancy specifications
                  </p>
                </div>
                <button
                  onClick={() => setIsJobModalOpen(false)}
                  className="p-1 rounded-lg text-blue-200 hover:text-white hover:bg-blue-900 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveJobSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* Job Title */}
                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-800 mb-1">Job Title *</label>
                    <input
                      type="text"
                      required
                      value={editingJob.title || ''}
                      onChange={(e) => setEditingJob({ ...editingJob, title: e.target.value })}
                      placeholder="e.g. Data Entry Operator"
                      className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  {/* Department */}
                  <div>
                    <label className="block font-bold text-slate-800 mb-1">Department</label>
                    <input
                      type="text"
                      value={editingJob.department || ''}
                      onChange={(e) => setEditingJob({ ...editingJob, department: e.target.value })}
                      placeholder="e.g. Admin Support Services"
                      className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-300"
                    />
                  </div>

                  {/* Minimum Qualification */}
                  <div>
                    <label className="block font-bold text-slate-800 mb-1">Minimum Qualification Level *</label>
                    <select
                      value={editingJob.minQualification || 'Primary'}
                      onChange={(e) => {
                        const val = e.target.value;
                        setEditingJob({
                          ...editingJob,
                          minQualification: val,
                          qualificationRequired: editingJob.qualificationRequired || `${val} or Higher`
                        });
                      }}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 font-bold bg-slate-50"
                    >
                      <option value="Primary">Primary (Level 1 Access)</option>
                      <option value="Middle">Middle (Level 1 Access)</option>
                      <option value="Matric">Matric (Level 2 Access)</option>
                      <option value="Intermediate">Intermediate (Level 3 Access)</option>
                      <option value="Diploma">Diploma (Level 3 Access)</option>
                      <option value="Technical Diploma">Technical Diploma (Level 3 Access)</option>
                      <option value="Certification">Certification (Level 3 Access)</option>
                      <option value="Associate Degree">Associate Degree (Level 3 Access)</option>
                      <option value="Bachelor">Bachelor (Level 3 Access)</option>
                      <option value="BS">BS (Level 3 Access)</option>
                      <option value="Master">Master (Level 3 Access)</option>
                      <option value="Other Higher Qualification">Other Higher Qualification (Level 3 Access)</option>
                    </select>
                  </div>

                  {/* Qualification Required Text */}
                  <div>
                    <label className="block font-bold text-slate-800 mb-1">Displayed Required Qualification</label>
                    <input
                      type="text"
                      value={editingJob.qualificationRequired || ''}
                      onChange={(e) => setEditingJob({ ...editingJob, qualificationRequired: e.target.value })}
                      placeholder="e.g. Primary / Middle or Higher"
                      className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-300"
                    />
                  </div>

                  {/* Job Type */}
                  <div>
                    <label className="block font-bold text-slate-800 mb-1">Job Type</label>
                    <input
                      type="text"
                      value={editingJob.jobType || ''}
                      onChange={(e) => setEditingJob({ ...editingJob, jobType: e.target.value })}
                      placeholder="e.g. Freelance / Remote"
                      className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-300"
                    />
                  </div>

                  {/* Salary Range */}
                  <div>
                    <label className="block font-bold text-slate-800 mb-1">Salary / Pay Range</label>
                    <input
                      type="text"
                      value={editingJob.salaryRange || ''}
                      onChange={(e) => setEditingJob({ ...editingJob, salaryRange: e.target.value })}
                      placeholder="e.g. PKR 25,000 - 35,000 / month"
                      className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-300 font-bold text-emerald-800"
                    />
                  </div>

                  {/* Vacancies */}
                  <div>
                    <label className="block font-bold text-slate-800 mb-1">Vacancies Count</label>
                    <input
                      type="number"
                      min={1}
                      value={editingJob.vacancies || 10}
                      onChange={(e) => setEditingJob({ ...editingJob, vacancies: Number(e.target.value) })}
                      className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-300"
                    />
                  </div>

                  {/* Location */}
                  <div>
                    <label className="block font-bold text-slate-800 mb-1">Location</label>
                    <input
                      type="text"
                      value={editingJob.location || ''}
                      onChange={(e) => setEditingJob({ ...editingJob, location: e.target.value })}
                      placeholder="e.g. Remote / Online"
                      className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-300"
                    />
                  </div>

                  {/* Deadline */}
                  <div>
                    <label className="block font-bold text-slate-800 mb-1">Application Deadline</label>
                    <input
                      type="text"
                      value={editingJob.deadline || ''}
                      onChange={(e) => setEditingJob({ ...editingJob, deadline: e.target.value })}
                      placeholder="2026-12-31"
                      className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-300"
                    />
                  </div>

                  {/* Required Skills */}
                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-800 mb-1">Required Skills (comma separated)</label>
                    <input
                      type="text"
                      value={Array.isArray(editingJob.requiredSkills) ? editingJob.requiredSkills.join(', ') : (editingJob.requiredSkills || '')}
                      onChange={(e) => setEditingJob({ ...editingJob, requiredSkills: e.target.value.split(',').map(s => s.trim()) })}
                      placeholder="e.g. Typing Speed, MS Word, Data Verification"
                      className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-300"
                    />
                  </div>

                  {/* Job Description */}
                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-800 mb-1">Job Description</label>
                    <textarea
                      rows={3}
                      value={editingJob.description || ''}
                      onChange={(e) => setEditingJob({ ...editingJob, description: e.target.value })}
                      placeholder="Detailed responsibilities and requirements..."
                      className="w-full text-xs p-3 rounded-xl border border-slate-300"
                    />
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block font-bold text-slate-800 mb-1">Status</label>
                    <select
                      value={editingJob.status || 'active'}
                      onChange={(e) => setEditingJob({ ...editingJob, status: e.target.value as 'active' | 'closed' })}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 font-bold"
                    >
                      <option value="active">Active (Accepting Applications)</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>

                </div>

                <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsJobModalOpen(false)}
                    className="px-4 py-2 text-slate-600 hover:text-slate-900 font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingJob}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
                  >
                    {savingJob && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    <span>{editingJob.id ? 'Update Job Vacancy' : 'Create Job Vacancy'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
