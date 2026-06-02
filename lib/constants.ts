// QR Code Configuration
export const QR_EXPIRY_SECONDS = 30;
export const QR_REFRESH_INTERVAL = 25000; // 25 seconds (refresh before expiry)

// Scan Configuration
export const SCAN_COOLDOWN_MS = 10000; // 10 seconds cooldown between scans
export const DUPLICATE_SCAN_WINDOW_MS = 60000; // 1 minute window for duplicate detection

// Work Hours Configuration
export const WORK_START_HOUR = 8; // 8:00 AM
export const WORK_START_MINUTE = 0;
export const LATE_THRESHOLD_MINUTES = 15; // Late after 8:15 AM
export const WORK_END_HOUR = 17; // 5:00 PM

// Departments
export const DEPARTMENTS = [
  { value: 'Engineering', label: 'Engineering' },
  { value: 'Design', label: 'Design' },
  { value: 'Marketing', label: 'Marketing' },
  { value: 'Sales', label: 'Sales' },
  { value: 'Human Resources', label: 'Human Resources' },
  { value: 'Finance', label: 'Finance' },
  { value: 'Operations', label: 'Operations' },
  { value: 'Customer Support', label: 'Customer Support' },
  { value: 'Legal', label: 'Legal' },
  { value: 'Executive', label: 'Executive' },
] as const;

export type Department = typeof DEPARTMENTS[number]['value'];

// JWT Configuration
export const JWT_EXPIRES_IN = '7d';
export const QR_TOKEN_ALGORITHM = 'HS256';

// Socket Events
export const SOCKET_EVENTS = {
  // Client -> Server
  JOIN_EMPLOYEE_ROOM: 'join:employee',
  JOIN_ADMIN_ROOM: 'join:admin',
  JOIN_SCANNER_ROOM: 'join:scanner',
  SCAN_QR: 'scan:qr',

  // Server -> Client
  SCAN_RESULT: 'scan:result',
  ATTENDANCE_UPDATE: 'attendance:update',
  NOTIFICATION: 'notification',
  EMPLOYEE_STATUS_UPDATE: 'employee:status',
  DASHBOARD_UPDATE: 'dashboard:update',
} as const;

// API Endpoints
export const API_ROUTES = {
  // Auth
  LOGIN: '/api/auth/login',
  REGISTER: '/api/auth/register',
  LOGOUT: '/api/auth/logout',
  ME: '/api/auth/me',

  // Employees
  EMPLOYEES: '/api/employees',
  EMPLOYEE: (id: string) => `/api/employees/${id}`,

  // QR
  GENERATE_QR: '/api/qr/generate',
  VALIDATE_QR: '/api/qr/validate',

  // Attendance
  ATTENDANCE: '/api/attendance',
  ATTENDANCE_TODAY: '/api/attendance/today',
  ATTENDANCE_HISTORY: '/api/attendance/history',
  ATTENDANCE_EXPORT: '/api/attendance/export',

  // Dashboard
  DASHBOARD_STATS: '/api/dashboard/stats',
  DASHBOARD_CHART: '/api/dashboard/chart',
} as const;

// Status Colors
export const STATUS_COLORS = {
  present: 'bg-success text-success-foreground',
  late: 'bg-warning text-warning-foreground',
  absent: 'bg-destructive text-destructive-foreground',
  'half-day': 'bg-accent text-accent-foreground',
} as const;

// Status Configuration with labels
export const STATUS_CONFIG = {
  present: { color: 'text-emerald-500 bg-emerald-500/10', label: 'Present' },
  late: { color: 'text-amber-500 bg-amber-500/10', label: 'Late' },
  absent: { color: 'text-rose-500 bg-rose-500/10', label: 'Absent' },
  'half-day': { color: 'text-blue-500 bg-blue-500/10', label: 'Half Day' },
} as const;

// Time formats
export const TIME_FORMAT = 'h:mm a';
export const DATE_FORMAT = 'MMM d, yyyy';
export const DATETIME_FORMAT = 'MMM d, yyyy h:mm a';