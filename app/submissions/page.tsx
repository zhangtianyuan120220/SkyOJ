import { prisma } from '@/lib/prisma';
import { getCurrentUser, clearSessionCookie } from '@/lib/auth';
import { UserBadge } from '@/components/UserBadge';
import { revalidatePath } from 'next/cache';
import Link from 'next/link';

async function handleHeaderLogout() {
  'use server';
  await clearSessionCookie();
  revalidatePath('/');
}

export default async function SubmissionsPage() {
  // 获取当前登录用户
  const currentUser = await getCurrentUser();

  // 获取评测记录列表
  const submissions = await prisma.submission.findMany({
    orderBy: { createdAt: 'desc' },
    take: 30,
    include: {
      user: true,
      problem: true,
    },
  });

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
          <Link href="/submissions" title="评测记录" className="text-blue-600 font-bold transition">📊</Link>
          <Link href="/discussions" title="讨论" className="hover:text-blue-600 transition">💬</Link>
          <Link href="/tickets" title="工单反馈" className="hover:text-blue-600 transition">🎫</Link>
          {currentUser?.role === 'ADMIN' && (
            <Link href="/admin" title="管理后台" className="hover:text-blue-600 transition">🛡️</Link>
          )}
          <Link href="/settings" title="设置" className="hover:text-blue-600 transition">⚙️</Link>
        </nav>
      </aside>

      <div className="flex-1 ml-14 flex flex-col">
        {/* 顶部 Header */}
        <header className="bg-white border-b border-gray-200 h-12 px-6 flex justify-between items-center sticky top-0 z-10 shadow-2xs">
          <span className="text-xs font-bold text-gray-700">评测记录 (Status)</span>
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
        <main className="p-6 max-w-7xl mx-auto w-full space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 space-y-4">
            <h2 className="text-xs font-bold text-gray-700 flex items-center gap-2 border-b border-gray-100 pb-3">
              <span className="w-2 h-4 bg-blue-600 rounded-full inline-block"></span>
              全站最新评测记录
            </h2>

            <div className="overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-semibold">
                    <th className="py-3 px-4 w-20">编号</th>
                    <th className="py-3 px-4">用户</th>
                    <th className="py-3 px-4">题目</th>
                    <th className="py-3 px-4 text-center">状态</th>
                    <th className="py-3 px-4 text-center">耗时</th>
                    <th className="py-3 px-4 text-center">内存</th>
                    <th className="py-3 px-4 text-center">语言</th>
                    <th className="py-3 px-4 text-center">提交时间</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {submissions.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-gray-400">暂无评测记录</td>
                    </tr>
                  ) : (
                    submissions.map((s) => (
                      <tr key={s.id} className="hover:bg-blue-50/30 transition font-mono">
                        <td className="py-3 px-4 text-gray-400">{s.id.slice(-6)}</td>
                        <td className="py-3 px-4 font-sans font-bold">
                          <UserBadge username={s.user.username} role={s.user.role} />
                        </td>
                        <td className="py-3 px-4 font-sans font-bold text-blue-600">
                          <Link href={`/problems/${s.problem.id}`} className="hover:underline">
                            {s.problem.id} - {s.problem.title}
                          </Link>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            s.status === 'Accepted' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                          }`}>
                            {s.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center text-gray-600">{s.time} ms</td>
                        <td className="py-3 px-4 text-center text-gray-600">{s.memory} KB</td>
                        <td className="py-3 px-4 text-center font-sans font-semibold text-gray-500">{s.language}</td>
                        <td className="py-3 px-4 text-center text-gray-400 font-sans text-[11px]">{new Date(s.createdAt).toLocaleString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}