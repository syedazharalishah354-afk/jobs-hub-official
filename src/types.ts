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
  rollNumber?: string;
  fullName: string;
  candidateName?: string;
  fatherName: string;
  cnic: string;
  dob?: string | null;
  gender?: string | null;
  email: string;
  mobile: string;
  mobileNumber?: string;
  whatsapp?: string | null;
  qualification: string;
  address: string;
  city?: string | null;
  province?: string | null;
  postalCode: string;
  jobPosition: string;
  jobTitle?: string;
  jobCategory?: string | null;
  jobId?: string | null;
  cnicFrontUrl: string;
  cnicBackUrl: string;
  applicantPhotoUrl?: string | null;
  paymentScreenshotUrl: string | null;
  paymentScreenshot?: string | null;
  paymentMethod: 'JazzCash' | 'Easypaisa' | null;
  paymentTxnId?: string | null;
  trxId?: string | null;
  status: ApplicationStatus;
  rejectionReason: string | null;
  createdAt: string;
  appliedAt?: string;
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
  organization?: string;
  companyName?: string;
  companyLogo?: string;
  category?: string;
  country?: string;
  employmentType?: string;
  minQualification: string;
  qualificationRequired: string;
  qualification?: string;
  medicalQualification?: string;
  experienceRequired?: string;
  experience?: string;
  jobType?: string;
  ageLimit?: string;
  vacancies: number;
  location: string;
  salaryRange: string;
  deadline: string;
  description: string;
  responsibilities?: string;
  requirements?: string;
  requiredSkills?: string[];
  applicationMethod?: string;
  applicationUrl?: string;
  postedDate?: string;
  status?: 'active' | 'closed' | 'published' | 'unpublished' | 'draft';
  campaigns?: string[];
}

export interface ApplicationStats {
  totalUsers: number;
  totalJobs: number;
  publishedJobs?: number;
  unpublishedJobs?: number;
  govtJobs?: number;
  privateJobs?: number;
  factoryJobs?: number;
  freelancerJobs?: number;
  otherCategoryJobs?: number;
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
