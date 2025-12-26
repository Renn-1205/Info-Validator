// ==================== PASSWORD VALIDATION CONFIG ====================

// Common dictionary words to check against
const commonWords = [
  'password', 'password1', '123456', '123456789', 'qwerty', 'abc123',
  'password123', 'admin', 'letmein', 'welcome', 'monkey', '1234567890',
  'iloveyou', 'princess', 'rockyou', '1234567', '12345678', 'password12',
  'qwerty123', '1q2w3e4r', 'baseball', 'football', 'soccer', 'hockey',
  'basketball', 'tennis', 'golf', 'swimming', 'volleyball', 'rugby'
];

// ==================== EMAIL VALIDATION CONFIG ====================

// List of legitimate email service providers
const legitimateEmailProviders = [
  // Major global providers
  'gmail.com', 'googlemail.com', 'yahoo.com', 'yahoo.co.uk', 'yahoo.fr', 'yahoo.de',
  'outlook.com', 'hotmail.com', 'live.com', 'msn.com', 'hotmail.co.uk',
  'icloud.com', 'me.com', 'mac.com',
  'protonmail.com', 'proton.me', 'pm.me',
  'aol.com', 'mail.com', 'zoho.com', 'yandex.com', 'yandex.ru',
  'gmx.com', 'gmx.net', 'gmx.de',
  // Business/Professional
  'fastmail.com', 'tutanota.com', 'hey.com',
  // Regional providers
  'qq.com', '163.com', '126.com', 'sina.com', 'naver.com', 'daum.net',
  // Educational (generic patterns will be checked separately)
  'edu', 'ac.uk', 'edu.au', 'edu.kh'
];

// Disposable/temporary email providers to reject
const disposableEmailProviders = [
  'tempmail.com', 'throwaway.com', 'guerrillamail.com', 'mailinator.com',
  '10minutemail.com', 'temp-mail.org', 'fakeinbox.com', 'trashmail.com',
  'yopmail.com', 'getnada.com', 'maildrop.cc', 'dispostable.com'
];

// ==================== PHONE NUMBER VALIDATION CONFIG ====================

// Cambodian mobile prefixes
const cambodianMobilePrefixes = [
  '10', '11', '12', '13', '14', '15', '16', '17', '18', '19',
  '31', '60', '66', '67', '68', '69', '70', '71', '76', '77', '78', '79',
  '80', '81', '82', '83', '84', '85', '86', '87', '88', '89',
  '90', '91', '92', '93', '94', '95', '96', '97', '98', '99'
];

// Cambodian landline prefixes
const cambodianLandlinePrefixes = [
  '23', '24', '25', '26', '32', '33', '34', '35', '36',
  '42', '43', '44', '52', '53', '54', '62', '63', '72', '73', '74', '75'
];

// Carrier identification
const cambodianCarriers = {
  '10': 'Cootel', '11': 'Cootel',
  '12': 'Cellcard', '14': 'Cellcard', '17': 'Cellcard', '77': 'Cellcard', '78': 'Cellcard', '79': 'Cellcard', '89': 'Cellcard', '92': 'Cellcard', '95': 'Cellcard',
  '15': 'Metfone', '16': 'Metfone', '31': 'Metfone', '60': 'Metfone', '66': 'Metfone', '67': 'Metfone', '68': 'Metfone', '71': 'Metfone', '88': 'Metfone', '90': 'Metfone', '97': 'Metfone',
  '18': 'Smart', '13': 'Smart', '69': 'Smart', '70': 'Smart', '80': 'Smart', '81': 'Smart', '82': 'Smart', '83': 'Smart', '84': 'Smart', '85': 'Smart', '86': 'Smart', '87': 'Smart', '93': 'Smart', '96': 'Smart', '98': 'Smart',
  '19': 'Seatel', '76': 'Seatel',
  '38': 'qb', '39': 'qb'
};

// Password strength configurations (0-10 scale)
const strengthConfig = {
  0: { text: 'None', color: '#666666' },
  1: { text: 'Very Weak', color: '#ff4757' },
  2: { text: 'Weak', color: '#ff4757' },
  3: { text: 'Poor', color: '#ff6348' },
  4: { text: 'Fair', color: '#ffa726' },
  5: { text: 'Moderate', color: '#ffa726' },
  6: { text: 'Good', color: '#2ed573' },
  7: { text: 'Strong', color: '#2ed573' },
  8: { text: 'Very Strong', color: '#3742fa' },
  9: { text: 'Excellent', color: '#3742fa' },
  10: { text: 'Fortress', color: '#9c88ff' }
};

module.exports = {
  commonWords,
  legitimateEmailProviders,
  disposableEmailProviders,
  cambodianMobilePrefixes,
  cambodianLandlinePrefixes,
  cambodianCarriers,
  strengthConfig
};
