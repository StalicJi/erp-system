export type Permission =
  | 'hr.read'
  | 'hr.write'
  | 'finance.read'
  | 'finance.write'
  | 'sales.read'
  | 'sales.write'
  | 'it.read'
  | 'it.write'
  | 'admin.read'
  | 'admin.write'
  | 'reports.read'
  | 'reports.write'
  | 'projects.read'
  | 'projects.write'
  | 'audit.read'
  | 'settings.read'
  | 'settings.write'

export const PERMISSION_LABELS: Record<Permission, string> = {
  'hr.read': '人資 - 查看',
  'hr.write': '人資 - 編輯',
  'finance.read': '財務 - 查看',
  'finance.write': '財務 - 編輯',
  'sales.read': '業務 - 查看',
  'sales.write': '業務 - 編輯',
  'it.read': '資訊 - 查看',
  'it.write': '資訊 - 編輯',
  'admin.read': '管理員 - 查看',
  'admin.write': '管理員 - 編輯',
  'reports.read': '報表 - 查看',
  'reports.write': '報表 - 填寫',
  'projects.read': '專案 - 查看',
  'projects.write': '專案 - 編輯',
  'audit.read': '事件紀錄 - 查看',
  'settings.read': '系統設定 - 查看',
  'settings.write': '系統設定 - 編輯',
}

export const ALL_PERMISSIONS: Permission[] = Object.keys(PERMISSION_LABELS) as Permission[]

export interface Employee {
  id: string
  name: string
  email: string
  phone: string
  position: string
  employeeNumber: string
  status: 'active' | 'inactive'
  loginEnabled: boolean
  password: string
  forcePasswordChange: boolean
  departmentIds: string[]
  isManager: boolean
  createdAt: string
  updatedAt: string
}

export interface Department {
  id: string
  name: string
  description: string
  permissions: Permission[]
  memberIds: string[]
  managerId?: string
  createdAt: string
  updatedAt: string
}

export interface Project {
  id: string
  name: string
  description: string
  departmentId: string
  status: 'active' | 'completed' | 'paused'
  createdAt: string
  updatedAt: string
}

export interface DailyReport {
  id: string
  employeeId: string
  date: string
  projectId: string
  action: string
  description: string
  hours: number
  createdAt: string
  updatedAt: string
}

export interface AuditLog {
  id: string
  userId: string
  userName: string
  action: string
  target: string
  detail: string
  timestamp: string
}

export interface AppSettings {
  siteName: string
  siteDescription: string
  logoText: string
  primaryColor: string
  allowSelfRegister: boolean
  sessionTimeout: number
  reportDeadlineHour: number
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
  siteName: 'ERP 系統',
  siteDescription: '企業資源規劃',
  logoText: 'ERP',
  primaryColor: 'blue',
  allowSelfRegister: false,
  sessionTimeout: 480,
  reportDeadlineHour: 18,
}

export interface AuthUser {
  id: string
  name: string
  email: string
  position: string
  isManager: boolean
  departmentIds: string[]
  permissions: Permission[]
}
