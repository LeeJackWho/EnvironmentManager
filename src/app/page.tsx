import { redirect } from 'next/navigation';

export default function HomePage() {
  // 服务器端重定向到环境管理页面
  redirect('/environments');
}


