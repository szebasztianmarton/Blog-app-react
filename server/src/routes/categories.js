const express = require('express');
const db = require('../db');

const router = express.Router();

const selectAll = db.prepare(`
  SELECT c.id, c.name, COUNT(b.id) AS blogCount
  FROM categories c
  LEFT JOIN blogs b ON b.category_id = c.id
  GROUP BY c.id
  ORDER BY c.name ASC
`);

router.get('/', (req, res) => {
  res.json(selectAll.all());
});

module.exports = router;
