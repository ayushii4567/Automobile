const express = require('express');
const cors = require('cors');
const path = require('path');
const apiRouter = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Static files for uploaded documents and assets
app.use('/data', express.static(path.join(__dirname, 'data')));

// Mount central API router for all 23 modules
app.use('/api', apiRouter);

// Root greeting & status
app.get('/', (req, res) => {
  res.json({
    name: 'Apex Horizon Motors Dealership API',
    status: 'online',
    version: '2.0.0',
    documentation: '/api/health'
  });
});

app.listen(PORT, () => {
  console.log(`🚗 Apex Horizon Auto Showroom Server running on port ${PORT} [SQLite Connected]`);
});
