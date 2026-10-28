import { prisma } from '@/lib/prisma';
import { setSessionCookie, clearSessionCookie, getCurrentUser, hashPassword, verifyPassword } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import Link from 'next/link';
export const dynamic = 'force-dynamic';
async function handleRegister(formData: FormData) {
  'use server';
  const username = (formData.get('username') as string || '').trim();
  const email = (formData.get('email') as string || '').trim();
  const password = (formData.get('password') as string || '').trim();

  if (!username || !email || !password) {
    redirect('/auth?error=MissingFields');
  }

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
  });

  if (existing) {
    redirect('/auth?error=UserExists');
  }

  const hashedPassword = hashPassword(password);
  const user = await prisma.user.create({
    data: { username, email, password: hashedPassword, role: 'USER' },
  });

  await setSessionCookie(user.id);
  revalidatePath('/');
  redirect('/');
}

async function handleLogin(formData: FormData) {
  'use server';
  const account = (formData.get('account') as string || '').trim();
  const password = (formData.get('password') as string || '').trim();

  if (!account || !password) {
    redirect('/auth?mode=login&error=MissingFields');
  }

  const user = await prisma.user.findFirst({
    where: { OR: [{ username: account }, { email: account }] },
  });

  if (!user || !verifyPassword(password, user.password)) {
    redirect('/auth?mode=login&error=InvalidCredentials');
  }

  await setSessionCookie(user.id);
  revalidatePath('/');
  redirect('/');
}

async function handleLogout() {
  'use server';
  await clearSessionCookie();
  revalidatePath('/');
  redirect('/auth?mode=login');
}

export default async function AuthPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; error?: string }>;
}) {
  const params = await searchParams;
  const isLogin = params.mode === 'login';
  const currentUser = await getCurrentUser();

  return (
    <div className="min-h-screen bg-[#edf2f7] flex items-center justify-center font-sans antialiased p-4">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 max-w-md w-full space-y-6">
        <div className="text-center space-y-1">
          <Link href="/" className="inline-block w-10 h-10 bg-blue-600 rounded text-white font-black text-sm leading-10 shadow-xs">
            Sky
          </Link>
          <h1 className="text-base font-bold text-gray-800 pt-2">
            {currentUser ? '当前账号状态' : isLogin ? '登录 SkyOJ 账号' : '注册 SkyOJ 账号'}
          </h1>
          <p className="text-xs text-gray-400">
            {currentUser ? `已登录：${currentUser.username}` : '商业级算法竞赛与在线评测平台'}
          </p>
        </div>

        {params.error === 'InvalidCredentials' && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded text-xs text-center font-medium">
            用户名/邮箱或密码错误！
          </div>
        )}
        {params.error === 'UserExists' && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded text-xs text-center font-medium">
            该用户名或邮箱已被注册！
          </div>
        )}

        {currentUser ? (
          <div className="space-y-4 text-center">
            <div className="p-4 bg-gray-50 rounded border border-gray-100 text-xs space-y-1">
              <div className="font-bold text-gray-800 text-sm">{currentUser.username}</div>
              <div className="text-gray-400 font-mono">{currentUser.email}</div>
              <div className="text-blue-600 font-semibold pt-1">
                权限：{currentUser.role === 'ADMIN' ? '管理员' : '普通用户'}
              </div>
            </div>
            <form action={handleLogout}>
              <button type="submit" className="w-full bg-red-500 text-white py-2.5 rounded text-xs font-bold hover:bg-red-600 transition">
                安全退出登录
              </button>
            </form>
          </div>
        ) : isLogin ? (
          <form action={handleLogin} className="space-y-4 text-xs">
            <div>
              <label className="block text-gray-600 font-semibold mb-1">用户名 / 电子邮箱</label>
              <input type="text" name="account" placeholder="请输入用户名或邮箱" className="w-full border border-gray-200 rounded p-2.5 bg-gray-50/50 focus:outline-none focus:border-blue-500" required />
            </div>
            <div>
              <label className="block text-gray-600 font-semibold mb-1">密码</label>
              <input type="password" name="password" placeholder="请输入密码" className="w-full border border-gray-200 rounded p-2.5 bg-gray-50/50 focus:outline-none focus:border-blue-500" required />
            </div>
            <button type="submit" className="w-full bg-blue-600 text-white py-2.5 rounded font-bold hover:bg-blue-700 transition">
              立即登录
            </button>
          </form>
        ) : (
          <form action={handleRegister} className="space-y-4 text-xs">
            <div>
              <label className="block text-gray-600 font-semibold mb-1">用户名</label>
              <input type="text" name="username" placeholder="设置用户名" className="w-full border border-gray-200 rounded p-2.5 bg-gray-50/50 focus:outline-none focus:border-blue-500" required />
            </div>
            <div>
              <label className="block text-gray-600 font-semibold mb-1">电子邮箱</label>
              <input type="email" name="email" placeholder="example@domain.com" className="w-full border border-gray-200 rounded p-2.5 bg-gray-50/50 focus:outline-none focus:border-blue-500" required />
            </div>
            <div>
              <label className="block text-gray-600 font-semibold mb-1">密码</label>
              <input type="password" name="password" placeholder="设置登录密码" className="w-full border border-gray-200 rounded p-2.5 bg-gray-50/50 focus:outline-none focus:border-blue-500" required />
            </div>
            <button type="submit" className="w-full bg-blue-600 text-white py-2.5 rounded font-bold hover:bg-blue-700 transition">
              立即注册
            </button>
          </form>
        )}

        <div className="text-center text-xs text-gray-400 pt-2 border-t border-gray-100 flex justify-between items-center">
          <Link href="/" className="hover:text-blue-600">返回首页</Link>
          {!currentUser && (
            isLogin ? (
              <p>还没有账号？ <Link href="/auth" className="text-blue-600 font-bold hover:underline">去注册</Link></p>
            ) : (
              <p>已有账号？ <Link href="/auth?mode=login" className="text-blue-600 font-bold hover:underline">去登录</Link></p>
            )
          )}
        </div>
      </div>
    </div>
  );
}