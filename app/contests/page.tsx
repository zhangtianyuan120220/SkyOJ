import { prisma } from '@/lib/prisma';
import { getCurrentUser, clearSessionCookie } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import Link from 'next/link';

async function handleHeaderLogout() {
  'use server';
  await clearSessionCookie();
  revalidatePath('/');
}

// 报名比赛 Server Action
async function registerContest(formData: FormData) {
  'use server';
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect('/auth?mode=login');

  const contestId = formData.get('contestId') as string;
  if (!contestId) return;

  try {
    await prisma.contestRegistration.create({
      data: { contestId, userId: currentUser.id },
    });
  } catch (e) {
    // 已经报名则忽略
  }

  revalidatePath('/contests');
}

export default async function ContestsPage() {
  const currentUser = await getCurrentUser();

  // 检查并初始化默认比赛
  const count = await prisma.contest.count();
  if (count === 0) {
    const now = new Date();
    const start = new Date(now.getTime() + 3600 * 1000); // 1小时后开始
    const end = new Date(now.getTime() + 4 * 3600 * 1000);

    await prisma.contest.create({
      data: {
        title: 'SkyOJ 10 月算法月赛 & 竞赛模拟 Round 1',
        description: '本场比赛为 IOI 赛制，共 3 道算法题，欢迎各位 OIer 踊跃参加！',
        startTime: start,
        endTime: end,
        status: 'Upcoming',
      },
    });
  }

  const contests = await prisma.contest.findMany({
    orderBy: { startTime: 'desc' },
    include: {
      registrations: true,
    },
  });

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
          <Link href="/ranklist" title="排名" className="hover:text-blue-600 transition">🎯</Link>
          <Link href="/contests" title="比赛" className="text-blue-600 font-bold transition">🏆</Link>
          <Link href="/submissions" title="评测记录" className="hover:text-blue-600 transition">📊</Link>
          <Link href="/discussions" title="讨论" className="hover:text-blue-600 transition">💬</Link>
          <Link href="/tickets" title="工单反馈" className="hover:text-blue-600 transition">🎫</Link>
          {currentUser?.role === 'ADMIN' && <Link href="/admin" title="管理后台">🛡️</Link>}
          <Link href="/settings" title="设置">⚙️</Link>
        </nav>
      </aside>

      <div className="flex-1 ml-14 flex flex-col">
        <header className="bg-white border-b border-gray-200 h-12 px-6 flex justify-between items-center sticky top-0 z-10 shadow-2xs">
          <span className="text-xs font-bold text-gray-700">算法竞赛与模拟赛 (Contests)</span>
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

        <main className="p-6 max-w-7xl mx-auto w-full space-y-4">
          <div className="space-y-3">
            {contests.map((c) => {
              const isRegistered = currentUser ? c.registrations.some(r => r.userId === currentUser.id) : false;
              return (
                <div key={c.id} className="p-5 bg-white rounded-lg border border-gray-200 shadow-2xs flex justify-between items-center hover:border-blue-300 transition">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[10px] font-bold">
                        {c.status === 'Upcoming' ? '未开始' : '进行中'}
                      </span>
                      <Link href={`/contests/${c.id}`} className="text-sm font-bold text-gray-800 hover:text-blue-600 transition">
                        {c.title}
                      </Link>
                    </div>
                    <p className="text-xs text-gray-500">{c.description}</p>
                    <div className="text-[11px] text-gray-400 font-mono pt-1">
                      时间：{new Date(c.startTime).toLocaleString()} ~ {new Date(c.endTime).toLocaleString()}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Link href={`/contests/${c.id}`} className="bg-gray-100 text-gray-700 px-3.5 py-2 rounded text-xs font-bold hover:bg-gray-200 transition">
                      进入比赛
                    </Link>
                    {!isRegistered ? (
                      <form action={registerContest}>
                        <input type="hidden" name="contestId" value={c.id} />
                        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded text-xs font-bold hover:bg-blue-700 transition shadow-2xs">
                          报名比赛
                        </button>
                      </form>
                    ) : (
                      <span className="bg-green-50 text-green-600 border border-green-200 px-3.5 py-2 rounded text-xs font-bold">
                        已报名 ✓
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      </div>
    </div>
  );
}