import { prisma } from '@/lib/prisma';
import { getCurrentUser, clearSessionCookie } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import Link from 'next/link';

async function handleHeaderLogout() {
  'use server';
  await clearSessionCookie();
  revalidatePath('/');
}

// 更新用户个人信息的 Server Action
async function updateSettings(formData: FormData) {
  'use server';
  const currentUser = await getCurrentUser();
  if (!currentUser) return;

  const username = (formData.get('username') as string || '').trim();
  if (!username) return;

  await prisma.user.update({
    where: { id: currentUser.id },
    data: { username },
  });

  revalidatePath('/settings');
}

export default async function SettingsPage() {
  // 获取当前登录用户，解决 currentUser is not defined 报错
  const currentUser = await getCurrentUser();

  return (
    <div className="min-h-screen bg-[#edf2f7] text-gray-800 flex font-sans antialiased">
      {/* 侧边栏 */}
      <aside className="w-14 bg-white border-r border-gray-200 flex flex-col items-center py-4 gap-6 fixed h-full z-20 shadow-2xs">
        <Link href="/" className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-black text-xs shadow-xs hover:opacity-90">
          Sky
        </Link>
        <nav className="flex flex-col gap-5 text-gray-400 text-sm">
          <Link href="/" title="首页" className="hover:text-blue-600 transition">🏠</Link>
          <Link href="/problems" title="题库" className="hover:text-blue-600 transition">📚</Link>
          <Link href="/articles" title="文章广场" className="hover:text-blue-600 transition">📖</Link>
          <Link href="/ranklist" title="排名" className="hover:text-blue-600 transition">🎯</Link>
          <Link href="/contests" title="比赛" className="hover:text-blue-600 transition">🏆</Link>
          <Link href="/submissions" title="评测记录" className="hover:text-blue-600 transition">📊</Link>
          <Link href="/discussions" title="讨论" className="hover:text-blue-600 transition">💬</Link>
          <Link href="/tickets" title="工单反馈" className="hover:text-blue-600 transition">🎫</Link>
          {currentUser?.role === 'ADMIN' && (
            <Link href="/admin" title="管理后台" className="hover:text-blue-600 transition">🛡️</Link>
          )}
          <Link href="/settings" title="设置" className="hover:text-blue-600 font-bold transition">⚙️</Link>
        </nav>
      </aside>

      <div className="flex-1 ml-14 flex flex-col">
        {/* 顶部 Header */}
        <header className="bg-white border-b border-gray-200 h-12 px-6 flex justify-between items-center sticky top-0 z-10 shadow-2xs">
          <span className="text-xs font-bold text-gray-700">账号设置 (Settings)</span>
          <div className="flex items-center gap-3 text-xs">
            {currentUser ? (
              <div className="flex items-center gap-3">
                <span className="font-bold text-gray-700">{currentUser.username}</span>
                <form action={handleHeaderLogout}>
                  <button type="submit" className="text-red-500 hover:underline text-[11px]">退出</button>
                </form>
              </div>
            ) : (
              <Link href="/auth?mode=login" className="text-blue-600 font-bold">登录</Link>
            )}
          </div>
        </header>

        {/* 主内容 */}
        <main className="p-6 max-w-4xl mx-auto w-full space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 space-y-4">
            <h2 className="text-xs font-bold text-gray-700 border-b border-gray-100 pb-3 flex items-center gap-2">
              <span className="w-2 h-4 bg-blue-600 rounded-full inline-block"></span>
              个人资料修改
            </h2>

            {currentUser ? (
              <form action={updateSettings} className="space-y-4 text-xs">
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">用户名</label>
                  <input
                    type="text"
                    name="username"
                    defaultValue={currentUser.username}
                    className="w-full border border-gray-200 rounded p-2.5 bg-gray-50/50"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">电子邮箱（不可修改）</label>
                  <input
                    type="email"
                    defaultValue={currentUser.email}
                    disabled
                    className="w-full border border-gray-200 rounded p-2.5 bg-gray-100 text-gray-400 font-mono"
                  />
                </div>
                <button type="submit" className="bg-blue-600 text-white px-5 py-2.5 rounded font-bold hover:bg-blue-700 transition">
                  保存修改
                </button>
              </form>
            ) : (
              <div className="py-6 text-center space-y-3">
                <p className="text-xs text-gray-400">请先登录后再访问设置页面</p>
                <Link href="/auth?mode=login" className="inline-block bg-blue-600 text-white px-4 py-2 rounded text-xs font-bold">
                  立即登录
                </Link>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}