import { cookies } from 'next/headers'
import { getDictionary } from '@/lib/i18n/dictionaries'
import PipelineClient from './PipelineClient'

export default async function PipelinePage() {
  const locale = cookies().get('NEXT_LOCALE')?.value || 'en'
  const dict = getDictionary(locale)

  return <PipelineClient dict={dict.pipeline} />
}
