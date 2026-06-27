import type { Metadata } from 'next'
import SearchView from '@/components/chat/SearchView'

export const metadata: Metadata = {
  title: 'Search | ChatSpace',
  robots: { index: false, follow: false },
}

export default function SearchPage() {
  return <SearchView />
}
