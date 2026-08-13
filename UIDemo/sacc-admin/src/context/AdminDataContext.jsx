/**
 * AdminDataContext — 后台数据状态管理
 *
 * 每个操作映射到一个后端 API 端点（设计稿阶段使用 localStorage 模拟）：
 *   saveCollectionItem    → POST/PUT /api/v1/admin/content         创建/更新内容
 *   deleteCollectionItem  → DELETE /api/v1/admin/content/{id}      删除内容
 *   reorderItems          → PUT    /api/v1/admin/content/reorder   调整排序
 *   (用户模块复用同一组方法，对应 /api/v1/admin/users 系列端点)
 *
 * 仪表盘数据来自: GET /api/v1/admin/dashboard
 * 审计日志来自:   GET /api/v1/admin/audit-log
 */
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useAuth } from './AuthContext'
import { cloneDatabase, createSeedDatabase } from '../lib/adminConfig'

const DATA_STORAGE_KEY = 'sacc-admin-db'
const AdminDataContext = createContext(null)

function readStoredDatabase() {
  if (typeof window === 'undefined') {
    return createSeedDatabase()
  }

  const rawValue = window.localStorage.getItem(DATA_STORAGE_KEY)

  if (!rawValue) {
    return createSeedDatabase()
  }

  try {
    return { ...createSeedDatabase(), ...JSON.parse(rawValue) }
  } catch {
    return createSeedDatabase()
  }
}

function nowString() {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
    .format(new Date())
    .replaceAll('/', '-')
}

function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function normalizeTags(tags) {
  if (Array.isArray(tags)) {
    return tags.map((tag) => `${tag}`.trim()).filter(Boolean)
  }

  if (typeof tags === 'string') {
    return tags
      .split(/[,，]/)
      .map((tag) => tag.trim())
      .filter(Boolean)
  }

  return []
}

function appendAuditLog(database, actor, module, action, detail) {
  const nextDatabase = cloneDatabase(database)

  nextDatabase.auditLog = [
    {
      id: createId('log'),
      module,
      action,
      actor,
      detail: detail || `${action} operation`,
      timestamp: nowString(),
    },
    ...nextDatabase.auditLog,
  ].slice(0, 12)

  return nextDatabase
}

export function AdminDataProvider({ children }) {
  const { currentUser } = useAuth()
  const [database, setDatabase] = useState(() => readStoredDatabase())

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    window.localStorage.setItem(DATA_STORAGE_KEY, JSON.stringify(database))
  }, [database])

  const value = useMemo(() => {
    const actor = currentUser?.displayName ?? '管理员 A'

    return {
      database,
      resetDatabase() {
        const nextDatabase = createSeedDatabase()
        setDatabase(nextDatabase)
        return nextDatabase
      },
      replaceDatabase(nextDatabase) {
        setDatabase(nextDatabase)
      },
      updateAbout(nextAbout) {
        let updatedRecord = null

        setDatabase((currentDatabase) => {
          const nextDatabase = cloneDatabase(currentDatabase)
          nextDatabase.about = {
            ...nextDatabase.about,
            ...nextAbout,
            highlightTags: normalizeTags(nextAbout.highlightTags ?? nextDatabase.about.highlightTags),
            lastUpdated: nowString(),
            editor: actor,
          }

          updatedRecord = nextDatabase.about
          return appendAuditLog(nextDatabase, actor, 'about', 'update', '更新关于我们页面内容')
        })

        return updatedRecord
      },
      saveCollectionItem(moduleKey, item) {
        let savedItem = null

        setDatabase((currentDatabase) => {
          const nextDatabase = cloneDatabase(currentDatabase)
          const currentItems = Array.isArray(nextDatabase[moduleKey]) ? nextDatabase[moduleKey] : []
          const existedItem = currentItems.find((entry) => entry.id === item.id)

          savedItem = {
            ...existedItem,
            ...item,
            id: existedItem?.id ?? createId(moduleKey),
            tags: normalizeTags(item.tags),
            updatedAt: nowString(),
          }

          nextDatabase[moduleKey] = existedItem
            ? currentItems.map((entry) => (entry.id === savedItem.id ? savedItem : entry))
            : [savedItem, ...currentItems]

          return appendAuditLog(
            nextDatabase,
            actor,
            moduleKey,
            existedItem ? 'update' : 'create',
            `${existedItem ? '更新' : '创建'}「${savedItem.title}」`,
          )
        })

        return savedItem
      },
      deleteCollectionItem(moduleKey, itemId) {
        let deletedItem = null

        setDatabase((currentDatabase) => {
          const nextDatabase = cloneDatabase(currentDatabase)
          const currentItems = Array.isArray(nextDatabase[moduleKey]) ? nextDatabase[moduleKey] : []
          deletedItem = currentItems.find((entry) => entry.id === itemId) ?? null
          nextDatabase[moduleKey] = currentItems.filter((entry) => entry.id !== itemId)

          if (!deletedItem) {
            return nextDatabase
          }

          return appendAuditLog(nextDatabase, actor, moduleKey, 'delete', `删除「${deletedItem.title}」`)
        })

        return deletedItem
      },
      reorderItems(moduleKey, items) {
        setDatabase((currentDatabase) => {
          const nextDatabase = cloneDatabase(currentDatabase)
          nextDatabase[moduleKey] = items.map((item, index) => ({
            ...item,
            sortOrder: index,
          }))
          return nextDatabase
        })
      },
    }
  }, [currentUser, database])

  return <AdminDataContext.Provider value={value}>{children}</AdminDataContext.Provider>
}

export function useAdminData() {
  const context = useContext(AdminDataContext)

  if (!context) {
    throw new Error('useAdminData 必须在 AdminDataProvider 内使用')
  }

  return context
}
