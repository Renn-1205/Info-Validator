// ==================== DOM ELEMENTS ====================

// Tab elements
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

// Password Tab Elements
const passwordInput = document.getElementById('password');
const copyBtn = document.getElementById('copy-btn');
const strengthText = document.getElementById('strength-text');
const strengthBar = document.getElementById('strength-bar');
const lengthStatus = document.getElementById('length-status');
const typesStatus = document.getElementById('types-status');
const complexityStatus = document.getElementById('complexity-status');

// Password Requirement elements
const reqLength = document.getElementById('req-length');
const reqUppercase = document.getElementById('req-uppercase');
const reqLowercase = document.getElementById('req-lowercase');
const reqNumbers = document.getElementById('req-numbers');
const reqSpecial = document.getElementById('req-special');
const reqNoSeq = document.getElementById('req-no-seq');
const reqNoRepeat = document.getElementById('req-no-repeat');
const reqNoCommon = document.getElementById('req-no-common');

// Employee Tab Elements
const fullnameInput = document.getElementById('fullname');
const emailInput = document.getElementById('email');
const phoneInput = document.getElementById('phone');
const bioInput = document.getElementById('bio');
const skillsInput = document.getElementById('skills');
const validateAllBtn = document.getElementById('validate-all-btn');

// Feedback elements
const nameFeedback = document.getElementById('name-feedback');
const emailFeedback = document.getElementById('email-feedback');
const phoneFeedback = document.getElementById('phone-feedback');
const bioFeedback = document.getElementById('bio-feedback');
const skillsFeedback = document.getElementById('skills-feedback');
const skillsPreview = document.getElementById('skills-preview');
const bioCharCount = document.getElementById('bio-char-count');

// Status elements
const nameStatus = document.getElementById('name-status');
const emailStatus = document.getElementById('email-status');
const phoneStatus = document.getElementById('phone-status');
const skillsStatus = document.getElementById('skills-status');

// Strength bars
const nameStrengthBar = document.getElementById('name-strength-bar');
const emailStrengthBar = document.getElementById('email-strength-bar');
const phoneStrengthBar = document.getElementById('phone-strength-bar');
const bioStrengthBar = document.getElementById('bio-strength-bar');
const skillsStrengthBar = document.getElementById('skills-strength-bar');
const overallStrengthBar = document.getElementById('overall-strength-bar');

// Summary elements
const summarySection = document.getElementById('summary-section');
const overallScore = document.getElementById('overall-score');
const overallStatus = document.getElementById('overall-status');

// API Configuration
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:3000'
  : 'YOUR_BACKEND_URL_HERE';

// ==================== TAB NAVIGATION ====================

tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    // Remove active class from all buttons and contents
    tabBtns.forEach(b => b.classList.remove('active'));
    tabContents.forEach(c => c.classList.remove('active'));
    
    // Add active class to clicked button and corresponding content
    btn.classList.add('active');
    const tabId = btn.getAttribute('data-tab');
    document.getElementById(`${tabId}-tab`).classList.add('active');
  });
});

// ==================== UTILITY FUNCTIONS ====================

// Debounce function to limit API calls
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Helper function to show button success feedback
function showButtonSuccess(button) {
  const originalHTML = button.innerHTML;
  button.innerHTML = `<span class="btn-icon">✓</span>`;
  button.classList.add('success');

  setTimeout(() => {
    button.innerHTML = originalHTML;
    button.classList.remove('success');
  }, 2000);
}

// Update mini strength bar (now out of 20)
function updateMiniStrengthBar(bar, score, color) {
  if (bar) {
    bar.style.width = `${(score / 20) * 100}%`;
    bar.style.background = color;
  }
}

// Update field status icon
function updateFieldStatus(element, valid, score) {
  if (element) {
    element.textContent = valid ? `✓ ${score}/20` : `✗ ${score}/20`;
    element.className = `field-status ${valid ? 'valid' : 'invalid'}`;
  }
}

// Display validation feedback
function displayFeedback(element, data) {
  if (!element) return;
  
  let html = '';
  
  if (data.errors && data.errors.length > 0) {
    html += `<div class="feedback-errors">`;
    data.errors.forEach(err => {
      html += `<span class="feedback-item error">✗ ${err}</span>`;
    });
    html += `</div>`;
  }
  
  if (data.warnings && data.warnings.length > 0) {
    html += `<div class="feedback-warnings">`;
    data.warnings.forEach(warn => {
      html += `<span class="feedback-item warning">⚠ ${warn}</span>`;
    });
    html += `</div>`;
  }
  
 
  
  element.innerHTML = html;
}

// ==================== PASSWORD VALIDATION ====================

// Real-time password checking with debounce
passwordInput.addEventListener('input', debounce(checkPassword, 300));

// Copy button functionality
copyBtn.addEventListener('click', async function() {
  const password = passwordInput.value;
  if (!password) return;

  try {
    await navigator.clipboard.writeText(password);
    showButtonSuccess(this);
  } catch (err) {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = password;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    showButtonSuccess(this);
  }
});

// Main password checking function - calls backend API
async function checkPassword() {
  const password = passwordInput.value;
  
  // Handle empty password locally for instant feedback
  if (password.length === 0) {
    updateStrengthMeter(0, 'None', '#666666');
    updateAnalysis(0, 0, 'Low');
    updateRequirements({
      length: false,
      uppercase: false,
      lowercase: false,
      numbers: false,
      special: false,
      noSequence: true,
      noRepeat: true,
      noCommon: true
    });
    copyBtn.disabled = true;
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/check-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password }),
    });

    if (!response.ok) {
      throw new Error('API request failed');
    }

    const data = await response.json();

    // Update UI with API response
    updateStrengthMeter(data.strength, data.strengthText, data.strengthColor);
    updateAnalysis(data.analysis.length, data.analysis.charTypes, data.analysis.complexity);
    updateRequirements(data.requirements);
    copyBtn.disabled = false;

  } catch (error) {
    console.error('Error checking password:', error);
    showApiError();
  }
}

// Show error when API is unavailable
function showApiError() {
  updateStrengthMeter(0, 'Server Offline', '#ff4757');
  updateAnalysis(0, 0, 'N/A');
  updateRequirements({
    length: false,
    uppercase: false,
    lowercase: false,
    numbers: false,
    special: false,
    noSequence: false,
    noRepeat: false,
    noCommon: false
  });
  copyBtn.disabled = true;
}

// Update the visual strength meter
function updateStrengthMeter(strength, text, color) {
  strengthText.textContent = text;
  strengthText.style.color = color;
  strengthBar.style.width = `${strength * 10}%`;
  strengthBar.style.background = color;
}

// Update analysis section
function updateAnalysis(length, charTypes, complexity) {
  lengthStatus.textContent = `${length}/12`;
  lengthStatus.style.color = length >= 12 ? '#2ed573' : '#666666';
  typesStatus.textContent = `${charTypes}/4`;
  typesStatus.style.color = charTypes === 4 ? '#2ed573' : charTypes >= 2 ? '#ffa726' : '#666666';
  complexityStatus.textContent = complexity;
  complexityStatus.style.color = complexity === 'High' ? '#2ed573' : complexity === 'Medium' ? '#ffa726' : '#666666';
}

// Update requirements display
function updateRequirements(requirements) {
  const reqMap = {
    length: reqLength,
    uppercase: reqUppercase,
    lowercase: reqLowercase,
    numbers: reqNumbers,
    special: reqSpecial,
    noSequence: reqNoSeq,
    noRepeat: reqNoRepeat,
    noCommon: reqNoCommon
  };

  for (const [key, element] of Object.entries(reqMap)) {
    if (requirements[key]) {
      element.classList.add('met');
      element.classList.remove('partial');
    } else {
      element.classList.remove('met', 'partial');
    }
  }
}

// ==================== EMPLOYEE INFO VALIDATION ====================

// Real-time validation for employee fields
fullnameInput.addEventListener('input', debounce(() => validateField('name', fullnameInput.value), 300));
emailInput.addEventListener('input', debounce(() => validateField('email', emailInput.value), 300));
phoneInput.addEventListener('input', debounce(() => validateField('phone', phoneInput.value), 300));
bioInput.addEventListener('input', debounce(() => {
  updateBioCharCount();
  validateField('bio', bioInput.value, true); // Use AI validation for bio
}, 500)); // Longer debounce for AI calls
skillsInput.addEventListener('input', debounce(() => validateField('skills', skillsInput.value), 300));

// Update bio character count
function updateBioCharCount() {
  const count = bioInput.value.length;
  bioCharCount.textContent = `${count}/500`;
  bioCharCount.style.color = count > 400 ? '#ff6348' : count > 0 ? '#2ed573' : '#666666';
}

// Validate individual field
async function validateField(field, value, useAI = false) {
  const endpointMap = {
    name: '/validate-name',
    email: '/validate-email',
    phone: '/validate-phone',
    bio: useAI ? '/validate-bio-ai' : '/validate-bio',
    skills: '/validate-skills'
  };
  
  const feedbackMap = {
    name: nameFeedback,
    email: emailFeedback,
    phone: phoneFeedback,
    bio: bioFeedback,
    skills: skillsFeedback
  };
  
  const statusMap = {
    name: nameStatus,
    email: emailStatus,
    phone: phoneStatus,
    skills: skillsStatus
  };
  
  const strengthBarMap = {
    name: nameStrengthBar,
    email: emailStrengthBar,
    phone: phoneStrengthBar,
    bio: bioStrengthBar,
    skills: skillsStrengthBar
  };
  
  const bodyKey = field === 'name' ? 'name' : field;
  
  // Clear feedback if empty
  if (!value || value.trim().length === 0) {
    if (feedbackMap[field]) feedbackMap[field].innerHTML = '';
    if (statusMap[field]) statusMap[field].textContent = '';
    if (strengthBarMap[field]) updateMiniStrengthBar(strengthBarMap[field], 0, '#666666');
    if (field === 'skills') skillsPreview.innerHTML = '';
    return;
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}${endpointMap[field]}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [bodyKey]: value })
    });
    
    if (!response.ok) throw new Error('API request failed');
    
    const data = await response.json();
    
    // Update UI
    displayFeedback(feedbackMap[field], data);
    if (statusMap[field]) updateFieldStatus(statusMap[field], data.valid, data.score);
    updateMiniStrengthBar(strengthBarMap[field], data.score, data.strengthColor);
    
    // Special handling for skills preview
    if (field === 'skills' && data.details && data.details.validSkills) {
      displaySkillsPreview(data.details.validSkills);
    }
    
    // Special handling for phone - show carrier info
    if (field === 'phone' && data.valid && data.details) {
      const phoneDetails = data.details;
      let extraInfo = '';
      if (phoneDetails.carrier && phoneDetails.carrier !== 'N/A') {
        extraInfo = `<span class="feedback-item info"> Carrier: ${phoneDetails.carrier} | Format: ${phoneDetails.internationalFormat}</span>`;
      }
      phoneFeedback.innerHTML += extraInfo;
    }
    
    // Special handling for bio - show AI analysis
    if (field === 'bio' && data.aiAnalysis) {
      let aiInfo = '';
      if (data.aiAnalysis.provider) {
        aiInfo = `<span class="feedback-item info"> AI Analysis by ${data.aiAnalysis.provider}</span>`;
        if (data.aiAnalysis.summary && data.aiAnalysis.summary.overallQuality) {
          aiInfo += `<span class="feedback-item ${data.aiAnalysis.summary.overallQuality === 'excellent' || data.aiAnalysis.summary.overallQuality === 'good' ? 'success' : 'warning'}">Quality: ${data.aiAnalysis.summary.overallQuality}</span>`;
        }
      } else if (data.aiAnalysis.error) {
        aiInfo = `<span class="feedback-item warning">⚠ AI unavailable: using basic validation</span>`;
      }
      bioFeedback.innerHTML += aiInfo;
    }
    
  } catch (error) {
    console.error(`Error validating ${field}:`, error);
    if (feedbackMap[field]) {
      feedbackMap[field].innerHTML = '<span class="feedback-item error">✗ Server offline</span>';
    }
  }
}

// Display skills preview as tags
function displaySkillsPreview(skills) {
  if (!skillsPreview) return;
  
  skillsPreview.innerHTML = skills.map(skill => 
    `<span class="skill-tag">${skill}</span>`
  ).join('');
}

// Validate all fields at once
validateAllBtn.addEventListener('click', validateAllFields);

async function validateAllFields() {
  validateAllBtn.disabled = true;
  validateAllBtn.textContent = 'Validating...';
  
  const data = {
    name: fullnameInput.value,
    email: emailInput.value,
    phone: phoneInput.value,
    bio: bioInput.value,
    skills: skillsInput.value
  };
  
  try {
    const response = await fetch(`${API_BASE_URL}/validate-all`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) throw new Error('API request failed');
    
    const result = await response.json();
    
    // Update individual fields
    const fieldMap = {
      name: { feedback: nameFeedback, status: nameStatus, bar: nameStrengthBar },
      email: { feedback: emailFeedback, status: emailStatus, bar: emailStrengthBar },
      phone: { feedback: phoneFeedback, status: phoneStatus, bar: phoneStrengthBar },
      bio: { feedback: bioFeedback, bar: bioStrengthBar },
      skills: { feedback: skillsFeedback, status: skillsStatus, bar: skillsStrengthBar }
    };
    
    Object.keys(result.results).forEach(field => {
      const data = result.results[field];
      const elements = fieldMap[field];
      
      displayFeedback(elements.feedback, data);
      if (elements.status) updateFieldStatus(elements.status, data.valid, data.score);
      updateMiniStrengthBar(elements.bar, data.score, data.strengthColor);
    });
    
    // Update skills preview
    if (result.results.skills.details && result.results.skills.details.validSkills) {
      displaySkillsPreview(result.results.skills.details.validSkills);
    }
    
    // Show summary section
    summarySection.style.display = 'block';
    overallScore.textContent = `${result.summary.score}/100`;
    overallScore.style.color = result.summary.strengthColor;
    
    const statusIcon = overallStatus.querySelector('.status-icon');
    const statusText = overallStatus.querySelector('.status-text');
    
    if (result.summary.valid) {
      statusIcon.textContent = '✓';
      statusIcon.style.color = '#2ed573';
      statusText.textContent = `All ${result.summary.validFields} fields valid - ${result.summary.strengthText}`;
    } else {
      statusIcon.textContent = '✗';
      statusIcon.style.color = '#ff4757';
      statusText.textContent = `${result.summary.validFields}/${result.summary.totalFields} fields valid (${result.summary.percentage}%)`;
    }
    
    // Update overall strength bar (out of 100)
    if (overallStrengthBar) {
      overallStrengthBar.style.width = `${result.summary.percentage}%`;
      overallStrengthBar.style.background = result.summary.strengthColor;
    }
    
  } catch (error) {
    console.error('Error validating all fields:', error);
    summarySection.style.display = 'block';
    overallScore.textContent = 'Error';
    overallScore.style.color = '#ff4757';
  } finally {
    validateAllBtn.disabled = false;
    validateAllBtn.textContent = 'Validate All Fields';
  }
}

// ==================== INITIALIZATION ====================

document.addEventListener('DOMContentLoaded', function() {
  checkPassword();
  updateBioCharCount();
});
