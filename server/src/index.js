const { createApp } = require('./app');

const PORT = process.env.PORT || 4000;
const app = createApp();

app.listen(PORT, () => {
  console.log(`API fut: http://localhost:${PORT}`);
  console.log(`Egeszseg: http://localhost:${PORT}/api/health`);
});
