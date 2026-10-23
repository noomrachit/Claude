import { Link } from 'react-router-dom'
import { t } from '@/lib/strings'

export default function NotFoundPage() {
  return (
    <main className="p-8 text-center">
      <p className="mb-4">{t.notFound}</p>
      <Link to="/" className="text-blue-600 underline">{t.backHome}</Link>
    </main>
  )
}
