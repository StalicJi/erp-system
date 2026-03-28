'use client'

import { useEffect, useState } from 'react'
import { useErp } from '@/context/ErpContext'
import { Department, Permission, ALL_PERMISSIONS, PERMISSION_LABELS } from '@/types'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'

interface Props {
  open: boolean
  onClose: () => void
  department?: Department | null
}

type DeptForm = Omit<Department, 'id' | 'createdAt' | 'updatedAt'>

const EMPTY: DeptForm = {
  name: '',
  description: '',
  permissions: [],
  memberIds: [],
  managerId: undefined,
}

export default function DepartmentDialog({ open, onClose, department }: Props) {
  const { addDepartment, updateDepartment } = useErp()
  const [form, setForm] = useState<DeptForm>(EMPTY)

  useEffect(() => {
    if (department) {
      const { id, createdAt, updatedAt, ...rest } = department
      setForm(rest)
    } else {
      setForm(EMPTY)
    }
  }, [department, open])

  const set = (k: keyof DeptForm, v: unknown) => setForm(f => ({ ...f, [k]: v }))

  const togglePermission = (perm: Permission) => {
    set('permissions', form.permissions.includes(perm)
      ? form.permissions.filter(p => p !== perm)
      : [...form.permissions, perm])
  }

  // Group permissions by module
  const modules = Array.from(new Set(ALL_PERMISSIONS.map(p => p.split('.')[0])))

  const handleSave = () => {
    if (!form.name) return
    if (department) {
      updateDepartment(department.id, form)
    } else {
      addDepartment(form)
    }
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{department ? '編輯部門' : '新增部門'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>部門名稱 *</Label>
            <Input value={form.name} onChange={e => set('name', e.target.value)} placeholder="人資部" />
          </div>
          <div className="space-y-1.5">
            <Label>部門描述</Label>
            <Input value={form.description} onChange={e => set('description', e.target.value)} placeholder="負責人力資源管理" />
          </div>

          <Separator />

          <div className="space-y-3">
            <Label>部門權限</Label>
            <div className="space-y-3">
              {modules.map(mod => (
                <div key={mod} className="border rounded-lg p-3 space-y-2">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    {mod === 'hr' ? '人資' :
                     mod === 'finance' ? '財務' :
                     mod === 'sales' ? '業務' :
                     mod === 'it' ? '資訊' :
                     mod === 'admin' ? '管理員' : mod}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {ALL_PERMISSIONS.filter(p => p.startsWith(mod)).map(perm => (
                      <div key={perm} className="flex items-center gap-2">
                        <Checkbox
                          id={`perm-${perm}`}
                          checked={form.permissions.includes(perm as Permission)}
                          onCheckedChange={() => togglePermission(perm as Permission)}
                        />
                        <label htmlFor={`perm-${perm}`} className="text-sm cursor-pointer">
                          {PERMISSION_LABELS[perm as Permission]}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>取消</Button>
          <Button onClick={handleSave} disabled={!form.name}>
            {department ? '儲存修改' : '新增部門'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
