'use client'

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import {
  Employee, Department, Project, DailyReport, AuditLog, AppSettings, AuthUser, Permission,
  DEFAULT_APP_SETTINGS,
} from '@/types'
import { DEFAULT_EMPLOYEES, DEFAULT_DEPARTMENTS, DEFAULT_PROJECTS } from '@/lib/data'

interface ErpContextType {
  // Auth
  currentUser: AuthUser | null
  login: (employeeNumber: string, password: string) => boolean
  logout: () => void
  changePassword: (id: string, currentPassword: string, newPassword: string) => boolean

  // Employees
  employees: Employee[]
  addEmployee: (emp: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateEmployee: (id: string, emp: Partial<Employee>) => void
  deleteEmployee: (id: string) => void
  toggleEmployeeLogin: (id: string) => void

  // Departments
  departments: Department[]
  addDepartment: (dept: Omit<Department, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateDepartment: (id: string, dept: Partial<Department>) => void
  deleteDepartment: (id: string) => void
  addEmployeeToDepartment: (deptId: string, empId: string) => void
  removeEmployeeFromDepartment: (deptId: string, empId: string) => void

  // Projects
  projects: Project[]
  addProject: (proj: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateProject: (id: string, proj: Partial<Project>) => void
  deleteProject: (id: string) => void

  // Daily Reports
  dailyReports: DailyReport[]
  addDailyReport: (report: Omit<DailyReport, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateDailyReport: (id: string, report: Partial<DailyReport>) => void
  deleteDailyReport: (id: string) => void

  // Audit Logs
  auditLogs: AuditLog[]

  // Settings
  appSettings: AppSettings
  updateAppSettings: (s: Partial<AppSettings>) => void
}

const ErpContext = createContext<ErpContextType | null>(null)

const SK = {
  employees: 'erp_employees',
  departments: 'erp_departments',
  projects: 'erp_projects',
  dailyReports: 'erp_daily_reports',
  auditLogs: 'erp_audit_logs',
  settings: 'erp_app_settings',
  currentUser: 'erp_current_user',
}

function genId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
}

function load<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const v = localStorage.getItem(key)
    return v ? JSON.parse(v) : fallback
  } catch {
    return fallback
  }
}

export function ErpProvider({ children }: { children: React.ReactNode }) {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [dailyReports, setDailyReports] = useState<DailyReport[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [appSettings, setAppSettings] = useState<AppSettings>(DEFAULT_APP_SETTINGS)
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null)
  const [hydrated, setHydrated] = useState(false)

  // Keep a stable ref to current state for use inside callbacks without stale closure issues
  const stateRef = useRef({ employees, departments, currentUser })
  useEffect(() => { stateRef.current = { employees, departments, currentUser } }, [employees, departments, currentUser])

  // ── Hydration ──────────────────────────────────────────────────────────────
  useEffect(() => {
    setEmployees(load(SK.employees, DEFAULT_EMPLOYEES))
    setDepartments(load(SK.departments, DEFAULT_DEPARTMENTS))
    setProjects(load(SK.projects, DEFAULT_PROJECTS))
    setDailyReports(load(SK.dailyReports, []))
    setAuditLogs(load(SK.auditLogs, []))
    setAppSettings(load(SK.settings, DEFAULT_APP_SETTINGS))
    setCurrentUser(load(SK.currentUser, null))
    setHydrated(true)
  }, [])

  // ── Persistence ────────────────────────────────────────────────────────────
  useEffect(() => { if (hydrated) localStorage.setItem(SK.employees, JSON.stringify(employees)) }, [employees, hydrated])
  useEffect(() => { if (hydrated) localStorage.setItem(SK.departments, JSON.stringify(departments)) }, [departments, hydrated])
  useEffect(() => { if (hydrated) localStorage.setItem(SK.projects, JSON.stringify(projects)) }, [projects, hydrated])
  useEffect(() => { if (hydrated) localStorage.setItem(SK.dailyReports, JSON.stringify(dailyReports)) }, [dailyReports, hydrated])
  useEffect(() => { if (hydrated) localStorage.setItem(SK.auditLogs, JSON.stringify(auditLogs)) }, [auditLogs, hydrated])
  useEffect(() => { if (hydrated) localStorage.setItem(SK.settings, JSON.stringify(appSettings)) }, [appSettings, hydrated])

  // ── Audit helper ───────────────────────────────────────────────────────────
  const addAuditLog = useCallback((action: string, target: string, detail: string) => {
    const user = stateRef.current.currentUser
    const entry: AuditLog = {
      id: genId('log'),
      userId: user?.id ?? 'system',
      userName: user?.name ?? '系統',
      action,
      target,
      detail,
      timestamp: new Date().toISOString(),
    }
    setAuditLogs(prev => [entry, ...prev].slice(0, 500)) // Keep last 500
  }, [])

  // ── Auth ───────────────────────────────────────────────────────────────────
  const login = useCallback((employeeNumber: string, password: string): boolean => {
    const { employees: emps, departments: depts } = stateRef.current
    const emp = emps.find(e =>
      e.employeeNumber === employeeNumber && e.password === password && e.loginEnabled && e.status === 'active'
    )
    if (!emp) return false

    const empDepts = depts.filter(d => emp.departmentIds.includes(d.id))
    const permissions = Array.from(new Set(empDepts.flatMap(d => d.permissions))) as Permission[]

    const user: AuthUser = {
      id: emp.id,
      name: emp.name,
      email: emp.email,
      position: emp.position,
      isManager: emp.isManager,
      departmentIds: emp.departmentIds,
      permissions,
    }
    setCurrentUser(user)
    localStorage.setItem(SK.currentUser, JSON.stringify(user))

    // Audit after state update
    const entry: AuditLog = {
      id: genId('log'),
      userId: emp.id,
      userName: emp.name,
      action: '登入',
      target: '系統',
      detail: `${emp.name} 登入系統`,
      timestamp: new Date().toISOString(),
    }
    setAuditLogs(prev => [entry, ...prev].slice(0, 500))
    return true
  }, [])

  const changePassword = useCallback((id: string, currentPassword: string, newPassword: string): boolean => {
    const { employees: emps } = stateRef.current
    const emp = emps.find(e => e.id === id)
    if (!emp || emp.password !== currentPassword) return false
    const now = new Date().toISOString()
    setEmployees(p => p.map(e =>
      e.id === id ? { ...e, password: newPassword, forcePasswordChange: false, updatedAt: now } : e
    ))
    addAuditLog('修改密碼', '個人設定', `${emp.name} 修改了密碼`)
    return true
  }, [addAuditLog])

  const logout = useCallback(() => {
    addAuditLog('登出', '系統', `${stateRef.current.currentUser?.name ?? ''} 登出系統`)
    setCurrentUser(null)
    localStorage.removeItem(SK.currentUser)
  }, [addAuditLog])

  // ── Employee CRUD ─────────────────────────────────────────────────────────
  const addEmployee = useCallback((emp: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString()
    const newEmp: Employee = { ...emp, forcePasswordChange: true, id: genId('emp'), createdAt: now, updatedAt: now }
    setEmployees(prev => [...prev, newEmp])
    if (emp.departmentIds.length > 0) {
      setDepartments(prev => prev.map(d =>
        emp.departmentIds.includes(d.id) && !d.memberIds.includes(newEmp.id)
          ? { ...d, memberIds: [...d.memberIds, newEmp.id], updatedAt: now }
          : d
      ))
    }
    addAuditLog('新增員工', '員工管理', `新增員工：${emp.name}（${emp.email}）`)
  }, [addAuditLog])

  const updateEmployee = useCallback((id: string, updates: Partial<Employee>) => {
    const now = new Date().toISOString()
    const prev = stateRef.current.employees.find(e => e.id === id)
    setEmployees(p => p.map(e => e.id === id ? { ...e, ...updates, updatedAt: now } : e))
    if (updates.departmentIds !== undefined) {
      setDepartments(p => p.map(d => {
        const should = updates.departmentIds!.includes(d.id)
        const has = d.memberIds.includes(id)
        if (should && !has) return { ...d, memberIds: [...d.memberIds, id], updatedAt: now }
        if (!should && has) return { ...d, memberIds: d.memberIds.filter(m => m !== id), updatedAt: now }
        return d
      }))
    }
    const changed = Object.keys(updates).filter(k => k !== 'updatedAt').join('、')
    addAuditLog('修改員工', '員工管理', `修改員工：${prev?.name ?? id}（欄位：${changed}）`)
  }, [addAuditLog])

  const deleteEmployee = useCallback((id: string) => {
    const emp = stateRef.current.employees.find(e => e.id === id)
    setEmployees(p => p.filter(e => e.id !== id))
    setDepartments(p => p.map(d => ({
      ...d,
      memberIds: d.memberIds.filter(m => m !== id),
      managerId: d.managerId === id ? undefined : d.managerId,
      updatedAt: new Date().toISOString(),
    })))
    addAuditLog('刪除員工', '員工管理', `刪除員工：${emp?.name ?? id}`)
  }, [addAuditLog])

  const toggleEmployeeLogin = useCallback((id: string) => {
    const emp = stateRef.current.employees.find(e => e.id === id)
    setEmployees(p => p.map(e =>
      e.id === id ? { ...e, loginEnabled: !e.loginEnabled, updatedAt: new Date().toISOString() } : e
    ))
    addAuditLog(
      emp?.loginEnabled ? '停用登入' : '啟用登入',
      '員工管理',
      `${emp?.loginEnabled ? '停用' : '啟用'} ${emp?.name ?? id} 的系統登入`
    )
  }, [addAuditLog])

  // ── Department CRUD ──────────────────────────────────────────────────────
  const addDepartment = useCallback((dept: Omit<Department, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString()
    const newDept: Department = { ...dept, id: genId('dept'), createdAt: now, updatedAt: now }
    setDepartments(p => [...p, newDept])
    if (dept.memberIds.length > 0) {
      setEmployees(p => p.map(e =>
        dept.memberIds.includes(e.id) && !e.departmentIds.includes(newDept.id)
          ? { ...e, departmentIds: [...e.departmentIds, newDept.id], updatedAt: now }
          : e
      ))
    }
    addAuditLog('新增部門', '部門管理', `新增部門：${dept.name}`)
  }, [addAuditLog])

  const updateDepartment = useCallback((id: string, updates: Partial<Department>) => {
    const now = new Date().toISOString()
    const prev = stateRef.current.departments.find(d => d.id === id)
    setDepartments(p => p.map(d => d.id === id ? { ...d, ...updates, updatedAt: now } : d))
    if (updates.memberIds !== undefined) {
      setEmployees(p => p.map(e => {
        const should = updates.memberIds!.includes(e.id)
        const has = e.departmentIds.includes(id)
        if (should && !has) return { ...e, departmentIds: [...e.departmentIds, id], updatedAt: now }
        if (!should && has) return { ...e, departmentIds: e.departmentIds.filter(did => did !== id), updatedAt: now }
        return e
      }))
    }
    addAuditLog('修改部門', '部門管理', `修改部門：${prev?.name ?? id}`)
  }, [addAuditLog])

  const deleteDepartment = useCallback((id: string) => {
    const dept = stateRef.current.departments.find(d => d.id === id)
    setDepartments(p => p.filter(d => d.id !== id))
    setEmployees(p => p.map(e => ({
      ...e,
      departmentIds: e.departmentIds.filter(did => did !== id),
      updatedAt: new Date().toISOString(),
    })))
    addAuditLog('刪除部門', '部門管理', `刪除部門：${dept?.name ?? id}`)
  }, [addAuditLog])

  const addEmployeeToDepartment = useCallback((deptId: string, empId: string) => {
    const now = new Date().toISOString()
    const dept = stateRef.current.departments.find(d => d.id === deptId)
    const emp = stateRef.current.employees.find(e => e.id === empId)
    setDepartments(p => p.map(d =>
      d.id === deptId && !d.memberIds.includes(empId)
        ? { ...d, memberIds: [...d.memberIds, empId], updatedAt: now } : d
    ))
    setEmployees(p => p.map(e =>
      e.id === empId && !e.departmentIds.includes(deptId)
        ? { ...e, departmentIds: [...e.departmentIds, deptId], updatedAt: now } : e
    ))
    addAuditLog('加入部門', '部門管理', `將 ${emp?.name ?? empId} 加入 ${dept?.name ?? deptId}`)
  }, [addAuditLog])

  const removeEmployeeFromDepartment = useCallback((deptId: string, empId: string) => {
    const now = new Date().toISOString()
    const dept = stateRef.current.departments.find(d => d.id === deptId)
    const emp = stateRef.current.employees.find(e => e.id === empId)
    setDepartments(p => p.map(d =>
      d.id === deptId ? { ...d, memberIds: d.memberIds.filter(m => m !== empId), updatedAt: now } : d
    ))
    setEmployees(p => p.map(e =>
      e.id === empId ? { ...e, departmentIds: e.departmentIds.filter(did => did !== deptId), updatedAt: now } : e
    ))
    addAuditLog('移出部門', '部門管理', `將 ${emp?.name ?? empId} 從 ${dept?.name ?? deptId} 移除`)
  }, [addAuditLog])

  // ── Project CRUD ─────────────────────────────────────────────────────────
  const addProject = useCallback((proj: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString()
    const newProj: Project = { ...proj, id: genId('proj'), createdAt: now, updatedAt: now }
    setProjects(p => [...p, newProj])
    addAuditLog('新增專案', '專案管理', `新增專案：${proj.name}`)
  }, [addAuditLog])

  const updateProject = useCallback((id: string, updates: Partial<Project>) => {
    const prev = projects.find(p => p.id === id)
    setProjects(p => p.map(proj =>
      proj.id === id ? { ...proj, ...updates, updatedAt: new Date().toISOString() } : proj
    ))
    addAuditLog('修改專案', '專案管理', `修改專案：${prev?.name ?? id}`)
  }, [projects, addAuditLog])

  const deleteProject = useCallback((id: string) => {
    const proj = projects.find(p => p.id === id)
    setProjects(p => p.filter(proj => proj.id !== id))
    addAuditLog('刪除專案', '專案管理', `刪除專案：${proj?.name ?? id}`)
  }, [projects, addAuditLog])

  // ── Daily Reports CRUD ────────────────────────────────────────────────────
  const addDailyReport = useCallback((report: Omit<DailyReport, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString()
    const newReport: DailyReport = { ...report, id: genId('rpt'), createdAt: now, updatedAt: now }
    setDailyReports(p => [...p, newReport])
    const proj = projects.find(p => p.id === report.projectId)
    addAuditLog('新增日報', '工作日報', `新增日報：${report.date} / 專案：${proj?.name ?? report.projectId}`)
  }, [projects, addAuditLog])

  const updateDailyReport = useCallback((id: string, updates: Partial<DailyReport>) => {
    setDailyReports(p => p.map(r =>
      r.id === id ? { ...r, ...updates, updatedAt: new Date().toISOString() } : r
    ))
    addAuditLog('修改日報', '工作日報', `修改日報 ID：${id}`)
  }, [addAuditLog])

  const deleteDailyReport = useCallback((id: string) => {
    setDailyReports(p => p.filter(r => r.id !== id))
    addAuditLog('刪除日報', '工作日報', `刪除日報 ID：${id}`)
  }, [addAuditLog])

  // ── Settings ──────────────────────────────────────────────────────────────
  const updateAppSettings = useCallback((updates: Partial<AppSettings>) => {
    setAppSettings(p => ({ ...p, ...updates }))
    const changed = Object.keys(updates).join('、')
    addAuditLog('修改系統設定', '系統設定', `修改設定項目：${changed}`)
  }, [addAuditLog])

  if (!hydrated) return null

  return (
    <ErpContext.Provider value={{
      currentUser, login, logout, changePassword,
      employees, addEmployee, updateEmployee, deleteEmployee, toggleEmployeeLogin,
      departments, addDepartment, updateDepartment, deleteDepartment,
      addEmployeeToDepartment, removeEmployeeFromDepartment,
      projects, addProject, updateProject, deleteProject,
      dailyReports, addDailyReport, updateDailyReport, deleteDailyReport,
      auditLogs,
      appSettings, updateAppSettings,
    }}>
      {children}
    </ErpContext.Provider>
  )
}

export function useErp() {
  const ctx = useContext(ErpContext)
  if (!ctx) throw new Error('useErp must be used within ErpProvider')
  return ctx
}
