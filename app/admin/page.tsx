import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
export const dynamic = 'force-dynamic';
async function createProblem(formData: FormData) {
  'use server';
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== 'ADMIN') throw new Error('Unauthorized');

  const id = (formData.get('id') as string || '').trim().toUpperCase();
  const title = (formData.get('title') as string || '').trim();
  const difficulty = formData.get('difficulty') as string;
  const content = (formData.get('content') as string || '').trim();

  if (!id || !title || !content) return;

  await prisma.problem.create({ data: { id, title, difficulty, content } });
  revalidatePath('/problems');
  revalidatePath('/admin');
}

async function updateUserRole(formData: FormData) {
  'use server';
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== 'ADMIN') throw new Error('Unauthorized');

  const userId = formData.get('userId') as string;
  const role = formData.get('role') as string;
  if (!userId) return;

  await prisma.user.update({ where: { id: userId }, data: { role } });
  revalidatePath('/admin');
}

export default async function AdminPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== 'ADMIN') redirect('/');

  const users = await prisma.user.findMany({ orderBy: { createdAt: 'asc' } });

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
          <span className="text-xs font-bold text-gray-700">商业级管理控制台 (Admin Dashboard)</span>
        </header>

        <main className="p-6 max-w-7xl mx-auto w-full space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 space-y-4">
            <h2 className="text-xs font-bold text-gray-700 border-b border-gray-100 pb-2.5">发布新题目</h2>
            <form action={createProblem} className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block text-gray-500 mb-1">题号</label>
                <input type="text" name="id" placeholder="P1002" className="w-full border border-gray-200 rounded p-2 uppercase font-mono bg-gray-50/50" required />
              </div>
              <div className="md:col-span-2">
                <label className="block text-gray-500 mb-1">题目名称</label>
                <input type="text" name="title" placeholder="例如：A+B 升级版" className="w-full border border-gray-200 rounded p-2 bg-gray-50/50" required />
              </div>
              <div>
                <label className="block text-gray-500 mb-1">难度</label>
                <select name="difficulty" className="w-full border border-gray-200 rounded p-2 bg-gray-50/50 font-bold">
                  <option value="入门">入门</option>
                  <option value="普及-">普及-</option>
                  <option value="提高+/省选">提高+/省选</option>
                </select>
              </div>
              <div className="md:col-span-4">
                <label className="block text-gray-500 mb-1">题目描述</label>
                <textarea name="content" rows={3} placeholder="输入题目详情..." className="w-full border border-gray-200 rounded p-2.5 bg-gray-50/50 resize-none" required />
              </div>
              <div className="md:col-span-4 flex justify-end">
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded font-bold hover:bg-blue-700 transition">确认发布题目</button>
              </div>
            </form>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden space-y-3">
            <div className="p-5 border-b border-gray-100">
              <h2 className="text-xs font-bold text-gray-700">全站用户权限管理</h2>
            </div>
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-semibold">
                  <th className="py-3 px-4">用户名</th>
                  <th className="py-3 px-4">邮箱</th>
                  <th className="py-3 px-4">权限</th>
                  <th className="py-3 px-4 text-center">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-blue-50/30 transition">
                    <td className="py-3 px-4 font-bold text-gray-800">{u.username}</td>
                    <td className="py-3 px-4 font-mono text-gray-500">{u.email}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${u.role === 'ADMIN' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                        {u.role === 'ADMIN' ? '管理员' : '普通用户'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <form action={updateUserRole} className="inline-flex items-center gap-2">
                        <input type="hidden" name="userId" value={u.id} />
                        <select name="role" defaultValue={u.role} className="border border-gray-200 rounded px-2 py-1 text-[11px] bg-white font-bold">
                          <option value="USER">普通用户</option>
                          <option value="ADMIN">设为管理员</option>
                        </select>
                        <button type="submit" className="bg-gray-800 text-white px-2.5 py-1 rounded text-[11px]">更新</button>
                      </form>
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