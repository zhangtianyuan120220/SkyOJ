import { prisma } from '@/lib/prisma';
import { getCurrentUser, clearSessionCookie } from '@/lib/auth';
import { UserBadge } from '@/components/UserBadge';
import { revalidatePath } from 'next/cache';
import { Suspense } from 'react';
import Link from 'next/link';

async function handleHeaderLogout() {
  'use server';
  await clearSessionCookie();
  revalidatePath('/');
}

function getUserDailyFortune(userId: string) {
  const today = new Date().toISOString().slice(0, 10);
  const seedStr = userId + today;
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = (hash << 5) - hash + seedStr.charCodeAt(i);
    hash |= 0;
  }
  const fortunes = [
    { text: '§ 大吉 §', color: 'text-red-600' },
    { text: '§ 吉 §', color: 'text-orange-500' },
    { text: '§ 小吉 §', color: 'text-amber-500' },
    { text: '§ 平 §', color: 'text-gray-500' },
    { text: '§ 末吉 §', color: 'text-blue-500' },
    { text: '§ 凶 §', color: 'text-red-500' },
  ];
  return fortunes[Math.abs(hash) % fortunes.length];
}

async function postBenben(formData: FormData) {
  'use server';
  const content = (formData.get('content') as string || '').trim();
  if (!content) return;
  const currentUser = await getCurrentUser();
  if (!currentUser) return;

  await prisma.benben.create({
    data: { content, userId: currentUser.id },
  });
  revalidatePath('/');
}

async function handleProblemJump(formData: FormData) {
  'use server';
  const query = (formData.get('problemId') as string || '').trim().toUpperCase();
  if (!query) return;

  let problem = await prisma.problem.findFirst({
    where: { OR: [{ id: query }, { title: { contains: query } }] },
  });

  if (!problem && query === 'P1001') {
    problem = await prisma.problem.create({
      data: { id: 'P1001', title: 'A+B Problem', difficulty: '入门', content: '输入两个整数 a 和 b，输出它们的和。' },
    });
  }

  if (problem) {
    const { redirect } = await import('next/navigation');
    redirect(`/problems/${problem.id}`);
  }
}

async function BenbenList() {
  const benbens = await prisma.benben.findMany({
    take: 15,
    orderBy: { createdAt: 'desc' },
    include: { user: true },
  });

  return (
    <div className="space-y-3 mt-4">
      {benbens.length === 0 ? (
        <p className="text-gray-400 text-xs text-center py-6">暂无动态，快来发射第一条犇犇吧！</p>
      ) : (
        benbens.map((item) => (
          <div key={item.id} className="p-3 bg-white rounded border border-blue-100 text-xs shadow-2xs">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center font-bold text-[10px] border border-blue-100">
                  {item.user.username.slice(0, 1).toUpperCase()}
                </div>
                <Link href={`/users/${item.user.id}`} className="hover:underline">
                  <UserBadge username={item.user.username} role={item.user.role} oiBadge={item.user.oiBadge} />
                </Link>
                <span className="text-[10px] text-gray-400">{new Date(item.createdAt).toLocaleString()}</span>
              </div>
            </div>
            <p className="text-gray-700 ml-8 leading-relaxed">{item.content}</p>
          </div>
        ))
      )}
    </div>
  );
}

export default async function Home() {
  const currentUser = await getCurrentUser();
  const fortune = currentUser ? getUserDailyFortune(currentUser.id) : { text: '§ 平 §', color: 'text-gray-500' };

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
            <span className="text-blue-600 font-bold">SkyOJ 平台</span>
            <Link href="/problems" className="text-gray-600 hover:text-blue-600">题库中心</Link>
            <Link href="/articles" className="text-gray-600 hover:text-blue-600">文章广场</Link>
          </div>
          <div className="flex items-center gap-3 text-xs">
            {currentUser ? (
              <div className="flex items-center gap-3">
                <Link href={`/users/${currentUser.id}`} className="font-bold text-gray-700">{currentUser.username}</Link>
                <form action={handleHeaderLogout}>
                  <button type="submit" className="text-red-500 hover:underline text-[11px]">退出</button>
                </form>
              </div>
            ) : (
              <>
                <Link href="/auth?mode=login" className="text-gray-600">登录</Link>
                <Link href="/auth" className="bg-blue-600 text-white px-3.5 py-1.5 rounded font-bold">注册</Link>
              </>
            )}
          </div>
        </header>

        <main className="p-5 max-w-7xl mx-auto w-full space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-md p-5 text-white h-40 flex flex-col justify-between">
              <div>
                <span className="bg-white/20 px-2 py-0.5 rounded text-[10px]">SkyOJ Round 1</span>
                <h2 className="text-lg font-bold mt-1">SkyOJ 10 月算法月赛 & 竞赛模拟</h2>
              </div>
            </div>
            <div className="bg-white rounded-md p-4 border border-gray-200 flex flex-col justify-between">
              <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                <span className="font-bold text-xs text-gray-700">{currentUser ? `${currentUser.username} 的运势` : '今日运势'}</span>
                <span className={`text-xs font-bold ${fortune.color}`}>{fortune.text}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 space-y-5">
              <div className="bg-white rounded-md p-4 border border-gray-200">
                <h3 className="text-xs font-bold text-gray-700 mb-2">问题跳转</h3>
                <form action={handleProblemJump} className="flex gap-2">
                  <input type="text" name="problemId" defaultValue="P1001" placeholder="例：P1001" className="flex-1 border border-gray-200 rounded px-3 py-1 text-xs uppercase font-mono" required />
                  <button type="submit" className="bg-orange-500 text-white px-3.5 py-1 rounded text-xs font-medium">查询/跳转</button>
                </form>
              </div>

              <div className="bg-white rounded-md p-4 border border-gray-200">
                <h3 className="text-xs font-bold text-gray-700 mb-2">有什么新鲜事告诉大家</h3>
                <form action={postBenben}>
                  <textarea name="content" rows={3} placeholder={currentUser ? "分享你的刷题心得或想法..." : "请登录后发射犇犇..."} disabled={!currentUser} className="w-full border border-gray-200 rounded p-2.5 text-xs resize-none disabled:bg-gray-100" required />
                  <div className="flex justify-end mt-2">
                    <button type="submit" disabled={!currentUser} className="bg-[#e74c3c] text-white px-4 py-1.5 rounded text-xs font-bold disabled:bg-gray-300">发射犇犇！</button>
                  </div>
                </form>
                <Suspense fallback={<p className="text-center text-gray-400 text-xs py-4">加载动态中...</p>}>
                  <BenbenList />
                </Suspense>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}