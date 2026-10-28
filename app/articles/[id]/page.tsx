import { prisma } from '@/lib/prisma';
import { getCurrentUser, clearSessionCookie } from '@/lib/auth';
import { UserBadge } from '@/components/UserBadge';
import { revalidatePath } from 'next/cache';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

async function handleHeaderLogout() {
  'use server';
  await clearSessionCookie();
  revalidatePath('/');
}

// 发表评论的 Server Action
async function createComment(formData: FormData) {
  'use server';
  const currentUser = await getCurrentUser();
  if (!currentUser) return;

  const discussionId = formData.get('discussionId') as string;
  const content = (formData.get('content') as string || '').trim();

  if (!discussionId || !content) return;

  await prisma.comment.create({
    data: {
      content,
      discussionId,
      userId: currentUser.id,
    },
  });

  revalidatePath(`/articles/${discussionId}`);
}

export default async function ArticleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const currentUser = await getCurrentUser();

  const article = await prisma.discussion.findUnique({
    where: { id },
    include: {
      user: true,
      comments: {
        include: { user: true },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!article) notFound();

  return (
    <div className="min-h-screen bg-[#edf2f7] text-gray-800 flex font-sans antialiased">
      <aside className="w-14 bg-white border-r border-gray-200 flex flex-col items-center py-4 gap-6 fixed h-full z-20 shadow-2xs">
        <Link href="/" className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-black text-xs">Sky</Link>
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
          <div className="flex items-center gap-3 text-xs font-semibold">
            <Link href="/articles" className="text-blue-600 font-bold hover:underline">← 返回文章广场</Link>
            <span className="text-gray-300">|</span>
            <span className="text-gray-700">{article.title}</span>
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
          {/* 文章主体卡片 */}
          <div className="bg-white rounded-lg shadow-sm p-8 border border-gray-200 space-y-6">
            <div className="space-y-2 border-b border-gray-100 pb-4">
              <div className="flex items-center gap-3">
                {article.problemId && (
                  <span className="px-2.5 py-0.5 bg-blue-50 text-blue-600 rounded font-mono font-bold text-xs border border-blue-100">
                    {article.problemId}
                  </span>
                )}
                <h1 className="text-lg font-bold text-gray-900">{article.title}</h1>
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-400 font-mono">
                <span>作者：<Link href={`/users/${article.user.id}`} className="text-blue-600 hover:underline font-bold">{article.user.username}</Link></span>
                <span>发布于：{new Date(article.createdAt).toLocaleString()}</span>
              </div>
            </div>

            {/* Markdown与数学公式解析渲染 */}
            <div className="text-xs text-gray-700 leading-relaxed prose prose-sm max-w-none">
              <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                {article.content}
              </ReactMarkdown>
            </div>
          </div>

          {/* 评论与互动专区 */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 space-y-6">
            <h2 className="text-xs font-bold text-gray-700 border-b border-gray-100 pb-3 flex items-center gap-2">
              <span className="w-2 h-4 bg-purple-600 rounded-full inline-block"></span>
              讨论与评论 ({article.comments.length})
            </h2>

            {/* 评论列表 */}
            <div className="space-y-4">
              {article.comments.length === 0 ? (
                <p className="text-xs text-gray-400 py-4 text-center">暂无评论，快来发表你的见解吧！</p>
              ) : (
                article.comments.map((comment) => (
                  <div key={comment.id} className="p-4 bg-gray-50 rounded border border-gray-100 space-y-2 text-xs">
                    <div className="flex justify-between items-center text-gray-400 font-mono text-[11px]">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-700">{comment.user.username}</span>
                        <UserBadge username={comment.user.username} role={comment.user.role} />
                      </div>
                      <span>{new Date(comment.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{comment.content}</p>
                  </div>
                ))
              )}
            </div>

            {/* 发表评论表单 */}
            {currentUser ? (
              <form action={createComment} className="space-y-3 pt-4 border-t border-gray-100 text-xs">
                <input type="hidden" name="discussionId" value={article.id} />
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">发表你的评论</label>
                  <textarea
                    name="content"
                    rows={3}
                    placeholder="支持友善交流、探讨解题思路..."
                    className="w-full border border-gray-200 rounded p-3 bg-gray-50/50 resize-none font-sans"
                    required
                  />
                </div>
                <div className="flex justify-end">
                  <button type="submit" className="bg-blue-600 text-white px-5 py-2 rounded font-bold hover:bg-blue-700 transition shadow-2xs">
                    提交评论
                  </button>
                </div>
              </form>
            ) : (
              <div className="py-4 text-center border-t border-gray-100">
                <p className="text-xs text-gray-400">请先 <Link href="/auth?mode=login" className="text-blue-600 font-bold hover:underline">登录</Link> 后参与评论互动</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}