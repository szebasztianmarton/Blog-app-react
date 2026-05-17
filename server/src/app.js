const express = require('express');
const cors = require('cors');
const path = require('path');

const blogsRouter = require('./routes/blogs');
const categoriesRouter = require('./routes/categories');

function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', ts: new Date().toISOString() });
  });

  app.use('/api/blogs', blogsRouter);
  app.use('/api/categories', categoriesRouter);

  const clientBuild = path.join(__dirname, '..', '..', 'build');
  app.use(express.static(clientBuild));
  app.get(/^\/(?!api).*/, (req, res, next) => {
    res.sendFile(path.join(clientBuild, 'index.html'), (err) => {
      if (err) next();
    });
  });

  app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: 'Belso szerver hiba' });
  });

  return app;
}

module.exports = { createApp };
