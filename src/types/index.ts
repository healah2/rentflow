export type UserRole = 'ADMIN' | 'AGENT' | 'LANDLORD' | 'TENANT';

export type PipelineType = 
  | 'PLATFORM_SUBSCRIPTION' // Agent -> SaaS Platform
  | 'AGENT_MANAGEMENT_FEE'   // Landlord -> Agent
  | 'TENANT_RENT_UTILITY';   // Tenant -> Property / Agent

export type SubscriptionStatus = 'active' | 'pending_payment' | 'expired' | 'suspended';

export type ManagementFeeStatus = 'active' | 'pending_payment' | 'overdue' | 'suspended';

export type InvoiceStatus = 'draft' | 'unpaid' | 'pending_verification' | 'paid' | 'overdue';

export type PaymentMethod = 'mpesa_stk' | 'mpesa_manual' | 'bank_transfer';

export type PaymentStatus = 'pending_verification' | 'completed' | 'rejected';

export type ChargeType = 
  | 'rent'
  | 'deposit'
  | 'electricity'
  | 'water'
  | 'gas_heating'
  | 'trash'
  | 'maintenance'
  | 'parking';

export interface User {
  id: string;
  email: string;
  fullName: string;
  phoneNumber: string;
  role: UserRole;
  avatarUrl: string;
  isActive: boolean;
  createdAt: string;
  // Role specific relational links
  agentId?: string; // If landlord or tenant is managed by this agent
  landlordId?: string; // If landlord profile exists
  tenantId?: string; // If tenant profile exists
}

export interface AgentProfile {
  id: string;
  userId: string;
  agencyName: string;
  paybillNumber: string;
  accountNumberPrefix: string;
  subscriptionPlan: 'Starter' | 'Professional' | 'Enterprise';
  subscriptionStatus: SubscriptionStatus;
  subscriptionExpiry: string;
  monthlySubscriptionFee: number; // in KES
  managementFeeType: 'fixed' | 'percentage';
  defaultManagementFee: number; // e.g. 3500 KES or 8%
  managedPropertiesCount: number;
  totalLandlordsCount: number;
}

export interface LandlordProfile {
  id: string;
  userId: string;
  agentId: string;
  managementFeeAmount: number; // in KES monthly
  feeStatus: ManagementFeeStatus;
  feeExpiry: string;
  bankName: string;
  bankAccount: string;
  mpesaPhone: string;
  propertyIds: string[];
}

export interface Property {
  id: string;
  agentId: string;
  landlordId: string;
  title: string;
  estateOrStreet: string;
  neighborhood: string;
  city: string;
  totalUnits: number;
  occupiedUnits: number;
  imageUrl: string;
  amenities: string[];
  createdAt: string;
}

export interface Unit {
  id: string;
  propertyId: string;
  unitNumber: string;
  unitType: 'Studio' | '1-Bedroom' | '2-Bedroom' | '3-Bedroom' | 'Commercial Penthouse' | 'Retail Shop';
  baseRent: number; // KES
  securityDeposit: number; // KES
  waterFixedCharge?: number;
  trashCharge?: number;
  parkingCharge?: number;
  electricityCharge?: number;
  roomProperties?: string[];
  status: 'vacant' | 'occupied' | 'under_maintenance';
  currentTenantId?: string;
  currentLeaseId?: string;
}

export interface Lease {
  id: string;
  unitId: string;
  propertyId: string;
  tenantId: string;
  agentId: string;
  landlordId: string;
  startDate: string;
  endDate: string;
  monthlyRent: number;
  depositPaid: number;
  isActive: boolean;
}

export interface InvoiceItem {
  id: string;
  chargeType: ChargeType;
  title: string;
  amount: number; // KES
  meterPreviousReading?: number;
  meterCurrentReading?: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string; // e.g. INV-SUB-2026-001 or INV-MGT-2026-001 or INV-TNT-2026-001
  pipelineType: PipelineType;
  payerId: string; // User ID
  payerName: string;
  payerRole: UserRole;
  payeeId: string; // User ID or 'RENTFLOW_PLATFORM'
  payeeName: string;
  amount: number; // KES total
  dueDate: string;
  billingPeriod: string; // e.g. "March 2026"
  status: InvoiceStatus;
  items: InvoiceItem[];
  propertyId?: string;
  unitId?: string;
  createdAt: string;
  paidAt?: string;
}

export interface Payment {
  id: string;
  paymentNumber: string;
  invoiceId: string;
  invoiceNumber: string;
  pipelineType: PipelineType;
  payerId: string;
  payerName: string;
  payeeId: string;
  amount: number;
  method: PaymentMethod;
  mpesaReference: string; // e.g. "QHK9283JD8"
  phoneNumber: string;
  status: PaymentStatus;
  notes?: string;
  submittedAt: string;
  verifiedAt?: string;
  verifiedBy?: string;
  rejectionReason?: string;
}

export interface Receipt {
  id: string;
  receiptNumber: string; // e.g. REC-SUB-1002, REC-MGT-2041, REC-TNT-5092
  paymentId: string;
  invoiceId: string;
  invoiceNumber: string;
  pipelineType: PipelineType;
  payerName: string;
  payerPhone: string;
  payeeName: string;
  amount: number;
  issuedAt: string;
  items: InvoiceItem[];
  mpesaReference: string;
  verificationCode: string; // Unique alphanumeric hash for receipt integrity
}

export interface MaintenanceComplaint {
  id: string;
  ticketNumber: string;
  unitId: string;
  unitNumber: string;
  propertyId: string;
  propertyName: string;
  tenantId: string;
  tenantName: string;
  agentId: string;
  landlordId: string;
  title: string;
  category: 'plumbing' | 'electrical' | 'structural' | 'noise' | 'appliance' | 'security';
  urgency: 'low' | 'medium' | 'high' | 'emergency';
  status: 'submitted' | 'in_progress' | 'resolved' | 'closed';
  description: string;
  resolutionNotes?: string;
  estimatedCost?: number; // KES
  createdAt: string;
  updatedAt: string;
}

export interface NotificationLog {
  id: string;
  recipientId: string;
  recipientName: string;
  recipientContact: string; // Phone or Email
  channel: 'whatsapp' | 'email' | 'sms';
  pipelineType: PipelineType;
  title: string;
  body: string;
  sentAt: string;
  status: 'delivered' | 'sent';
  invoiceId?: string;
}

export interface MpesaPromptState {
  isOpen: boolean;
  invoice: Invoice | null;
  mode: 'stk' | 'manual';
  onSuccess?: () => void;
}
