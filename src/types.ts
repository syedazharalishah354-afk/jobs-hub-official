export type ApplicationStatus =
  | 'Information Incomplete'
  | 'Payment Pending'
  | 'Payment Verification Pending'
  | 'Payment Rejected'
  | 'Payment Approved'
  | 'Submitted Successfully';

export interface UserAccount {
  id: string;
  fullName: string;
  email: string;
  cnic: string;
  passwordHash: string;
  createdAt: string;
  role: 'user';
}

export interface Application {
  id: string;
  userId?: string | null;
  referenceNo: string;
  fullName: string;
  fatherName: string;
  cnic: string;
  email: string;
  mobile: string;
  qualification: string;
  address: string;
  postalCode: string;
  jobPosition: string;
  jobId?: string | null;
  cnicFrontUrl: string;
  cnicBackUrl: string;
  paymentScreenshotUrl: string | null;
  paymentMethod: 'JazzCash' | 'Easypaisa' | null;
  paymentTxnId?: string | null;
  status: ApplicationStatus;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentMethodConfig {
  accountTitle: string;
  accountNumber: string;
  instructions: string;
}

export interface SystemSettings {
  applicationFee: number;
  jazzcash: PaymentMethodConfig;
  easypaisa: PaymentMethodConfig;
  interviewPolicy?: string;
}

export interface JobPosition {
  id: string;
  title: string;
  department: string;
  minQualification: string;
  qualificationRequired: string;
  jobType?: string;
  ageLimit: string;
  vacancies: number;
  location: string;
  salaryRange: string;
  deadline: string;
  description: string;
  requiredSkills?: string[];
  status?: 'active' | 'closed' | 'published' | 'draft';
}

export interface ApplicationStats {
  totalUsers: number;
  totalJobs: number;
  totalApplications: number;
  pendingPayments: number;
  approvedPayments: number;
  rejectedPayments: number;
  submittedSuccessfully: number;
}

export interface AdminUser {
  id: string;
  username: string;
  passwordHash: string;
}
