const express = require('express');
const router = express.Router();
const { validatePassword } = require('../services/validation');

// Password strength API
router.post('/check-password', (req, res) => {
  const { password } = req.body;
  const result = validatePassword(password);
  res.json(result);
});

module.exports = router;
