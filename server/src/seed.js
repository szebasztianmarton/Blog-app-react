const fs = require('fs');
const path = require('path');
const db = require('./db');

const seedPath = path.join(__dirname, '..', '..', 'Data', 'db.json');
const raw = fs.readFileSync(seedPath, 'utf-8');
const { blogs } = JSON.parse(raw);

const insertCategory = db.prepare('INSERT OR IGNORE INTO categories (name) VALUES (?)');
const getCategoryId  = db.prepare('SELECT id FROM categories WHERE name = ?');
const insertBlog     = db.prepare(`
  INSERT INTO blogs (title, body, author, blog_image, category_id)
  VALUES (?, ?, ?, ?, ?)
`);

const seed = db.transaction((items) => {
  db.exec('DELETE FROM blogs; DELETE FROM categories;');
  for (const b of items) {
    insertCategory.run(b.category);
    const { id: catId } = getCategoryId.get(b.category);
    insertBlog.run(b.title, b.body, b.author, b.blogImage, catId);
  }
});

seed(blogs);
const count = db.prepare('SELECT COUNT(*) AS c FROM blogs').get().c;
console.log(`Seed kesz: ${count} blog beszurva.`);
