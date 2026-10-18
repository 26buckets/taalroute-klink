import { ManualNavigation } from '@/components/product/manual-navigation';
import chapters from '@/data/klink-teacher-manual.json';
import './wiki.css';

export default function ManualLayout({ children }: { children: React.ReactNode }) {
  return <div className="teacher-manual manual-wiki"><ManualNavigation chapters={chapters.map(({ id, title }) => ({ id, title }))} /><main className="wiki-main" id="wiki-inhoud" tabIndex={-1}>{children}</main></div>;
}
