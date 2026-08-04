import { cookies } from 'next/headers'
import { getDictionary } from '@/lib/i18n/dictionaries'
import ContactsClient from './ContactsClient'

export default async function ContactsPage() {
  const locale = cookies().get('NEXT_LOCALE')?.value || 'en'
  const dict = getDictionary(locale)

  return <ContactsClient dict={dict.contacts} />
}
