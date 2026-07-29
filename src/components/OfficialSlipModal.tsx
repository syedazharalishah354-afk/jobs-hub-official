import React from 'react';
import { Application } from '../types.js';
import { getWhatsAppUrl } from '../utils/whatsapp.js';
import { X, Printer, ShieldCheck, CheckCircle2, Building, Download, MessageCircle } from 'lucide-react';

interface OfficialSlipModalProps {
  app: Application | null;
  onClose: () => void;
  whatsappNumber?: string;
}

export const OfficialSlipModal: React.FC<OfficialSlipModalProps> = ({ app, onClose, whatsappNumber }) => {
  if (!app) return null;

  const handlePrint = () => {
    window.print();
  };

  const whatsappUrl = getWhatsAppUrl(whatsappNumber, app.referenceNo, app.jobPosition);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        
        {/* Header Control */}
        <div className="bg-slate-900 text-white px-5 py-3 flex items-center justify-between print:hidden">
          <span className="text-xs font-bold flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Official Application Pass / Slip
          </span>
          <div className="flex items-center gap-2">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
              title="Contact Support on WhatsApp"
            >
              <MessageCircle className="w-3.5 h-3.5 fill-emerald-600 text-white" />
              <span>Contact on WhatsApp</span>
            </a>
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center gap-1 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Slip</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Pass Container */}
        <div id="printable-slip" className="p-8 space-y-6 text-slate-900 font-sans">
          
          {/* Header Badge */}
          <div className="border-b-2 border-blue-900 pb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-900 text-white font-black text-xl flex items-center justify-center">
                JH
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-blue-950 tracking-tight">JobsHubOfficial Portal</h2>
                <p className="text-xs text-slate-500 font-medium">Official Application Receipt &amp; Verification Slip</p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200 block">
                STATUS: SUBMITTED
              </span>
              <span className="text-xs font-mono font-bold text-blue-900 block mt-1">
                REF: {app.referenceNo}
              </span>
            </div>
          </div>

          {/* Applicant Info Grid */}
          <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-5 rounded-2xl border border-slate-200">
            <div>
              <span className="text-slate-400 text-[10px] block uppercase font-bold">Applied Position</span>
              <strong className="text-blue-950 font-extrabold text-sm">{app.jobPosition}</strong>
            </div>

            <div>
              <span className="text-slate-400 text-[10px] block uppercase font-bold">Submission Date</span>
              <strong className="text-slate-800 font-bold">{new Date(app.updatedAt || app.createdAt).toLocaleDateString()}</strong>
            </div>

            <div>
              <span className="text-slate-400 text-[10px] block uppercase font-bold">Full Name</span>
              <strong className="text-slate-900 font-bold">{app.fullName}</strong>
            </div>

            <div>
              <span className="text-slate-400 text-[10px] block uppercase font-bold">Father's Name</span>
              <strong className="text-slate-900 font-bold">{app.fatherName}</strong>
            </div>

            <div>
              <span className="text-slate-400 text-[10px] block uppercase font-bold">CNIC Number</span>
              <strong className="text-slate-900 font-mono font-bold">{app.cnic}</strong>
            </div>

            <div>
              <span className="text-slate-400 text-[10px] block uppercase font-bold">Mobile Number</span>
              <strong className="text-slate-900 font-bold">{app.mobile}</strong>
            </div>

            <div>
              <span className="text-slate-400 text-[10px] block uppercase font-bold">Qualification</span>
              <strong className="text-slate-900 font-bold">{app.qualification}</strong>
            </div>

            <div>
              <span className="text-slate-400 text-[10px] block uppercase font-bold">Email Address</span>
              <span className="text-slate-800 font-medium">{app.email}</span>
            </div>

            <div className="col-span-2">
              <span className="text-slate-400 text-[10px] block uppercase font-bold">Residential Address</span>
              <span className="text-slate-800 font-medium">{app.address} ({app.postalCode})</span>
            </div>
          </div>

          {/* Verification Stamps */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="p-3 rounded-xl border border-blue-200 bg-blue-50/50 text-[11px] text-blue-900 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <strong>Payment Verified</strong>
                <p className="text-[10px] text-blue-800">Fee payment approved by admin audit team.</p>
              </div>
            </div>

            <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 text-[11px] text-slate-700 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0" />
              <div>
                <strong>CNIC Document Verified</strong>
                <p className="text-[10px] text-slate-500">Document matches candidate information.</p>
              </div>
            </div>
          </div>

          {/* Official Interview & Test Policy Note */}
          <div className="bg-amber-50/80 p-4 rounded-xl border border-amber-200 text-xs text-amber-950 space-y-1">
            <strong className="font-bold text-amber-900 block text-[11px] uppercase tracking-wider">
              Mandatory Interview &amp; Test Regulations
            </strong>
            <ul className="list-disc list-inside text-[10px] space-y-1 text-slate-700 font-medium">
              <li>Must bring original CNIC, educational certificates, and this printed slip on interview day.</li>
              <li>Report at venue 30 minutes before time. Mobile phones and electronics are strictly banned.</li>
              <li>No TA/DA will be admissible. Schedule updates will be sent via SMS/Email.</li>
            </ul>
          </div>

          {/* WhatsApp Direct Support Contact Button */}
          <div className="pt-2 print:hidden">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 fill-emerald-600 text-white" />
              <span>Contact Support on WhatsApp</span>
            </a>
          </div>

          {/* Footer Note */}
          <div className="pt-4 border-t border-slate-200 text-center text-[10px] text-slate-400">
            This is a computer generated official application slip issued by JobsHubOfficial Services Portal.
          </div>

        </div>

      </div>
    </div>
  );
};
