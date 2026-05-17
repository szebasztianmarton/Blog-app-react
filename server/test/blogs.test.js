const path = require('path');
const fs = require('fs');
const os = require('os');

const TEST_DB = path.join(os.tmpdir(), `blog-test-${process.pid}.db`);
process.env.DB_PATH = TEST_DB;
fs.rmSync(TEST_DB, { force: true });

const request = require('supertest');
const { expect } = require('chai');
const db = require('../src/db');
const { createApp } = require('../src/app');

const app = createApp();

function seed() {
  db.exec('DELETE FROM blogs; DELETE FROM categories;');
  const cat = db.prepare('INSERT INTO categories (name) VALUES (?)');
  const blog = db.prepare(
    'INSERT INTO blogs (title, body, author, blog_image, category_id) VALUES (?, ?, ?, ?, ?)'
  );
  cat.run('technology');
  cat.run('sports');
  const techId   = db.prepare('SELECT id FROM categories WHERE name = ?').get('technology').id;
  const sportsId = db.prepare('SELECT id FROM categories WHERE name = ?').get('sports').id;
  blog.run('Bevezetes a React-be', 'React lecke szovege...', 'Anna', 'https://example.com/a.jpg', techId);
  blog.run('Foci VB 2026',          'Sport hirek szovege...', 'Bela', 'https://example.com/b.jpg', sportsId);
}

describe('Blog API integracios tesztek', () => {
  beforeEach(() => seed());
  after(() => {
    db.close();
    fs.rmSync(TEST_DB, { force: true });
  });

  describe('GET /api/health', () => {
    it('200-as statussal valaszol', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).to.equal(200);
      expect(res.body.status).to.equal('ok');
      expect(res.body.ts).to.be.a('string');
    });
  });

  describe('GET /api/blogs', () => {
    it('visszaadja az osszes blogot', async () => {
      const res = await request(app).get('/api/blogs');
      expect(res.status).to.equal(200);
      expect(res.body).to.be.an('array').with.lengthOf(2);
      expect(res.body[0]).to.include.keys('id', 'title', 'body', 'author', 'category', 'blogImage');
    });

    it('szuri a blogokat kategoria szerint', async () => {
      const res = await request(app).get('/api/blogs?category=sports');
      expect(res.status).to.equal(200);
      expect(res.body).to.have.lengthOf(1);
      expect(res.body[0].category).to.equal('sports');
    });

    it('uresen ter vissza ha nincs blog', async () => {
      db.exec('DELETE FROM blogs');
      const res = await request(app).get('/api/blogs');
      expect(res.status).to.equal(200);
      expect(res.body).to.deep.equal([]);
    });
  });

  describe('GET /api/blogs/:id', () => {
    it('visszaadja a megadott blogot', async () => {
      const { id } = db.prepare('SELECT id FROM blogs LIMIT 1').get();
      const res = await request(app).get(`/api/blogs/${id}`);
      expect(res.status).to.equal(200);
      expect(res.body.id).to.equal(id);
    });

    it('404-et ad nem letezo id-ra', async () => {
      const res = await request(app).get('/api/blogs/99999');
      expect(res.status).to.equal(404);
    });

    it('400-at ad ervenytelen id-ra', async () => {
      const res = await request(app).get('/api/blogs/abc');
      expect(res.status).to.equal(400);
    });
  });

  describe('POST /api/blogs', () => {
    it('uj blogot hoz letre es visszaadja 201-gyel', async () => {
      const payload = {
        title: 'Uj bejegyzes',
        body: 'A bejegyzes torzse...',
        author: 'Csaba',
        category: 'travel',
        blogImage: 'https://example.com/c.jpg',
      };
      const res = await request(app).post('/api/blogs').send(payload);
      expect(res.status).to.equal(201);
      expect(res.body).to.include({
        title: payload.title,
        author: payload.author,
        category: payload.category,
      });
      expect(res.body.id).to.be.a('number');

      const all = await request(app).get('/api/blogs');
      expect(all.body).to.have.lengthOf(3);
    });

    it('400-at ad ha hianyzik kotelezo mezo', async () => {
      const res = await request(app).post('/api/blogs').send({ title: 'csak cim' });
      expect(res.status).to.equal(400);
      expect(res.body.missing).to.include.members(['body', 'author', 'category']);
    });

    it('uj kategoriat is letre tud hozni', async () => {
      const res = await request(app).post('/api/blogs').send({
        title: 'Kerteszkedes',
        body: '...',
        author: 'Eva',
        category: 'garden',
      });
      expect(res.status).to.equal(201);
      expect(res.body.category).to.equal('garden');
    });
  });

  describe('DELETE /api/blogs/:id', () => {
    it('torli a blogot es 204-et ad', async () => {
      const { id } = db.prepare('SELECT id FROM blogs LIMIT 1').get();
      const res = await request(app).delete(`/api/blogs/${id}`);
      expect(res.status).to.equal(204);
      const check = await request(app).get(`/api/blogs/${id}`);
      expect(check.status).to.equal(404);
    });

    it('404-et ad nem letezo id-ra', async () => {
      const res = await request(app).delete('/api/blogs/99999');
      expect(res.status).to.equal(404);
    });
  });
});

describe('Kategoria API', () => {
  beforeEach(() => seed());

  describe('GET /api/categories', () => {
    it('visszaadja a kategoriakat blogszamokkal', async () => {
      const res = await request(app).get('/api/categories');
      expect(res.status).to.equal(200);
      expect(res.body).to.be.an('array').with.length.greaterThanOrEqual(2);
      const tech = res.body.find(c => c.name === 'technology');
      expect(tech).to.exist;
      expect(tech.blogCount).to.equal(1);
    });
  });
});
