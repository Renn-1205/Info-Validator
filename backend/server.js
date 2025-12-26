// Load environment variables from .env file
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const express = require("express");
const cors = require("cors");
const path = require("path");

// Import routes
const passwordRoutes = require('./routes/password');
const employeeRoutes = require('./routes/employee');

const app = express();

// CORS configuration
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json());



// API info endpoint
app.get("/api", (req, res) => {
  res.json({
    message: "Employee Info Validator API is running!",
    endpoints: {
      "POST /check-password": "Check password strength",
      "POST /validate-name": "Validate full name",
      "POST /validate-email": "Validate email address",
      "POST /validate-phone": "Validate Cambodian phone number",
      "POST /validate-bio": "Validate short bio (basic)",
      "POST /validate-bio-ai": "Validate short bio with AI grammar check",
      "POST /validate-skills": "Validate skills",
      "POST /validate-all": "Validate all employee info at once",
      "GET /ai-status": "Get AI provider status"
    }
  });
});

// Use routes
app.use('/', passwordRoutes);
app.use('/', employeeRoutes);


const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;
