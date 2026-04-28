import {
  PERMISSION_LABELS,
  ALL_PERMISSIONS,
  DEFAULT_APP_SETTINGS,
  type Permission,
  type AppSettings,
} from '@/types/index'

// Derived from the type definition — the canonical list of all Permission values
const EXPECTED_PERMISSIONS: Permission[] = [
  'hr.read',
  'hr.write',
  'finance.read',
  'finance.write',
  'sales.read',
  'sales.write',
  'it.read',
  'it.write',
  'admin.read',
  'admin.write',
  'reports.read',
  'reports.write',
  'projects.read',
  'projects.write',
  'audit.read',
  'settings.read',
  'settings.write',
]

describe('PERMISSION_LABELS', () => {
  it('has an entry for every expected permission', () => {
    for (const perm of EXPECTED_PERMISSIONS) {
      // Use bracket access: toHaveProperty interprets dots as nested paths
      expect(PERMISSION_LABELS[perm]).toBeDefined()
    }
  })

  it('has no extra or unknown keys beyond the expected permissions', () => {
    const keys = Object.keys(PERMISSION_LABELS) as Permission[]
    expect(keys.sort()).toEqual([...EXPECTED_PERMISSIONS].sort())
  })

  it('every label is a non-empty string', () => {
    for (const [, label] of Object.entries(PERMISSION_LABELS)) {
      expect(typeof label).toBe('string')
      expect(label.length).toBeGreaterThan(0)
    }
  })

  it('no two permissions share the same label', () => {
    const labels = Object.values(PERMISSION_LABELS)
    const unique = new Set(labels)
    expect(unique.size).toBe(labels.length)
  })
})

describe('ALL_PERMISSIONS', () => {
  it('contains exactly the same permissions as PERMISSION_LABELS keys', () => {
    const labelKeys = Object.keys(PERMISSION_LABELS).sort()
    const allSorted = [...ALL_PERMISSIONS].sort()
    expect(allSorted).toEqual(labelKeys)
  })

  it('has no duplicate entries', () => {
    const unique = new Set(ALL_PERMISSIONS)
    expect(unique.size).toBe(ALL_PERMISSIONS.length)
  })

  it('contains every expected permission', () => {
    for (const perm of EXPECTED_PERMISSIONS) {
      expect(ALL_PERMISSIONS).toContain(perm)
    }
  })

  it('has the correct total count', () => {
    expect(ALL_PERMISSIONS).toHaveLength(EXPECTED_PERMISSIONS.length)
  })
})

describe('DEFAULT_APP_SETTINGS', () => {
  // Verify all required AppSettings keys are present and have the right types
  it('has all required AppSettings fields', () => {
    const required: (keyof AppSettings)[] = [
      'siteName',
      'siteDescription',
      'logoText',
      'primaryColor',
      'allowSelfRegister',
      'sessionTimeout',
      'reportDeadlineHour',
    ]
    for (const key of required) {
      expect(DEFAULT_APP_SETTINGS).toHaveProperty(key)
    }
  })

  it('siteName is a non-empty string', () => {
    expect(typeof DEFAULT_APP_SETTINGS.siteName).toBe('string')
    expect(DEFAULT_APP_SETTINGS.siteName.length).toBeGreaterThan(0)
  })

  it('siteDescription is a string', () => {
    expect(typeof DEFAULT_APP_SETTINGS.siteDescription).toBe('string')
  })

  it('logoText is a non-empty string', () => {
    expect(typeof DEFAULT_APP_SETTINGS.logoText).toBe('string')
    expect(DEFAULT_APP_SETTINGS.logoText.length).toBeGreaterThan(0)
  })

  it('primaryColor is a non-empty string', () => {
    expect(typeof DEFAULT_APP_SETTINGS.primaryColor).toBe('string')
    expect(DEFAULT_APP_SETTINGS.primaryColor.length).toBeGreaterThan(0)
  })

  it('allowSelfRegister is a boolean', () => {
    expect(typeof DEFAULT_APP_SETTINGS.allowSelfRegister).toBe('boolean')
  })

  it('sessionTimeout is a positive number', () => {
    expect(typeof DEFAULT_APP_SETTINGS.sessionTimeout).toBe('number')
    expect(DEFAULT_APP_SETTINGS.sessionTimeout).toBeGreaterThan(0)
  })

  it('reportDeadlineHour is a number between 0 and 23 (valid hour)', () => {
    expect(typeof DEFAULT_APP_SETTINGS.reportDeadlineHour).toBe('number')
    expect(DEFAULT_APP_SETTINGS.reportDeadlineHour).toBeGreaterThanOrEqual(0)
    expect(DEFAULT_APP_SETTINGS.reportDeadlineHour).toBeLessThanOrEqual(23)
  })

  it('matches the known default values', () => {
    expect(DEFAULT_APP_SETTINGS).toEqual({
      siteName: 'ERP 系統',
      siteDescription: '企業資源規劃',
      logoText: 'ERP',
      primaryColor: 'blue',
      allowSelfRegister: false,
      sessionTimeout: 480,
      reportDeadlineHour: 18,
    })
  })
})
