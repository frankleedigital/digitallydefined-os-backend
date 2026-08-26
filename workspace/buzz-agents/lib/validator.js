// lib/validator.js
// Input validation for all DigitallyDefined agents

export function validateInput(schema, data) {
  const errors = [];
  
  for (const [field, rule] of Object.entries(schema)) {
    if (rule.required && data[field] === undefined) {
      errors.push('Missing required field: ' + field);
    }
    
    if (rule.type === 'string' && typeof data[field] !== 'string') {
      errors.push(field + ' must be a string');
    }
    
    if (rule.type === 'number' && typeof data[field] !== 'number') {
      errors.push(field + ' must be a number');
    }
    
    if (rule.type === 'array' && !Array.isArray(data[field])) {
      errors.push(field + ' must be an array');
    }
  }
  
  if (errors.length > 0) {
    return { valid: false, error: errors.join('; ') };
  }
  
  return { valid: true };
}

export function validateQuizInput(data) {
  const schema = {
    userAnswers: { required: true, type: 'array' },
    metadata: { required: false, type: 'object' }
  };
  
  return validateInput(schema, data);
}

export default { validateInput, validateQuizInput };
