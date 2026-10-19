'use client';
import { usePathname } from 'next/navigation';
import ChatSidebar from './ChatSidebar';

export default function ChatShell({ children }) {
  const pathname = usePathname();
  const listMode = pathname === '/chat';

  return (
    <div className="flex gap-3 h-[80vh] max-w-5xl mx-auto">
      <div
        className={`${listMode ? 'flex' : 'hidden'} md:flex w-full md:w-80 shrink-0 flex-col card overflow-hidden`}
      >
        <ChatSidebar />
      </div>
      <div className={`${listMode ? 'hidden' : 'flex'} md:flex flex-1 flex-col card overflow-hidden`}>
        {children}
      </div>
    </div>
  );
}