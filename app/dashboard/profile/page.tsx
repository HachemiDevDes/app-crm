import { cookies } from 'next/headers'
import { getDictionary } from '@/lib/i18n/dictionaries'
import ProfileClient from './ProfileClient'

export default async function ProfilePage() {
  const locale = cookies().get('NEXT_LOCALE')?.value || 'en'
  const dict = getDictionary(locale)

  return <ProfileClient dict={dict.profile} />
}
