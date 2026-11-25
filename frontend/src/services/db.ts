import {
  User,
  AgentProfile,
  LandlordProfile,
  Property,
  Unit,
  Lease,
  Invoice,
  Payment,
  Receipt,
  MaintenanceComplaint,
  NotificationLog,
  PipelineType
} from '../types';
import {
  SEED_USERS,
  SEED_AGENTS,
  SEED_LANDLORDS,
  SEED_PROPERTIES,
  SEED_UNITS,
  SEED_LEASES,
  SEED_INVOICES,
  SEED_PAYMENTS,
  SEED_RECEIPTS,
  SEED_COMPLAINTS,
  SEED_NOTIFICATIONS
} from '../data/seedData';

const STORAGE_KEYS = {
  USERS: 'rentflow_users_v1',
  AGENTS: 'rentflow_agents_v1',
  LANDLORDS: 'rentflow_landlords_v1',
  PROPERTIES: 'rentflow_properties_v1',
  UNITS: 'rentflow_units_v1',
  LEASES: 'rentflow_leases_v1',
  INVOICES: 'rentflow_invoices_v1',
  PAYMENTS: 'rentflow_payments_v1',
  RECEIPTS: 'rentflow_receipts_v1',
  COMPLAINTS: 'rentflow_complaints_v1',
  NOTIFICATIONS: 'rentflow_notifications_v1',
  CURRENT_USER_ID: 'rentflow_active_user_id_v1',
  CURRENT_USER: 'rentflow_active_user_v1',
  ACCESS_TOKEN: 'rentflow_access_token_v1',
  REFRESH_TOKEN: 'rentflow_refresh_token_v1'
};

const DEFAULT_API_BASE_URL = import.meta.env.PROD
  ? 'https://rentflowapi.xulttech.com/api/v1'
  : 'http://localhost:8000/api/v1';
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/$/, '');

class RentFlowDatabase {
  private get<T>(key: string, defaultValue: T): T {
    try {
      const data = localStorage.getItem(key);
      if (!data) return defaultValue;
      return JSON.parse(data) as T;
    } catch {
      return defaultValue;
    }
  }

  private set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error('Database write error', e);
    }
  }

  constructor() {
    this.init();
  }

  private async request<T>(path: string, body?: unknown): Promise<T> {
    const requestWithToken = (token: string | null) => fetch(`${API_BASE_URL}${path}`, {
      method: body === undefined ? 'GET' : 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) })
    });
    let token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    let response = await requestWithToken(token);
    if (response.status === 401 && !path.startsWith('/auth/token') && localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)) {
      const refreshResponse = await fetch(`${API_BASE_URL}/auth/token/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN) })
      });
      const refreshed: { access?: unknown; refresh?: unknown } | null = await refreshResponse.json().catch(() => null);
      if (!refreshResponse.ok || typeof refreshed?.access !== 'string') {
        this.logout();
        throw new Error('Your session expired. Sign in again to continue.');
      }
      const refreshedToken = refreshed.access;
      token = refreshedToken;
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, refreshedToken);
      if (typeof refreshed.refresh === 'string') {
        localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshed.refresh);
      }
      response = await requestWithToken(refreshedToken);
    }
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      const detail = data?.detail || data?.error || data?.message || `Backend request failed (${response.status})`;
      throw new Error(typeof detail === 'string' ? detail : JSON.stringify(detail));
    }
    return data as T;
  }

  private async submitToBackend(type: string, payload: unknown): Promise<void> {
    await this.request('/form-submissions/', { submission_type: type, payload });
  }

  public init(forceReset = false): void {
    if (forceReset || !localStorage.getItem(STORAGE_KEYS.USERS)) {
      this.set(STORAGE_KEYS.USERS, SEED_USERS);
      this.set(STORAGE_KEYS.AGENTS, SEED_AGENTS);
      this.set(STORAGE_KEYS.LANDLORDS, SEED_LANDLORDS);
      this.set(STORAGE_KEYS.PROPERTIES, SEED_PROPERTIES);
      this.set(STORAGE_KEYS.UNITS, SEED_UNITS);
      this.set(STORAGE_KEYS.LEASES, SEED_LEASES);
      this.set(STORAGE_KEYS.INVOICES, SEED_INVOICES);
      this.set(STORAGE_KEYS.PAYMENTS, SEED_PAYMENTS);
      this.set(STORAGE_KEYS.RECEIPTS, SEED_RECEIPTS);
      this.set(STORAGE_KEYS.COMPLAINTS, SEED_COMPLAINTS);
      this.set(STORAGE_KEYS.NOTIFICATIONS, SEED_NOTIFICATIONS);
    }
  }

  // --- Current User & Session ---
  public getCurrentUser(): User | null {
    try {
      if (!localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)) return null;
      const savedUser = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      if (savedUser) return JSON.parse(savedUser) as User;
      const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
      if (!raw) return null;
      let cleanId = raw;
      try {
        const parsed = JSON.parse(raw);
        if (typeof parsed === 'string') cleanId = parsed;
      } catch {
        cleanId = raw;
      }
      cleanId = cleanId.replace(/^"|"$/g, '').trim();
      if (!cleanId) return null;
      const users = this.getUsers();
      return users.find(u => u.id === cleanId) || null;
    } catch {
      return null;
    }
  }

  public setCurrentUser(userId: string): void {
    const cleanId = userId.replace(/^"|"$/g, '').trim();
    this.set(STORAGE_KEYS.CURRENT_USER_ID, cleanId);
    const user = this.getUsers().find(candidate => candidate.id === cleanId);
    if (user) this.set(STORAGE_KEYS.CURRENT_USER, user);
  }

  public logout(): void {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER_ID);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  }

  public async authenticateUser(username: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const result = await this.request<{
        access: string;
        refresh: string;
        user: {
          id: string;
          username: string;
          email: string;
          first_name: string;
          last_name: string;
          role: User['role'];
          phone_number: string;
          avatar_url: string | null;
          agent_id?: string;
          landlord_id?: string;
          tenant_id?: string;
          agent_profile?: {
            id: string;
            agency_name: string;
            paybill_number: string;
            account_prefix: string;
            subscription_plan: AgentProfile['subscriptionPlan'];
            subscription_status: AgentProfile['subscriptionStatus'];
            subscription_expiry: string;
            monthly_subscription_fee: number;
            managed_properties_count: number;
            total_landlords_count: number;
          } | null;
          landlord_profile?: {
            id: string;
            agent_id: string;
            monthly_management_fee: number;
            fee_status: LandlordProfile['feeStatus'];
            fee_expiry: string;
            bank_name: string;
            bank_account: string;
            mpesa_phone: string;
            property_ids: string[];
          } | null;
        };
      }>('/auth/token/', { username: username.trim(), password });
      const account = result.user;
      const existing = this.getUsers().find(user => user.email.toLowerCase() === account.email.toLowerCase());
      const user: User = existing ? {
        ...existing,
        id: existing.id,
        email: account.email,
        fullName: [account.first_name, account.last_name].filter(Boolean).join(' ') || account.username,
        phoneNumber: account.phone_number || existing.phoneNumber,
        role: account.role,
        avatarUrl: account.avatar_url || existing.avatarUrl,
        isActive: true,
        agentId: existing.agentId || account.agent_id,
        landlordId: existing.landlordId || account.landlord_id,
        tenantId: account.tenant_id || existing.tenantId
      } : {
        id: account.id,
        email: account.email,
        fullName: [account.first_name, account.last_name].filter(Boolean).join(' ') || account.username,
        phoneNumber: account.phone_number || '',
        role: account.role,
        avatarUrl: account.avatar_url || '',
        isActive: true,
        createdAt: new Date().toISOString(),
        agentId: account.agent_id,
        landlordId: account.landlord_id,
        tenantId: account.tenant_id
      };
      if (account.agent_profile && !this.getAgents().some(profile => profile.userId === user.id)) {
        const profile = account.agent_profile;
        const agents = this.getAgents();
        const localProfile: AgentProfile = {
          id: profile.id,
          userId: user.id,
          agencyName: profile.agency_name,
          paybillNumber: profile.paybill_number,
          accountNumberPrefix: profile.account_prefix,
          subscriptionPlan: profile.subscription_plan,
          subscriptionStatus: profile.subscription_status,
          subscriptionExpiry: profile.subscription_expiry,
          monthlySubscriptionFee: profile.monthly_subscription_fee,
          managementFeeType: 'percentage',
          defaultManagementFee: 8,
          managedPropertiesCount: profile.managed_properties_count,
          totalLandlordsCount: profile.total_landlords_count
        };
        this.set(STORAGE_KEYS.AGENTS, [localProfile, ...agents.filter(item => item.userId !== user.id)]);
        user.agentId = user.agentId || profile.id;
      }
      if (account.landlord_profile && !this.getLandlords().some(profile => profile.userId === user.id)) {
        const profile = account.landlord_profile;
        const landlords = this.getLandlords();
        const localProfile: LandlordProfile = {
          id: profile.id,
          userId: user.id,
          agentId: profile.agent_id,
          managementFeeAmount: profile.monthly_management_fee,
          feeStatus: profile.fee_status,
          feeExpiry: profile.fee_expiry,
          bankName: profile.bank_name,
          bankAccount: profile.bank_account,
          mpesaPhone: profile.mpesa_phone,
          propertyIds: profile.property_ids
        };
        this.set(STORAGE_KEYS.LANDLORDS, [localProfile, ...landlords.filter(item => item.userId !== user.id)]);
        user.landlordId = user.landlordId || profile.id;
      }
      if (!existing) {
        this.set(STORAGE_KEYS.USERS, [user, ...this.getUsers()]);
      }
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, result.access);
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, result.refresh);
      this.set(STORAGE_KEYS.CURRENT_USER_ID, user.id);
      this.set(STORAGE_KEYS.CURRENT_USER, user);
      return { success: true, user };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Authentication failed.' };
    }
  }

  // --- Users & Profiles ---
  public getUsers(): User[] {
    return this.get<User[]>(STORAGE_KEYS.USERS, SEED_USERS);
  }

  public getAgents(): AgentProfile[] {
    return this.get<AgentProfile[]>(STORAGE_KEYS.AGENTS, SEED_AGENTS);
  }

  public getLandlords(): LandlordProfile[] {
    return this.get<LandlordProfile[]>(STORAGE_KEYS.LANDLORDS, SEED_LANDLORDS);
  }

  public getAgentByUserId(userId: string): AgentProfile | undefined {
    return this.getAgents().find(a => a.userId === userId);
  }

  public getLandlordByUserId(userId: string): LandlordProfile | undefined {
    return this.getLandlords().find(l => l.userId === userId);
  }

  // --- Role-Based Data Isolation Filters ---
  public getIsolatedProperties(currentUser: User): Property[] {
    const all = this.get<Property[]>(STORAGE_KEYS.PROPERTIES, SEED_PROPERTIES);
    if (currentUser.role === 'ADMIN') return all;
    if (currentUser.role === 'AGENT' && currentUser.agentId) {
      return all.filter(p => p.agentId === currentUser.agentId);
    }
    if (currentUser.role === 'LANDLORD' && currentUser.landlordId) {
      return all.filter(p => p.landlordId === currentUser.landlordId);
    }
    if (currentUser.role === 'TENANT') {
      const leases = this.getLeases().filter(l => l.tenantId === currentUser.tenantId);
      const propIds = leases.map(l => l.propertyId);
      return all.filter(p => propIds.includes(p.id));
    }
    return [];
  }

  public getIsolatedUnits(currentUser: User): Unit[] {
    const all = this.get<Unit[]>(STORAGE_KEYS.UNITS, SEED_UNITS);
    const accessibleProps = this.getIsolatedProperties(currentUser).map(p => p.id);
    if (currentUser.role === 'ADMIN') return all;
    if (currentUser.role === 'TENANT') {
      return all.filter(u => u.currentTenantId === currentUser.tenantId);
    }
    return all.filter(u => accessibleProps.includes(u.propertyId));
  }

  public getLeases(): Lease[] {
    return this.get<Lease[]>(STORAGE_KEYS.LEASES, SEED_LEASES);
  }

  // --- Invoices & Isolation ---
  public getInvoices(): Invoice[] {
    return this.get<Invoice[]>(STORAGE_KEYS.INVOICES, SEED_INVOICES);
  }

  public getIsolatedInvoices(currentUser: User, filterPipeline?: PipelineType): Invoice[] {
    let invoices = this.getInvoices();
    if (filterPipeline) {
      invoices = invoices.filter(inv => inv.pipelineType === filterPipeline);
    }

    if (currentUser.role === 'ADMIN') {
      // Admin sees all invoices, primarily SaaS platform subscriptions
      return invoices;
    }

    if (currentUser.role === 'AGENT') {
      // Agent sees:
      // 1. Their own SaaS subscription invoices (payerId = user.id)
      // 2. Management fee invoices issued to their landlords (payeeId = user.id)
      // 3. Tenant invoices for their managed units (payeeId = user.id)
      return invoices.filter(inv => 
        inv.payerId === currentUser.id || inv.payeeId === currentUser.id
      );
    }

    if (currentUser.role === 'LANDLORD') {
      // Landlord sees:
      // 1. Their management fee invoices to the agent (payerId = user.id)
      // 2. Tenant invoices for their properties (for visibility, but separate pipeline)
      const landlordProps = this.getIsolatedProperties(currentUser).map(p => p.id);
      return invoices.filter(inv => 
        inv.payerId === currentUser.id || 
        (inv.pipelineType === 'TENANT_RENT_UTILITY' && inv.propertyId && landlordProps.includes(inv.propertyId))
      );
    }

    if (currentUser.role === 'TENANT') {
      // Tenant ONLY sees their own bills
      return invoices.filter(inv => inv.payerId === currentUser.id);
    }

    return [];
  }

  // --- Payments & Isolation ---
  public getPayments(): Payment[] {
    return this.get<Payment[]>(STORAGE_KEYS.PAYMENTS, SEED_PAYMENTS);
  }

  public getIsolatedPayments(currentUser: User): Payment[] {
    const all = this.getPayments();
    if (currentUser.role === 'ADMIN') return all;
    if (currentUser.role === 'AGENT') {
      return all.filter(p => p.payerId === currentUser.id || p.payeeId === currentUser.id);
    }
    if (currentUser.role === 'LANDLORD') {
      return all.filter(p => p.payerId === currentUser.id);
    }
    if (currentUser.role === 'TENANT') {
      return all.filter(p => p.payerId === currentUser.id);
    }
    return [];
  }

  // --- Receipts & Isolation ---
  public getReceipts(): Receipt[] {
    return this.get<Receipt[]>(STORAGE_KEYS.RECEIPTS, SEED_RECEIPTS);
  }

  public getIsolatedReceipts(currentUser: User): Receipt[] {
    const all = this.getReceipts();
    if (currentUser.role === 'ADMIN') return all;
    const accessibleInvoices = this.getIsolatedInvoices(currentUser).map(i => i.id);
    return all.filter(r => accessibleInvoices.includes(r.invoiceId));
  }

  // --- Maintenance & Complaints ---
  public getComplaints(): MaintenanceComplaint[] {
    return this.get<MaintenanceComplaint[]>(STORAGE_KEYS.COMPLAINTS, SEED_COMPLAINTS);
  }

  public getIsolatedComplaints(currentUser: User): MaintenanceComplaint[] {
    const all = this.getComplaints();
    if (currentUser.role === 'ADMIN') return all;
    if (currentUser.role === 'AGENT') {
      return all.filter(c => c.agentId === currentUser.agentId);
    }
    if (currentUser.role === 'LANDLORD') {
      return all.filter(c => c.landlordId === currentUser.landlordId);
    }
    if (currentUser.role === 'TENANT') {
      return all.filter(c => c.tenantId === currentUser.tenantId);
    }
    return [];
  }

  // --- Notifications ---
  public getNotifications(): NotificationLog[] {
    return this.get<NotificationLog[]>(STORAGE_KEYS.NOTIFICATIONS, SEED_NOTIFICATIONS);
  }

  public getIsolatedNotifications(currentUser: User): NotificationLog[] {
    const all = this.getNotifications();
    if (currentUser.role === 'ADMIN') return all;
    return all.filter(n => n.recipientId === currentUser.id);
  }

  // --- Write Operations ---
  public async createProperty(property: Omit<Property, 'id' | 'createdAt'>): Promise<Property> {
    await this.submitToBackend('create_property', property);
    const properties = this.get<Property[]>(STORAGE_KEYS.PROPERTIES, SEED_PROPERTIES);
    const newProp: Property = {
      ...property,
      id: `prop-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    properties.unshift(newProp);
    this.set(STORAGE_KEYS.PROPERTIES, properties);
    return newProp;
  }

  public async createUnit(unit: Omit<Unit, 'id'>): Promise<Unit> {
    await this.submitToBackend('create_unit', unit);
    const units = this.get<Unit[]>(STORAGE_KEYS.UNITS, SEED_UNITS);
    const newUnit: Unit = {
      ...unit,
      id: `unit-${Date.now()}`
    };
    units.push(newUnit);
    this.set(STORAGE_KEYS.UNITS, units);

    // Update property total units
    const properties = this.get<Property[]>(STORAGE_KEYS.PROPERTIES, SEED_PROPERTIES);
    const pIndex = properties.findIndex(p => p.id === unit.propertyId);
    if (pIndex !== -1) {
      properties[pIndex].totalUnits += 1;
      if (unit.status === 'occupied') {
        properties[pIndex].occupiedUnits += 1;
      }
      this.set(STORAGE_KEYS.PROPERTIES, properties);
    }

    return newUnit;
  }

  public async createComplaint(complaint: Omit<MaintenanceComplaint, 'id' | 'ticketNumber' | 'createdAt' | 'updatedAt' | 'status'>): Promise<MaintenanceComplaint> {
    await this.submitToBackend('create_complaint', complaint);
    const complaints = this.getComplaints();
    const newTicket: MaintenanceComplaint = {
      ...complaint,
      id: `tkt-${Date.now()}`,
      ticketNumber: `TKT-2026-${Math.floor(100 + Math.random() * 900)}`,
      status: 'submitted',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    complaints.unshift(newTicket);
    this.set(STORAGE_KEYS.COMPLAINTS, complaints);

    // Dispatch WhatsApp & Email notification to agent
    this.dispatchNotification({
      recipientId: complaint.agentId,
      recipientName: 'Managing Agent',
      recipientContact: '+254712345678',
      channel: 'whatsapp',
      pipelineType: 'TENANT_RENT_UTILITY',
      title: `New Maintenance Ticket: ${newTicket.ticketNumber}`,
      body: `Tenant ${complaint.tenantName} (${complaint.unitNumber}, ${complaint.propertyName}) reported: "${complaint.title}". Urgency: ${complaint.urgency.toUpperCase()}.`
    });

    return newTicket;
  }

  public async updateComplaintStatus(
    ticketId: string, 
    status: MaintenanceComplaint['status'], 
    resolutionNotes?: string, 
    cost?: number
  ): Promise<void> {
    await this.submitToBackend('update_complaint', { ticketId, status, resolutionNotes, cost });
    const complaints = this.getComplaints();
    const index = complaints.findIndex(c => c.id === ticketId);
    if (index !== -1) {
      complaints[index].status = status;
      if (resolutionNotes) complaints[index].resolutionNotes = resolutionNotes;
      if (cost !== undefined) complaints[index].estimatedCost = cost;
      complaints[index].updatedAt = new Date().toISOString();
      this.set(STORAGE_KEYS.COMPLAINTS, complaints);

      // Notify tenant
      this.dispatchNotification({
        recipientId: complaints[index].tenantId,
        recipientName: complaints[index].tenantName,
        recipientContact: '+254799887766',
        channel: 'whatsapp',
        pipelineType: 'TENANT_RENT_UTILITY',
        title: `Work Order Update: ${complaints[index].ticketNumber}`,
        body: `Your maintenance ticket "${complaints[index].title}" has been updated to ${status.toUpperCase()}. Notes: ${resolutionNotes || 'Technician assigned.'}`
      });
    }
  }

  // --- Entity Creation Operations (System Admin Driven) ---
  public async createAgent(data: {
    fullName: string;
    agencyName: string;
    email: string;
    phoneNumber: string;
    monthlySubscriptionFee: number;
    officeLocation?: string;
    subscriptionPlan?: 'Starter' | 'Professional' | 'Enterprise';
    initialStatus?: 'active' | 'pending_payment';
    paybillNumber?: string;
  }): Promise<{ user: User; profile: AgentProfile; invoice: Invoice }> {
    await this.submitToBackend('create_agent', data);
    const users = this.getUsers();
    const agents = this.getAgents();
    const invoices = this.getInvoices();

    // Check if email already registered
    const cleanEmail = data.email.trim().toLowerCase();
    if (users.some(u => u.email.trim().toLowerCase() === cleanEmail)) {
      throw new Error(`An account with email "${data.email.trim()}" is already registered.`);
    }

    const agentId = `agent-${Date.now()}`;
    const userId = `user-agent-${Date.now()}`;

    const newUser: User = {
      id: userId,
      email: data.email.trim(),
      fullName: data.fullName.trim(),
      phoneNumber: data.phoneNumber.trim(),
      role: 'AGENT',
      avatarUrl: '/src/assets/images/avatar_agent_sarah_1792560785492.jpg',
      isActive: true,
      createdAt: new Date().toISOString(),
      agentId: agentId
    };

    const status = data.initialStatus || 'active';
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);

    const newProfile: AgentProfile = {
      id: agentId,
      userId: userId,
      agencyName: data.agencyName.trim() || `${data.fullName.trim()} Real Estate`,
      paybillNumber: data.paybillNumber?.trim() || '247247',
      accountNumberPrefix: (data.agencyName.trim().replace(/[^a-zA-Z]/g, '').slice(0, 4) || 'AGNT').toUpperCase(),
      subscriptionPlan: data.subscriptionPlan || 'Professional',
      subscriptionStatus: status,
      subscriptionExpiry: futureDate.toISOString(),
      monthlySubscriptionFee: Number(data.monthlySubscriptionFee) || 15000,
      managementFeeType: 'percentage',
      defaultManagementFee: 8,
      managedPropertiesCount: 0,
      totalLandlordsCount: 0
    };

    // Generate initial Platform Subscription Invoice (Agent -> System Admin)
    const invNumber = `INV-SUB-2026-${Math.floor(100 + Math.random() * 900)}`;
    const subInvoice: Invoice = {
      id: `inv-sub-${Date.now()}`,
      invoiceNumber: invNumber,
      pipelineType: 'PLATFORM_SUBSCRIPTION',
      payerId: userId,
      payerName: `${newUser.fullName} (${newProfile.agencyName})`,
      payerRole: 'AGENT',
      payeeId: 'user-admin',
      payeeName: 'RentFlow Platform Admin (Caroline Kariuki)',
      amount: newProfile.monthlySubscriptionFee,
      billingPeriod: new Date().toLocaleDateString('en-KE', { month: 'long', year: 'numeric' }),
      dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      status: status === 'active' ? 'paid' : 'unpaid',
      paidAt: status === 'active' ? new Date().toISOString() : undefined,
      items: [
        {
          id: `item-sub-${Date.now()}`,
          chargeType: 'maintenance',
          title: `RentFlow Monthly SaaS Subscription (${newProfile.subscriptionPlan} Tier)`,
          amount: newProfile.monthlySubscriptionFee
        }
      ],
      createdAt: new Date().toISOString()
    };

    // If initial status is active, also register completed payment and receipt for system admin
    if (status === 'active') {
      const payments = this.getPayments();
      const receipts = this.getReceipts();
      const timestamp = new Date().toISOString();
      const mpesaRef = `SUB${Math.floor(1000 + Math.random() * 9000)}OK`;

      const payment: Payment = {
        id: `pay-${Date.now()}`,
        paymentNumber: `PAY-SUB-${Math.floor(1000 + Math.random() * 9000)}`,
        invoiceId: subInvoice.id,
        invoiceNumber: subInvoice.invoiceNumber,
        pipelineType: 'PLATFORM_SUBSCRIPTION',
        payerId: userId,
        payerName: subInvoice.payerName,
        payeeId: 'user-admin',
        amount: subInvoice.amount,
        method: 'mpesa_stk',
        mpesaReference: mpesaRef,
        phoneNumber: newUser.phoneNumber,
        status: 'completed',
        submittedAt: timestamp,
        verifiedAt: timestamp,
        verifiedBy: 'System Administrator (Approved on Agent Onboarding)'
      };
      payments.unshift(payment);
      this.set(STORAGE_KEYS.PAYMENTS, payments);

      const receipt: Receipt = {
        id: `rec-sub-${Date.now()}`,
        receiptNumber: `REC-SUB-2026-${Math.floor(100 + Math.random() * 900)}`,
        paymentId: payment.id,
        invoiceId: subInvoice.id,
        invoiceNumber: subInvoice.invoiceNumber,
        pipelineType: 'PLATFORM_SUBSCRIPTION',
        payerName: subInvoice.payerName,
        payerPhone: newUser.phoneNumber,
        payeeName: subInvoice.payeeName,
        amount: subInvoice.amount,
        issuedAt: timestamp,
        items: subInvoice.items,
        mpesaReference: mpesaRef,
        verificationCode: `RF-SUB-${subInvoice.amount}-${mpesaRef}-ACTIVE`
      };
      receipts.unshift(receipt);
      this.set(STORAGE_KEYS.RECEIPTS, receipts);
    }

    users.push(newUser);
    agents.push(newProfile);
    invoices.unshift(subInvoice);

    this.set(STORAGE_KEYS.USERS, users);
    this.set(STORAGE_KEYS.AGENTS, agents);
    this.set(STORAGE_KEYS.INVOICES, invoices);

    // Dispatch welcome notification with login credentials
    this.dispatchNotification({
      recipientId: userId,
      recipientName: newUser.fullName,
      recipientContact: newUser.phoneNumber,
      channel: 'whatsapp',
      pipelineType: 'PLATFORM_SUBSCRIPTION',
      title: 'Welcome to RentFlow — Agent Account Activated',
      body: `Jambo ${newUser.fullName}! Your Managing Agent account for "${newProfile.agencyName}" has been provisioned. Login with Email: ${newUser.email} and Password: ${newUser.phoneNumber}. Agreed Monthly SaaS Platform Fee: KES ${newProfile.monthlySubscriptionFee.toLocaleString()}.`
    });

    return { user: newUser, profile: newProfile, invoice: subInvoice };
  }

  // --- Entity Creation Operations (Agent Driven) ---
  public async createLandlord(data: {
    fullName: string;
    phoneNumber: string;
    email: string;
    agentId: string;
    monthlyFeeAmount?: number;
    bankName?: string;
    bankAccount?: string;
  }): Promise<{ user: User; profile: LandlordProfile }> {
    await this.submitToBackend('create_landlord', data);
    const users = this.getUsers();
    const landlords = this.getLandlords();

    const landlordId = `landlord-${Date.now()}`;
    const userId = `user-landlord-${Date.now()}`;

    const newUser: User = {
      id: userId,
      email: data.email.trim(),
      fullName: data.fullName.trim(),
      phoneNumber: data.phoneNumber.trim(),
      role: 'LANDLORD',
      avatarUrl: '/src/assets/images/avatar_landlord_mwangi_1792560787097.jpg',
      isActive: true,
      createdAt: new Date().toISOString(),
      agentId: data.agentId,
      landlordId: landlordId,
    };

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);

    const newProfile: LandlordProfile = {
      id: landlordId,
      userId: userId,
      agentId: data.agentId,
      managementFeeAmount: data.monthlyFeeAmount || 3500,
      feeStatus: 'active',
      feeExpiry: futureDate.toISOString(),
      bankName: data.bankName || 'Equity Bank Kenya',
      bankAccount: data.bankAccount || `0180${Math.floor(100000000 + Math.random() * 900000000)}`,
      mpesaPhone: data.phoneNumber.trim(),
      propertyIds: [],
    };

    users.push(newUser);
    landlords.push(newProfile);

    this.set(STORAGE_KEYS.USERS, users);
    this.set(STORAGE_KEYS.LANDLORDS, landlords);

    // Update agent's landlord count
    const agents = this.getAgents();
    const aIdx = agents.findIndex(a => a.id === data.agentId);
    if (aIdx !== -1) {
      agents[aIdx].totalLandlordsCount = (agents[aIdx].totalLandlordsCount || 0) + 1;
      this.set(STORAGE_KEYS.AGENTS, agents);
    }

    // Dispatch welcome notification
    this.dispatchNotification({
      recipientId: userId,
      recipientName: newUser.fullName,
      recipientContact: newUser.phoneNumber,
      channel: 'whatsapp',
      pipelineType: 'AGENT_MANAGEMENT_FEE',
      title: 'Welcome to RentFlow Management System',
      body: `Jambo ${newUser.fullName}! You have been registered as a property owner under Apex Property Management. Your dedicated landlord portal is now active.`
    });

    return { user: newUser, profile: newProfile };
  }

  public async createApartmentWithRooms(data: {
    landlordId: string;
    agentId: string;
    title: string;
    neighborhood?: string;
    street?: string;
    roomsCount: number;
    roomConfigs?: Array<{
      unitNumber: string;
      unitType: Unit['unitType'];
      baseRent: number;
      securityDeposit: number;
      waterFixedCharge?: number;
      trashCharge?: number;
      parkingCharge?: number;
      electricityCharge?: number;
      roomProperties?: string[];
      tenantId?: string;
      newTenant?: {
        fullName: string;
        phoneNumber: string;
        email: string;
      };
    }>;
    amenities?: string[];
    imageUrl?: string;
  }): Promise<Property> {
    await this.submitToBackend('create_apartment_with_rooms', data);
    const properties = this.get<Property[]>(STORAGE_KEYS.PROPERTIES, SEED_PROPERTIES);
    const units = this.get<Unit[]>(STORAGE_KEYS.UNITS, SEED_UNITS);
    const users = this.getUsers();
    const leases = this.getLeases();

    const propId = `prop-${Date.now()}`;
    let occupiedCount = 0;

    const generatedUnits: Unit[] = [];

    if (data.roomConfigs && data.roomConfigs.length > 0) {
      data.roomConfigs.forEach((rc, idx) => {
        const unitId = `unit-${Date.now()}-${idx}-${Math.floor(Math.random() * 1000)}`;
        let assignedTenantId: string | undefined = undefined;
        let createdLeaseId: string | undefined = undefined;

        // Check if existing tenant selected
        if (rc.tenantId) {
          assignedTenantId = rc.tenantId;
        } else if (rc.newTenant && rc.newTenant.fullName.trim()) {
          // Register inline new tenant
          const newTId = `tenant-${Date.now()}-${idx}`;
          const newUId = `user-tenant-${Date.now()}-${idx}`;
          const newTenantUser: User = {
            id: newUId,
            email: rc.newTenant.email.trim() || `${rc.newTenant.fullName.toLowerCase().replace(/\s+/g, '.')}@example.com`,
            fullName: rc.newTenant.fullName.trim(),
            phoneNumber: rc.newTenant.phoneNumber.trim() || '+254700000000',
            role: 'TENANT',
            avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
            isActive: true,
            createdAt: new Date().toISOString(),
            agentId: data.agentId,
            landlordId: data.landlordId,
            tenantId: newTId
          };
          users.push(newTenantUser);
          assignedTenantId = newTId;
        }

        const isOccupied = Boolean(assignedTenantId);
        if (isOccupied) {
          occupiedCount += 1;
          createdLeaseId = `lease-${Date.now()}-${idx}`;
          leases.push({
            id: createdLeaseId,
            unitId,
            propertyId: propId,
            tenantId: assignedTenantId!,
            agentId: data.agentId,
            landlordId: data.landlordId,
            startDate: new Date().toISOString().split('T')[0],
            endDate: '2027-12-31',
            monthlyRent: rc.baseRent,
            depositPaid: rc.securityDeposit,
            isActive: true
          });
        }

        generatedUnits.push({
          id: unitId,
          propertyId: propId,
          unitNumber: rc.unitNumber,
          unitType: rc.unitType,
          baseRent: rc.baseRent,
          securityDeposit: rc.securityDeposit,
          waterFixedCharge: rc.waterFixedCharge ?? 1500,
          trashCharge: rc.trashCharge ?? 500,
          parkingCharge: rc.parkingCharge ?? 0,
          electricityCharge: rc.electricityCharge ?? 0,
          roomProperties: rc.roomProperties || ['Ensuite Bathroom', 'Balcony Access'],
          status: isOccupied ? 'occupied' : 'vacant',
          currentTenantId: assignedTenantId,
          currentLeaseId: createdLeaseId
        });
      });
    } else {
      for (let i = 1; i <= data.roomsCount; i++) {
        const floor = Math.ceil(i / 4);
        const letter = String.fromCharCode(65 + ((i - 1) % 4));
        const num = `Room ${floor}${letter}`;
        generatedUnits.push({
          id: `unit-${Date.now()}-${i}`,
          propertyId: propId,
          unitNumber: num,
          unitType: i % 2 === 0 ? '2-Bedroom' : '1-Bedroom',
          baseRent: 35000 + (i % 3) * 5000,
          securityDeposit: 35000 + (i % 3) * 5000,
          waterFixedCharge: 1500,
          trashCharge: 500,
          parkingCharge: 0,
          electricityCharge: 0,
          roomProperties: ['Ensuite Bathroom', 'Balcony Access'],
          status: 'vacant'
        });
      }
    }

    const newProp: Property = {
      id: propId,
      agentId: data.agentId,
      landlordId: data.landlordId,
      title: data.title.trim(),
      estateOrStreet: data.street || 'Main Avenue',
      neighborhood: data.neighborhood || 'Kilimani',
      city: 'Nairobi',
      totalUnits: data.roomsCount,
      occupiedUnits: occupiedCount,
      imageUrl: data.imageUrl || '/src/assets/images/property_kilimani_apartments_1792560785757.jpg',
      amenities: data.amenities || ['Borehole Water', 'Backup Generator', '24/7 Security Guards', 'Fibre Ready', 'Dedicated Parking'],
      createdAt: new Date().toISOString()
    };

    properties.unshift(newProp);
    units.push(...generatedUnits);

    this.set(STORAGE_KEYS.PROPERTIES, properties);
    this.set(STORAGE_KEYS.UNITS, units);
    this.set(STORAGE_KEYS.USERS, users);
    this.set(STORAGE_KEYS.LEASES, leases);

    // Link property to landlord profile
    const landlords = this.getLandlords();
    const lIdx = landlords.findIndex(l => l.id === data.landlordId);
    if (lIdx !== -1) {
      if (!landlords[lIdx].propertyIds.includes(propId)) {
        landlords[lIdx].propertyIds.push(propId);
        this.set(STORAGE_KEYS.LANDLORDS, landlords);
      }
    }

    // Update agent's managed properties count
    const agents = this.getAgents();
    const aIdx = agents.findIndex(a => a.id === data.agentId);
    if (aIdx !== -1) {
      agents[aIdx].managedPropertiesCount = (agents[aIdx].managedPropertiesCount || 0) + 1;
      this.set(STORAGE_KEYS.AGENTS, agents);
    }

    return newProp;
  }

  public async createTenantAndAssignRoom(data: {
    fullName: string;
    email: string;
    phoneNumber: string;
    landlordId: string;
    agentId: string;
    propertyId: string;
    unitId: string;
    monthlyRent?: number;
    securityDeposit?: number;
    startDate?: string;
  }): Promise<{ user: User; lease: Lease; unit: Unit }> {
    await this.submitToBackend('create_tenant_and_assign_room', data);
    const users = this.getUsers();
    const units = this.get<Unit[]>(STORAGE_KEYS.UNITS, SEED_UNITS);
    const leases = this.getLeases();

    const tenantId = `tenant-${Date.now()}`;
    const userId = `user-tenant-${Date.now()}`;

    const newUser: User = {
      id: userId,
      email: data.email.trim(),
      fullName: data.fullName.trim(),
      phoneNumber: data.phoneNumber.trim(),
      role: 'TENANT',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      isActive: true,
      createdAt: new Date().toISOString(),
      agentId: data.agentId,
      landlordId: data.landlordId,
      tenantId: tenantId,
    };

    const unitIdx = units.findIndex(u => u.id === data.unitId);
    if (unitIdx === -1) throw new Error('Selected room not found');

    const unit = units[unitIdx];
    const rentAmount = data.monthlyRent || unit.baseRent;
    const depositAmount = data.securityDeposit || unit.securityDeposit;

    const leaseId = `lease-${Date.now()}`;
    const newLease: Lease = {
      id: leaseId,
      unitId: unit.id,
      propertyId: data.propertyId,
      tenantId: tenantId,
      agentId: data.agentId,
      landlordId: data.landlordId,
      startDate: data.startDate || new Date().toISOString().split('T')[0],
      endDate: '2027-12-31',
      monthlyRent: rentAmount,
      depositPaid: depositAmount,
      isActive: true
    };

    // Update unit
    unit.status = 'occupied';
    unit.currentTenantId = tenantId;
    unit.currentLeaseId = leaseId;
    units[unitIdx] = unit;

    // Update property occupied count
    const properties = this.get<Property[]>(STORAGE_KEYS.PROPERTIES, SEED_PROPERTIES);
    const pIdx = properties.findIndex(p => p.id === data.propertyId);
    if (pIdx !== -1) {
      properties[pIdx].occupiedUnits = (properties[pIdx].occupiedUnits || 0) + 1;
      this.set(STORAGE_KEYS.PROPERTIES, properties);
    }

    users.push(newUser);
    leases.push(newLease);

    this.set(STORAGE_KEYS.USERS, users);
    this.set(STORAGE_KEYS.UNITS, units);
    this.set(STORAGE_KEYS.LEASES, leases);

    // Notify new tenant
    this.dispatchNotification({
      recipientId: userId,
      recipientName: newUser.fullName,
      recipientContact: newUser.phoneNumber,
      channel: 'whatsapp',
      pipelineType: 'TENANT_RENT_UTILITY',
      title: 'Welcome to your New Residence!',
      body: `Jambo ${newUser.fullName}! Your lease for ${unit.unitNumber} has been successfully activated. Rent is KES ${rentAmount.toLocaleString()} per month. You can log into RentFlow anytime to check bills and remit via M-Pesa.`
    });

    return { user: newUser, lease: newLease, unit };
  }

  // --- Payment & Invoicing Logic ---
  public async createInvoice(invoice: Omit<Invoice, 'id' | 'createdAt'>): Promise<Invoice> {
    await this.submitToBackend('create_invoice', invoice);
    const invoices = this.getInvoices();
    const newInv: Invoice = {
      ...invoice,
      id: `inv-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    invoices.unshift(newInv);
    this.set(STORAGE_KEYS.INVOICES, invoices);

    // Notify payer
    this.dispatchNotification({
      recipientId: newInv.payerId,
      recipientName: newInv.payerName,
      recipientContact: 'SMS / WhatsApp',
      channel: 'whatsapp',
      pipelineType: newInv.pipelineType,
      title: `Invoice Generated: ${newInv.invoiceNumber}`,
      body: `Jambo ${newInv.payerName}! Invoice ${newInv.invoiceNumber} for ${newInv.billingPeriod} totaling KES ${newInv.amount.toLocaleString()} has been issued. Due date: ${newInv.dueDate}.`,
      invoiceId: newInv.id
    });

    return newInv;
  }

  public async processMpesaStkPayment(invoiceId: string, phoneNumber: string): Promise<{ payment: Payment; receipt: Receipt }> {
    await this.submitToBackend('mpesa_stk_payment', { invoiceId, phoneNumber });
    const invoices = this.getInvoices();
    const invIndex = invoices.findIndex(i => i.id === invoiceId);
    if (invIndex === -1) throw new Error('Invoice not found');

    const invoice = invoices[invIndex];
    const timestamp = new Date().toISOString();
    const mpesaRef = `QK${Math.floor(1000 + Math.random() * 9000)}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`;

    const newPayment: Payment = {
      id: `pay-${Date.now()}`,
      paymentNumber: `PAY-${Math.floor(1000 + Math.random() * 9000)}`,
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      pipelineType: invoice.pipelineType,
      payerId: invoice.payerId,
      payerName: invoice.payerName,
      payeeId: invoice.payeeId,
      amount: invoice.amount,
      method: 'mpesa_stk',
      mpesaReference: mpesaRef,
      phoneNumber,
      status: 'completed',
      submittedAt: timestamp,
      verifiedAt: timestamp,
      verifiedBy: 'Safaricom Daraja STK Push Gateway'
    };

    const payments = this.getPayments();
    payments.unshift(newPayment);
    this.set(STORAGE_KEYS.PAYMENTS, payments);

    // Mark invoice as paid
    invoice.status = 'paid';
    invoice.paidAt = timestamp;
    invoices[invIndex] = invoice;
    this.set(STORAGE_KEYS.INVOICES, invoices);

    // Generate Receipt
    const prefix = invoice.pipelineType === 'PLATFORM_SUBSCRIPTION' ? 'REC-SUB' :
                   invoice.pipelineType === 'AGENT_MANAGEMENT_FEE' ? 'REC-MGT' : 'REC-TNT';
    const newReceipt: Receipt = {
      id: `rec-${Date.now()}`,
      receiptNumber: `${prefix}-2026-${Math.floor(100 + Math.random() * 900)}`,
      paymentId: newPayment.id,
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      pipelineType: invoice.pipelineType,
      payerName: invoice.payerName,
      payerPhone: phoneNumber,
      payeeName: invoice.payeeName,
      amount: invoice.amount,
      issuedAt: timestamp,
      items: invoice.items,
      mpesaReference: mpesaRef,
      verificationCode: `RF-${invoice.amount}-${mpesaRef}-V${Math.floor(1 + Math.random() * 9)}`
    };

    const receipts = this.getReceipts();
    receipts.unshift(newReceipt);
    this.set(STORAGE_KEYS.RECEIPTS, receipts);

    // Apply Entitlement side-effects based on Pipeline Type
    this.applyPaymentSideEffects(invoice);

    // Dispatch Notifications (WhatsApp + Email)
    this.dispatchNotification({
      recipientId: invoice.payerId,
      recipientName: invoice.payerName,
      recipientContact: phoneNumber,
      channel: 'whatsapp',
      pipelineType: invoice.pipelineType,
      title: `Payment Received: ${newReceipt.receiptNumber}`,
      body: `Confirmed! KES ${invoice.amount.toLocaleString()} received via M-Pesa ${mpesaRef} for ${invoice.invoiceNumber}. Receipt ${newReceipt.receiptNumber} generated. Thank you!`,
      invoiceId: invoice.id
    });

    this.dispatchNotification({
      recipientId: invoice.payerId,
      recipientName: invoice.payerName,
      recipientContact: 'email@domain.com',
      channel: 'email',
      pipelineType: invoice.pipelineType,
      title: `Official Receipt - ${newReceipt.receiptNumber}`,
      body: `Your official payment receipt of KES ${invoice.amount.toLocaleString()} for ${invoice.billingPeriod} has been generated. Verified by RentFlow.`,
      invoiceId: invoice.id
    });

    return { payment: newPayment, receipt: newReceipt };
  }

  public async submitManualMpesaPayment(invoiceId: string, mpesaReference: string, phoneNumber: string, notes?: string): Promise<Payment> {
    await this.submitToBackend('manual_mpesa_payment', { invoiceId, mpesaReference, phoneNumber, notes });
    const invoices = this.getInvoices();
    const invIndex = invoices.findIndex(i => i.id === invoiceId);
    if (invIndex === -1) throw new Error('Invoice not found');

    const invoice = invoices[invIndex];
    const timestamp = new Date().toISOString();

    const newPayment: Payment = {
      id: `pay-${Date.now()}`,
      paymentNumber: `PAY-${Math.floor(1000 + Math.random() * 9000)}`,
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      pipelineType: invoice.pipelineType,
      payerId: invoice.payerId,
      payerName: invoice.payerName,
      payeeId: invoice.payeeId,
      amount: invoice.amount,
      method: 'mpesa_manual',
      mpesaReference: mpesaReference.trim().toUpperCase(),
      phoneNumber,
      status: 'pending_verification',
      notes,
      submittedAt: timestamp
    };

    const payments = this.getPayments();
    payments.unshift(newPayment);
    this.set(STORAGE_KEYS.PAYMENTS, payments);

    // Update invoice status to pending_verification
    invoice.status = 'pending_verification';
    invoices[invIndex] = invoice;
    this.set(STORAGE_KEYS.INVOICES, invoices);

    // Notify payee/verifier
    const verifierRole = invoice.pipelineType === 'PLATFORM_SUBSCRIPTION' ? 'System Administrator' : 'Managing Agent';
    this.dispatchNotification({
      recipientId: invoice.payeeId,
      recipientName: verifierRole,
      recipientContact: '+254712345678',
      channel: 'whatsapp',
      pipelineType: invoice.pipelineType,
      title: `Manual M-Pesa Submitted: ${newPayment.mpesaReference}`,
      body: `${invoice.payerName} submitted M-Pesa Code "${newPayment.mpesaReference}" for KES ${invoice.amount.toLocaleString()} (${invoice.invoiceNumber}). Please verify and approve.`,
      invoiceId: invoice.id
    });

    return newPayment;
  }

  public async verifyManualPayment(paymentId: string, approved: boolean, verifiedBy: string, rejectionReason?: string): Promise<void> {
    await this.submitToBackend('verify_manual_payment', { paymentId, approved, verifiedBy, rejectionReason });
    const payments = this.getPayments();
    const pIndex = payments.findIndex(p => p.id === paymentId);
    if (pIndex === -1) throw new Error('Payment not found');

    const payment = payments[pIndex];
    const timestamp = new Date().toISOString();

    const invoices = this.getInvoices();
    const invIndex = invoices.findIndex(i => i.id === payment.invoiceId);

    if (approved) {
      payment.status = 'completed';
      payment.verifiedAt = timestamp;
      payment.verifiedBy = verifiedBy;
      payments[pIndex] = payment;
      this.set(STORAGE_KEYS.PAYMENTS, payments);

      if (invIndex !== -1) {
        const invoice = invoices[invIndex];
        invoice.status = 'paid';
        invoice.paidAt = timestamp;
        invoices[invIndex] = invoice;
        this.set(STORAGE_KEYS.INVOICES, invoices);

        // Generate Receipt
        const prefix = invoice.pipelineType === 'PLATFORM_SUBSCRIPTION' ? 'REC-SUB' :
                       invoice.pipelineType === 'AGENT_MANAGEMENT_FEE' ? 'REC-MGT' : 'REC-TNT';
        const newReceipt: Receipt = {
          id: `rec-${Date.now()}`,
          receiptNumber: `${prefix}-2026-${Math.floor(100 + Math.random() * 900)}`,
          paymentId: payment.id,
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          pipelineType: invoice.pipelineType,
          payerName: invoice.payerName,
          payerPhone: payment.phoneNumber,
          payeeName: invoice.payeeName,
          amount: invoice.amount,
          issuedAt: timestamp,
          items: invoice.items,
          mpesaReference: payment.mpesaReference,
          verificationCode: `RF-${invoice.amount}-${payment.mpesaReference}-VERIFIED`
        };

        const receipts = this.getReceipts();
        receipts.unshift(newReceipt);
        this.set(STORAGE_KEYS.RECEIPTS, receipts);

        // Apply entitlement side-effects
        this.applyPaymentSideEffects(invoice);

        // Notify payer
        this.dispatchNotification({
          recipientId: invoice.payerId,
          recipientName: invoice.payerName,
          recipientContact: payment.phoneNumber,
          channel: 'whatsapp',
          pipelineType: invoice.pipelineType,
          title: `Payment Verified & Approved!`,
          body: `M-Pesa reference ${payment.mpesaReference} was verified by ${verifiedBy}. Receipt ${newReceipt.receiptNumber} issued for KES ${invoice.amount.toLocaleString()}.`
        });
      }
    } else {
      payment.status = 'rejected';
      payment.rejectionReason = rejectionReason || 'Transaction code could not be verified on Safaricom statement';
      payments[pIndex] = payment;
      this.set(STORAGE_KEYS.PAYMENTS, payments);

      if (invIndex !== -1) {
        invoices[invIndex].status = 'unpaid';
        this.set(STORAGE_KEYS.INVOICES, invoices);

        this.dispatchNotification({
          recipientId: payment.payerId,
          recipientName: payment.payerName,
          recipientContact: payment.phoneNumber,
          channel: 'whatsapp',
          pipelineType: payment.pipelineType,
          title: `Payment Verification Declined`,
          body: `Your submitted reference ${payment.mpesaReference} was rejected. Reason: ${payment.rejectionReason}. Please check your M-Pesa statement or resubmit.`
        });
      }
    }
  }

  public async updateAgentSubscription(
    agentId: string,
    subscriptionStatus: AgentProfile['subscriptionStatus'],
    subscriptionExpiry?: string
  ): Promise<void> {
    await this.submitToBackend('update_agent_subscription', { agentId, subscriptionStatus, subscriptionExpiry });
    const agents = this.getAgents();
    const index = agents.findIndex(agent => agent.id === agentId);
    if (index !== -1) {
      agents[index] = {
        ...agents[index],
        subscriptionStatus,
        ...(subscriptionExpiry ? { subscriptionExpiry } : {})
      };
      this.set(STORAGE_KEYS.AGENTS, agents);
    }
  }

  private applyPaymentSideEffects(invoice: Invoice): void {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    const expiryStr = futureDate.toISOString();

    if (invoice.pipelineType === 'PLATFORM_SUBSCRIPTION') {
      // Find agent profile and activate/extend
      const agents = this.getAgents();
      const aIndex = agents.findIndex(a => a.userId === invoice.payerId);
      if (aIndex !== -1) {
        agents[aIndex].subscriptionStatus = 'active';
        agents[aIndex].subscriptionExpiry = expiryStr;
        this.set(STORAGE_KEYS.AGENTS, agents);
      }
    } else if (invoice.pipelineType === 'AGENT_MANAGEMENT_FEE') {
      // Find landlord profile and activate/extend
      const landlords = this.getLandlords();
      const lIndex = landlords.findIndex(l => l.userId === invoice.payerId);
      if (lIndex !== -1) {
        landlords[lIndex].feeStatus = 'active';
        landlords[lIndex].feeExpiry = expiryStr;
        this.set(STORAGE_KEYS.LANDLORDS, landlords);
      }
    }
  }

  public dispatchNotification(params: Omit<NotificationLog, 'id' | 'sentAt' | 'status'>): NotificationLog {
    const notifications = this.getNotifications();
    const newNotif: NotificationLog = {
      ...params,
      id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      sentAt: new Date().toISOString(),
      status: 'delivered'
    };
    notifications.unshift(newNotif);
    this.set(STORAGE_KEYS.NOTIFICATIONS, notifications);
    return newNotif;
  }

  // --- Financial Aggregations & Metrics ---
  public getAdminMetrics() {
    const subInvoices = this.getInvoices().filter(i => i.pipelineType === 'PLATFORM_SUBSCRIPTION');
    const totalSaaSRevenue = subInvoices
      .filter(i => i.status === 'paid')
      .reduce((acc, curr) => acc + curr.amount, 0);

    const agents = this.getAgents();
    const activeAgents = agents.filter(a => a.subscriptionStatus === 'active').length;
    const expiredAgents = agents.filter(a => a.subscriptionStatus === 'expired').length;

    const pendingSubVerifications = this.getPayments().filter(
      p => p.pipelineType === 'PLATFORM_SUBSCRIPTION' && p.status === 'pending_verification'
    ).length;

    return {
      totalSaaSRevenue,
      totalAgents: agents.length,
      activeAgents,
      expiredAgents,
      pendingSubVerifications
    };
  }

  public getAgentMetrics(agentUserId: string) {
    const invoices = this.getInvoices();
    // 1. Tenant rent collected vs outstanding
    const tenantInvoices = invoices.filter(
      i => i.pipelineType === 'TENANT_RENT_UTILITY' && i.payeeId === agentUserId
    );
    const rentCollected = tenantInvoices
      .filter(i => i.status === 'paid')
      .reduce((acc, curr) => acc + curr.amount, 0);
    const rentOutstanding = tenantInvoices
      .filter(i => i.status !== 'paid')
      .reduce((acc, curr) => acc + curr.amount, 0);

    // 2. Management fees earned from landlords
    const mgtInvoices = invoices.filter(
      i => i.pipelineType === 'AGENT_MANAGEMENT_FEE' && i.payeeId === agentUserId
    );
    const mgtFeesEarned = mgtInvoices
      .filter(i => i.status === 'paid')
      .reduce((acc, curr) => acc + curr.amount, 0);

    // 3. Pending verifications
    const pendingVerifications = this.getPayments().filter(
      p => p.payeeId === agentUserId && p.status === 'pending_verification'
    ).length;

    return {
      rentCollected,
      rentOutstanding,
      mgtFeesEarned,
      pendingVerifications
    };
  }

  public getLandlordMetrics(landlordUserId: string) {
    const currentUser = this.getUsers().find(u => u.id === landlordUserId);
    if (!currentUser) return { grossRentCollected: 0, mgtFeesDeducted: 0, netPayout: 0 };

    const props = this.getIsolatedProperties(currentUser).map(p => p.id);
    const tenantInvoices = this.getInvoices().filter(
      i => i.pipelineType === 'TENANT_RENT_UTILITY' && i.propertyId && props.includes(i.propertyId) && i.status === 'paid'
    );
    const grossRentCollected = tenantInvoices.reduce((acc, curr) => acc + curr.amount, 0);

    // Management fees paid
    const mgtInvoices = this.getInvoices().filter(
      i => i.pipelineType === 'AGENT_MANAGEMENT_FEE' && i.payerId === landlordUserId && i.status === 'paid'
    );
    const mgtFeesDeducted = mgtInvoices.reduce((acc, curr) => acc + curr.amount, 0);

    return {
      grossRentCollected,
      mgtFeesDeducted,
      netPayout: Math.max(0, grossRentCollected - mgtFeesDeducted)
    };
  }

  public resetToSeed(): void {
    this.init(true);
  }
}

export const db = new RentFlowDatabase();
