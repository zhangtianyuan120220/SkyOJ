import { prisma } from '@/lib/prisma';
import { getCurrentUser, clearSessionCookie } from '@/lib/auth';
import { UserBadge } from '@/components/UserBadge';
import { revalidatePath } from 'next/cache';
import Link from 'next/link';
export const dynamic = 'force-dynamic';
async function handleHeaderLogout() {
  'use server';
  await clearSessionCookie();
  revalidatePath('/');
}

export default async function RanklistPage() {
  // 获取当前登录用户以供侧边栏权限判断
  const currentUser = await getCurrentUser();

  // 获取所有用户并计算 AC 数量排名
  const users = await prisma.user.findMany({
    include: {
      submissions: {
        where: { status: 'Accepted' },
      },
    },
  });

  const rankedUsers = users.map((u) => {
    const acCount = u.submissions.length;
    const totalCount = u.submissions.length; // 简化计算，可按实际提交记录统计
    const acRate = totalCount > 0 ? ((acCount / totalCount) * 100).toFixed(1) : '0.0';
    return {
      ...u,
      acCount,
      totalCount,
      acRate,
    };
  }).sort((a, b) => b.acCount - a.acCount);

  return (
    <div className="min-h-screen bg-[#edf2f7] text-gray-800 flex font-sans antialiased">
      {/* 侧边栏 */}
      <aside className="w-14 bg-white border-r border-gray-200 flex flex-col items-center py-4 gap-6 fixed h-full z-20 shadow-2xs">
        <Link href="/" className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-black text-xs shadow-xs">
          Sky
        </Link>
        <nav className="flex flex-col gap-5 text-gray-400 text-sm">
          <Link href="/" title="首页" className="hover:text-blue-600 transition">🏠</Link>
          <Link href="/problems" title="题库" className="hover:text-blue-600 transition">📚</Link>
          <Link href="/articles" title="文章广场" className="hover:text-blue-600 transition">📖</Link>
          <Link href="/ranklist" title="排名" className="text-blue-600 font-bold transition">🎯</Link>
          <Link href="/contests" title="比赛" className="hover:text-blue-600 transition">🏆</Link>
          <Link href="/submissions" title="评测记录" className="hover:text-blue-600 transition">📊</Link>
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
          <span className="text-xs font-bold text-gray-700">全站排行榜 (Ranklist)</span>
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
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h2 className="text-xs font-bold text-gray-700 flex items-center gap-2">
                <span className="w-2 h-4 bg-blue-600 rounded-full inline-block"></span>
                全站用户刷题贡献榜
              </h2>
              <span className="text-[11px] text-gray-400">排名根据 AC 题目数量进行实时排序</span>
            </div>

            <div className="overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-semibold">
                    <th className="py-3 px-4 w-20">排名</th>
                    <th className="py-3 px-4">用户</th>
                    <th className="py-3 px-4 w-28 text-center">通过 (AC)</th>
                    <th className="py-3 px-4 w-28 text-center">提交数</th>
                    <th className="py-3 px-4 w-28 text-center">通过率</th>
                    <th className="py-3 px-4 w-32 text-center">注册时间</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rankedUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-gray-400">暂无排名数据</td>
                    </tr>
                  ) : (
                    rankedUsers.map((u, idx) => (
                      <tr key={u.id} className="hover:bg-blue-50/30 transition">
                        <td className="py-3 px-4 font-bold">
                          <span className={`w-6 h-6 inline-flex items-center justify-center rounded text-[11px] ${
                            idx === 0 ? 'bg-amber-400 text-white shadow-2xs' :
                            idx === 1 ? 'bg-gray-300 text-white' :
                            idx === 2 ? 'bg-amber-600 text-white' : 'text-gray-500'
                          }`}>
                            {idx + 1}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-bold">
                          <Link href={`/users/${u.id}`} className="hover:underline flex items-center gap-2">
                            <UserBadge username={u.username} role={u.role} />
                          </Link>
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-bold text-green-600">{u.acCount}</td>
                        <td className="py-3 px-4 text-center font-mono text-gray-600">{u.totalCount}</td>
                        <td className="py-3 px-4 text-center font-mono text-gray-500">{u.acRate}%</td>
                        <td className="py-3 px-4 text-center text-gray-400 font-mono">{new Date(u.createdAt).toLocaleDateString()}</td>
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