const { createApp } = require('./app');

const PORT = process.env.PORT || 4000;
const app = createApp();

app.listen(PORT, () => {
  console.log(`API futása: http://localhost:${PORT}`);
  console.log(`Egészség ellenőrzés: http://localhost:${PORT}/api/health`);
});
