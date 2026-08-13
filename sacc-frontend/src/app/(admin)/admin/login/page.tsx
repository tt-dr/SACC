export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#f4f6fb] to-[#f7f1e7]">
      <div className="w-full max-w-[470px] rounded-[20px] border border-[#dbe5f2] bg-white/96 p-7 shadow-sm">
        <h1 className="text-[30px] font-bold text-[#132544]">管理员登录</h1>
        <p className="mt-1 text-xs text-[#64748b]">
          登录后可进入后台进行内容维护与权限分配
        </p>

        <div className="mt-4 rounded-xl bg-[#e5ebf4] p-1">
          <div className="flex min-h-[34px] items-center justify-center rounded-[10px] bg-white text-[13px] font-bold text-[#132544]">
            账号登录
          </div>
        </div>

        <div className="mt-3 space-y-3">
          <input
            className="w-full rounded-[10px] border border-[#dbe3ee] bg-[#f7faff] px-3 py-[11px] text-sm outline-none focus:border-[#f4aa60]"
            placeholder="学号"
          />
          <input
            type="password"
            className="w-full rounded-[10px] border border-[#dbe3ee] bg-[#f7faff] px-3 py-[11px] text-sm outline-none focus:border-[#f4aa60]"
            placeholder="密码"
          />
          <div className="flex gap-2.5">
            <input
              className="flex-1 rounded-[10px] border border-[#dbe3ee] bg-[#f7faff] px-3 py-[11px] text-sm outline-none focus:border-[#f4aa60]"
              placeholder="图形验证码"
            />
            <span className="inline-flex min-h-[46px] w-[118px] items-center justify-center gap-2 rounded-[10px] border border-[#dbe3ee] bg-[#e8eef8] font-mono text-[13px] font-bold text-[#132544]">
              ABCD
            </span>
          </div>
        </div>

        <button className="mt-4 w-full rounded-[10px] bg-[#ff8a00] py-[11px] text-[13px] font-bold text-white">
          登录并进入后台
        </button>

        <div className="mt-4 flex items-center gap-2 rounded-[10px] border border-[#d9e5f5] bg-[#f5f9ff] p-2.5 text-xs text-[#416086]">
          登录后会通过服务端 JWT 校验会话状态
        </div>

        <p className="mt-3 text-[11px] text-[#64748b]">
          接口：POST /api/v1/auth/login
        </p>
      </div>
    </div>
  );
}
