// app/page.tsx
import { redirect } from 'next/navigation';
import { DEFAULT_ZIP } from '@/lib/config';

export default function RootPage() {
  redirect(`/${DEFAULT_ZIP}`);
}
