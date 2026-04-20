export function validateRequired(value, label, minLength = 1) {
  const trimmed = (value || '').trim();
  if (!trimmed) {
    return `${label} is required.`;
  }
  if (trimmed.length < minLength) {
    return `${label} must be at least ${minLength} characters.`;
  }
  return '';
}

export function validatePhoneNumber(value) {
  const trimmed = (value || '').trim();
  if (!trimmed) {
    return '';
  }
  const digitsOnly = trimmed.replace(/[\s\-()]/g, '');
  if (!/^\d+$/.test(digitsOnly) || digitsOnly.length < 10 || digitsOnly.length > 15) {
    return 'Phone number must be 10-15 digits.';
  }
  return '';
}

export function validateMaxLength(value, label, maxLength) {
  if (value && value.length > maxLength) {
    return `${label} must be at most ${maxLength} characters.`;
  }
  return '';
}

export function mergeValidationErrors(entries) {
  return entries.reduce((acc, [key, value]) => {
    if (value) {
      acc[key] = value;
    }
    return acc;
  }, {});
}
