const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const { convertResponseToCamelCase, convertRequestToSnakeCase } = require('./middleware/caseConverters');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Import routes
const authRoutes = require('./routes/auth');
const practiceRoutes = require('./routes/practices');
const inventoryRoutes = require('./routes/inventories');
const productRoutes = require('./routes/products');

// Basic middlewares
app.use(morgan('dev'));
app.use(cors());
app.use(express.json());
app.use(convertRequestToSnakeCase);

// Middleware to convert response to camelCase
app.use((req, res, next) => {
  const originalJson = res.json;
  res.json = (data) => {
    const camelCaseData = convertResponseToCamelCase(data);
    return originalJson.call(res, camelCaseData);
  };
  next();
});

// Define a simple route for the root URL
app.get('/', (req, res) => {
  res.send('Server is running');
});

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api', practiceRoutes);
app.use('/api', inventoryRoutes);
app.use('/api', productRoutes);

// Start the server
app.listen(PORT, (error) => {
  if (!error)
    console.log("Server is Successfully Running, and App is listening on port " + PORT);
  else
    console.log("Error occurred, server can't start", error);
});
