import { prisma } from '@/lib/prisma';
import { getCurrentUser, clearSessionCookie } from '@/lib/auth';
import { UserBadge } from '@/components/UserBadge';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import Link from 'next/link';

// Server Action: 退出登录
async function handleHeaderLogout() {
  'use server';
  await clearSessionCookie();
  revalidatePath('/');
}

// Server Action: 发布新讨论 / 题解
async function createDiscussion(formData: FormData) {
  'use server';
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect('/auth?mode=login');
  }

  const title = (formData.get('title') as string || '').trim();
  const content = (formData.get('content') as string || '').trim();
  const problemId = (formData.get('problemId') as string || '').trim().toUpperCase();

  if (!title || !content) return;

  await prisma.discussion.create({
    data: {
      title,
      content,
      problemId: problemId || null,
      userId: currentUser.id,
    },
  });

  revalidatePath('/discussions');
}

export default async function DiscussionsPage() {
  const currentUser = await getCurrentUser();

  const discussions = await prisma.discussion.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      user: true,
    },
  });

  return (
    <div className="min-h-screen bg-[#edf2f7] text-gray-800 flex font-sans antialiased">
      {/* 左侧固定边栏 (集成文章广场与工单反馈按钮) */}
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
        {/* 顶部状态 Header */}
        <header className="bg-white border-b border-gray-200 h-12 px-6 flex justify-between items-center sticky top-0 z-10 shadow-2xs">
          <span className="text-xs font-bold text-gray-700">讨论与题解 (Discussions)</span>
          <div className="flex items-center gap-3 text-xs">
            {currentUser ? (
              <div className="flex items-center gap-3">
                <Link href={`/users/${currentUser.id}`} className="font-bold text-gray-700 hover:underline">
                  {currentUser.username}
                </Link>
                <form action={handleHeaderLogout}>
                  <button type="submit" className="text-red-500 hover:underline text-[11px]">退出</button>
                </form>
              </div>
            ) : (
              <>
                <Link href="/auth?mode=login" className="text-gray-600 hover:text-blue-600 font-medium px-3 py-1.5 transition">
                  登录
                </Link>
                <Link href="/auth" className="bg-blue-600 text-white px-3.5 py-1.5 rounded font-bold hover:bg-blue-700 transition shadow-2xs">
                  注册
                </Link>
              </>
            )}
          </div>
        </header>

        {/* 主内容 */}
        <main className="p-6 max-w-7xl mx-auto w-full space-y-6">
          {/* 发布表单 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 space-y-4">
            <h2 className="text-xs font-bold text-gray-700 flex items-center gap-2">
              <span className="w-2 h-4 bg-blue-600 rounded-full inline-block"></span>
              发布新讨论 / 题解
            </h2>

            {currentUser ? (
              <form action={createDiscussion} className="space-y-3 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="md:col-span-3">
                    <input
                      type="text"
                      name="title"
                      placeholder="讨论标题（例如：【题解】P1001 思路分享）"
                      className="w-full border border-gray-200 rounded p-2.5 bg-gray-50/30 focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      name="problemId"
                      placeholder="关联题号 (可选，如 P1001)"
                      className="w-full border border-gray-200 rounded p-2.5 bg-gray-50/30 font-mono uppercase focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <textarea
                  name="content"
                  rows={3}
                  placeholder="详细描述你的解题思路、代码实现或算法讨论..."
                  className="w-full border border-gray-200 rounded p-2.5 bg-gray-50/30 resize-none focus:outline-none focus:border-blue-500"
                  required
                />

                <div className="flex justify-end">
                  <button type="submit" className="bg-blue-600 text-white px-5 py-2 rounded text-xs font-bold hover:bg-blue-700 transition shadow-2xs">
                    发布讨论
                  </button>
                </div>
              </form>
            ) : (
              <p className="text-xs text-gray-400 text-center py-4">
                请先 <Link href="/auth?mode=login" className="text-blue-600 font-bold hover:underline">登录</Link> 后参与社区讨论。
              </p>
            )}
          </div>

          {/* 讨论列表 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 space-y-4">
            <h2 className="text-xs font-bold text-gray-700 flex items-center gap-2 border-b border-gray-100 pb-2.5">
              <span className="w-2 h-4 bg-purple-600 rounded-full inline-block"></span>
              讨论列表
            </h2>

            {discussions.length === 0 ? (
              <p className="text-gray-400 text-xs text-center py-8">暂无讨论话题，快来发布第一个讨论吧！</p>
            ) : (
              <div className="space-y-3">
                {discussions.map((item) => (
                  <div key={item.id} className="p-4 bg-gray-50/50 rounded border border-gray-100 space-y-2 hover:border-blue-200 transition">
                    <div className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-2">
                        {item.problemId && (
                          <span className="bg-blue-50 text-blue-600 font-mono font-bold px-2 py-0.5 rounded text-[10px] border border-blue-100">
                            {item.problemId}
                          </span>
                        )}
                        <span className="font-bold text-gray-800">{item.title}</span>
                      </div>
                      <span className="text-[10px] text-gray-400 font-mono">{new Date(item.createdAt).toLocaleString()}</span>
                    </div>

                    <p className="text-xs text-gray-600 leading-relaxed pl-1">{item.content}</p>

                    <div className="flex items-center gap-2 pt-1">
                      <UserBadge username={item.user.username} role={item.user.role} oiBadge={item.user.oiBadge} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}