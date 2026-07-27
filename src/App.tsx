import React, { useState, useEffect } from 'react';
import { Header } from './components/Header.js';
import { Hero } from './components/Hero.js';
import { StepsOverview } from './components/StepsOverview.js';
import { JobList } from './components/JobList.js';
import { ApplicationWizard } from './components/ApplicationWizard.js';
import { TrackModal } from './components/TrackModal.js';
import { AdminPanel } from './components/AdminPanel.js';
import { AdminLogin } from './components/AdminLogin.js';
import { OfficialSlipModal } from './components/OfficialSlipModal.js';
import { InterviewPolicySection } from './components/InterviewPolicySection.js';
import { Footer } from './components/Footer.js';
import { SystemSettings, JobPosition, Application } from './types.js';
import { fetchConfig, fetchJobs } from './services/api.js';
import { HelpCircle, ChevronDown } from 'lucide-react';

export default function App() {
  const [config, setConfig] = useState<SystemSettings>({
    applicationFee: 300,
    jazzcash: {
      accountTitle: 'JobsHub Official Services',
      accountNumber: '0301-8899771',
      instructions: 'Transfer 300 PKR via JazzCash App or *786# code.'
    },
    easypaisa: {
      accountTitle: 'JobsHub Official Services',
      accountNumber: '0345-8899772',
      instructions: 'Transfer 300 PKR via Easypaisa App or *786# code.'
    }
  });

  const [jobs, setJobs] = useState<JobPosition[]>([]);
  const [loading, setLoading] = useState(true);

  // Admin session state
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(!!localStorage.getItem('admin_token'));
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);

  // Modals state
  const [isApplyOpen, setIsApplyOpen] = useState(false);
  const [selectedJobTitle, setSelectedJobTitle] = useState<string | undefined>(undefined);
  const [selectedJobQualification, setSelectedJobQualification] = useState<string | undefined>(undefined);
  const [isTrackOpen, setIsTrackOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [selectedSlipApp, setSelectedSlipApp] = useState<Application | null>(null);

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    loadInitialData();
    checkAdminSession();

    // Check if URL path or hash indicates admin access
    const checkAdminRoute = () => {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      const search = window.location.search.toLowerCase();
      if (path.includes('/admin') || hash.includes('admin') || search.includes('admin')) {
        if (localStorage.getItem('admin_token')) {
          setIsAdminOpen(true);
        } else {
          setIsAdminLoginOpen(true);
        }
      }
    };

    checkAdminRoute();
    window.addEventListener('popstate', checkAdminRoute);
    window.addEventListener('hashchange', checkAdminRoute);

    return () => {
      window.removeEventListener('popstate', checkAdminRoute);
      window.removeEventListener('hashchange', checkAdminRoute);
    };
  }, []);

  const checkAdminSession = async () => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      setIsAdminLoggedIn(false);
      return;
    }
    try {
      const res = await fetch('/api/admin/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setIsAdminLoggedIn(true);
      } else {
        localStorage.removeItem('admin_token');
        setIsAdminLoggedIn(false);
      }
    } catch {
      setIsAdminLoggedIn(false);
    }
  };

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [confData, jobsData] = await Promise.all([fetchConfig(), fetchJobs()]);
      setConfig(confData);
      setJobs(jobsData);
    } catch (err) {
      console.error('Error loading config or jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLoginSuccess = (token: string) => {
    setIsAdminLoggedIn(true);
    setIsAdminLoginOpen(false);
    setIsAdminOpen(true);
  };

  const handleAdminLogout = () => {
    localStorage.removeItem('admin_token');
    setIsAdminLoggedIn(false);
    setIsAdminOpen(false);
  };

  const handleOpenApply = (positionName?: string, qualification?: string) => {
    setSelectedJobTitle(positionName);
    setSelectedJobQualification(qualification || localStorage.getItem('user_qualification') || 'Matric');
    setIsApplyOpen(true);
  };

  const handleNavigateSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const faqs = [
    {
      q: 'Is candidate registration or login required to apply?',
      a: 'No login or signup registration is required. Candidates can fill out the Step 1 application form directly and receive a unique reference number to track their application status.'
    },
    {
      q: 'What is the required application fee?',
      a: `The standard application fee is PKR ${config.applicationFee} per position, payable on Page 2 (Payment Page). The fee covers candidate testing, CNIC verification, and application file processing.`
    },
    {
      q: 'How do I submit my payment screenshot proof?',
      a: 'After filling in Step 1, you will be taken to Page 2 (Payment Page). Select JazzCash or Easypaisa, transfer the fee to the official account number displayed, take a clear screenshot of the transaction receipt, and upload it.'
    },
    {
      q: 'What happens after I upload my payment screenshot?',
      a: 'Your application status will become "Payment Verification Pending". Our admin staff will audit the payment screenshot and CNIC documents. Once approved, your application status updates to "Submitted Successfully" and an official confirmation slip will be generated.'
    },
    {
      q: 'What if my payment screenshot is rejected by admin?',
      a: 'If payment verification fails (e.g. blurry image or unreadable receipt), your status will show "Payment Rejected" with the rejection reason. You can simply search your application using the Track Application modal and click "Re-upload Correct Payment Screenshot" to resubmit proof without starting over.'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col selection:bg-blue-600 selection:text-white">
      
      {/* Header */}
      <Header
        onOpenApply={() => handleOpenApply()}
        onOpenTrack={() => setIsTrackOpen(true)}
        onNavigateSection={handleNavigateSection}
        onOpenAdminLogin={() => setIsAdminLoginOpen(true)}
        isAdminLoggedIn={isAdminLoggedIn}
        onOpenAdminPanel={() => setIsAdminOpen(true)}
        onLogoutAdmin={handleAdminLogout}
      />

      {/* Main View Mode */}
      <main className="flex-1">
        {/* Hero Section */}
        <Hero
          onOpenApply={() => handleOpenApply()}
          onOpenTrack={() => setIsTrackOpen(true)}
          appFee={config.applicationFee}
        />

        {/* Steps Overview Section */}
        <StepsOverview
          onOpenApply={() => handleOpenApply()}
          appFee={config.applicationFee}
        />

        {/* Job Vacancies Section */}
        <JobList
          jobs={jobs}
          onApplyPosition={(pos, qual) => handleOpenApply(pos, qual)}
        />

        {/* Official Interview & Test Policy Section */}
        <InterviewPolicySection policyText={config.interviewPolicy} />

        {/* FAQ Accordion Section */}
        <section className="py-14 bg-blue-50/30 border-b border-blue-100">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <span className="text-xs font-bold text-blue-700 bg-blue-100/80 px-3 py-1 rounded-full uppercase tracking-wider">
                Frequently Asked Questions
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-blue-950 mt-2 tracking-tight">
                Got Questions About Applying?
              </h2>
            </div>

            <div className="space-y-3">
              {faqs.map((faq, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-xl border border-blue-100 shadow-2xs overflow-hidden"
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                    className="w-full text-left p-4 sm:p-5 flex items-center justify-between font-bold text-slate-900 text-xs sm:text-sm cursor-pointer hover:bg-slate-50/60 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <HelpCircle className="w-4 h-4 text-blue-600 shrink-0" />
                      {faq.q}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${openFaq === idx ? 'rotate-180 text-blue-600' : ''}`} />
                  </button>

                  {openFaq === idx && (
                    <div className="px-5 pb-5 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3 bg-slate-50/50">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <Footer
        onOpenApply={() => handleOpenApply()}
        onOpenTrack={() => setIsTrackOpen(true)}
        onNavigateSection={handleNavigateSection}
        onOpenAdminLogin={() => setIsAdminLoginOpen(true)}
      />

      {/* Admin Login Modal with Lock Icon */}
      <AdminLogin
        isOpen={isAdminLoginOpen}
        onClose={() => setIsAdminLoginOpen(false)}
        onSuccess={handleAdminLoginSuccess}
      />

      {/* Multi-Step Application Wizard Modal */}
      <ApplicationWizard
        isOpen={isApplyOpen}
        onClose={() => setIsApplyOpen(false)}
        config={config}
        jobs={jobs}
        initialPosition={selectedJobTitle}
        initialQualification={selectedJobQualification}
        onViewSlip={(app) => setSelectedSlipApp(app)}
      />

      {/* Track Application Status Modal */}
      <TrackModal
        isOpen={isTrackOpen}
        onClose={() => setIsTrackOpen(false)}
        onViewSlip={(app) => setSelectedSlipApp(app)}
      />

      {/* Admin Panel Modal */}
      <AdminPanel
        isOpen={isAdminOpen}
        onClose={() => {
          setIsAdminOpen(false);
          if (window.location.pathname.toLowerCase().includes('/admin')) {
            window.history.pushState({}, '', '/');
          }
        }}
        onRefreshConfig={() => {
          loadInitialData();
          checkAdminSession();
        }}
      />

      {/* Printable Official Slip Modal */}
      <OfficialSlipModal
        app={selectedSlipApp}
        onClose={() => setSelectedSlipApp(null)}
      />

    </div>
  );
}
