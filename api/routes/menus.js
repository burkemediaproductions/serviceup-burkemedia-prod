import express from 'express';
import { checkPermission } from '../middleware/checkPermission.js';

const router = express.Router();

function slugify(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

router.get('/', checkPermission('manage_content_types'), async (req, res) => {
  try {
    const { rows } = await req.db.query(
      `select id, label, slug, config, created_at, updated_at
         from public.menus
        order by label asc, created_at asc`
    );
    return res.json(rows);
  } catch (err) {
    console.error('[GET /api/menus]', err);
    return res.status(500).json({ error: 'Failed to load menus' });
  }
});

router.post('/', checkPermission('manage_content_types'), async (req, res) => {
  const label = String(req.body?.label || '').trim();
  if (!label) return res.status(400).json({ error: 'Menu label is required' });

  const baseSlug = slugify(req.body?.slug || label) || 'menu';

  try {
    let slug = baseSlug;
    let suffix = 1;
    while (true) {
      const existing = await req.db.query(
        'select 1 from public.menus where slug = $1 limit 1',
        [slug]
      );
      if (!existing.rows.length) break;
      suffix += 1;
      slug = `${baseSlug}-${suffix}`;
    }

    const { rows } = await req.db.query(
      `insert into public.menus (label, slug, config)
       values ($1, $2, $3::jsonb)
       returning id, label, slug, config, created_at, updated_at`,
      [label, slug, JSON.stringify({ items: [] })]
    );
    return res.status(201).json(rows[0]);
  } catch (err) {
    console.error('[POST /api/menus]', err);
    return res.status(500).json({ error: 'Failed to create menu' });
  }
});

export default router;
