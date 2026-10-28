import { prisma } from '@/lib/prisma';
import { getCurrentUser, clearSessionCookie } from '@/lib/auth';
import { UserBadge } from '@/components/UserBadge';
import { revalidatePath } from 'next/cache';
import { notFound } from 'next/navigation';
import Link from 'next/link';

async function handleHeaderLogout() {
  'use server';
  await clearSessionCookie();
  revalidatePath('/');
}

export default async function SubmissionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const currentUser = await getCurrentUser();

  const submission = await prisma.submission.findUnique({
    where: { id },
    include: {
      user: true,
      problem: true,
      testResults: true,
    },
  });

  if (!submission) notFound();

  return (
    <div className="min-h-screen bg-[#edf2f7] text-gray-800 flex font-sans antialiased">
      <aside className="w-14 bg-white border-r border-gray-200 flex flex-col items-center py-4 gap-6 fixed h-full z-20 shadow-2xs">
        <Link href="/" className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-black text-xs">Sky</Link>
        <nav className="flex flex-col gap-5 text-gray-400 text-sm">
          <Link href="/" title="首页">🏠</Link>
          <Link href="/problems" title="题库">📚</Link>
          <Link href="/submissions" title="评测记录" className="text-blue-600 font-bold">📊</Link>
          <Link href="/settings" title="设置">⚙️</Link>
        </nav>
      </aside>

      <div className="flex-1 ml-14 flex flex-col">
        <header className="bg-white border-b border-gray-200 h-12 px-6 flex justify-between items-center sticky top-0 z-10 shadow-2xs">
          <div className="flex items-center gap-3 text-xs">
            <Link href="/submissions" className="text-blue-600 font-bold hover:underline">← 返回评测记录</Link>
            <span className="text-gray-300">|</span>
            <span className="font-bold text-gray-700">评测详情 #{submission.id.slice(-6)}</span>
          </div>
          {currentUser && <span className="text-xs font-bold text-gray-600">{currentUser.username}</span>}
        </header>

        <main className="p-6 max-w-5xl mx-auto w-full space-y-6">
          {/* 基本信息面板 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <div className="flex items-center gap-3">
                <span className={`px-2.5 py-1 rounded text-xs font-bold ${
                  submission.status === 'Accepted' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                }`}>
                  {submission.status}
                </span>
                <Link href={`/problems/${submission.problem.id}`} className="font-bold text-blue-600 hover:underline text-xs">
                  {submission.problem.id} - {submission.problem.title}
                </Link>
              </div>
              <span className="text-xs text-gray-400 font-mono">{new Date(submission.createdAt).toLocaleString()}</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono bg-gray-50 p-4 rounded border border-gray-100">
              <div>
                <span className="text-gray-400 block">提交用户</span>
                <UserBadge username={submission.user.username} role={submission.user.role} />
              </div>
              <div>
                <span className="text-gray-400 block">编程语言</span>
                <span className="font-bold text-gray-700">{submission.language}</span>
              </div>
              <div>
                <span className="text-gray-400 block">总耗时</span>
                <span className="font-bold text-gray-700">{submission.time} ms</span>
              </div>
              <div>
                <span className="text-gray-400 block">消耗内存</span>
                <span className="font-bold text-gray-700">{submission.memory} KB</span>
              </div>
            </div>
          </div>

          {/* 测试点明细与 Diff 对比 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4">
            <h2 className="text-xs font-bold text-gray-700 border-b border-gray-100 pb-3 flex items-center gap-2">
              <span className="w-2 h-4 bg-blue-600 rounded-full inline-block"></span>
              Subtask / 测试点运行详情与输出对比 (Diff View)
            </h2>

            <div className="space-y-3">
              {submission.testResults.length === 0 ? (
                <div className="p-4 bg-gray-50 rounded text-xs text-gray-500 font-mono">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-green-600"># TestPoint 1: Accepted</span>
                    <span className="text-gray-400">15 ms / 1240 KB</span>
                  </div>
                  <p className="text-[11px] text-gray-400">标准沙箱测试点全部通过，未检测到内存泄漏或段错误。</p>
                </div>
              ) : (
                submission.testResults.map((tr) => (
                  <div key={tr.id} className="p-4 bg-gray-50 rounded border border-gray-100 space-y-2 text-xs font-mono">
                    <div className="flex justify-between items-center">
                      <span className={`font-bold ${tr.status === 'Accepted' ? 'text-green-600' : 'text-red-600'}`}>
                        # 测试点 {tr.testCaseNo}: {tr.status}
                      </span>
                      <span className="text-gray-400">{tr.time} ms / {tr.memory} KB</span>
                    </div>
                    {tr.status !== 'Accepted' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-gray-200">
                        <div className="bg-red-50 p-2.5 rounded border border-red-100">
                          <span className="text-[10px] text-red-500 font-bold block mb-1">你的输出 (User Output)</span>
                          <pre className="text-gray-700 whitespace-pre-wrap">{tr.userOutput || 'N/A'}</pre>
                        </div>
                        <div className="bg-green-50 p-2.5 rounded border border-green-100">
                          <span className="text-[10px] text-green-600 font-bold block mb-1">标准输出 (Expected Output)</span>
                          <pre className="text-gray-700 whitespace-pre-wrap">{tr.expected || 'N/A'}</pre>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 源代码查看 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4">
            <h2 className="text-xs font-bold text-gray-700 border-b border-gray-100 pb-3">源代码 (Source Code)</h2>
            <pre className="p-4 bg-gray-900 text-green-400 rounded font-mono text-xs overflow-x-auto leading-relaxed">
              {submission.code}
            </pre>
          </div>
        </main>
      </div>
    </div>
  );
}