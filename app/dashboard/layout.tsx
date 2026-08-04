import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/Sidebar'
import { getDictionary } from '@/lib/i18n/dictionaries'
import LanguageToggle from '@/components/LanguageToggle'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const locale = cookies().get('NEXT_LOCALE')?.value || 'en'
  const dict = getDictionary(locale)

  return (
    <div className="app-shell">
      <Sidebar dict={dict.sidebar} />
      <main className="main-content">
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
          <LanguageToggle />
        </div>
        {children}
      </main>
    </div>
  )
}
