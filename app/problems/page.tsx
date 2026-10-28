import { prisma } from '@/lib/prisma';
import { getCurrentUser, clearSessionCookie } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import Link from 'next/link';

async function handleHeaderLogout() {
  'use server';
  await clearSessionCookie();
  revalidatePath('/');
}

export default async function ProblemsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; diff?: string }>;
}) {
  const params = await searchParams;
  const query = (params.q || '').trim();
  const diff = params.diff || '';
  const currentUser = await getCurrentUser();

  const problems = await prisma.problem.findMany({
    where: {
      AND: [
        query ? { OR: [{ id: { contains: query } }, { title: { contains: query } }] } : {},
        diff ? { difficulty: diff } : {},
      ],
    },
    orderBy: { id: 'asc' },
  });

  return (
    <div className="min-h-screen bg-[#edf2f7] text-gray-800 flex font-sans antialiased">
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
        <header className="bg-white border-b border-gray-200 h-12 px-6 flex justify-between items-center sticky top-0 z-10 shadow-2xs">
          <div className="flex items-center gap-6 text-xs font-semibold">
            <Link href="/" className="text-gray-500 hover:text-blue-600">SkyOJ 平台</Link>
            <span className="text-blue-600 font-bold">题库中心</span>
          </div>
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

        <main className="p-6 max-w-7xl mx-auto w-full space-y-5">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <form method="GET" className="flex flex-wrap gap-3 items-center text-xs">
              <input type="text" name="q" defaultValue={query} placeholder="搜索题号或标题..." className="flex-1 min-w-[200px] border border-gray-200 rounded px-3 py-2 bg-gray-50/50" />
              <select name="diff" defaultValue={diff} className="border border-gray-200 rounded px-3 py-2 bg-gray-50/50 font-bold">
                <option value="">所有难度</option>
                <option value="入门">入门</option>
                <option value="普及-">普及-</option>
                <option value="提高+/省选">提高+/省选</option>
              </select>
              <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded font-bold hover:bg-blue-700 transition">筛选题目</button>
            </form>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-semibold">
                  <th className="py-3 px-4 w-24">题号</th>
                  <th className="py-3 px-4">题目名称</th>
                  <th className="py-3 px-4 w-32">难度</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {problems.map((p) => (
                  <tr key={p.id} className="hover:bg-blue-50/30 transition">
                    <td className="py-3 px-4 font-mono font-bold text-blue-600">
                      <Link href={`/problems/${p.id}`}>{p.id}</Link>
                    </td>
                    <td className="py-3 px-4 font-bold text-gray-800">
                      <Link href={`/problems/${p.id}`} className="hover:underline">{p.title}</Link>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-gray-100 text-gray-600 border border-gray-200">{p.difficulty}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  );
}