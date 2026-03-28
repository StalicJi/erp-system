'use client'

import { useEffect, useState } from 'react'
import { useErp } from '@/context/ErpContext'
import { Employee } from '@/types'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Switch } from '@/components/ui/switch'

interface Props {
  open: boolean
  onClose: () => void
  employee?: Employee | null
}

type EmpForm = Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>

const EMPTY: EmpForm = {
  name: '',
  email: '',
  phone: '',
  position: '',
  employeeNumber: '',
  status: 'active',
  loginEnabled: true,
  isManager: false,
  password: '',
  forcePasswordChange: false,
  departmentIds: [],
}

export default function EmployeeDialog({ open, onClose, employee }: Props) {
  const { addEmployee, updateEmployee, departments } = useErp()
  const [form, setForm] = useState<EmpForm>(EMPTY)

  useEffect(() => {
    if (employee) {
      const { id, createdAt, updatedAt, ...rest } = employee
      setForm(rest)
    } else {
      setForm(EMPTY)
    }
  }, [employee, open])

  const set = (k: keyof EmpForm, v: unknown) => setForm(f => ({ ...f, [k]: v }))

  const toggleDept = (deptId: string) => {
    set('departmentIds', form.departmentIds.includes(deptId)
      ? form.departmentIds.filter(id => id !== deptId)
      : [...form.departmentIds, deptId])
  }

  const handleSave = () => {
    if (!form.name || !form.email) return
    if (employee) {
      // In edit mode: never update employeeNumber or password
      const { employeeNumber, password, ...rest } = form
      updateEmployee(employee.id, rest)
    } else {
      addEmployee(form)
    }
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{employee ? '編輯員工' : '新增員工'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>姓名 *</Label>
              <Input value={form.name} onChange={e => set('name', e.target.value)} placeholder="王小明" />
            </div>
            <div className="space-y-1.5">
              <Label>員工編號</Label>
              <Input
                value={form.employeeNumber}
                onChange={e => set('employeeNumber', e.target.value)}
                placeholder="EMP001"
                disabled={!!employee}
              />
              {employee && (
                <p className="text-xs text-slate-400">員工編號建立後不可更改</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>電子郵件 *</Label>
            <Input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="name@company.com" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>電話</Label>
              <Input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="0912-345-678" />
            </div>
            <div className="space-y-1.5">
              <Label>職稱</Label>
              <Input value={form.position} onChange={e => set('position', e.target.value)} placeholder="工程師" />
            </div>
          </div>

          {!employee && (
            <div className="space-y-1.5">
              <Label>密碼 *</Label>
              <Input
                type="password"
                value={form.password}
                onChange={e => set('password', e.target.value)}
                placeholder="請輸入密碼"
              />
              <p className="text-xs text-slate-400">員工首次登入時將被強制修改密碼</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="text-sm font-medium">帳號狀態</p>
                <p className="text-xs text-slate-500">{form.status === 'active' ? '在職' : '離職'}</p>
              </div>
              <Switch
                checked={form.status === 'active'}
                onCheckedChange={v => set('status', v ? 'active' : 'inactive')}
              />
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="text-sm font-medium">允許登入</p>
                <p className="text-xs text-slate-500">可登入系統</p>
              </div>
              <Switch
                checked={form.loginEnabled}
                onCheckedChange={v => set('loginEnabled', v)}
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <p className="text-sm font-medium">設為部門主管</p>
              <p className="text-xs text-slate-500">主管可查看部門員工所有日報與 KPI</p>
            </div>
            <Switch
              checked={form.isManager}
              onCheckedChange={v => set('isManager', v)}
            />
          </div>

          <div className="space-y-2">
            <Label>所屬部門</Label>
            <ScrollArea className="h-40 border rounded-lg p-3">
              {departments.length === 0 && (
                <p className="text-sm text-slate-400">尚無部門</p>
              )}
              {departments.map(dept => (
                <div key={dept.id} className="flex items-center gap-2 py-1.5">
                  <Checkbox
                    id={`dept-${dept.id}`}
                    checked={form.departmentIds.includes(dept.id)}
                    onCheckedChange={() => toggleDept(dept.id)}
                  />
                  <label htmlFor={`dept-${dept.id}`} className="text-sm cursor-pointer flex-1">
                    {dept.name}
                  </label>
                  {dept.permissions.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {dept.permissions.length} 權限
                    </Badge>
                  )}
                </div>
              ))}
            </ScrollArea>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>取消</Button>
          <Button onClick={handleSave} disabled={!form.name || !form.email}>
            {employee ? '儲存修改' : '新增員工'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
