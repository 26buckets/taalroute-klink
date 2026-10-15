import FirstBlock from '@/components/product/first-block';
import '../tas/tas.css';

export const metadata = { title: 'Zoek hetzelfde woord · Klink', robots: { index: false, follow: false } };

export default function Page() {
  return <FirstBlock key="word-match" wordMatching />;
}
