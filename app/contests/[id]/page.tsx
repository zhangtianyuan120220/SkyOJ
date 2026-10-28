import { prisma } from '@/lib/prisma';
import { getCurrentUser, clearSessionCookie } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { notFound } from 'next/navigation';
import Link from 'next/link';
export const dynamic = 'force-dynamic';
async function handleHeaderLogout() {
  'use server';
  await clearSessionCookie();
  revalidatePath('/');
}

export default async function ContestDetailPage({ params, searchParams }: { params: Promise<{ id: string }>, searchParams: Promise<{ tab?: string }> }) {
  const { id } = await params;
  const { tab = 'problems' } = await searchParams;
  const currentUser = await getCurrentUser();

  let contest = await prisma.contest.findUnique({
    where: { id },
    include: {
      registrations: { include: { user: { include: { submissions: { include: { problem: true } } } } } },
      problems: { include: { problem: true } },
    },
  });

  if (!contest) notFound();

  // 如果比赛没有题目，自动挂载几道默认题目供演示
  if (contest.problems.length === 0) {
    const sampleProblems = await prisma.problem.findMany({ take: 3 });
    for (const p of sampleProblems) {
      try {
        await prisma.contestProblem.create({
          data: { contestId: contest.id, problemId: p.id },
        });
      } catch (e) {}
    }
    contest = await prisma.contest.findUnique({
      where: { id },
      include: {
        registrations: { include: { user: { include: { submissions: { include: { problem: true } } } } } },
        problems: { include: { problem: true } },
      },
    });
  }

  // 计算比赛实时排行榜：统计每个已报名用户的 AC 题目数
  const scoreboard = contest?.registrations.map(reg => {
    const user = reg.user;
    // 找出该用户在本次比赛题目中获得 Accepted 的题目
    const contestProblemIds = new Set(contest?.problems.map(cp => cp.problemId) || []);
    const userAcceptedProblems = new Set(
      user.submissions
        .filter(s => s.status === 'Accepted' && contestProblemIds.has(s.problemId))
        .map(s => s.problemId)
    );
    return {
      userId: user.id,
      username: user.username,
      solvedCount: userAcceptedProblems.size,
      totalSubmissions: user.submissions.filter(s => contestProblemIds.has(s.problemId)).length,
    };
  }).sort((a, b) => b.solvedCount - a.solvedCount);

  return (
    <div className="min-h-screen bg-[#edf2f7] text-gray-800 flex font-sans antialiased">
      <aside className="w-14 bg-white border-r border-gray-200 flex flex-col items-center py-4 gap-6 fixed h-full z-20 shadow-2xs">
        <Link href="/" className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-black text-xs">Sky</Link>
        <nav className="flex flex-col gap-5 text-gray-400 text-sm">
          <Link href="/" title="首页">🏠</Link>
          <Link href="/problems" title="题库">📚</Link>
          <Link href="/contests" title="比赛" className="text-blue-600 font-bold">🏆</Link>
          <Link href="/settings" title="设置">⚙️</Link>
        </nav>
      </aside>

      <div className="flex-1 ml-14 flex flex-col">
        <header className="bg-white border-b border-gray-200 h-12 px-6 flex justify-between items-center sticky top-0 z-10 shadow-2xs">
          <div className="flex items-center gap-3 text-xs">
            <Link href="/contests" className="text-blue-600 font-bold hover:underline">← 返回比赛列表</Link>
            <span className="text-gray-300">|</span>
            <span className="font-bold text-gray-700">{contest?.title}</span>
          </div>
          {currentUser && <span className="text-xs font-bold text-gray-600">{currentUser.username}</span>}
        </header>

        <main className="p-6 max-w-7xl mx-auto w-full space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-3">
            <h1 className="text-base font-bold text-gray-800">{contest?.title}</h1>
            <p className="text-xs text-gray-600 leading-relaxed">{contest?.description}</p>
            <div className="text-xs text-gray-400 font-mono pt-2 border-t border-gray-100 flex gap-6">
              <span>开始时间：{contest?.startTime ? new Date(contest.startTime).toLocaleString() : ''}</span>
              <span>结束时间：{contest?.endTime ? new Date(contest.endTime).toLocaleString() : ''}</span>
            </div>
          </div>

          {/* Tab 切换栏 */}
          <div className="flex gap-2 border-b border-gray-200 pb-2 text-xs font-bold">
            <Link href={`/contests/${id}?tab=problems`} className={`px-4 py-2 rounded-t ${tab === 'problems' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}>
              赛题列表
            </Link>
            <Link href={`/contests/${id}?tab=scoreboard`} className={`px-4 py-2 rounded-t ${tab === 'scoreboard' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}>
              实时排行榜 (Scoreboard)
            </Link>
          </div>

          {/* 赛题 Tab 内容 */}
          {tab === 'problems' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4">
              <h2 className="text-xs font-bold text-gray-700 border-b border-gray-100 pb-3">比赛题目</h2>
              <div className="space-y-2">
                {contest?.problems.map((cp, idx) => (
                  <div key={cp.id} className="p-4 bg-gray-50 rounded border border-gray-100 flex justify-between items-center text-xs">
                    <div>
                      <span className="font-mono text-blue-600 font-bold mr-3"># {String.fromCharCode(65 + idx)}</span>
                      <Link href={`/problems/${cp.problem.id}`} className="font-bold text-gray-800 hover:underline">
                        {cp.problem.id} - {cp.problem.title}
                      </Link>
                    </div>
                    <Link href={`/problems/${cp.problem.id}`} className="bg-blue-600 text-white px-3.5 py-1.5 rounded font-bold hover:bg-blue-700">
                      进入做题
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 排行榜 Tab 内容 */}
          {tab === 'scoreboard' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4">
              <h2 className="text-xs font-bold text-gray-700 border-b border-gray-100 pb-3">实时赛况排行榜 (IOI 赛制)</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-gray-200 text-gray-400">
                      <th className="pb-3 font-semibold">排名</th>
                      <th className="pb-3 font-semibold">用户</th>
                      <th className="pb-3 font-semibold">通过题数 (Solved)</th>
                      <th className="pb-3 font-semibold">总提交数</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {scoreboard?.map((row, index) => (
                      <tr key={row.userId} className="hover:bg-gray-50">
                        <td className="py-3 font-bold text-blue-600">#{index + 1}</td>
                        <td className="py-3 font-bold text-gray-800">{row.username}</td>
                        <td className="py-3 font-bold text-green-600">{row.solvedCount} / {contest?.problems.length}</td>
                        <td className="py-3 text-gray-500">{row.totalSubmissions}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}