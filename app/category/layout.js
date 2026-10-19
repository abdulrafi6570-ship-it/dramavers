export const dynamic = 'force-dynamic';

import { supabaseAdmin } from '../../lib/supabaseAdmin';
import CategoryTabs from '../../components/CategoryTabs';

export default async function CategoryLayout({ children }) {
  const db = supabaseAdmin();

  const { data: categories } = await db
    .from('categories')
    .select('id, name, slug')
    .order('sort_order', { ascending: true });

  return (
    <div className="space-y-6">
      <CategoryTabs categories={categories || []} />
      {children}
    </div>
  );
}