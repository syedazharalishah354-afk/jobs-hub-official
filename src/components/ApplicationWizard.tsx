import React, { useState, useEffect } from 'react';
import { SystemSettings, Application, JobPosition } from '../types.js';
import { submitApplicationStep1, submitPaymentProof, uploadImageFile, fetchApplicationById } from '../services/api.js';
import { isJobUnlocked, QUALIFICATION_CATEGORIES } from '../utils/qualification.js';
import { X, CheckCircle2, User, Mail, Phone, MapPin, GraduationCap, FileText, Upload, Copy, Check, Clock, ShieldCheck, Printer, AlertTriangle, ArrowRight, ArrowLeft, RefreshCw, Sparkles, Building, Briefcase } from 'lucide-react';

interface ApplicationWizardProps {
  isOpen: boolean;
  onClose: () => void;
  config: SystemSettings;
  jobs: JobPosition[];
  initialPosition?: string;
  initialQualification?: string;
  onViewSlip?: (app: Application) => void;
  currentUser?: { id: string; fullName: string; email: string; cnic: string } | null;
}

export const ApplicationWizard: React.FC<ApplicationWizardProps> = ({
  isOpen,
  onClose,
  config,
  jobs,
  initialPosition,
  initialQualification,
  onViewSlip,
  currentUser
}) => {
  // Wizard Stage: 1 = Personal Info, 2 = Payment, 3 = Under Verification, 4 = Final Submitted Slip
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [submittedApp, setSubmittedApp] = useState<Application | null>(null);

  // Form Fields for Step 1
  const [qualification, setQualification] = useState<string>(() => {
    return initialQualification || localStorage.getItem('user_qualification') || 'Matric';
  });

  // Ensure jobs list exists
  const availableJobsList = jobs && jobs.length > 0 ? jobs : [];

  // Filter available jobs based on selected qualification
  const unlockedJobs = availableJobsList.filter(j => isJobUnlocked(qualification, j.minQualification));
  
  // Options to render in the dropdown (fallback to availableJobsList if unlockedJobs is empty)
  const displayedJobsOptions = unlockedJobs.length > 0 ? unlockedJobs : availableJobsList;

  const [jobPosition, setJobPosition] = useState<string>(() => {
    if (initialPosition) return initialPosition;
    return displayedJobsOptions.length > 0 ? displayedJobsOptions[0].title : 'Data Entry Operator';
  });

  const [fullName, setFullName] = useState(currentUser?.fullName || '');
  const [fatherName, setFatherName] = useState('');
  const [cnic, setCnic] = useState(currentUser?.cnic || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [mobile, setMobile] = useState('');
  const [address, setAddress] = useState('');
  const [postalCode, setPostalCode] = useState('');

  // Files for Step 1
  const [cnicFrontFile, setCnicFrontFile] = useState<File | null>(null);
  const [cnicFrontPreview, setCnicFrontPreview] = useState<string | null>(null);
  const [cnicBackFile, setCnicBackFile] = useState<File | null>(null);
  const [cnicBackPreview, setCnicBackPreview] = useState<string | null>(null);

  // Validation Errors
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submittingStep1, setSubmittingStep1] = useState(false);

  // Form Fields for Step 2
  const [paymentMethod, setPaymentMethod] = useState<'JazzCash' | 'Easypaisa'>('JazzCash');
  const [paymentScreenshotFile, setPaymentScreenshotFile] = useState<File | null>(null);
  const [paymentScreenshotPreview, setPaymentScreenshotPreview] = useState<string | null>(null);
  const [paymentTxnId, setPaymentTxnId] = useState('');
  const [submittingStep2, setSubmittingStep2] = useState(false);
  const [step2Error, setStep2Error] = useState<string | null>(null);

  // Copy Feedback
  const [copiedAccount, setCopiedAccount] = useState(false);

  // Poll status when in Step 3
  const [pollingStatus, setPollingStatus] = useState(false);

  useEffect(() => {
    if (currentUser) {
      if (!fullName) setFullName(currentUser.fullName);
      if (!email) setEmail(currentUser.email);
      if (!cnic) setCnic(currentUser.cnic);
    }
  }, [currentUser]);

  useEffect(() => {
    if (initialPosition) {
      setJobPosition(initialPosition);
    }
    if (initialQualification) {
      setQualification(initialQualification);
    }
  }, [initialPosition, initialQualification]);

  // When qualification changes, check if jobPosition is still unlocked. If not, auto-select first unlocked job
  useEffect(() => {
    if (!jobs || jobs.length === 0) return;
    const available = jobs.filter(j => isJobUnlocked(qualification, j.minQualification));
    if (available.length > 0) {
      const isCurrentValid = available.some(j => j.title.toLowerCase() === jobPosition.toLowerCase());
      if (!isCurrentValid) {
        setJobPosition(available[0].title);
      }
    } else if (jobs.length > 0) {
      setJobPosition(jobs[0].title);
    }
  }, [qualification, jobs]);

  if (!isOpen) return null;

  // Formatting helpers
  const handleCnicChange = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 13);
    if (digits.length <= 5) {
      setCnic(digits);
    } else if (digits.length <= 12) {
      setCnic(`${digits.slice(0, 5)}-${digits.slice(5)}`);
    } else {
      setCnic(`${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12)}`);
    }
  };

  const handleMobileChange = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 11);
    setMobile(digits);
  };

  // Validation function
  const validateStep1 = (): boolean => {
    const errors: Record<string, string> = {};

    if (!fullName.trim()) errors.fullName = 'Full Name is required.';
    if (!fatherName.trim()) errors.fatherName = 'Father’s Name is required.';

    const rawCnic = cnic.replace(/\D/g, '');
    if (rawCnic.length !== 13) {
      errors.cnic = '13-digit CNIC Number is required (e.g. 12345-1234567-1).';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      errors.email = 'Valid Email Address is required.';
    }

    if (!mobile || mobile.length < 11) {
      errors.mobile = 'Valid 11-digit Mobile Number is required (e.g., 03001234567).';
    }

    if (!qualification.trim()) errors.qualification = 'Qualification is required.';
    if (!address.trim()) errors.address = 'Complete Address is required.';
    if (!postalCode.trim() || postalCode.length < 4) errors.postalCode = 'Valid Postal Code is required.';

    if (!cnicFrontPreview && !cnicFrontFile) {
      errors.cnicFront = 'CNIC Front picture upload is required.';
    }
    if (!cnicBackPreview && !cnicBackFile) {
      errors.cnicBack = 'CNIC Back picture upload is required.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle Step 1 Submit
  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep1()) {
      return;
    }

    setSubmittingStep1(true);
    setFormErrors({});

    try {
      let cnicFrontUrl = cnicFrontPreview || '';
      let cnicBackUrl = cnicBackPreview || '';

      if (cnicFrontFile) {
        cnicFrontUrl = await uploadImageFile(cnicFrontFile);
      }
      if (cnicBackFile) {
        cnicBackUrl = await uploadImageFile(cnicBackFile);
      }

      const res = await submitApplicationStep1({
        fullName,
        fatherName,
        cnic,
        email,
        mobile,
        qualification,
        address,
        postalCode,
        jobPosition,
        cnicFrontUrl,
        cnicBackUrl
      });

      setSubmittedApp(res.application);
      setCurrentStep(2);
    } catch (err: any) {
      setFormErrors({ server: err.message || 'Failed to submit application information.' });
    } finally {
      setSubmittingStep1(false);
    }
  };

  // Handle Step 2 Submit (Payment Screenshot Upload)
  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submittedApp) return;

    if (!paymentScreenshotFile && !paymentScreenshotPreview) {
      setStep2Error('Please select and upload your payment screenshot proof.');
      return;
    }

    setSubmittingStep2(true);
    setStep2Error(null);

    try {
      let screenshotUrl = paymentScreenshotPreview || '';
      if (paymentScreenshotFile) {
        screenshotUrl = await uploadImageFile(paymentScreenshotFile);
      }

      const res = await submitPaymentProof(submittedApp.id, {
        paymentMethod,
        paymentScreenshotUrl: screenshotUrl,
        paymentTxnId
      });

      setSubmittedApp(res.application);
      // Move to Step 3: Verification Pending
      setCurrentStep(3);
    } catch (err: any) {
      setStep2Error(err.message || 'Failed to upload payment screenshot proof.');
    } finally {
      setSubmittingStep2(false);
    }
  };

  // Check verification status on Step 3
  const handleCheckStatus = async () => {
    if (!submittedApp) return;
    setPollingStatus(true);
    try {
      const updated = await fetchApplicationById(submittedApp.id);
      setSubmittedApp(updated);
      if (updated.status === 'Submitted Successfully' || updated.status === 'Payment Approved') {
        setCurrentStep(4);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPollingStatus(false);
    }
  };

  const copyAccountToClipboard = (accNum: string) => {
    navigator.clipboard.writeText(accNum);
    setCopiedAccount(true);
    setTimeout(() => setCopiedAccount(false), 2000);
  };

  const activeMethodConfig = paymentMethod === 'JazzCash' ? config.jazzcash : config.easypaisa;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6 flex flex-col max-h-[92vh]">
        
        {/* Top Header */}
        <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 w-8 h-8 rounded flex items-center justify-center text-white font-bold">
              <Building className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base tracking-tight text-blue-900">
                JobsHub<span className="font-normal text-blue-600">Official</span> Application Portal
              </h3>
              <p className="text-xs text-slate-500">Position: <strong className="text-slate-800">{jobPosition}</strong></p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {currentStep === 2 && (
              <div className="hidden sm:flex bg-blue-50 text-blue-700 px-3.5 py-1 rounded-full text-xs font-semibold border border-blue-100">
                Fee: {config.applicationFee} PKR
              </div>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Top Progress Indicator Banner (Step 1: Applicant Information → Step 2: Payment) */}
        <div className="bg-slate-100 border-b border-slate-200 px-6 py-2.5 flex items-center justify-center gap-2 text-xs font-bold text-slate-600">
          <span className={`px-3 py-1 rounded-full flex items-center gap-1.5 transition-colors ${
            currentStep === 1 ? 'bg-blue-600 text-white shadow-2xs' : 'bg-slate-200 text-slate-700'
          }`}>
            <span>Step 1: Applicant Information</span>
            {currentStep > 1 && <Check className="w-3.5 h-3.5 text-emerald-400" />}
          </span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
          <span className={`px-3 py-1 rounded-full flex items-center gap-1.5 transition-colors ${
            currentStep === 2 ? 'bg-blue-600 text-white shadow-2xs' : 'bg-slate-200 text-slate-700'
          }`}>
            <span>Step 2: Payment</span>
            {currentStep > 2 && <Check className="w-3.5 h-3.5 text-emerald-400" />}
          </span>
        </div>

        {/* Main Content Body with Sidebar Layout */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Sidebar Process Guide Panel */}
          <aside className="w-72 bg-white border-r border-slate-200 p-6 sm:p-8 flex-col hidden md:flex shrink-0">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Process Guide</h3>
            
            <div className="space-y-7 relative">
              {/* Step Connector Line */}
              <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-slate-100" />
              
              {/* Step 1 */}
              <div className="flex gap-3.5 relative">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] z-10 font-bold transition-all ${
                  currentStep > 1 ? 'bg-emerald-600 text-white' : currentStep === 1 ? 'bg-blue-600 text-white ring-4 ring-blue-50' : 'bg-slate-200 text-slate-600'
                }`}>
                  {currentStep > 1 ? <Check className="w-3.5 h-3.5" /> : '1'}
                </div>
                <div>
                  <p className={`text-sm font-bold ${currentStep === 1 ? 'text-slate-900' : 'text-slate-500'}`}>Applicant Information</p>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">Personal, CNIC &amp; Address details.</p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-3.5 relative">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] z-10 font-bold transition-all ${
                  currentStep > 2 ? 'bg-emerald-600 text-white' : currentStep === 2 ? 'bg-blue-600 text-white ring-4 ring-blue-50' : 'bg-slate-200 text-slate-600'
                }`}>
                  {currentStep > 2 ? <Check className="w-3.5 h-3.5" /> : '2'}
                </div>
                <div>
                  <p className={`text-sm font-bold ${currentStep === 2 ? 'text-slate-900' : 'text-slate-500'}`}>Payment Page</p>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">JazzCash / Easypaisa screenshot proof.</p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-3.5 relative">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] z-10 font-bold transition-all ${
                  currentStep > 3 ? 'bg-emerald-600 text-white' : currentStep === 3 ? 'bg-amber-600 text-white ring-4 ring-amber-50' : 'bg-slate-200 text-slate-600'
                }`}>
                  {currentStep > 3 ? <Check className="w-3.5 h-3.5" /> : '3'}
                </div>
                <div>
                  <p className={`text-sm font-bold ${currentStep === 3 ? 'text-slate-900' : 'text-slate-500'}`}>Verification</p>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">Admin approval of payment proof.</p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex gap-3.5 relative">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] z-10 font-bold transition-all ${
                  currentStep === 4 ? 'bg-emerald-600 text-white ring-4 ring-emerald-50' : 'bg-slate-200 text-slate-600'
                }`}>
                  4
                </div>
                <div>
                  <p className={`text-sm font-bold ${currentStep === 4 ? 'text-slate-900' : 'text-slate-500'}`}>Confirmation</p>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">Generation of official pass slip.</p>
                </div>
              </div>
            </div>

            <div className="mt-auto p-4 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                All applications are processed within 24-48 business hours. Ensure all uploaded documents are clear.
              </p>
            </div>
          </aside>

          {/* Right Workflow Content Area */}
          <section className="flex-1 p-6 sm:p-8 overflow-y-auto bg-white">
            
            {/* Mobile Horizontal Stepper */}
            <div className="md:hidden mb-6 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex justify-around text-xs font-bold text-slate-600">
                <span className={currentStep === 1 ? 'text-blue-600 font-bold' : ''}>1. Info</span>
                <span className={currentStep === 2 ? 'text-blue-600 font-bold' : ''}>2. Payment</span>
                <span className={currentStep === 3 ? 'text-amber-600 font-bold' : ''}>3. Verify</span>
                <span className={currentStep === 4 ? 'text-emerald-600 font-bold' : ''}>4. Slip</span>
              </div>
            </div>

            {/* ================= PAGE 1: APPLICANT INFORMATION ================= */}
            {currentStep === 1 && (
              <div className="max-w-2xl">
                <div className="mb-6">
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight">PAGE 1 — APPLICANT INFORMATION</h1>
                  <p className="text-slate-500 text-xs sm:text-sm mt-1">Please provide accurate applicant details as per your official CNIC records.</p>
                </div>

                <form onSubmit={handleStep1Submit} className="space-y-5">
                  
                  {/* JOB SELECTION & QUALIFICATION FILTER */}
                  <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200/90 space-y-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <GraduationCap className="w-4 h-4 text-blue-600" />
                        <label className="text-xs font-bold text-slate-800 uppercase tracking-wide">1. Select Your Qualification *</label>
                      </div>
                      <select
                        value={qualification}
                        onChange={(e) => {
                          const newQual = e.target.value;
                          setQualification(newQual);
                          localStorage.setItem('user_qualification', newQual);
                        }}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-2xs"
                      >
                        <option value="Primary">Primary (10 Jobs Available)</option>
                        <option value="Middle">Middle (10 Jobs Available)</option>
                        <option value="Matric">Matric (15 Jobs Available)</option>
                        <option value="Intermediate">Intermediate (25 Jobs Available)</option>
                        <option value="Diploma">Diploma (25 Jobs Available)</option>
                        <option value="Technical Diploma">Technical Diploma (25 Jobs Available)</option>
                        <option value="Certification">Certification (25 Jobs Available)</option>
                        <option value="Associate Degree">Associate Degree (25 Jobs Available)</option>
                        <option value="Bachelor">Bachelor (25 Jobs Available)</option>
                        <option value="BS">BS (25 Jobs Available)</option>
                        <option value="Master">Master (25 Jobs Available)</option>
                        <option value="Other Higher Qualification">Other Higher Qualification (25 Jobs Available)</option>
                      </select>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <Briefcase className="w-4 h-4 text-emerald-600" />
                          <label className="text-xs font-bold text-slate-800 uppercase tracking-wide">2. Select Available Job *</label>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase tracking-wider">
                          {displayedJobsOptions.length} Positions Available
                        </span>
                      </div>
                      <select
                        value={jobPosition}
                        onChange={(e) => setJobPosition(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-2xs"
                      >
                        {displayedJobsOptions.map(j => (
                          <option key={j.id} value={j.title}>
                            {j.title} — Min: {j.qualificationRequired || j.minQualification} ({j.department})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="bg-gradient-to-r from-blue-700 to-indigo-700 text-white p-3.5 rounded-xl flex items-center justify-between shadow-xs">
                      <div>
                        <span className="text-[10px] text-blue-200 uppercase font-bold tracking-wider block">Selected Job Position</span>
                        <strong className="text-white text-sm sm:text-base font-black block mt-0.5">{jobPosition}</strong>
                      </div>
                      <span className="px-2.5 py-1 bg-white/20 text-white text-[10px] font-bold rounded-md uppercase tracking-wider backdrop-blur-xs">
                        Active Choice
                      </span>
                    </div>
                  </div>

                  {formErrors.server && (
                    <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>{formErrors.server}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    
                    {/* Full Name */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Full Name *</label>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Muhammad Ahmed"
                        className={`w-full px-4 py-2 rounded border ${
                          formErrors.fullName ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200 bg-slate-50'
                        } text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all`}
                      />
                      {formErrors.fullName && <p className="text-[11px] text-rose-600">{formErrors.fullName}</p>}
                    </div>

                    {/* Father Name */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Father's Name *</label>
                      <input
                        type="text"
                        required
                        value={fatherName}
                        onChange={(e) => setFatherName(e.target.value)}
                        placeholder="e.g. Ibrahim Khan"
                        className={`w-full px-4 py-2 rounded border ${
                          formErrors.fatherName ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200 bg-slate-50'
                        } text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all`}
                      />
                      {formErrors.fatherName && <p className="text-[11px] text-rose-600">{formErrors.fatherName}</p>}
                    </div>

                    {/* CNIC Number */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">CNIC Number *</label>
                      <input
                        type="text"
                        required
                        value={cnic}
                        onChange={(e) => handleCnicChange(e.target.value)}
                        placeholder="42101-0000000-1"
                        className={`w-full px-4 py-2 rounded border ${
                          formErrors.cnic ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200 bg-slate-50'
                        } text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all`}
                      />
                      {formErrors.cnic && <p className="text-[11px] text-rose-600">{formErrors.cnic}</p>}
                    </div>

                    {/* Email */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Email Address *</label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="ahmed@example.com"
                        className={`w-full px-4 py-2 rounded border ${
                          formErrors.email ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200 bg-slate-50'
                        } text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all`}
                      />
                      {formErrors.email && <p className="text-[11px] text-rose-600">{formErrors.email}</p>}
                    </div>

                    {/* Mobile */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Mobile Number *</label>
                      <input
                        type="tel"
                        required
                        value={mobile}
                        onChange={(e) => handleMobileChange(e.target.value)}
                        placeholder="03XX-XXXXXXX"
                        className={`w-full px-4 py-2 rounded border ${
                          formErrors.mobile ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200 bg-slate-50'
                        } text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all`}
                      />
                      {formErrors.mobile && <p className="text-[11px] text-rose-600">{formErrors.mobile}</p>}
                    </div>

                    {/* Qualification */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Highest Qualification *</label>
                      <select
                        value={qualification}
                        onChange={(e) => setQualification(e.target.value)}
                        className="w-full px-4 py-2 rounded border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                      >
                        <option value="Primary">Primary</option>
                        <option value="Middle">Middle</option>
                        <option value="Matric">Matric</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Diploma">Diploma</option>
                        <option value="Technical Diploma">Technical Diploma</option>
                        <option value="Certification">Certification</option>
                        <option value="Associate Degree">Associate Degree</option>
                        <option value="Bachelor">Bachelor</option>
                        <option value="BS">BS</option>
                        <option value="Master">Master</option>
                        <option value="Other Higher Qualification">Other Higher Qualification</option>
                      </select>
                    </div>

                    {/* Complete Address */}
                    <div className="sm:col-span-2 space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Complete Residential Address *</label>
                      <input
                        type="text"
                        required
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="House #, Street #, Sector/Area, City"
                        className={`w-full px-4 py-2 rounded border ${
                          formErrors.address ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200 bg-slate-50'
                        } text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all`}
                      />
                      {formErrors.address && <p className="text-[11px] text-rose-600">{formErrors.address}</p>}
                    </div>

                    {/* Postal Code */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Postal Code *</label>
                      <input
                        type="text"
                        required
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value)}
                        placeholder="e.g. 44000"
                        className={`w-full px-4 py-2 rounded border ${
                          formErrors.postalCode ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200 bg-slate-50'
                        } text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all`}
                      />
                      {formErrors.postalCode && <p className="text-[11px] text-rose-600">{formErrors.postalCode}</p>}
                    </div>

                  </div>

                  {/* Document Uploads Dropzone */}
                  <div className="space-y-3 pt-2">
                    <p className="text-xs font-bold text-slate-700 uppercase tracking-wide">CNIC Documents Upload *</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      
                      {/* CNIC Front */}
                      <div className="border-2 border-dashed border-slate-200 rounded-lg p-4 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer relative">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mb-2 text-blue-600">
                          <Upload className="w-4 h-4" />
                        </div>
                        <p className="text-[11px] font-semibold text-slate-700">CNIC Front Image Upload *</p>
                        <p className="text-[9px] text-slate-400 mt-0.5">JPG, PNG up to 5MB</p>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              const file = e.target.files[0];
                              setCnicFrontFile(file);
                              setCnicFrontPreview(URL.createObjectURL(file));
                            }
                          }}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                        {cnicFrontPreview && (
                          <div className="mt-2 w-full">
                            <img src={cnicFrontPreview} alt="Front Preview" className="h-20 w-full object-cover rounded border" />
                            <span className="text-[10px] text-emerald-600 font-bold block text-center mt-1">Front Image Loaded ✓</span>
                          </div>
                        )}
                        {formErrors.cnicFront && <p className="text-[11px] text-rose-600 mt-1">{formErrors.cnicFront}</p>}
                      </div>

                      {/* CNIC Back */}
                      <div className="border-2 border-dashed border-slate-200 rounded-lg p-4 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer relative">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mb-2 text-blue-600">
                          <Upload className="w-4 h-4" />
                        </div>
                        <p className="text-[11px] font-semibold text-slate-700">CNIC Back Image Upload *</p>
                        <p className="text-[9px] text-slate-400 mt-0.5">JPG, PNG up to 5MB</p>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              const file = e.target.files[0];
                              setCnicBackFile(file);
                              setCnicBackPreview(URL.createObjectURL(file));
                            }
                          }}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                        {cnicBackPreview && (
                          <div className="mt-2 w-full">
                            <img src={cnicBackPreview} alt="Back Preview" className="h-20 w-full object-cover rounded border" />
                            <span className="text-[10px] text-emerald-600 font-bold block text-center mt-1">Back Image Loaded ✓</span>
                          </div>
                        )}
                        {formErrors.cnicBack && <p className="text-[11px] text-rose-600 mt-1">{formErrors.cnicBack}</p>}
                      </div>

                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-6 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submittingStep1}
                      className="px-10 py-3 text-sm font-black bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2 cursor-pointer uppercase tracking-wider"
                    >
                      {submittingStep1 ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Validating Information...</span>
                        </>
                      ) : (
                        <>
                          <span>NEXT &rarr;</span>
                        </>
                      )}
                    </button>
                  </div>

                </form>
              </div>
            )}

            {/* ================= PAGE 2: PAYMENT ================= */}
            {currentStep === 2 && (
              <div className="max-w-2xl">
                <div className="mb-6">
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight">PAGE 2 — PAYMENT</h1>
                  <p className="text-slate-500 text-xs sm:text-sm mt-1">
                    Deposit the 300 application fee via JazzCash or Easypaisa and upload your payment screenshot.
                  </p>
                </div>

                <form onSubmit={handleStep2Submit} className="space-y-5">
                  
                  {/* Fee Banner */}
                  <div className="bg-gradient-to-r from-blue-950 to-slate-900 text-white p-6 rounded-2xl shadow-md border border-slate-800 space-y-2">
                    <span className="text-xs text-blue-300 font-bold uppercase tracking-wider block">Application Fee</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-black text-white">{config.applicationFee}</span>
                      <span className="text-sm font-bold text-blue-200">PKR</span>
                    </div>
                    <p className="text-xs text-slate-300 pt-2 border-t border-slate-700/60">
                      Reference #: <strong className="text-white font-mono">{submittedApp?.referenceNo}</strong> &bull; Position: <strong className="text-blue-200">{submittedApp?.jobPosition}</strong>
                    </p>
                  </div>

                  {step2Error && (
                    <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>{step2Error}</span>
                    </div>
                  )}

                  {/* Payment Method Selector */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Select Available Payment Method *</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('JazzCash')}
                        className={`p-4 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                          paymentMethod === 'JazzCash'
                            ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20 shadow-2xs'
                            : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                        }`}
                      >
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-extrabold text-xs ${
                          paymentMethod === 'JazzCash' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'
                        }`}>
                          JC
                        </div>
                        <div>
                          <strong className="block text-xs font-bold text-slate-900">JazzCash</strong>
                          <span className="text-[10px] text-slate-500">Mobile Wallet / Deposit</span>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentMethod('Easypaisa')}
                        className={`p-4 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                          paymentMethod === 'Easypaisa'
                            ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20 shadow-2xs'
                            : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                        }`}
                      >
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-extrabold text-xs ${
                          paymentMethod === 'Easypaisa' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                        }`}>
                          EP
                        </div>
                        <div>
                          <strong className="block text-xs font-bold text-slate-900">Easypaisa</strong>
                          <span className="text-[10px] text-slate-500">Mobile Wallet / Deposit</span>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Wallet Account Info Box */}
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <span className="text-xs font-bold text-slate-800">
                        Official {paymentMethod} Payment Account Details
                      </span>
                      <button
                        type="button"
                        onClick={() => copyAccountToClipboard(activeMethodConfig.accountNumber)}
                        className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 bg-white px-2.5 py-1 rounded-md border border-slate-200 cursor-pointer shadow-2xs"
                      >
                        {copiedAccount ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedAccount ? 'Copied!' : 'Copy Account #'}</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[10px] font-bold uppercase">Account Title</span>
                        <strong className="text-slate-900 font-bold text-sm">{activeMethodConfig.accountTitle}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] font-bold uppercase">Account Number</span>
                        <strong className="text-blue-900 font-bold text-sm font-mono">{activeMethodConfig.accountNumber}</strong>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-500 pt-2 border-t border-slate-200/60 leading-relaxed font-medium">
                      Instructions: Transfer the exact <strong>300 PKR</strong> fee to the above {paymentMethod} account, then take a screenshot of the confirmation receipt and upload it below.
                    </p>
                  </div>

                  {/* Screenshot Upload Dropzone */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Upload Payment Screenshot *</label>
                    <div className="border-2 border-dashed border-slate-300 rounded-xl p-5 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer relative">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mb-2">
                        <Upload className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-bold text-slate-800">Click to Upload Payment Screenshot *</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Required field (Transaction ID and amount must be clearly visible)</p>
                      <input
                        type="file"
                        accept="image/*"
                        required
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            const file = e.target.files[0];
                            setPaymentScreenshotFile(file);
                            setPaymentScreenshotPreview(URL.createObjectURL(file));
                          }
                        }}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                      {paymentScreenshotPreview && (
                        <div className="mt-3 w-full max-w-xs mx-auto">
                          <img src={paymentScreenshotPreview} alt="Receipt Preview" className="h-32 w-full object-cover rounded-lg border shadow-xs" />
                          <span className="text-[10px] text-emerald-600 font-bold block text-center mt-1">Payment Screenshot Loaded ✓</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-between items-center gap-3 mt-6 pt-6 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(1)}
                      className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Back to Page 1
                    </button>

                    <button
                      type="submit"
                      disabled={submittingStep2}
                      className="px-8 py-3 text-xs font-black bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2 cursor-pointer uppercase tracking-wider"
                    >
                      {submittingStep2 ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Submitting Payment Proof...</span>
                        </>
                      ) : (
                        <>
                          <span>SUBMIT PAYMENT FOR VERIFICATION</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>

                </form>
              </div>
            )}

            {/* ================= STEP 3: PAYMENT VERIFICATION PENDING ================= */}
            {currentStep === 3 && (
              <div className="max-w-xl mx-auto text-center py-8 space-y-6">
                
                <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto ring-8 ring-amber-50">
                  <Clock className="w-8 h-8 animate-pulse" />
                </div>

                <div>
                  <span className="inline-block px-3.5 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-extrabold mb-2">
                    Payment Verification Pending
                  </span>
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight leading-snug">
                    Your payment proof has been submitted successfully and is now pending admin verification.
                  </h2>
                  <p className="text-slate-500 text-xs sm:text-sm mt-2 leading-relaxed">
                    Our administrative audit team is reviewing your payment receipt and application details. Once approved, your official Application Slip will be generated.
                  </p>
                </div>

                <div className="bg-slate-50 rounded-lg p-5 border border-slate-200 text-left space-y-2 text-xs">
                  <div className="flex justify-between border-b border-slate-200/80 pb-2">
                    <span className="text-slate-400 font-bold uppercase text-[10px]">Reference Number</span>
                    <strong className="text-blue-900 font-bold text-sm font-mono">{submittedApp?.referenceNo}</strong>
                  </div>
                  <div className="flex justify-between border-b border-slate-200/80 pb-2">
                    <span className="text-slate-400 font-bold uppercase text-[10px]">Applicant Name</span>
                    <strong className="text-slate-800">{submittedApp?.fullName}</strong>
                  </div>
                  <div className="flex justify-between border-b border-slate-200/80 pb-2">
                    <span className="text-slate-400 font-bold uppercase text-[10px]">CNIC Number</span>
                    <strong className="text-slate-800 font-mono">{submittedApp?.cnic}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-bold uppercase text-[10px]">Applied Position</span>
                    <strong className="text-slate-800">{submittedApp?.jobPosition}</strong>
                  </div>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    onClick={handleCheckStatus}
                    disabled={pollingStatus}
                    className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${pollingStatus ? 'animate-spin' : ''}`} />
                    <span>Check Verification Status</span>
                  </button>

                  <button
                    onClick={onClose}
                    className="w-full sm:w-auto px-6 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                  >
                    Close Window
                  </button>
                </div>

              </div>
            )}

            {/* ================= STEP 4: FINAL SUBMITTED SLIP ================= */}
            {currentStep === 4 && submittedApp && (
              <div className="max-w-2xl mx-auto space-y-6">
                
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 text-center">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
                  <span className="inline-block px-3 py-0.5 bg-emerald-600 text-white text-xs font-bold rounded-full mb-1">
                    Verified &amp; Complete
                  </span>
                  <h3 className="text-xl font-bold text-emerald-950">Application Approved</h3>
                  <p className="text-xs text-emerald-800 mt-1">
                    Your payment screenshot has been audited and approved by the administration.
                  </p>
                </div>

                {/* Printable Pass Slip Summary */}
                <div className="border border-slate-200 rounded-xl p-6 bg-slate-50 space-y-4">
                  <div className="flex justify-between items-start border-b border-slate-200 pb-3">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 block">Official Application Pass</span>
                      <h4 className="text-base font-bold text-slate-900">JobsHubOfficial Testing Services</h4>
                      <p className="text-xs text-slate-500">Ref #: <strong className="text-blue-900 font-mono font-bold">{submittedApp.referenceNo}</strong></p>
                    </div>
                    <div className="px-3 py-1.5 bg-emerald-100 text-emerald-800 border border-emerald-200 rounded font-bold text-xs">
                      PASSED AUDIT
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Candidate Name</span>
                      <strong className="text-slate-900">{submittedApp.fullName}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Father's Name</span>
                      <strong className="text-slate-900">{submittedApp.fatherName}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">CNIC Number</span>
                      <strong className="text-slate-900 font-mono">{submittedApp.cnic}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Applied Position</span>
                      <strong className="text-blue-900">{submittedApp.jobPosition}</strong>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-3">
                  <button
                    onClick={() => {
                      if (onViewSlip) onViewSlip(submittedApp);
                      onClose();
                    }}
                    className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print Official Slip</span>
                  </button>
                </div>

              </div>
            )}

          </section>

        </div>

      </div>
    </div>
  );
};
