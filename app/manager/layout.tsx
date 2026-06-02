import { redirect } from 'next/navigation';
import { getAuthFromCookies } from '@/lib/auth';

export default async function ManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = await getAuthFromCookies();

  if (!auth) {
    redirect('/login');
  }

  if (auth.role !== 'manager' && auth.role !== 'admin') {
    redirect('/employee');
  }

  return <>{children}</>;
}