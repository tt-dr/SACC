import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const AUTH_STORAGE_KEY = 'sacc-admin-auth'
const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL || ''}`.trim().replace(/\/+$/, '')
const AuthContext = createContext(null)

const DEV_MOCK_USER = {
  token: 'dev-mock-token',
  role: 'super_admin',
  userId: 'dev-user-001',
  username: 'admin',
  displayName: '林嘉禾',
  position: '前端组组长',
  desc: '官网、组件库、工程化，一砖一瓦建起来。',
  avatar: '/uploads/avatars/linjiahe.png',
  loginAt: new Date().toISOString(),
}

function useDevMode() {
  return !API_BASE_URL
}

function buildApiUrl(pathname) {
  if (!API_BASE_URL) {
    return pathname
  }

  return `${API_BASE_URL}${pathname}`
}

function readStoredAuth() {
  if (typeof window === 'undefined') {
    return null
  }

  const rawValue = window.sessionStorage.getItem(AUTH_STORAGE_KEY)

  if (!rawValue) {
    return null
  }

  try {
    return JSON.parse(rawValue)
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const devMode = useDevMode()
  const [currentUser, setCurrentUser] = useState(() => (devMode ? DEV_MOCK_USER : readStoredAuth()))
  const [isHydrating, setIsHydrating] = useState(!devMode)

  useEffect(() => {
    if (typeof window === 'undefined' || devMode) {
      setIsHydrating(false)
      return
    }

    if (!currentUser?.token) {
      setIsHydrating(false)
      return
    }

    let isMounted = true

    // 映射: GET /api/v1/admin/me — 验证 Token 有效性并刷新用户信息
    fetch(buildApiUrl('/api/v1/admin/me'), {
      headers: {
        Authorization: `Bearer ${currentUser.token}`,
      },
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error('会话已失效')
        }

        const payload = await response.json()

        if (!isMounted) {
          return
        }

        setCurrentUser((previousUser) => ({
          ...previousUser,
          ...payload.data,
          displayName: previousUser?.displayName ?? payload.data?.username ?? '管理员',
        }))
      })
      .catch(() => {
        if (!isMounted) {
          return
        }

        setCurrentUser(null)
      })
      .finally(() => {
        if (isMounted) {
          setIsHydrating(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [currentUser?.token])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    if (!currentUser) {
      window.sessionStorage.removeItem(AUTH_STORAGE_KEY)
      return
    }

    window.sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(currentUser))
  }, [currentUser])

  const value = useMemo(
    () => ({
      currentUser,
      isHydrating,
      devMode,
      async login({ username, password }) {
        // 映射: POST /api/v1/auth/login
        if (devMode) {
          setCurrentUser({ ...DEV_MOCK_USER, displayName: username || 'Super Admin', username: username || 'admin' })
          return { ok: true, user: currentUser }
        }

        try {
          const response = await fetch(buildApiUrl('/api/v1/auth/login'), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              username: username.trim(),
              password,
            }),
          })

          if (!response.ok) {
            return { ok: false, message: '账号或密码不正确，或服务端不可用。' }
          }

          const payload = await response.json()
          const data = payload.data || {}
          const nextUser = {
            token: data.token,
            role: data.role,
            userId: data.userId,
            username: data.username,
            displayName: data.displayName || data.username || '管理员',
            loginAt: new Date().toISOString(),
          }

          setCurrentUser(nextUser)
          return { ok: true, user: nextUser }
        } catch {
          return { ok: false, message: '登录接口不可用，请先启动后端服务。' }
        }
      },
      logout() {
        setCurrentUser(null)
      },
      async changePassword({ oldPassword, newPassword }) {
        // 映射: PUT /api/v1/admin/password  { oldPassword, newPassword }
        if (devMode) {
          if (oldPassword === 'wrong') {
            return { ok: false, message: '旧密码不正确' }
          }
          return { ok: true, message: '密码已修改（开发模式）' }
        }

        try {
          const response = await fetch(buildApiUrl('/api/v1/admin/password'), {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${currentUser?.token}`,
            },
            body: JSON.stringify({ oldPassword, newPassword }),
          })

          if (!response.ok) {
            const payload = await response.json().catch(() => ({}))
            return { ok: false, message: payload.message || '修改失败，请检查旧密码' }
          }

          return { ok: true, message: '密码已修改' }
        } catch {
          return { ok: false, message: '接口不可用，请先启动后端服务' }
        }
      },
      async uploadAvatar(file) {
        // 映射: POST /api/v1/admin/upload (multipart/form-data) → 获取 url
        //       再通过 PUT /api/v1/admin/users/{id} 保存到用户信息
        if (devMode) {
          return new Promise((resolve) => {
            const reader = new FileReader()
            reader.onload = () => {
              const dataUrl = reader.result
              setCurrentUser((prev) => ({ ...prev, avatar: dataUrl }))
              resolve({ ok: true, url: dataUrl })
            }
            reader.readAsDataURL(file)
          })
        }

        try {
          const formData = new FormData()
          formData.append('file', file)
          const uploadRes = await fetch(buildApiUrl('/api/v1/admin/upload'), {
            method: 'POST',
            headers: { Authorization: `Bearer ${currentUser?.token}` },
            body: formData,
          })
          if (!uploadRes.ok) throw new Error('上传失败')
          const uploadPayload = await uploadRes.json()
          const url = uploadPayload.data?.url

          const updateRes = await fetch(buildApiUrl(`/api/v1/admin/users/${currentUser?.userId}`), {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${currentUser?.token}`,
            },
            body: JSON.stringify({ avatar: url }),
          })
          if (!updateRes.ok) throw new Error('保存头像失败')

          setCurrentUser((prev) => ({ ...prev, avatar: url }))
          return { ok: true, url }
        } catch (e) {
          return { ok: false, message: e.message }
        }
      },
    }),
    [currentUser, isHydrating],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth 必须在 AuthProvider 内使用')
  }

  return context
}
