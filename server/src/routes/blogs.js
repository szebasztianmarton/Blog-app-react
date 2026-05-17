const express = require('express');
const db = require('../db');

const router = express.Router();

const selectAll = db.prepare(`
  SELECT b.id, b.title, b.body, b.author, b.blog_image AS blogImage,
         c.name AS category, b.created_at AS createdAt
  FROM blogs b
  JOIN categories c ON c.id = b.category_id
  ORDER BY b.id ASC
`);

const selectByCategory = db.prepare(`
  SELECT b.id, b.title, b.body, b.author, b.blog_image AS blogImage,
         c.name AS category, b.created_at AS createdAt
  FROM blogs b
  JOIN categories c ON c.id = b.category_id
  WHERE LOWER(c.name) = LOWER(?)
  ORDER BY b.id ASC
`);

const selectById = db.prepare(`
  SELECT b.id, b.title, b.body, b.author, b.blog_image AS blogImage,
         c.name AS category, b.created_at AS createdAt
  FROM blogs b
  JOIN categories c ON c.id = b.category_id
  WHERE b.id = ?
`);

const insertCategoryStmt = db.prepare('INSERT OR IGNORE INTO categories (name) VALUES (?)');
const getCategoryIdStmt  = db.prepare('SELECT id FROM categories WHERE name = ?');
const insertBlogStmt     = db.prepare(`
  INSERT INTO blogs (title, body, author, blog_image, category_id)
  VALUES (?, ?, ?, ?, ?)
`);

const deleteByIdStmt = db.prepare('DELETE FROM blogs WHERE id = ?');

router.get('/', (req, res) => {
  const { category } = req.query;
  const rows = category ? selectByCategory.all(category) : selectAll.all();
  res.json(rows);
});

router.get('/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'Ervenytelen id' });
  }
  const row = selectById.get(id);
  if (!row) return res.status(404).json({ error: 'Blog nem talalhato' });
  res.json(row);
});

router.post('/', (req, res) => {
  const { title, body, author, blogImage, category } = req.body || {};
  const missing = ['title', 'body', 'author', 'category'].filter(k => !req.body?.[k]?.trim?.());
  if (missing.length) {
    return res.status(400).json({ error: 'Hianyzo mezok', missing });
  }

  const create = db.transaction(() => {
    insertCategoryStmt.run(category);
    const { id: catId } = getCategoryIdStmt.get(category);
    const result = insertBlogStmt.run(title, body, author, blogImage || null, catId);
    return selectById.get(Number(result.lastInsertRowid));
  });

  const created = create();
  res.status(201).json(created);
});

router.delete('/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'Ervenytelen id' });
  }
  const info = deleteByIdStmt.run(id);
  if (info.changes === 0) return res.status(404).json({ error: 'Blog nem talalhato' });
  res.status(204).send();
});

module.exports = router;
