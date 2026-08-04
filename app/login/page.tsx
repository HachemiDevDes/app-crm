import { cookies } from 'next/headers'
import { getDictionary } from '@/lib/i18n/dictionaries'
import LoginClient from './LoginClient'

export default async function LoginPage() {
  const locale = cookies().get('NEXT_LOCALE')?.value || 'en'
  const dict = getDictionary(locale)

  return <LoginClient dict={dict.login} />
}
