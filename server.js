require('dotenv').config();
const express = require('express');
const bpjsRoute = require('./routes/bpjs');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

// DEFAULT ROUTE
app.get('/', (req, res) => {
  res.send('BPJS Checker API UP');
});

// BPJS ROUTE
app.use('/api/bpjs', bpjsRoute);

// RUN SERVER
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
