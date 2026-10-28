import { prisma } from '@/lib/prisma';
import { getCurrentUser, clearSessionCookie } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import Link from 'next/link';
export const dynamic = 'force-dynamic';
async function handleHeaderLogout() {
  'use server';
  await clearSessionCookie();
  revalidatePath('/');
}

// 提交工单 Server Action
async function createTicket(formData: FormData) {
  'use server';
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect('/auth?mode=login');
  }

  const title = (formData.get('title') as string || '').trim();
  const content = (formData.get('content') as string || '').trim();

  if (!title || !content) return;

  // 使用 Discussion 模型存储工单反馈（带 [工单反馈] 前缀）
  await prisma.discussion.create({
    data: {
      title: `[工单反馈] ${title}`,
      content,
      userId: currentUser.id,
    },
  });

  revalidatePath('/tickets');
  redirect('/tickets?success=1');
}

// 工单列表组件
async function TicketList() {
  const tickets = await prisma.discussion.findMany({
    where: {
      title: { startsWith: '[工单反馈]' },
    },
    orderBy: { createdAt: 'desc' },
    include: { user: true },
  });

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 space-y-4">
      <h2 className="text-xs font-bold text-gray-700 border-b border-gray-100 pb-3 flex items-center gap-2">
        <span className="w-2 h-4 bg-blue-600 rounded-full inline-block"></span>
        全站工单反馈列表 ({tickets.length})
      </h2>

      {tickets.length === 0 ? (
        <p className="text-xs text-gray-400 text-center py-6">暂无提交的工单记录。</p>
      ) : (
        <div className="space-y-3">
          {tickets.map((t) => (
            <div key={t.id} className="p-4 bg-gray-50/60 rounded border border-gray-100 space-y-2 hover:border-blue-200 transition">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-gray-800">{t.title}</span>
                <span className="text-[10px] text-gray-400 font-mono">{new Date(t.createdAt).toLocaleString()}</span>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">{t.content}</p>
              <div className="flex items-center gap-2 pt-1 text-[11px] text-gray-500">
                <span>提交用户：<strong className="text-blue-600">{t.user.username}</strong></span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default async function TicketsPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>;
}) {
  const currentUser = await getCurrentUser();
  const params = await searchParams;

  return (
    <div className="min-h-screen bg-[#edf2f7] text-gray-800 flex font-sans antialiased">
      {/* 侧边导航栏 */}
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
          <div className="flex items-center gap-6 text-xs font-semibold">
            <Link href="/" className="text-gray-500 hover:text-blue-600">SkyOJ 平台</Link>
            <Link href="/articles" className="text-gray-500 hover:text-blue-600">文章广场</Link>
            <span className="text-blue-600 font-bold">工单与意见反馈中心</span>
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

        <main className="p-6 max-w-4xl mx-auto w-full space-y-6">
          {params.success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded text-xs text-center font-medium">
              工单已成功提交！管理员会尽快处理您的反馈。
            </div>
          )}

          {/* 提交工单表单 */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 space-y-4">
            <h2 className="text-xs font-bold text-gray-700 border-b border-gray-100 pb-3 flex items-center gap-2">
              <span className="w-2 h-4 bg-purple-600 rounded-full inline-block"></span>
              提交支持工单 (Support Ticket)
            </h2>
            {currentUser ? (
              <form action={createTicket} className="space-y-4 text-xs">
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">反馈主题 / 故障类型</label>
                  <input
                    type="text"
                    name="title"
                    placeholder="例如：P1001 评测机返回格式错误(WA)的异议"
                    className="w-full border border-gray-200 rounded p-2.5 bg-gray-50/50"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">详细描述</label>
                  <textarea
                    name="content"
                    rows={4}
                    placeholder="请详细描述您遇到的 Bug、建议或评测异议..."
                    className="w-full border border-gray-200 rounded p-2.5 bg-gray-50/50 resize-none"
                    required
                  />
                </div>
                <button type="submit" className="bg-blue-600 text-white px-5 py-2.5 rounded font-bold hover:bg-blue-700 transition">
                  提交工单
                </button>
              </form>
            ) : (
              <div className="py-6 text-center space-y-3">
                <p className="text-xs text-gray-400">请先登录后再提交工单反馈</p>
                <Link href="/auth?mode=login" className="inline-block bg-blue-600 text-white px-4 py-2 rounded text-xs font-bold">
                  立即登录
                </Link>
              </div>
            )}
          </div>

          {/* 工单历史列表 */}
          <TicketList />
        </main>
      </div>
    </div>
  );
}