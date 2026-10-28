import { prisma } from '@/lib/prisma';
import { getCurrentUser, clearSessionCookie } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
export const dynamic = 'force-dynamic';
async function handleHeaderLogout() {
  'use server';
  await clearSessionCookie();
  revalidatePath('/');
}

// 提交代码并触发沙箱多测试点评测的 Server Action
async function handleSubmission(formData: FormData) {
  'use server';
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect('/auth?mode=login');

  const problemId = formData.get('problemId') as string;
  const language = formData.get('language') as string;
  const code = (formData.get('code') as string || '').trim();

  if (!problemId || !code) return;

  // 沙箱模拟判定：若代码中包含 error 则模拟出错，否则高概率通过
  const isAccepted = !code.includes('error') && Math.random() > 0.2;
  const status = isAccepted ? 'Accepted' : 'Wrong Answer';
  const time = Math.floor(Math.random() * 40) + 10;
  const memory = Math.floor(Math.random() * 1500) + 1024;

  // 创建评测记录
  const submission = await prisma.submission.create({
    data: {
      problemId,
      userId: currentUser.id,
      language,
      code,
      status,
      time,
      memory,
    },
  });

  // 自动生成 3 个测试点的详细 Diff 运行结果
  for (let i = 1; i <= 3; i++) {
    const pointPassed = isAccepted || i < 3;
    await prisma.testCaseResult.create({
      data: {
        submissionId: submission.id,
        testCaseNo: i,
        status: pointPassed ? 'Accepted' : 'Wrong Answer',
        time: Math.floor(Math.random() * 15) + 5,
        memory: Math.floor(Math.random() * 500) + 1000,
        userOutput: pointPassed ? '42' : '24',
        expected: '42',
      },
    });
  }

  revalidatePath('/submissions');
  redirect(`/submissions/${submission.id}`);
}

export default async function ProblemDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const currentUser = await getCurrentUser();

  const problem = await prisma.problem.findUnique({
    where: { id },
  });

  if (!problem) notFound();

  return (
    <div className="min-h-screen bg-[#edf2f7] text-gray-800 flex font-sans antialiased">
      {/* 侧边栏 */}
      <aside className="w-14 bg-white border-r border-gray-200 flex flex-col items-center py-4 gap-6 fixed h-full z-20 shadow-2xs">
        <Link href="/" className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-black text-xs shadow-xs">
          Sky
        </Link>
        <nav className="flex flex-col gap-5 text-gray-400 text-sm">
          <Link href="/" title="首页" className="hover:text-blue-600 transition">🏠</Link>
          <Link href="/problems" title="题库" className="text-blue-600 font-bold transition">📚</Link>
          <Link href="/articles" title="文章广场" className="hover:text-blue-600 transition">📖</Link>
          <Link href="/ranklist" title="排名" className="hover:text-blue-600 transition">🎯</Link>
          <Link href="/contests" title="比赛" className="hover:text-blue-600 transition">🏆</Link>
          <Link href="/submissions" title="评测记录" className="hover:text-blue-600 transition">📊</Link>
          <Link href="/discussions" title="讨论" className="hover:text-blue-600 transition">💬</Link>
          <Link href="/tickets" title="工单反馈" className="hover:text-blue-600 transition">🎫</Link>
          {currentUser?.role === 'ADMIN' && <Link href="/admin" title="管理后台">🛡️</Link>}
          <Link href="/settings" title="设置">⚙️</Link>
        </nav>
      </aside>

      <div className="flex-1 ml-14 flex flex-col">
        {/* 顶部 Header */}
        <header className="bg-white border-b border-gray-200 h-12 px-6 flex justify-between items-center sticky top-0 z-10 shadow-2xs">
          <div className="flex items-center gap-3 text-xs">
            <Link href="/problems" className="text-blue-600 font-bold hover:underline">← 返回题库</Link>
            <span className="text-gray-300">|</span>
            <span className="font-bold text-gray-700">{problem.id} - {problem.title}</span>
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

        {/* 主内容：左右分栏 */}
        <main className="p-6 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 题目详情与描述 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h1 className="text-sm font-bold text-gray-800">{problem.id}. {problem.title}</h1>
              <span className="px-2.5 py-0.5 rounded font-bold text-[10px] bg-gray-100 text-gray-600 border border-gray-200">
                {problem.difficulty} / {problem.score}分
              </span>
            </div>
            <div className="text-xs text-gray-700 leading-relaxed space-y-3">
              <h3 className="font-bold text-gray-800">题目描述</h3>
              <p className="bg-gray-50 p-4 rounded border border-gray-100 font-mono whitespace-pre-wrap">{problem.content}</p>
            </div>
          </div>

          {/* 在线评测提交区 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4">
            <h2 className="text-xs font-bold text-gray-700 border-b border-gray-100 pb-3 flex items-center gap-2">
              <span className="w-2 h-4 bg-blue-600 rounded-full inline-block"></span>
              沙箱在线代码提交 (Sandbox Submit)
            </h2>

            {currentUser ? (
              <form action={handleSubmission} className="space-y-4 text-xs">
                <input type="hidden" name="problemId" value={problem.id} />
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">选择编程语言</label>
                  <select name="language" className="w-full border border-gray-200 rounded p-2.5 bg-gray-50/50 font-bold">
                    <option value="C++14">C++14 (g++ 9.4)</option>
                    <option value="C++20">C++20 (g++ 11.2)</option>
                    <option value="Python3">Python 3.10</option>
                    <option value="Java">Java 17 (OpenJDK)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-600 font-semibold mb-1">源代码 (Source Code)</label>
                  <textarea
                    name="code"
                    rows={12}
                    placeholder="#include <iostream>&#10;using namespace std;&#10;int main() {&#10;    int a, b;&#10;    cin >> a >> b;&#10;    cout << a + b << endl;&#10;    return 0;&#10;}"
                    className="w-full border border-gray-200 rounded p-3 bg-gray-900 text-green-400 font-mono text-xs resize-none"
                    required
                  />
                </div>

                <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded font-bold hover:bg-blue-700 transition shadow-2xs">
                  提交至沙箱评测 (Submit & Judge)
                </button>
              </form>
            ) : (
              <div className="py-12 text-center space-y-3">
                <p className="text-xs text-gray-400">请先登录后再提交代码评测</p>
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