// Employee Types
export interface Employee {
  _id: string;
  employeeId: string;
  name: string;
  email: string;
  department: string;
  position: string;
  avatar?: string;
  role: 'employee' | 'manager' | 'admin';
  isActive: boolean;
  address?: string;
  age?: number;
  scheduleTimeIn?: string;
  scheduleTimeOut?: string;
  profileCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeWithPassword extends Employee {
  password: string;
}

// Attendance Types
export type AttendanceStatus = 'in_progress' | 'complete' | 'undertime' | 'overtime' | 'auto_signed_out';

export type AttendanceType = 'TIME_IN' | 'TIME_OUT';

export interface Attendance {
  _id: string;
  employeeId: string;
  employee?: Employee;
  type: AttendanceType;
  timestamp: string;
  status: AttendanceStatus;
  timeIn?: string;
  timeOut?: string;
  totalMinutes?: number;
  workMinutes?: number;
  overtimeRequested?: boolean;
  overtimeRequestedAt?: string;
  overtimeApproved?: boolean;
  overtimeApprovedBy?: string;
  overtimeApprovedAt?: string;
  autoSignedOut?: boolean;
  deviceInfo?: string;
  qrTokenUsed?: string;
  location?: string;
  notes?: string;
}

export interface AttendanceRecord {
  date: string;
  timeIn?: string;
  timeOut?: string;
  duration?: string;
  status: AttendanceStatus;
}

// QR Session Types
export interface QRSession {
  _id: string;
  employeeId: string;
  token: string;
  expiresAt: string;
  createdAt: string;
}

// Auth Types
export interface AuthPayload {
  userId: string;
  employeeId: string;
  role: 'employee' | 'manager' | 'admin';
  email: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends LoginCredentials {
  name: string;
  employeeId: string;
  department: string;
  position: string;
}

// QR Token Payload
export interface QRTokenPayload {
  employeeId: string;
  timestamp: number;
  expiresAt: number;
  signature: string;
}

// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Socket Event Types
export interface ScanEvent {
  employeeId: string;
  employeeName: string;
  type: AttendanceType;
  timestamp: string;
  success: boolean;
}

export interface NotificationEvent {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
  timestamp: string;
}

// Dashboard Stats Types
export interface DashboardStats {
  totalEmployees: number;
  presentToday: number;
  lateToday: number;
  absentToday: number;
  onLeave: number;
}

export interface AttendanceChartData {
  date: string;
  present: number;
  late: number;
  absent: number;
}

// Filter Types
export interface AttendanceFilters {
  startDate?: string;
  endDate?: string;
  employeeId?: string;
  department?: string;
  type?: AttendanceType;
}

// Notification Types
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'SHIFT_30MIN' | 'SHIFT_10MIN' | 'SHIFT_COMPLETE' | 'OVERTIME_REQUEST' | 'OVERTIME_APPROVED' | 'OVERTIME_REJECTED' | 'AUTO_SIGNED_OUT';
  read: boolean;
  recipientId: string;
  senderId?: string;
  attendanceId?: string;
  actionRequired?: boolean;
  actionTaken?: boolean;
  createdAt: string;
}