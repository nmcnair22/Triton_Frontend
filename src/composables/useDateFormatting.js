import { formatDateSafe, formatRelativeDate, safeDateFormat } from '@/lib/utils';

/**
 * Composable for safe date formatting throughout the application
 * Handles Unix epoch dates (Dec 31, 1969) and other invalid dates gracefully
 */
export function useDateFormatting() {
    
    /**
     * Format a date with safe handling for Unix epoch and invalid dates
     * @param {string|Date|number} dateInput - The date to format
     * @param {string} format - Format type ('short', 'long', 'mm/dd/yyyy', etc.)
     * @param {string} fallback - Text to show for invalid dates
     * @returns {string} Formatted date or fallback text
     */
    const formatDate = (dateInput, format = 'short', fallback = 'Date Missing') => {
        return formatDateSafe(dateInput, { format, fallback });
    };

    /**
     * Quick format for common use cases - shows "Date Missing" for Unix epoch dates
     * @param {string|Date|number} dateInput - The date to format
     * @param {string} customFallback - Custom fallback text (optional)
     * @returns {string} Formatted date or "Date Missing"
     */
    const safeDate = (dateInput, customFallback = 'Date Missing') => {
        return safeDateFormat(dateInput, customFallback);
    };

    /**
     * Format date with time included
     * @param {string|Date|number} dateInput - The date to format
     * @param {string} fallback - Text to show for invalid dates
     * @returns {string} Formatted date with time or fallback text
     */
    const formatDateTime = (dateInput, fallback = 'Date Missing') => {
        return formatDateSafe(dateInput, { 
            format: 'short', 
            showTime: true, 
            fallback 
        });
    };

    /**
     * Format date relative to now (e.g., "2 days ago", "in 3 hours")
     * @param {string|Date|number} dateInput - The date to format
     * @param {string} fallback - Text to show for invalid dates
     * @returns {string} Relative date string or fallback text
     */
    const formatRelative = (dateInput, fallback = 'Date Missing') => {
        return formatDateSafe(dateInput, { 
            format: 'relative', 
            fallback 
        });
    };

    /**
     * Format date in ISO format (YYYY-MM-DD)
     * @param {string|Date|number} dateInput - The date to format
     * @param {string} fallback - Text to show for invalid dates
     * @returns {string} ISO formatted date or fallback text
     */
    const formatISO = (dateInput, fallback = 'Date Missing') => {
        return formatDateSafe(dateInput, { 
            format: 'iso', 
            fallback 
        });
    };

    /**
     * Format date in long format (e.g., "Monday, January 1, 2024")
     * @param {string|Date|number} dateInput - The date to format
     * @param {string} fallback - Text to show for invalid dates
     * @returns {string} Long formatted date or fallback text
     */
    const formatLong = (dateInput, fallback = 'Date Missing') => {
        return formatDateSafe(dateInput, { 
            format: 'long', 
            fallback 
        });
    };

    /**
     * Check if a date is a Unix epoch date (1969-1970)
     * @param {string|Date|number} dateInput - The date to check
     * @returns {boolean} True if it's a Unix epoch date
     */
    const isEpochDate = (dateInput) => {
        if (!dateInput) return false;
        
        try {
            const date = new Date(dateInput);
            if (isNaN(date.getTime())) return false;
            
            const year = date.getFullYear();
            return year <= 1970 && year >= 1969;
        } catch {
            return false;
        }
    };

    /**
     * Check if a date is valid and not an epoch date
     * @param {string|Date|number} dateInput - The date to check
     * @returns {boolean} True if it's a valid, non-epoch date
     */
    const isValidDate = (dateInput) => {
        if (!dateInput) return false;
        
        try {
            const date = new Date(dateInput);
            if (isNaN(date.getTime())) return false;
            
            const year = date.getFullYear();
            return year > 1970 && year <= 2100;
        } catch {
            return false;
        }
    };

    return {
        formatDate,
        safeDate,
        formatDateTime,
        formatRelative,
        formatISO,
        formatLong,
        isEpochDate,
        isValidDate
    };
} 