"use client";

import { useCallback, useState } from "react";
import { Card } from "@/components/sections/Card";
import { CTAButton } from "@/components/sections/CTAButton";

type LoginErrorCode =
  | "CAPTCHA_INVALID"
  | "USER_NOT_FOUND"
  | "PASSWORD_WRONG"
  | "UNKNOWN";

interface LoginErrorResponse {
  code: LoginErrorCode;
  message?: string;
}

/**
 * 管理员登录页（客户端组件）
 * 路由：/admin/login
 * 说明：登录按钮因 CTAButton 是 Link 组件不支持 submit/loading，
 *      此处使用原生 button 并复用 CTAButton primary 的视觉风格（语义类 bg-primary）。
 */
export default function AdminLoginPage() {
  // 表单 state
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [captchaCode, setCaptchaCode] = useState("");

  // 交互 state
  const [showPassword, setShowPassword] = useState(false);
  const [captchaSrc, setCaptchaSrc] = useState("/api/captcha");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // 刷新验证码：加时间戳防缓存
  const refreshCaptcha = useCallback(() => {
    setCaptchaSrc(`/api/captcha?t=${Date.now()}`);
  }, []);

  // 提交登录
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // 非空校验
    if (!username.trim() || !password.trim() || !captchaCode.trim()) {
      setErrorMsg("账号、密码、验证码均不能为空");
      return;
    }

    setErrorMsg("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          password,
          captchaCode: captchaCode.trim(),
        }),
      });

      // 登录成功
      if (res.ok) {
        // 跳转后台首页（由服务端 JWT 校验会话）
        window.location.href = "/admin";
        return;
      }

      // 登录失败：解析后端错误码
      const data = (await res.json().catch(() => ({}))) as LoginErrorResponse;
      switch (data.code) {
        case "CAPTCHA_INVALID":
          setErrorMsg("验证码错误，请重新输入");
          refreshCaptcha();
          setCaptchaCode("");
          break;
        case "USER_NOT_FOUND":
          setErrorMsg("账号不存在，请检查后重试");
          break;
        case "PASSWORD_WRONG":
          setErrorMsg("密码错误，请重新输入");
          break;
        default:
          setErrorMsg(data.message || `登录失败（HTTP ${res.status}）`);
      }
    } catch {
      // 网络异常
      setErrorMsg("网络异常，请检查连接后重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-[470px] p-7">
        {/* 标题区 */}
        <h1 className="text-2xl font-bold text-foreground">管理员登录</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          登录后可进入后台进行内容维护与权限分配
        </p>

        {/* 表单 */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-3" noValidate>
          {/* 管理员账号 */}
          <div>
            <label htmlFor="username" className="mb-1 block text-xs text-muted-foreground">
              管理员账号
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              placeholder="请输入学号"
              className="w-full rounded-md border border-input bg-muted px-3 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:bg-card"
            />
          </div>

          {/* 登录密码（带显示/隐藏切换） */}
          <div>
            <label htmlFor="password" className="mb-1 block text-xs text-muted-foreground">
              登录密码
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                placeholder="请输入密码"
                className="w-full rounded-md border border-input bg-muted px-3 py-2.5 pr-14 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:bg-card"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "隐藏密码" : "显示密码"}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-primary"
              >
                {showPassword ? "隐藏" : "显示"}
              </button>
            </div>
          </div>

          {/* 图形验证码（图片 + 输入框，点击图片刷新） */}
          <div>
            <label htmlFor="captcha" className="mb-1 block text-xs text-muted-foreground">
              图形验证码
            </label>
            <div className="flex gap-2.5">
              <input
                id="captcha"
                type="text"
                value={captchaCode}
                onChange={(e) => setCaptchaCode(e.target.value)}
                maxLength={6}
                autoComplete="off"
                placeholder="请输入右侧验证码"
                className="flex-1 rounded-md border border-input bg-muted px-3 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:bg-card"
              />
              <button
                type="button"
                onClick={refreshCaptcha}
                aria-label="点击刷新验证码"
                title="点击刷新验证码"
                className="inline-flex h-[46px] w-[118px] shrink-0 items-center justify-center overflow-hidden rounded-md border border-input bg-muted transition-colors hover:border-ring"
              >
                {/* 验证码图片：占位调用 /api/captcha，后端未实现时显示 alt 文案 */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={captchaSrc}
                  alt="图形验证码（点击刷新）"
                  className="h-full w-full select-none object-cover"
                  onError={() => setErrorMsg("验证码服务暂不可用，请稍后重试")}
                />
              </button>
            </div>
          </div>

          {/* 错误提示 */}
          {errorMsg && (
            <div
              role="alert"
              className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive"
            >
              {errorMsg}
            </div>
          )}

          {/* 登录按钮：复用 CTAButton primary 视觉风格，使用语义类 */}
          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-[0_14px_24px_rgba(255,122,0,0.2)] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
          >
            {loading ? "登录中…" : "登录并进入后台"}
          </button>
        </form>

        {/* 会话提示 */}
        <div className="mt-4 flex items-center gap-2 rounded-md border border-border bg-muted/60 p-2.5 text-xs text-muted-foreground">
          登录后会通过服务端 JWT 校验会话状态
        </div>

        {/* 辅助操作：复用 CTAButton 组件，返回首页 */}
        <div className="mt-4 flex justify-center">
          <CTAButton href="/" label="返回首页" variant="secondary" size="sm" />
        </div>

        {/* 接口说明 */}
        <p className="mt-3 text-[11px] text-muted-foreground">
          接口：POST /api/admin/login · 验证码：GET /api/captcha
        </p>
      </Card>
    </main>
  );
}
