// AI Service for Bio Validation
// Supports: OpenAI, Google Gemini, and LanguageTool (free)

const https = require('https');
const http = require('http');

// Configuration - Set your preferred AI provider and API key
const AI_CONFIG = {
  // Options: 'openai', 'gemini', 'languagetool' (free, no key needed)
  provider: process.env.AI_PROVIDER || 'languagetool',
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    model: 'gpt-3.5-turbo'
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
    model: 'gemini-2.0-flash'
  }
};

// ==================== LANGUAGETOOL (FREE) ====================

async function checkWithLanguageTool(text) {
  return new Promise((resolve, reject) => {
    const postData = `text=${encodeURIComponent(text)}&language=en-US`;
    
    const options = {
      hostname: 'api.languagetool.org',
      port: 443,
      path: '/v2/check',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          const issues = result.matches.map(match => ({
            message: match.message,
            shortMessage: match.shortMessage || match.rule.description,
            context: match.context.text.substring(match.context.offset, match.context.offset + match.context.length),
            suggestions: match.replacements.slice(0, 3).map(r => r.value),
            category: match.rule.category.name,
            type: match.rule.issueType
          }));
          
          resolve({
            success: true,
            provider: 'LanguageTool',
            issues,
            summary: generateSummary(issues, text),
            score: calculateAIScore(issues, text)
          });
        } catch (e) {
          reject(new Error('Failed to parse LanguageTool response'));
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// ==================== OPENAI ====================

async function checkWithOpenAI(text) {
  if (!AI_CONFIG.openai.apiKey) {
    throw new Error('OpenAI API key not configured');
  }

  return new Promise((resolve, reject) => {
    const prompt = `Analyze this bio text for grammar, spelling, clarity, and professionalism. Return a JSON response with:
- issues: array of {type, message, suggestion}
- overallQuality: "excellent", "good", "fair", or "poor"
- suggestions: array of improvement tips
- tone: detected tone (professional, casual, etc.)

Bio text: "${text}"

Respond only with valid JSON.`;

    const postData = JSON.stringify({
      model: AI_CONFIG.openai.model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3
    });

    const options = {
      hostname: 'api.openai.com',
      port: 443,
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AI_CONFIG.openai.apiKey}`
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result.error) {
            reject(new Error(result.error.message));
            return;
          }
          
          const content = result.choices[0].message.content;
          const analysis = JSON.parse(content);
          
          resolve({
            success: true,
            provider: 'OpenAI',
            issues: analysis.issues || [],
            summary: analysis,
            score: mapQualityToScore(analysis.overallQuality)
          });
        } catch (e) {
          reject(new Error('Failed to parse OpenAI response'));
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// ==================== GOOGLE GEMINI ====================

async function checkWithGemini(text) {
  if (!AI_CONFIG.gemini.apiKey) {
    throw new Error('Gemini API key not configured');
  }

  return new Promise((resolve, reject) => {
    const prompt = `You are a strict professional bio reviewer. Analyze this bio text for a job application or professional profile.

Evaluate these criteria:
1. PROFESSIONALISM: Is the language appropriate for a workplace? Filler words like "blah", "haha", "lol", slang, or nonsense text is UNPROFESSIONAL.
2. GRAMMAR & SPELLING: Check for errors, missing punctuation, capitalization issues.
3. CLARITY: Is it clear and meaningful? Vague or meaningless content should be flagged.
4. STRUCTURE: Does it have proper sentences? Is it well-organized?
5. CONTENT QUALITY: Does it actually describe the person professionally?

Be STRICT in your evaluation. A bio with filler words, nonsense, or unprofessional language should be rated "poor" or "fair", NOT "excellent" or "good".

Return a JSON response with:
- issues: array of {type: "grammar"|"professionalism"|"clarity"|"structure", message: string, suggestion: string}
- overallQuality: "excellent" (perfect professional bio), "good" (minor issues), "fair" (needs improvement), or "poor" (unprofessional/inappropriate)
- suggestions: array of improvement tips
- tone: detected tone (professional, casual, unprofessional, etc.)
- isProfessional: boolean (true only if suitable for a job application)

Bio text: "${text}"

Respond ONLY with valid JSON, no markdown code blocks.`;

    const postData = JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }]
    });

    const options = {
      hostname: 'generativelanguage.googleapis.com',
      port: 443,
      path: `/v1beta/models/${AI_CONFIG.gemini.model}:generateContent?key=${AI_CONFIG.gemini.apiKey}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result.error) {
            console.error('Gemini API Error:', result.error);
            reject(new Error(result.error.message || 'Gemini API error'));
            return;
          }
          
          if (!result.candidates || !result.candidates[0]) {
            console.error('Gemini response missing candidates:', data);
            reject(new Error('Invalid Gemini response structure'));
            return;
          }
          
          const content = result.candidates[0].content.parts[0].text;
          // Remove markdown code blocks if present
          const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
          
          let analysis;
          try {
            analysis = JSON.parse(cleanContent);
          } catch (parseError) {
            console.error('Failed to parse Gemini JSON:', cleanContent);
            reject(new Error('Failed to parse Gemini response as JSON'));
            return;
          }
          
          resolve({
            success: true,
            provider: 'Google Gemini',
            issues: analysis.issues || [],
            summary: analysis,
            score: mapQualityToScore(analysis.overallQuality),
            isProfessional: analysis.isProfessional
          });
        } catch (e) {
          console.error('Gemini processing error:', e.message, data);
          reject(new Error('Failed to process Gemini response'));
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// ==================== HELPER FUNCTIONS ====================

// Check for unprofessional content patterns
function checkProfessionalism(text) {
  const issues = [];
  const lowerText = text.toLowerCase();
  
  // Filler words and nonsense
  const fillerPatterns = [
    { pattern: /\b(blah|bleh|meh)\b/gi, issue: 'Contains filler words' },
    { pattern: /\b(haha|hehe|lol|lmao|rofl)\b/gi, issue: 'Contains informal laughter' },
    { pattern: /\b(um+|uh+|er+|hmm+)\b/gi, issue: 'Contains verbal fillers' },
    { pattern: /\b(stuff|things|whatever)\b/gi, issue: 'Contains vague words' },
    { pattern: /(.)\1{3,}/gi, issue: 'Contains repeated characters' },
    { pattern: /\b(test|testing|asdf|qwerty)\b/gi, issue: 'Contains test/placeholder text' },
  ];
  
  // Unprofessional language
  const unprofessionalPatterns = [
    { pattern: /\b(awesome|cool|dude|bro|gonna|wanna|gotta|kinda|sorta)\b/gi, issue: 'Contains overly casual language' },
    { pattern: /!{2,}/g, issue: 'Contains excessive exclamation marks' },
    { pattern: /\?{2,}/g, issue: 'Contains excessive question marks' },
  ];
  
  fillerPatterns.forEach(({ pattern, issue }) => {
    if (pattern.test(text)) {
      issues.push({ type: 'professionalism', message: issue, severity: 'high' });
    }
  });
  
  unprofessionalPatterns.forEach(({ pattern, issue }) => {
    if (pattern.test(text)) {
      issues.push({ type: 'professionalism', message: issue, severity: 'medium' });
    }
  });
  
  // Check for very short or repetitive content
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const uniqueWords = new Set(words.map(w => w.toLowerCase()));
  
  if (uniqueWords.size < words.length * 0.5 && words.length > 5) {
    issues.push({ type: 'content', message: 'Contains too much repetition', severity: 'high' });
  }
  
  if (words.length < 10) {
    issues.push({ type: 'content', message: 'Bio is too brief for a professional profile', severity: 'medium' });
  }
  
  return issues;
}

function generateSummary(issues, text) {
  const categories = {};
  issues.forEach(issue => {
    categories[issue.category] = (categories[issue.category] || 0) + 1;
  });
  
  // Check for professionalism issues
  const professionalismIssues = checkProfessionalism(text);
  const allIssues = [...issues, ...professionalismIssues];
  
  const highSeverityCount = professionalismIssues.filter(i => i.severity === 'high').length;
  const totalIssueCount = allIssues.length;
  
  let overallQuality = 'excellent';
  if (highSeverityCount > 0) overallQuality = 'poor';
  else if (totalIssueCount > 5) overallQuality = 'poor';
  else if (totalIssueCount > 3) overallQuality = 'fair';
  else if (totalIssueCount > 0) overallQuality = 'good';
  
  return {
    totalIssues: totalIssueCount,
    categories,
    overallQuality,
    professionalismIssues,
    suggestions: allIssues.slice(0, 5).map(i => i.message)
  };
}

function calculateAIScore(issues, text) {
  // Start with max 10 points (AI contributes up to 10 points)
  let score = 10;
  
  // Check for professionalism issues first
  const professionalismIssues = checkProfessionalism(text);
  const highSeverityCount = professionalismIssues.filter(i => i.severity === 'high').length;
  
  // Heavy penalty for unprofessional content
  if (highSeverityCount > 0) {
    score = Math.max(2, score - (highSeverityCount * 3));
  }
  
  // Deduct points based on grammar issues
  const issueCount = issues.length;
  if (issueCount === 0) score = Math.min(score, 10);
  else if (issueCount <= 2) score = Math.min(score, 8);
  else if (issueCount <= 4) score = Math.min(score, 6);
  else if (issueCount <= 6) score = Math.min(score, 4);
  else score = Math.min(score, 2);
  
  // Bonus for longer, well-written text (only if no professionalism issues)
  const wordCount = text.split(/\s+/).length;
  if (wordCount >= 20 && issueCount === 0 && highSeverityCount === 0) {
    score = 10;
  }
  
  return Math.max(0, score);
}

function mapQualityToScore(quality) {
  const mapping = {
    'excellent': 10,
    'good': 8,
    'fair': 5,
    'poor': 2
  };
  return mapping[quality?.toLowerCase()] || 5;
}

// ==================== MAIN FUNCTION ====================

async function analyzeWithAI(text) {
  if (!text || text.trim().length < 10) {
    return {
      success: false,
      error: 'Text too short for AI analysis',
      score: 0
    };
  }

  try {
    switch (AI_CONFIG.provider) {
      case 'openai':
        return await checkWithOpenAI(text);
      case 'gemini':
        return await checkWithGemini(text);
      case 'languagetool':
      default:
        return await checkWithLanguageTool(text);
    }
  } catch (error) {
    console.error('AI Analysis Error:', error.message);
    
    // Fallback to LanguageTool if primary provider fails
    if (AI_CONFIG.provider !== 'languagetool') {
      try {
        console.log('Falling back to LanguageTool...');
        return await checkWithLanguageTool(text);
      } catch (fallbackError) {
        return {
          success: false,
          error: fallbackError.message,
          score: 0
        };
      }
    }
    
    return {
      success: false,
      error: error.message,
      score: 0
    };
  }
}

// Get current AI provider info
function getAIProviderInfo() {
  return {
    currentProvider: AI_CONFIG.provider,
    available: {
      languagetool: true, // Always available (free)
      openai: !!AI_CONFIG.openai.apiKey,
      gemini: !!AI_CONFIG.gemini.apiKey
    }
  };
}

module.exports = {
  analyzeWithAI,
  getAIProviderInfo,
  AI_CONFIG
};
