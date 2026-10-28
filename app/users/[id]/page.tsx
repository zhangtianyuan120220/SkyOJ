import { prisma } from '@/lib/prisma';
import { getCurrentUser, clearSessionCookie } from '@/lib/auth';
import { UserBadge } from '@/components/UserBadge';
import { revalidatePath } from 'next/cache';
import { notFound } from 'next/navigation';
import Link from 'next/link';
export const dynamic = 'force-dynamic';
async function handleHeaderLogout() {
  'use server';
  await clearSessionCookie();
  revalidatePath('/');
}

export default async function UserProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const currentUser = await getCurrentUser();

  const targetUser = await prisma.user.findUnique({
    where: { id },
    include: {
      submissions: {
        include: { problem: true },
        orderBy: { createdAt: 'desc' },
      },
      discussions: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!targetUser) {
    notFound();
  }

  // 统计数据
  const totalSubmissions = targetUser.submissions.length;
  const acceptedSubmissions = targetUser.submissions.filter(s => s.status === 'Accepted');
  // 去重统计 AC 的题目数
  const solvedProblemIds = new Set(acceptedSubmissions.map(s => s.problemId));
  const solvedCount = solvedProblemIds.size;
  const acRate = totalSubmissions > 0 ? ((acceptedSubmissions.length / totalSubmissions) * 100).toFixed(1) : '0.0';

  // 计算全站排名 (基于 AC 题目数)
  const allUsers = await prisma.user.findMany({
    include: { submissions: { where: { status: 'Accepted' } } },
  });
  const sortedRank = allUsers.map(u => ({
    id: u.id,
    solved: new Set(u.submissions.map(s => s.problemId)).size,
  })).sort((a, b) => b.solved - a.solved);

  const rankIndex = sortedRank.findIndex(u => u.id === targetUser.id);
  const userRank = rankIndex !== -1 ? rankIndex + 1 : '-';

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
          <Link href="/settings" title="设置" className="hover:text-blue-600 transition">⚙️</Link>
        </nav>
      </aside>

      <div className="flex-1 ml-14 flex flex-col">
        {/* 顶部 Header */}
        <header className="bg-white border-b border-gray-200 h-12 px-6 flex justify-between items-center sticky top-0 z-10 shadow-2xs">
          <span className="text-xs font-bold text-gray-700">用户个人主页 (Profile)</span>
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
          {/* 洛谷风格个人资料卡片 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-2xl shadow-md">
                  {targetUser.username.slice(0, 1).toUpperCase()}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <h1 className="text-lg font-bold text-gray-800">{targetUser.username}</h1>
                    <UserBadge username={targetUser.username} role={targetUser.role} />
                  </div>
                  <p className="text-xs text-gray-500 italic">"{targetUser.slogan}"</p>
                  <p className="text-[11px] text-gray-400 font-mono">注册时间：{new Date(targetUser.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              {/* 洛谷风格核心数据统计面板 */}
              <div className="flex gap-4 bg-gray-50 p-3 rounded-lg border border-gray-100 text-center font-mono">
                <div>
                  <div className="text-[10px] text-gray-400 font-sans">排名</div>
                  <div className="text-sm font-bold text-blue-600">#{userRank}</div>
                </div>
                <div className="border-r border-gray-200"></div>
                <div>
                  <div className="text-[10px] text-gray-400 font-sans">通过 (AC)</div>
                  <div className="text-sm font-bold text-green-600">{solvedCount}</div>
                </div>
                <div className="border-r border-gray-200"></div>
                <div>
                  <div className="text-[10px] text-gray-400 font-sans">提交量</div>
                  <div className="text-sm font-bold text-gray-700">{totalSubmissions}</div>
                </div>
                <div className="border-r border-gray-200"></div>
                <div>
                  <div className="text-[10px] text-gray-400 font-sans">估值</div>
                  <div className="text-sm font-bold text-purple-600">{targetUser.guzhi}</div>
                </div>
              </div>
            </div>
          </div>

          {/* 下方内容网格 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 最近提交记录 */}
            <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-200 space-y-4">
              <h2 className="text-xs font-bold text-gray-700 border-b border-gray-100 pb-3 flex items-center gap-2">
                <span className="w-2 h-4 bg-blue-600 rounded-full inline-block"></span>
                最近评测提交
              </h2>
              <div className="space-y-2">
                {targetUser.submissions.length === 0 ? (
                  <p className="text-xs text-gray-400 py-6 text-center">暂无提交记录</p>
                ) : (
                  targetUser.submissions.slice(0, 6).map((s) => (
                    <div key={s.id} className="p-3 bg-gray-50 rounded text-xs flex justify-between items-center font-mono">
                      <span className="font-bold text-blue-600">{s.problem.id} - {s.problem.title}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        s.status === 'Accepted' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                      }`}>
                        {s.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* 发布的讨论与题解 */}
            <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-200 space-y-4">
              <h2 className="text-xs font-bold text-gray-700 border-b border-gray-100 pb-3 flex items-center gap-2">
                <span className="w-2 h-4 bg-purple-600 rounded-full inline-block"></span>
                发布的讨论与题解
              </h2>
              <div className="space-y-2">
                {targetUser.discussions.length === 0 ? (
                  <p className="text-xs text-gray-400 py-6 text-center">暂无讨论文章</p>
                ) : (
                  targetUser.discussions.slice(0, 6).map((d) => (
                    <div key={d.id} className="p-3 bg-gray-50 rounded text-xs space-y-1">
                      <div className="font-bold text-gray-800">{d.title}</div>
                      <p className="text-gray-500 line-clamp-1">{d.content}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}