/**
 * Format a date string or Date object to a readable format
 * @param {string|Date} date - The date to format
 * @param {object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date string
 */
export function formatDate(date, options = {}) {
  if (!date) return '';

  const defaultOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  };
  
  const mergedOptions = { ...defaultOptions, ...options };
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) {
      return 'Invalid date';
    }
    
    return new Intl.DateTimeFormat('en-US', mergedOptions).format(dateObj);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Error';
  }
}

/**
 * Format a number as currency
 * @param {number} amount - The amount to format
 * @param {object} options - Intl.NumberFormat options
 * @returns {string} Formatted currency string
 */
export function formatCurrency(amount, options = {}) {
  if (amount === null || amount === undefined) return '$0';
  
  const defaultOptions = {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  };
  
  const mergedOptions = { ...defaultOptions, ...options };
  
  try {
    return new Intl.NumberFormat('en-US', mergedOptions).format(amount);
  } catch (error) {
    console.error('Error formatting currency:', error);
    return '$0';
  }
}

/**
 * Format a number as a percentage
 * @param {number} value - The value to format
 * @param {object} options - Intl.NumberFormat options
 * @returns {string} Formatted percentage string
 */
export function formatPercent(value, options = {}) {
  if (value === null || value === undefined) return '0%';
  
  const defaultOptions = {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  };
  
  const mergedOptions = { ...defaultOptions, ...options };
  
  try {
    // Convert to decimal if needed (e.g., 42 -> 0.42)
    const normalizedValue = value > 1 ? value / 100 : value;
    return new Intl.NumberFormat('en-US', mergedOptions).format(normalizedValue);
  } catch (error) {
    console.error('Error formatting percentage:', error);
    return '0%';
  }
}

/**
 * Format a number with thousands separators
 * @param {number} value - The value to format
 * @param {object} options - Intl.NumberFormat options
 * @returns {string} Formatted number string
 */
export function formatNumber(value, options = {}) {
  if (value === null || value === undefined) return '0';
  
  const defaultOptions = {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  };
  
  const mergedOptions = { ...defaultOptions, ...options };
  
  try {
    return new Intl.NumberFormat('en-US', mergedOptions).format(value);
  } catch (error) {
    console.error('Error formatting number:', error);
    return '0';
  }
} 