const express = require('express');
const router = express.Router();
const {
  validateFullName,
  validateEmail,
  validateCambodianPhone,
  validateBio,
  validateSkills,
  getStrengthText20,
  getStrengthColor20,
  getOverallStrengthText,
  getOverallStrengthColor
} = require('../services/validation');
const { analyzeWithAI, getAIProviderInfo } = require('../services/aiService');

// Full Name validation endpoint
router.post('/validate-name', (req, res) => {
  const { name } = req.body;
  const result = validateFullName(name);
  
  res.json({
    field: 'name',
    ...result,
    strengthText: getStrengthText20(result.score),
    strengthColor: getStrengthColor20(result.score)
  });
});

// Email validation endpoint
router.post('/validate-email', (req, res) => {
  const { email } = req.body;
  const result = validateEmail(email);
  
  res.json({
    field: 'email',
    ...result,
    strengthText: getStrengthText20(result.score),
    strengthColor: getStrengthColor20(result.score)
  });
});

// Phone validation endpoint
router.post('/validate-phone', (req, res) => {
  const { phone } = req.body;
  const result = validateCambodianPhone(phone);
  
  res.json({
    field: 'phone',
    ...result,
    strengthText: getStrengthText20(result.score),
    strengthColor: getStrengthColor20(result.score)
  });
});

// Bio validation endpoint
router.post('/validate-bio', (req, res) => {
  const { bio } = req.body;
  const result = validateBio(bio);
  
  res.json({
    field: 'bio',
    ...result,
    strengthText: getStrengthText20(result.score),
    strengthColor: getStrengthColor20(result.score)
  });
});

// AI-enhanced Bio validation endpoint
router.post('/validate-bio-ai', async (req, res) => {
  const { bio } = req.body;
  
  // First, get basic validation
  const basicResult = validateBio(bio);
  
  // If basic validation fails, return early
  if (!basicResult.valid || basicResult.score === 0) {
    return res.json({
      field: 'bio',
      ...basicResult,
      strengthText: getStrengthText20(basicResult.score),
      strengthColor: getStrengthColor20(basicResult.score),
      aiAnalysis: null
    });
  }
  
  try {
    // Get AI analysis
    const aiResult = await analyzeWithAI(bio);
    
    // Combine scores: basic validation (max 12) + AI (max 8)
    // Rescale basic score from 20 to 12
    const basicScoreScaled = Math.round((basicResult.score / 20) * 12);
    // AI score is out of 10, scale to 8
    const aiScoreScaled = aiResult.success ? Math.round((aiResult.score / 10) * 8) : 4;
    
    const combinedScore = Math.min(basicScoreScaled + aiScoreScaled, 20);
    
    // Add AI-specific warnings
    if (aiResult.success && aiResult.issues && aiResult.issues.length > 0) {
      const aiWarnings = aiResult.issues.slice(0, 3).map(issue => 
        `AI: ${issue.shortMessage || issue.message}${issue.suggestions?.length ? ` (try: "${issue.suggestions[0]}")` : ''}`
      );
      basicResult.warnings = [...(basicResult.warnings || []), ...aiWarnings];
    }
    
    res.json({
      field: 'bio',
      ...basicResult,
      score: combinedScore,
      strengthText: getStrengthText20(combinedScore),
      strengthColor: getStrengthColor20(combinedScore),
      aiAnalysis: aiResult.success ? {
        provider: aiResult.provider,
        issues: aiResult.issues,
        summary: aiResult.summary,
        aiScore: aiResult.score
      } : null
    });
  } catch (error) {
    // If AI fails, return basic result
    res.json({
      field: 'bio',
      ...basicResult,
      strengthText: getStrengthText20(basicResult.score),
      strengthColor: getStrengthColor20(basicResult.score),
      aiAnalysis: { error: error.message }
    });
  }
});

// Get AI provider info
router.get('/ai-status', (req, res) => {
  res.json(getAIProviderInfo());
});

// Skills validation endpoint
router.post('/validate-skills', (req, res) => {
  const { skills } = req.body;
  const result = validateSkills(skills);
  
  res.json({
    field: 'skills',
    ...result,
    strengthText: getStrengthText20(result.score),
    strengthColor: getStrengthColor20(result.score)
  });
});

// Validate all employee info at once
router.post('/validate-all', (req, res) => {
  const { name, email, phone, bio, skills } = req.body;
  
  const results = {
    name: { ...validateFullName(name), field: 'name' },
    email: { ...validateEmail(email), field: 'email' },
    phone: { ...validateCambodianPhone(phone), field: 'phone' },
    bio: { ...validateBio(bio), field: 'bio' },
    skills: { ...validateSkills(skills), field: 'skills' }
  };
  
  // Add strength text and color to each result
  Object.keys(results).forEach(key => {
    results[key].strengthText = getStrengthText20(results[key].score);
    results[key].strengthColor = getStrengthColor20(results[key].score);
  });
  
  // Calculate overall validity and score (total out of 100)
  const allFields = Object.values(results);
  const overallValid = allFields.every(r => r.valid);
  const totalScore = allFields.reduce((sum, r) => sum + r.score, 0);
  const maxPossibleScore = 100;
  
  res.json({
    results,
    summary: {
      valid: overallValid,
      score: totalScore,
      maxScore: maxPossibleScore,
      percentage: Math.round((totalScore / maxPossibleScore) * 100),
      strengthText: getOverallStrengthText(totalScore),
      strengthColor: getOverallStrengthColor(totalScore),
      validFields: allFields.filter(r => r.valid).length,
      totalFields: allFields.length
    }
  });
});

module.exports = router;
