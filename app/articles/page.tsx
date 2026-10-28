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

// 发布文章 Server Action
async function createArticle(formData: FormData) {
  'use server';
  const currentUser = await getCurrentUser();
  if (!currentUser) return;

  const title = (formData.get('title') as string || '').trim();
  const problemId = (formData.get('problemId') as string || '').trim();
  const content = (formData.get('content') as string || '').trim();

  if (!title || !content) return;

  await prisma.discussion.create({
    data: {
      title,
      content,
      problemId: problemId ? problemId : null,
      userId: currentUser.id,
    },
  });

  revalidatePath('/articles');
}

export default async function ArticlesPage() {
  const currentUser = await getCurrentUser();
  const articles = await prisma.discussion.findMany({
    orderBy: { createdAt: 'desc' },
    include: { user: true },
  });

  return (
    <div className="min-h-screen bg-[#edf2f7] text-gray-800 flex font-sans antialiased">
      <aside className="w-14 bg-white border-r border-gray-200 flex flex-col items-center py-4 gap-6 fixed h-full z-20 shadow-2xs">
        <Link href="/" className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-black text-xs shadow-xs">Sky</Link>
        <nav className="flex flex-col gap-5 text-gray-400 text-sm">
          <Link href="/" title="首页">🏠</Link>
          <Link href="/problems" title="题库">📚</Link>
          <Link href="/articles" title="文章广场" className="text-blue-600 font-bold">📖</Link>
          <Link href="/ranklist" title="排名">🎯</Link>
          <Link href="/contests" title="比赛">🏆</Link>
          <Link href="/submissions" title="评测记录">📊</Link>
          <Link href="/discussions" title="讨论">💬</Link>
          <Link href="/tickets" title="工单反馈">🎫</Link>
          {currentUser?.role === 'ADMIN' && <Link href="/admin" title="管理后台">🛡️</Link>}
          <Link href="/settings" title="设置">⚙️</Link>
        </nav>
      </aside>

      <div className="flex-1 ml-14 flex flex-col">
        <header className="bg-white border-b border-gray-200 h-12 px-6 flex justify-between items-center sticky top-0 z-10 shadow-2xs">
          <div className="flex items-center gap-6 text-xs font-semibold">
            <Link href="/" className="text-gray-500 hover:text-blue-600">SkyOJ 平台</Link>
            <span className="text-blue-600 font-bold">文章广场 / 题解专栏</span>
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
          {currentUser && (
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 space-y-4">
              <h2 className="text-xs font-bold text-gray-700 border-b border-gray-100 pb-3 flex items-center gap-2">
                <span className="w-2 h-4 bg-blue-600 rounded-full inline-block"></span>
                发表新文章 / 题解 (支持 Markdown 与 LaTeX 数学公式)
              </h2>
              <form action={createArticle} className="space-y-3 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="md:col-span-2">
                    <input type="text" name="title" placeholder="文章标题..." className="w-full border border-gray-200 rounded p-2.5 bg-gray-50/50" required />
                  </div>
                  <div>
                    <input type="text" name="problemId" placeholder="关联题号（可选）" className="w-full border border-gray-200 rounded p-2.5 bg-gray-50/50 uppercase font-mono" />
                  </div>
                </div>
                <div>
                  <textarea name="content" rows={4} placeholder="使用 Markdown 编写内容，支持公式..." className="w-full border border-gray-200 rounded p-3 bg-gray-50/50 resize-none font-mono" required />
                </div>
                <div className="flex justify-end">
                  <button type="submit" className="bg-blue-600 text-white px-5 py-2.5 rounded font-bold hover:bg-blue-700 transition">立即发布</button>
                </div>
              </form>
            </div>
          )}

          <div className="space-y-3">
            <h2 className="text-xs font-bold text-gray-700">社区文章列表 ({articles.length})</h2>
            {articles.map((art) => (
              <div key={art.id} className="bg-white rounded-lg shadow-sm p-5 border border-gray-200 flex justify-between items-center hover:border-blue-300 transition">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {art.problemId && <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded font-mono font-bold text-[10px]">{art.problemId}</span>}
                    <Link href={`/articles/${art.id}`} className="font-bold text-gray-800 hover:text-blue-600 text-sm transition">
                      {art.title}
                    </Link>
                  </div>
                  <div className="text-[11px] text-gray-400 font-mono">
                    作者：{art.user.username} &nbsp;|&nbsp; 发布时间：{new Date(art.createdAt).toLocaleString()}
                  </div>
                </div>
                <Link href={`/articles/${art.id}`} className="bg-gray-100 text-gray-700 px-3.5 py-2 rounded text-xs font-bold hover:bg-gray-200 transition">
                  阅读文章 →
                </Link>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}