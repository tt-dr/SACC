import { useRef, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { NAV_ITEMS, PAGE_META } from '../lib/adminConfig'

function AdminLayout() {
  const location = useLocation()
  const { currentUser, logout, changePassword, uploadAvatar } = useAuth()
  const role = currentUser?.role ?? 'editor'
  const navItems = NAV_ITEMS[role] ?? NAV_ITEMS.editor
  const pageMeta = PAGE_META[location.pathname] ?? PAGE_META['/']

  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [oldPwd, setOldPwd] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [pwdMsg, setPwdMsg] = useState('')
  const [pwdOk, setPwdOk] = useState(false)
  const avatarInputRef = useRef(null)

  const handleChangePwd = async () => {
    if (!oldPwd || !newPwd) {
      setPwdMsg('请填写旧密码和新密码')
      setPwdOk(false)
      return
    }
    const result = await changePassword({ oldPassword: oldPwd, newPassword: newPwd })
    setPwdMsg(result.message)
    setPwdOk(result.ok)
    if (result.ok) {
      setTimeout(() => {
        setShowPasswordModal(false)
        setOldPwd('')
        setNewPwd('')
        setPwdMsg('')
        setPwdOk(false)
      }, 1200)
    }
  }

  const handleAvatarClick = () => {
    avatarInputRef.current?.click()
  }

  const handleAvatarChange = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    // 映射: POST /api/v1/admin/upload → PUT /api/v1/admin/users/{id}
    await uploadAvatar(file)
    event.target.value = ''
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="sidebar-brand">SACC Admin</div>
        <div className="sidebar-subtitle">
          {role === 'super_admin' ? '超级管理员' : '成员编辑'}
        </div>
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.key}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) => `sidebar-link${isActive ? ' is-active' : ''}`}
            >
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <button
            type="button"
            className="sidebar-link"
            onClick={() => setShowPasswordModal(true)}
          >
            <span>🔑 修改密码</span>
          </button>
          <button type="button" className="sidebar-link" onClick={logout}>
            <span>← 退出登录</span>
          </button>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-header">
          <div className="header-breadcrumb">{pageMeta.breadcrumb}</div>
          <div className="header-user">
            <img
              className="header-avatar"
              src={currentUser?.avatar || '/uploads/avatars/default.png'}
              alt={currentUser?.displayName || ''}
              onClick={handleAvatarClick}
              title="点击更换头像"
            />
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleAvatarChange}
            />
            🔔 {currentUser?.displayName ?? '管理员'}
          </div>
        </header>

        <main className="admin-content">
          <Outlet />
        </main>
      </div>

      {showPasswordModal && (
        <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h2>修改密码</h2>
            <div className="modal-field">
              <label>旧密码</label>
              <input
                type="password"
                value={oldPwd}
                onChange={(e) => { setOldPwd(e.target.value); setPwdMsg(''); setPwdOk(false) }}
                placeholder="输入当前密码"
              />
            </div>
            <div className="modal-field">
              <label>新密码</label>
              <input
                type="password"
                value={newPwd}
                onChange={(e) => { setNewPwd(e.target.value); setPwdMsg(''); setPwdOk(false) }}
                placeholder="输入新密码（8-32 位）"
              />
            </div>
            {pwdMsg && (
              <div className={pwdOk ? 'modal-success' : 'modal-error'}>{pwdMsg}</div>
            )}
            <div className="modal-actions">
              <button type="button" className="btn-cancel" onClick={() => { setShowPasswordModal(false); setOldPwd(''); setNewPwd(''); setPwdMsg('') }}>
                取消
              </button>
              <button type="button" className="primary-button" onClick={handleChangePwd}>
                确认修改
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminLayout
