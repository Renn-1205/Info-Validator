const {
  commonWords,
  legitimateEmailProviders,
  disposableEmailProviders,
  cambodianMobilePrefixes,
  cambodianLandlinePrefixes,
  cambodianCarriers,
  strengthConfig
} = require('../config/constants');

// ==================== PASSWORD VALIDATION ====================

function hasSequentialChars(password) {
  const sequences = ['abcdefghijklmnopqrstuvwxyz', 'zyxwvutsrqponmlkjihgfedcba', '0123456789', '9876543210'];
  const lowerPass = password.toLowerCase();

  for (let seq of sequences) {
    for (let i = 0; i <= seq.length - 3; i++) {
      const substring = seq.substring(i, i + 3);
      if (lowerPass.includes(substring)) {
        return true;
      }
    }
  }
  return false;
}

function hasRepeatedChars(password) {
  for (let i = 0; i < password.length - 2; i++) {
    if (password[i] === password[i + 1] && password[i] === password[i + 2]) {
      return true;
    }
  }
  return false;
}

function containsCommonWord(password) {
  const lowerPass = password.toLowerCase();
  return commonWords.some(word => lowerPass.includes(word));
}

function validatePassword(password) {
  if (!password) {
    return {
      strength: 0,
      strengthText: 'None',
      strengthColor: '#666666',
      requirements: {
        length: false,
        uppercase: false,
        lowercase: false,
        numbers: false,
        special: false,
        noSequence: true,
        noRepeat: true,
        noCommon: true
      },
      analysis: {
        length: 0,
        charTypes: 0,
        complexity: 'Low'
      }
    };
  }

  let strength = 0;

  const requirements = {
    length: password.length >= 12,
    uppercase: (password.match(/[A-Z]/g) || []).length >= 2,
    lowercase: (password.match(/[a-z]/g) || []).length >= 2,
    numbers: (password.match(/[0-9]/g) || []).length >= 2,
    special: (password.match(/[^A-Za-z0-9]/g) || []).length >= 2,
    noSequence: !hasSequentialChars(password),
    noRepeat: !hasRepeatedChars(password),
    noCommon: !containsCommonWord(password)
  };

  if (requirements.length) strength += 2;
  if (requirements.uppercase) strength += 1;
  if (requirements.lowercase) strength += 1;
  if (requirements.numbers) strength += 1;
  if (requirements.special) strength += 1;
  if (requirements.noSequence) strength += 1;
  if (requirements.noRepeat) strength += 1;
  if (requirements.noCommon) strength += 2;

  if (password.length >= 16) strength += 1;
  if (password.length >= 20) strength += 1;

  const charTypes = [
    /[A-Z]/.test(password),
    /[a-z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password)
  ].filter(Boolean).length;

  if (charTypes === 4) strength += 1;
  strength = Math.min(strength, 10);

  const config = strengthConfig[strength] || strengthConfig[0];

  let complexity = 'Low';
  if (strength >= 7) complexity = 'High';
  else if (strength >= 4) complexity = 'Medium';

  return {
    strength,
    strengthText: config.text,
    strengthColor: config.color,
    requirements,
    analysis: {
      length: password.length,
      charTypes,
      complexity
    }
  };
}

// ==================== NAME VALIDATION ====================

function validateFullName(name) {
  const errors = [];
  const warnings = [];
  let score = 0;
  
  if (!name || name.trim().length === 0) {
    errors.push('Name is required');
    return { valid: false, score: 0, maxScore: 20, errors, warnings: [], details: {} };
  }
  
  const trimmedName = name.trim();
  const parts = trimmedName.split(/\s+/);
  
  // Base score: 4 points for providing a name
  score = 4;
  
  // Length check: +4 points for reasonable length (2+ chars)
  if (trimmedName.length >= 2) {
    score += 4;
  } else {
    warnings.push('Name seems too short');
  }
  
  // Full name check: +4 points for first and last name
  if (parts.length >= 2) {
    score += 4;
  } else {
    warnings.push('Consider providing both first and last name');
  }
  
  // Valid characters check: +4 points for valid name characters
  const validNamePattern = /^[a-zA-Z\u00C0-\u024F\u1780-\u17FF\s\-'\.]+$/;
  if (validNamePattern.test(trimmedName)) {
    score += 4;
  } else {
    warnings.push('Name contains unusual characters');
  }
  
  // Proper capitalization check: +4 points
  const hasProperCapitalization = parts.every(part => 
    part.length > 0 && part[0] === part[0].toUpperCase()
  );
  if (hasProperCapitalization) {
    score += 4;
  } else {
    warnings.push('Names should start with uppercase letters');
  }
  
  // Penalty for numbers in name
  if (/\d/.test(trimmedName)) {
    warnings.push('Name contains numbers');
    score = Math.max(0, score - 4);
  }
  
  return {
    valid: score >= 8,
    score: Math.min(score, 20),
    maxScore: 20,
    errors,
    warnings,
    details: {
      length: trimmedName.length,
      parts: parts.length,
      firstName: parts[0] || '',
      lastName: parts.length > 1 ? parts[parts.length - 1] : ''
    }
  };
}

// ==================== EMAIL VALIDATION ====================

function validateEmail(email) {
  const errors = [];
  const warnings = [];
  let score = 0;
  
  if (!email || email.trim().length === 0) {
    errors.push('Email is required');
    return { valid: false, score: 0, maxScore: 20, errors, warnings: [], details: {} };
  }
  
  const trimmedEmail = email.trim().toLowerCase();
  
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(trimmedEmail)) {
    errors.push('Invalid email format');
    return { valid: false, score: 0, maxScore: 20, errors, warnings, details: {} };
  }
  
  // Base score: 8 points for valid email format
  score = 8;
  
  const [localPart, domain] = trimmedEmail.split('@');
  const domainParts = domain.split('.');
  const tld = domainParts[domainParts.length - 1];
  
  // Disposable email check: penalty
  if (disposableEmailProviders.some(d => domain.includes(d) || domain === d)) {
    warnings.push('Disposable/temporary email detected');
    score = Math.max(0, score - 4);
  }
  
  const isLegitProvider = legitimateEmailProviders.some(provider => {
    if (provider.includes('.')) {
      return domain === provider || domain.endsWith('.' + provider);
    }
    return domain.endsWith('.' + provider);
  });
  
  const isEducational = tld === 'edu' || domain.endsWith('.edu') || 
    domain.endsWith('.ac.uk') || domain.endsWith('.edu.au') || domain.endsWith('.edu.kh');
  
  const isBusinessDomain = domainParts.length >= 2 && 
    domainParts[0].length >= 2 && 
    tld.length >= 2 && tld.length <= 6;
  
  // Provider type scoring: +6 points for legitimate, +4 for educational, +2 for business
  if (isLegitProvider) {
    score += 6;
  } else if (isEducational) {
    warnings.push('Educational email detected');
    score += 4;
  } else if (isBusinessDomain) {
    warnings.push('Custom/business domain');
    score += 2;
  } else {
    warnings.push('Unknown email provider');
  }
  
  // Username length check: +4 points for reasonable length
  if (localPart.length >= 3) {
    score += 4;
  } else {
    warnings.push('Email username is very short');
  }
  
  // Test/temp email check: +2 points for non-test emails
  if (/^(test|spam|fake|temp|noreply|no-reply)/.test(localPart)) {
    warnings.push('Email appears to be a test/temporary address');
  } else {
    score += 2;
  }
  
  return {
    valid: score >= 8,
    score: Math.min(score, 20),
    maxScore: 20,
    errors,
    warnings,
    details: {
      localPart,
      domain,
      tld,
      isLegitProvider,
      isEducational,
      isBusinessDomain
    }
  };
}

// ==================== PHONE VALIDATION ====================

function validateCambodianPhone(phone) {
  const errors = [];
  const warnings = [];
  let score = 0;
  
  if (!phone || phone.trim().length === 0) {
    errors.push('Phone number is required');
    return { valid: false, score: 0, maxScore: 20, errors, warnings: [], details: {} };
  }
  
  let cleanPhone = phone.replace(/[\s\-\(\)\.\+]/g, '');
  
  if (!/^\d+$/.test(cleanPhone)) {
    errors.push('Phone number should contain only digits');
    return { valid: false, score: 0, maxScore: 20, errors, warnings, details: { cleanPhone } };
  }
  
  if (cleanPhone.length < 9 || cleanPhone.length > 12) {
    errors.push('Phone number must be 9-12 digits');
    return { valid: false, score: 0, maxScore: 20, errors, warnings, details: { cleanPhone, digitCount: cleanPhone.length } };
  }
  
  // Base score: 8 points for valid digit count
  score = 8;
  
  let nationalNumber = cleanPhone;
  let hasCountryCode = false;
  
  if (cleanPhone.startsWith('855')) {
    nationalNumber = cleanPhone.slice(3);
    hasCountryCode = true;
  } else if (cleanPhone.startsWith('0')) {
    nationalNumber = cleanPhone.slice(1);
  }
  
  const prefix = nationalNumber.slice(0, 2);
  const isMobile = cambodianMobilePrefixes.includes(prefix);
  const isLandline = cambodianLandlinePrefixes.includes(prefix);
  
  // Recognized prefix: +6 points
  if (isMobile || isLandline) {
    score += 6;
  } else {
    warnings.push(`Unrecognized Cambodian prefix: ${prefix}`);
  }
  
  const carrier = cambodianCarriers[prefix] || 'Unknown';
  
  // Country code format: +4 points for international format, +2 for local format
  if (hasCountryCode) {
    score += 4;
  } else {
    warnings.push('Consider using international format (+855)');
    score += 2;
  }
  
  // Known carrier bonus: +2 points
  if (carrier !== 'Unknown' && isMobile) {
    score += 2;
  }
  
  return {
    valid: score >= 8,
    score: Math.min(score, 20),
    maxScore: 20,
    errors,
    warnings,
    details: {
      originalInput: phone,
      cleanNumber: cleanPhone,
      nationalNumber,
      digitCount: cleanPhone.length,
      internationalFormat: `+855${nationalNumber}`,
      prefix,
      type: isMobile ? 'Mobile' : isLandline ? 'Landline' : 'Unknown',
      carrier: isMobile ? carrier : 'N/A',
      hasCountryCode
    }
  };
}

// ==================== BIO VALIDATION ====================

function validateBio(bio) {
  const errors = [];
  const warnings = [];
  let score = 0;
  
  if (!bio || bio.trim().length === 0) {
    errors.push('Bio is required');
    return { valid: false, score: 0, maxScore: 20, errors, warnings: [], details: {} };
  }
  
  const trimmedBio = bio.trim();
  const wordCount = trimmedBio.split(/\s+/).filter(w => w.length > 0).length;
  const charCount = trimmedBio.length;
  
  if (charCount < 20) {
    errors.push(`Bio is too short (${charCount}/20 characters minimum)`);
    return { valid: false, score: 0, maxScore: 20, errors, warnings, details: { charCount, wordCount, charRemaining: 20 - charCount } };
  }
  
  // Base score: 6 points for meeting minimum length
  score = 6;
  
  // Length bonus: +4 points for 50+ chars, +2 more for 100+ chars
  if (charCount >= 100) {
    score += 6;
  } else if (charCount >= 50) {
    score += 4;
  } else {
    score += 2;
  }
  
  if (charCount > 500) {
    warnings.push('Bio is very long (over 500 characters)');
  }
  
  // Word count bonus: +2 points for 5+ words
  if (wordCount >= 5) {
    score += 2;
  } else {
    warnings.push('Consider adding more detail to your bio');
  }
  
  // Check for repetitive words
  const words = trimmedBio.toLowerCase().split(/\s+/);
  const wordFreq = {};
  words.forEach(w => wordFreq[w] = (wordFreq[w] || 0) + 1);
  const maxFreq = Math.max(...Object.values(wordFreq));
  if (maxFreq > wordCount / 3 && wordCount > 5) {
    warnings.push('Bio contains repetitive words');
    score = Math.max(0, score - 2);
  }
  
  // Proper capitalization: +2 points
  if (/^[A-Z]/.test(trimmedBio)) {
    score += 2;
  } else {
    warnings.push('Bio should start with a capital letter');
  }
  
  // Proper punctuation: +2 points
  if (/[.!?]$/.test(trimmedBio)) {
    score += 2;
  } else {
    warnings.push('Bio should end with proper punctuation');
  }
  
  // Spam check: penalty
  const spamPatterns = /\b(click here|buy now|free money|winner|congratulations)\b/i;
  if (spamPatterns.test(trimmedBio)) {
    warnings.push('Bio may contain spam-like content');
    score = Math.max(0, score - 4);
  }
  
  return {
    valid: score >= 8,
    score: Math.min(score, 20),
    maxScore: 20,
    errors,
    warnings,
    details: {
      charCount,
      wordCount,
      charRemaining: Math.max(0, 500 - charCount)
    }
  };
}

// ==================== SKILLS VALIDATION ====================

function validateSkills(skillsInput) {
  const errors = [];
  const warnings = [];
  let score = 0;
  
  if (!skillsInput || skillsInput.trim().length === 0) {
    errors.push('Skills are required');
    return { valid: false, score: 0, maxScore: 20, errors, warnings: [], details: {} };
  }
  
  const skills = skillsInput.split(',')
    .map(s => s.trim())
    .filter(s => s.length > 0);
  
  if (skills.length === 0) {
    errors.push('Please provide at least one skill');
    return { valid: false, score: 0, maxScore: 20, errors, warnings, details: {} };
  }
  
  // Base score: 4 points for having at least one skill
  score = 4;
  
  // Skills count bonus: +2 for 2 skills, +4 for 3+, +6 for 5+
  if (skills.length >= 5) {
    score += 6;
  } else if (skills.length >= 3) {
    score += 4;
  } else if (skills.length >= 2) {
    score += 2;
  } else {
    warnings.push('Consider adding more skills (3+ recommended)');
  }
  
  const lowerSkills = skills.map(s => s.toLowerCase());
  const uniqueSkills = [...new Set(lowerSkills)];
  
  // Uniqueness bonus: +4 points for all unique skills
  if (uniqueSkills.length === skills.length) {
    score += 4;
  } else {
    warnings.push('Duplicate skills detected');
    score += 2; // Partial credit
  }
  
  const validatedSkills = [];
  const invalidSkills = [];
  
  skills.forEach(skill => {
    if (skill.length < 2) {
      invalidSkills.push({ skill, reason: 'Too short' });
    } else if (skill.length > 50) {
      invalidSkills.push({ skill, reason: 'Too long' });
    } else if (!/^[a-zA-Z0-9\s\-\+\#\.\/]+$/.test(skill)) {
      invalidSkills.push({ skill, reason: 'Contains invalid characters' });
    } else {
      validatedSkills.push(skill);
    }
  });
  
  // Skill quality bonus: +6 points for all valid skills, scaled for partial
  if (invalidSkills.length === 0) {
    score += 6;
  } else if (invalidSkills.length < skills.length / 2) {
    warnings.push(`Some skills have issues: ${invalidSkills.map(s => `"${s.skill}"`).join(', ')}`);
    score += 3;
  } else {
    warnings.push(`Some skills have issues: ${invalidSkills.map(s => `"${s.skill}"`).join(', ')}`);
  }
  
  return {
    valid: score >= 8,
    score: Math.min(score, 20),
    maxScore: 20,
    errors,
    warnings,
    details: {
      totalSkills: skills.length,
      validSkills: validatedSkills,
      invalidSkills,
      uniqueCount: uniqueSkills.length
    }
  };
}

// ==================== HELPER FUNCTIONS ====================

function getStrengthText20(score) {
  if (score === 0) return 'Invalid';
  if (score === 20) return 'Valid';
  return 'Partial';
}

function getStrengthColor20(score) {
  if (score === 0) return '#ff4757';
  if (score === 20) return '#2ed573';
  return '#ffa726';
}

function getOverallStrengthText(score) {
  if (score === 0) return 'None';
  if (score < 40) return 'Poor';
  if (score < 60) return 'Fair';
  if (score < 80) return 'Good';
  if (score < 100) return 'Very Good';
  return 'Perfect';
}

function getOverallStrengthColor(score) {
  if (score === 0) return '#666666';
  if (score < 40) return '#ff4757';
  if (score < 60) return '#ff6348';
  if (score < 80) return '#ffa726';
  if (score < 100) return '#2ed573';
  return '#9c88ff';
}

module.exports = {
  validatePassword,
  validateFullName,
  validateEmail,
  validateCambodianPhone,
  validateBio,
  validateSkills,
  getStrengthText20,
  getStrengthColor20,
  getOverallStrengthText,
  getOverallStrengthColor
};
