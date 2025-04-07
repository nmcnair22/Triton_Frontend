export const sampleDataReduction = (data, option, show) => {
    let sampledData = [];
    let tempData = [];
    const dataLength = data.length;

    if (dataLength === 0) return sampledData;

    const timeUnits = {
        millisecond: 1,
        second: 1000,
        minute: 60 * 1000,
        hour: 60 * 60 * 1000,
        day: 24 * 60 * 60 * 1000,
        week: 7 * 24 * 60 * 60 * 1000,
        month: 30 * 24 * 60 * 60 * 1000,
        quarter: 90 * 24 * 60 * 60 * 1000,
        year: 365 * 24 * 60 * 60 * 1000
    };
    const selectedMultiplier = timeUnits[option];
    const endDate = new Date(data[dataLength - 1].x);
    const firstData = new Date(data[0].x);
    const calculatedDate = new Date(endDate.getTime() - show * selectedMultiplier);
    const startDate = firstData.getTime() > calculatedDate.getTime() ? firstData : calculatedDate;
    tempData = data.filter((item) => new Date(item.x) >= startDate);
    const tempLen = tempData.length;
    if (option === 'minute' || option === 'second' || option === 'millisecond') {
        if (tempLen < show) {
            const endDate = new Date(data[data.length - 1].x);
            const startDate = new Date(endDate);
            startDate.setHours(endDate.getHours() - 4);
            tempData = data.filter((item) => new Date(item.x) >= startDate);
        }
        return tempData;
    } else if (option === 'day' || option === 'hour') {
        return tempData;
    } else if (option === 'week' || option === 'month' || option === 'quarter' || option === 'year') {
        const sliceUnits = {
            week: 7,
            month: 30,
            quarter: 90,
            year: 365 / 2
        };
        const selectedSlicer = parseInt(sliceUnits[option]);
        for (let i = 0; i < tempLen; i += selectedSlicer) {
            const range = tempData.slice(i, i + selectedSlicer);
            const rangeAverage = range.reduce((sum, value) => sum + value.y, 0) / range.length;
            sampledData.push({ x: range[0].x, y: rangeAverage });
        }
        return sampledData;
    }
    return data;
};

export const sampleDataReductionByArray = (data, option, show) => {
    let sampledData = [];
    const dataLength = data.length;

    if (dataLength === 0) return sampledData;

    const timeUnits = {
        millisecond: 1,
        second: 1000,
        minute: 60 * 1000,
        hour: 60 * 60 * 1000,
        day: 24 * 60 * 60 * 1000,
        week: 7 * 24 * 60 * 60 * 1000,
        month: 30 * 24 * 60 * 60 * 1000,
        quarter: 90 * 24 * 60 * 60 * 1000,
        year: 365 * 24 * 60 * 60 * 1000
    };
    const selectedMultiplier = timeUnits[option];
    const endDate = new Date(data[dataLength - 1].x);
    const firstData = new Date(data[0].x);
    const calculatedDate = new Date(endDate.getTime() - show * selectedMultiplier);
    const startDate = firstData.getTime() > calculatedDate.getTime() ? firstData : calculatedDate;
    let tempData = data.filter((item) => new Date(item.x) >= startDate);
    const tempLen = tempData.length;

    if (option === 'minute' || option === 'second' || option === 'millisecond') {
        if (tempLen < show) {
            const endDate = new Date(data[data.length - 1].x);
            const startDate = new Date(endDate);
            startDate.setHours(endDate.getHours() - 4);
            tempData = data.filter((item) => new Date(item.x) >= startDate);
        }
        return tempData;
    } else if (option === 'day' || option === 'hour') {
        return tempData;
    } else if (option === 'week' || option === 'month' || option === 'quarter' || option === 'year') {
        const sliceUnits = {
            week: 7,
            month: 30,
            quarter: 90,
            year: 365 / 2
        };
        const selectedSlicer = parseInt(sliceUnits[option]);
        for (let i = 0; i < tempLen; i += selectedSlicer) {
            sampledData.push(tempData[i]);
        }
        return sampledData;
    }
    return data;
};

export const sampleDataByFixedLength = (data, option, show) => {
    let sampledData = [];
    const dataLength = data.length;

    if (dataLength === 0) return sampledData;

    const timeUnits = {
        millisecond: 'millisecond',
        second: 'second',
        minute: 'minute',
        hour: 'hour',
        day: 'day',
        week: 'week',
        month: 'month',
        quarter: 'quarter',
        year: 'year'
    };

    if (!timeUnits[option]) return data;

    const parseDate = (dateStr) => new Date(dateStr);

    const average = (arr) => {
        if (arr.length === 0) return 0;
        if (typeof arr[0] === 'number') {
            return arr.reduce((acc, val) => acc + val, 0) / arr.length;
        } else {
            const length = arr[0].length;

            const avgArr = [];
            Array(length)
                .fill(null)
                .forEach((_, i) => {
                    const val = arr.map((data) => Number(data[i])).reduce((acc, val) => acc + val, 0) / arr.length;
                    avgArr.push(val);
                });
            return avgArr;
        }
    };

    let tempData = [];
    let currentUnit = null;

    for (let i = dataLength - 1; i >= 0; i--) {
        const dataPoint = data[i];
        const date = parseDate(dataPoint.x);

        let unit = null;
        if (option === 'day') {
            unit = Math.floor(date.getTime() / (24 * 60 * 60 * 1000));
        } else if (option === 'week') {
            unit = Math.floor(date.getTime() / (7 * 24 * 60 * 60 * 1000));
        } else if (option === 'month') {
            unit = date.getFullYear() * 12 + date.getMonth();
        } else if (option === 'year') {
            unit = date.getFullYear();
        } else if (option === 'hour') {
            unit = Math.floor(date.getTime() / (60 * 60 * 1000));
        } else if (option === 'minute') {
            unit = Math.floor(date.getTime() / (60 * 1000));
        } else if (option === 'second') {
            unit = Math.floor(date.getTime() / 1000);
        } else if (option === 'millisecond') {
            unit = Math.floor(date.getTime() / 1);
        } else if (option === 'quarter') {
            unit = date.getFullYear() * 4 + Math.floor(date.getMonth() / 3);
        }

        if (currentUnit === null) {
            currentUnit = unit;
        }

        if (unit !== currentUnit) {
            const avgValues = average(tempData.map((item) => item.y));
            sampledData.unshift({ x: tempData[0].x, y: avgValues });
            tempData = [];
            currentUnit = unit;
        }

        tempData.push(dataPoint);

        if (sampledData.length >= show) {
            break;
        }
    }

    if (tempData.length > 0) {
        const avgValues = average(tempData.map((item) => item.y));
        sampledData.unshift({ x: tempData[0].x, y: avgValues });
    }
    if (['week', 'month', 'quarter'].includes(option)) {
        const days = {
            week: 7,
            month: 30,
            quarter: 90
        };
        const dayCn = 24 * 60 * 60 * 1000;
        if (new Date(sampledData[sampledData.length - 1].x).getTime() / dayCn - new Date(sampledData[sampledData.length - 2].x).getTime() / dayCn < days[option]) {
            sampledData.pop();
        } else {
            sampledData.shift();
        }
    }
    return sampledData;
};

export const generateRandomData = (startDate, endDate, intervalHours, minValue, maxValue) => {
    let data = [];
    let currentDate = new Date(startDate);
    const end = new Date(endDate);

    while (currentDate <= end) {
        const currentValue = minValue + Math.random() * (maxValue - minValue);

        data.push({ x: new Date(currentDate), y: parseFloat(currentValue.toFixed(2)) });

        currentDate = new Date(currentDate.getTime() + intervalHours * 60 * 60 * 1000);
    }

    return data;
};

export const generateRandomMultiData = (startDate, endDate, intervalHours, minValue, maxValue, datasetsCount = 2, inter = false) => {
    let data = [];
    let currentDate = new Date(startDate);
    const end = new Date(endDate);

    while (currentDate <= end) {
        let currentValues;
        if (inter) {
            let incr = maxValue;
            currentValues = Array(datasetsCount)
                .fill(null)
                .map((_, i) => {
                    return (minValue + Math.random() * (maxValue - minValue) + incr * (datasetsCount - i * 1.2)).toFixed(0);
                });
        } else {
            currentValues = Array(datasetsCount)
                .fill(null)
                .map(() => {
                    return (minValue + Math.random() * (maxValue - minValue)).toFixed(0);
                });
        }
        data.push({ x: new Date(currentDate), y: [...currentValues] });

        currentDate = new Date(currentDate.getTime() + intervalHours * 60 * 60 * 1000);
    }
    return data;
};

/**
 * Format a date for display (mm/dd/yyyy)
 * @param {string|Date} date - The date to format
 * @param {string} [format='mm/dd/yyyy'] - The format to use
 * @returns {string} The formatted date or empty string if invalid
 */
export const formatDate = (date, format = 'mm/dd/yyyy') => {
  if (!date) return '';
  
  try {
    const d = new Date(date);
    if (isNaN(d)) return '';
    
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    const year = d.getFullYear();
    
    if (format === 'mm/dd/yyyy') {
      return `${month}/${day}/${year}`;
    } else if (format === 'yyyy-mm-dd') {
      return `${year}-${month}-${day}`;
    } else {
      return `${month}/${day}/${year}`;
    }
  } catch (e) {
    console.error('Error formatting date:', e);
    return '';
  }
};

/**
 * Format a number as currency with proper thousand separators
 * @param {number} amount - The amount to format
 * @param {boolean} showSymbol - Whether to show the currency symbol
 * @param {number} maxDecimals - Maximum number of decimal places
 * @param {string} [currency='USD'] - The currency to use
 * @param {string} [locale='en-US'] - The locale to use
 * @returns {string} The formatted currency or empty string if invalid
 */
export const formatCurrency = (amount, showSymbol = true, maxDecimals = 2, currency = 'USD', locale = 'en-US') => {
  if (amount === null || amount === undefined) {
    return showSymbol ? '$0.00' : '0.00';
  }
  
  try {
    // Format with Intl.NumberFormat for consistent formatting
    const formatter = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: maxDecimals
    });
    
    const formatted = formatter.format(amount);
    
    // If we don't want to show the currency symbol, remove it
    if (!showSymbol) {
      return formatted.replace(/[^\d.,]/g, '').trim();
    }
    
    return formatted;
  } catch (e) {
    // Fallback simple formatting if Intl is not supported
    const value = parseFloat(amount).toFixed(maxDecimals);
    return showSymbol ? `$${value}` : value;
  }
};

/**
 * Format a number with the specified decimals and thousand separators
 * @param {number} number - The number to format
 * @param {number} [decimals=2] - Number of decimal places
 * @param {string} [locale='en-US'] - The locale to use
 * @returns {string} The formatted number or empty string if invalid
 */
export const formatNumber = (number, decimals = 2, locale = 'en-US') => {
  if (number === null || number === undefined) return '';
  
  try {
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(number);
  } catch (e) {
    console.error('Error formatting number:', e);
    return '';
  }
};

/**
 * Format a due date message based on its status
 * @param {string|Date} dueDate - The due date
 * @param {string} status - The invoice status
 * @returns {object} Object with message and CSS class
 */
export const formatDueDate = (dueDate, status) => {
  if (!dueDate) return { message: 'No due date', class: 'text-surface-400' };
  
  try {
    const now = new Date();
    const due = new Date(dueDate);
    const diffTime = due - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // For paid invoices, just show the date
    if (status === 'paid') {
      return { 
        message: formatDate(dueDate), 
        class: 'text-surface-700'
      };
    }
    
    // For overdue invoices
    if (diffDays < 0) {
      return { 
        message: `Overdue by ${Math.abs(diffDays)} days`, 
        class: 'text-red-500 font-medium'
      };
    }
    
    // For invoices due soon (within next 3 days)
    if (diffDays <= 3) {
      return { 
        message: `Due in ${diffDays} days`, 
        class: 'text-yellow-500 font-medium'
      };
    }
    
    // Default case - just show the date
    return { 
      message: formatDate(dueDate), 
      class: 'text-surface-700'
    };
  } catch (e) {
    console.error('Error formatting due date:', e);
    return { message: formatDate(dueDate), class: '' };
  }
};

/**
 * Group invoice line items by a specific field
 * @param {Array} items - The array of invoice line items to group
 * @param {string} groupBy - The field to group by (e.g., 'glAccountCategory', 'jobNo')
 * @returns {Object} Object with grouped items and calculated subtotals
 */
export const groupInvoiceItems = (items, groupBy) => {
  if (!items || !Array.isArray(items) || items.length === 0) {
    return { groups: [], groupNames: [] };
  }
  
  try {
    // Create a map to group the items
    const groupMap = new Map();
    
    // Determine the display field based on the groupBy option
    const getGroupName = (item) => {
      switch (groupBy) {
        case 'product':
          return item.genProdPostingGroup || 'Other';
        case 'location':
          return item.udfL1 || 'Other';
        case 'category':
          return item.glAccountCategory || 'Other';
        case 'service':
          return item.description || 'Other';
        default:
          return 'All Items';
      }
    };
    
    // Group the items
    items.forEach(item => {
      const groupName = getGroupName(item);
      
      if (!groupMap.has(groupName)) {
        groupMap.set(groupName, []);
      }
      
      groupMap.get(groupName).push(item);
    });
    
    // Convert the map to an array of groups with totals
    const groups = Array.from(groupMap.entries()).map(([name, groupItems]) => {
      // Calculate the total for this group
      const groupTotal = groupItems.reduce((sum, item) => {
        return sum + (parseFloat(item.amountIncludingTax) || 0);
      }, 0);
      
      return {
        name,
        items: groupItems,
        total: groupTotal
      };
    });
    
    // Sort groups by name
    groups.sort((a, b) => a.name.localeCompare(b.name));
    
    // Extract just the group names for easy access
    const groupNames = groups.map(group => group.name);
    
    return { groups, groupNames };
  } catch (e) {
    console.error('Error grouping invoice items:', e);
    return { groups: [], groupNames: [] };
  }
};
