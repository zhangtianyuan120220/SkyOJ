import Link from 'next/link';

interface SidebarProps {
  role?: string;
  active?: string;
}

export function Sidebar({ role, active }: SidebarProps) {
  return (
    <aside className="w-14 bg-white border-r border-gray-200 flex flex-col items-center py-4 gap-6 fixed h-full z-20 shadow-2xs">
      <Link href="/" className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-black text-xs shadow-xs hover:opacity-90">
        Sky
      </Link>
      <nav className="flex flex-col gap-5 text-gray-400 text-sm">
        <Link href="/" title="首页" className={`hover:text-blue-600 transition ${active === 'home' ? 'text-blue-600 font-bold' : ''}`}>🏠</Link>
        <Link href="/problems" title="题库" className={`hover:text-blue-600 transition ${active === 'problems' ? 'text-blue-600 font-bold' : ''}`}>📚</Link>
        <Link href="/articles" title="文章广场" className={`hover:text-blue-600 transition ${active === 'articles' ? 'text-blue-600 font-bold' : ''}`}>📖</Link>
        <Link href="/ranklist" title="排名" className={`hover:text-blue-600 transition ${active === 'ranklist' ? 'text-blue-600 font-bold' : ''}`}>🎯</Link>
        <Link href="/contests" title="比赛" className={`hover:text-blue-600 transition ${active === 'contests' ? 'text-blue-600 font-bold' : ''}`}>🏆</Link>
        <Link href="/submissions" title="评测记录" className={`hover:text-blue-600 transition ${active === 'submissions' ? 'text-blue-600 font-bold' : ''}`}>📊</Link>
        <Link href="/discussions" title="讨论" className={`hover:text-blue-600 transition ${active === 'discussions' ? 'text-blue-600 font-bold' : ''}`}>💬</Link>
        <Link href="/tickets" title="工单反馈" className={`hover:text-blue-600 transition ${active === 'tickets' ? 'text-blue-600 font-bold' : ''}`}>🎫</Link>
        {role === 'ADMIN' && (
          <Link href="/admin" title="管理后台" className={`hover:text-blue-600 transition ${active === 'admin' ? 'text-blue-600 font-bold' : ''}`}>🛡️</Link>
        )}
        <Link href="/settings" title="设置" className={`hover:text-blue-600 transition ${active === 'settings' ? 'text-blue-600 font-bold' : ''}`}>⚙️</Link>
      </nav>
    </aside>
  );
}