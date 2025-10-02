/**
 * Frontend Validation Utilities
 * Matches backend Bean Validation constraints
 */

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

/**
 * Validate email format
 */
export function validateEmail(email: string): string | null {
  if (!email || email.trim() === '') {
    return 'Email is required';
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'Email should be valid';
  }
  
  return null;
}

/**
 * Validate application name
 * Backend: @NotBlank @Size(min = 1, max = 100)
 */
export function validateApplicationName(name: string): string | null {
  if (!name || name.trim() === '') {
    return 'Application name is required';
  }
  
  if (name.length < 1 || name.length > 100) {
    return 'Application name must be between 1 and 100 characters';
  }
  
  return null;
}

/**
 * Validate application description
 * Backend: @Size(max = 500)
 */
export function validateApplicationDescription(description: string): string | null {
  if (description && description.length > 500) {
    return 'Description must not exceed 500 characters';
  }
  
  return null;
}

/**
 * Validate alert severity level
 * Backend: @NotBlank @Pattern(regexp = "^(ERROR|WARNING|INFO|DEBUG)$")
 */
export function validateSeverityLevel(level: string): string | null {
  if (!level || level.trim() === '') {
    return 'Severity level is required';
  }
  
  const validLevels = ['ERROR', 'WARNING', 'INFO', 'DEBUG'];
  if (!validLevels.includes(level)) {
    return 'Severity level must be one of: ERROR, WARNING, INFO, DEBUG';
  }
  
  return null;
}

/**
 * Validate alert count
 * Backend: @NotNull @Min(1) @Max(10000)
 */
export function validateAlertCount(count: number | string): string | null {
  const numCount = typeof count === 'string' ? parseInt(count) : count;
  
  if (isNaN(numCount)) {
    return 'Count is required';
  }
  
  if (numCount < 0) {
    return 'Count must be at least 0';
  }
  
  if (numCount > 10000) {
    return 'Count must not exceed 10000';
  }
  
  return null;
}

/**
 * Validate application ID
 * Backend: @NotNull @Positive
 */
export function validateApplicationId(id: number | string): string | null {
  const numId = typeof id === 'string' ? parseInt(id) : id;
  
  if (isNaN(numId) || numId <= 0) {
    return 'Application ID is required';
  }
  
  return null;
}

/**
 * Validate time window
 * Backend: @NotNull
 */
export function validateTimeWindow(timeWindow: string): string | null {
  if (!timeWindow || (typeof timeWindow === 'string' && timeWindow.trim() === '')) {
    return 'Time window is required';
  }
  
  return null;
}

/**
 * Validate Create Application Request
 */
export function validateCreateApplication(data: {
  name: string;
  description?: string;
}): ValidationResult {
  const errors: Record<string, string> = {};
  
  const nameError = validateApplicationName(data.name);
  if (nameError) errors.name = nameError;
  
  if (data.description) {
    const descError = validateApplicationDescription(data.description);
    if (descError) errors.description = descError;
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Validate Update Application Request
 */
export function validateUpdateApplication(data: {
  name?: string;
  description?: string;
  isActive?: boolean;
}): ValidationResult {
  const errors: Record<string, string> = {};
  
  if (data.name !== undefined) {
    const nameError = validateApplicationName(data.name);
    if (nameError) errors.name = nameError;
  }
  
  if (data.description !== undefined) {
    const descError = validateApplicationDescription(data.description);
    if (descError) errors.description = descError;
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Validate Create Alert Request
 */
export function validateCreateAlert(data: {
  applicationId: number;
  severityLevel: string;
  count: number;
  timeWindow: string;
}): ValidationResult {
  const errors: Record<string, string> = {};
  
  const appIdError = validateApplicationId(data.applicationId);
  if (appIdError) errors.applicationId = appIdError;
  
  const levelError = validateSeverityLevel(data.severityLevel);
  if (levelError) errors.severityLevel = levelError;
  
  const countError = validateAlertCount(data.count);
  if (countError) errors.count = countError;
  
  const timeWindowError = validateTimeWindow(data.timeWindow);
  if (timeWindowError) errors.timeWindow = timeWindowError;
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Validate Update Alert Request
 */
export function validateUpdateAlert(data: {
  applicationId?: number;
  severityLevel?: string;
  count?: number;
  timeWindow?: string;
  isActive?: boolean;
}): ValidationResult {
  const errors: Record<string, string> = {};
  
  if (data.applicationId !== undefined) {
    const appIdError = validateApplicationId(data.applicationId);
    if (appIdError) errors.applicationId = appIdError;
  }
  
  if (data.severityLevel !== undefined) {
    const levelError = validateSeverityLevel(data.severityLevel);
    if (levelError) errors.severityLevel = levelError;
  }
  
  if (data.count !== undefined) {
    const countError = validateAlertCount(data.count);
    if (countError) errors.count = countError;
  }
  
  if (data.timeWindow !== undefined) {
    const timeWindowError = validateTimeWindow(data.timeWindow);
    if (timeWindowError) errors.timeWindow = timeWindowError;
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Validate Register User Request
 */
export function validateRegisterUser(data: {
  email: string;
}): ValidationResult {
  const errors: Record<string, string> = {};
  
  const emailError = validateEmail(data.email);
  if (emailError) errors.email = emailError;
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Real-time field validation helper
 */
export function validateField(
  fieldName: string,
  value: any,
  validationType: 'email' | 'appName' | 'appDesc' | 'severity' | 'count' | 'appId' | 'timeWindow'
): string | null {
  switch (validationType) {
    case 'email':
      return validateEmail(value);
    case 'appName':
      return validateApplicationName(value);
    case 'appDesc':
      return validateApplicationDescription(value);
    case 'severity':
      return validateSeverityLevel(value);
    case 'count':
      return validateAlertCount(value);
    case 'appId':
      return validateApplicationId(value);
    case 'timeWindow':
      return validateTimeWindow(value);
    default:
      return null;
  }
}

/**
 * Character counter helper
 */
export function getCharacterCount(value: string, maxLength: number): string {
  const remaining = maxLength - value.length;
  const color = remaining < 50 ? 'red' : remaining < 100 ? 'orange' : 'gray';
  return `${value.length}/${maxLength} characters`;
}

/**
 * Check if form has errors
 */
export function hasErrors(errors: Record<string, string>): boolean {
  return Object.keys(errors).length > 0;
}

/**
 * Get first error message
 */
export function getFirstError(errors: Record<string, string>): string | null {
  const keys = Object.keys(errors);
  return keys.length > 0 ? errors[keys[0]] : null;
}
