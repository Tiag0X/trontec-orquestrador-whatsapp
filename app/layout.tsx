import type { Metadata } from 'next';
import { Fira_Sans, Fira_Code } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/sonner";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarLayout } from "@/components/sidebar-layout";
import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth';

const firaSans = Fira_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-sans',
});

const firaCode = Fira_Code({
  subsets: ['latin'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'Trontec AI',
  description: 'Plataforma Inteligente de Gestão de Comunicações',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth')?.value;
  const payload = await decrypt(token);
  const userPermissions = payload?.permissions || [];

  return (
    <html lang="pt-BR" suppressHydrationWarning className={`${firaSans.variable} ${firaCode.variable}`}>
      <body className={firaSans.className}>
        <SidebarLayout sidebar={<AppSidebar userPermissions={userPermissions} />}>
          {children}
        </SidebarLayout>
        <Toaster />
      </body>
    </html>
  );
}
