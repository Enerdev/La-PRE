require('dotenv').config();
const app = require('./src/app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`LA PRE backend escuchando en http://localhost:${PORT}`);
});
