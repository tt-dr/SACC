import { RefreshCw, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function createCaptcha() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 4 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('')
}

function LoginPage() {
  const navigate = useNavigate()
  const { currentUser, isHydrating, login } = useAuth()
  const [form, setForm] = useState({
    username: '',
    password: '',
    captchaInput: '',
  })
  const [captchaCode, setCaptchaCode] = useState(() => createCaptcha())
  const [error, setError] = useState('')

  if (currentUser) {
    return <Navigate replace to="/" />
  }

  const updateForm = (key, value) => {
    setForm((currentForm) => ({
      ...currentForm,
      [key]: value,
    }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    if (form.captchaInput.trim().toUpperCase() !== captchaCode) {
      setError('验证码不正确，请重新输入。')
      updateForm('captchaInput', '')
      setCaptchaCode(createCaptcha())
      return
    }

    Promise.resolve(
      login({
        username: form.username,
        password: form.password,
      }),
    ).then((result) => {
      if (!result.ok) {
        setError(result.message)
        return
      }

      navigate('/', { replace: true })
    })
  }

  return (
    <div className="login-shell">
      <section className="login-hero">
        <div className="login-badge">SACC Management Console</div>
        <img className="login-hero-logo" src="/download.png" alt="SACC" />
        <div className="login-hero-card">
          <h2>SACC官网后台管理终端</h2>
          <p>统一认证、分级授权、内容审核、发布回滚一体化管理</p>
        </div>
        <div className="login-hero-decoration login-dot-large" />
        <div className="login-hero-decoration login-dot-small" />
      </section>

      <section className="login-panel">
        <form className="login-card" onSubmit={handleSubmit}>
          <div className="login-card-copy">
            <h1>管理员登录</h1>
            <p>登录后可进入后台进行内容维护与权限分配</p>
          </div>

          <div className="login-method-shell">
            <div className="login-method-tab is-active">账号登录</div>
          </div>

          <label className="login-field">
            <span className="sr-only">学号</span>
            <input
              value={form.username}
              onChange={(event) => updateForm('username', event.target.value)}
              placeholder="学号"
            />
          </label>

          <label className="login-field">
            <span className="sr-only">密码</span>
            <input
              type="password"
              value={form.password}
              onChange={(event) => updateForm('password', event.target.value)}
              placeholder="密码"
            />
          </label>

          <div className="captcha-row">
            <label className="login-field captcha-field">
              <span className="sr-only">图形验证码</span>
              <input
                value={form.captchaInput}
                onChange={(event) => updateForm('captchaInput', event.target.value)}
                placeholder="图形验证码"
              />
            </label>
            <button type="button" className="captcha-box" onClick={() => setCaptchaCode(createCaptcha())}>
              <span>{captchaCode}</span>
              <RefreshCw size={14} />
            </button>
          </div>

          {error ? <div className="form-error">{error}</div> : null}

          <button type="submit" className="primary-button full-width" disabled={isHydrating}>
            登录并进入后台
          </button>

          <div className="login-tip">
            <ShieldCheck size={16} />
            <span>登录后会通过服务端 JWT 校验会话状态</span>
          </div>

          <p className="login-footer">生产环境建议通过同域 `/api` 访问后端，并使用 `.env.example` 中配置的种子管理员账号首次登录。</p>
        </form>
      </section>
    </div>
  )
}

export default LoginPage
