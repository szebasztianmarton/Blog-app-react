const path = require('path');
const { DatabaseSync } = require('node:sqlite');
const dbPath = path.join(__dirname, 'server', 'data', 'blog.db');
const db = new DatabaseSync(dbPath);
const rows = db.prepare('SELECT blogs.id, title, author, name AS category, created_at FROM blogs JOIN categories ON blogs.category_id = categories.id ORDER BY blogs.id').all();
for (const row of rows) {
  console.log(`${row.id}|${row.title}|${row.author}|${row.category}|${row.created_at}`);
}
