import { auditClient } from '@/services/auditClient';

/**
 * Billing Details Service
 * Retrieves detailed billing line items for locations and charge signatures
 */
export const billingDetailsService = {
  /**
   * Get billing line items for a specific location
   */
  async getBillingDetailsByLocation(locationId) {
    try {
      const response = await auditClient.http.get(`/billing/details/${locationId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch billing details:', error);
      return null;
    }
  },

  /**
   * Get billing line items breakdown for a charge signature
   * This gets the detailed breakdown of charges that make up the signature
   */
  async getBillingDetailsBySignature(customerId, chargeSignature) {
    try {
      // Use the breakdown endpoint to get line item details
      const response = await auditClient.http.get(
        `/audit-signatures/customers/${customerId}/charge-signatures/${encodeURIComponent(chargeSignature)}/breakdown`
      );
      
      if (!response.data) {
        return { line_items: [], total_monthly: 0 };
      }

      // Process the breakdown response
      return this.processSignatureBreakdown(response.data);
    } catch (error) {
      console.error('Failed to fetch billing details by signature:', error);
      return { line_items: [], total_monthly: 0 };
    }
  },

  /**
   * Process signature breakdown response
   */
  processSignatureBreakdown(breakdownData) {
    if (!breakdownData) {
      return { line_items: [], total_monthly: 0 };
    }

    const lineItems = [];
    let totalMonthly = 0;

    // Use line_items array to preserve individual line items with different prices
    if (breakdownData.line_items && breakdownData.line_items.length > 0) {
      breakdownData.line_items.forEach((item, index) => {
        const lineItem = {
          charge_code: item.charge_code,
          description: item.display_name || item.description,
          item_no: item.item_no,
          quantity: 1,
          unit_price: item.amount,
          total_amount: item.amount,
          billing_type: 'Monthly',
          category: this.categorizeCharge(item.charge_code),
          // Add index to make each line unique even with same charge code
          id: `${item.charge_code}_${index}`
        };
        
        lineItems.push(lineItem);
        totalMonthly += item.amount;
      });
    }

    return {
      line_items: lineItems,
      total_monthly: breakdownData.total_amount || totalMonthly,
      signature: breakdownData.signature,
      sample_location: breakdownData.sample_location
    };
  },

  /**
   * Process and normalize billing details
   */
  processBillingDetails(billingData) {
    if (!billingData || !billingData.billing_lines) {
      return { line_items: [], total_monthly: 0 };
    }

    // Group and aggregate line items by charge code
    const aggregated = {};
    let totalMonthly = 0;

    billingData.billing_lines.forEach(line => {
      const key = line.charge_code || line.description;
      
      if (!aggregated[key]) {
        aggregated[key] = {
          charge_code: line.charge_code,
          description: line.description || line.charge_description,
          quantity: 0,
          unit_price: line.unit_price || line.amount,
          total_amount: 0,
          billing_type: line.billing_type || 'Monthly',
          category: this.categorizeCharge(line.charge_code)
        };
      }

      aggregated[key].quantity += (line.quantity || 1);
      aggregated[key].total_amount += (line.amount || 0);
      
      if (line.billing_type === 'Monthly' || !line.billing_type) {
        totalMonthly += (line.amount || 0);
      }
    });

    return {
      line_items: Object.values(aggregated),
      total_monthly: totalMonthly,
      signature: billingData.charge_signature
    };
  },

  /**
   * Categorize charge code into service type
   */
  categorizeCharge(chargeCode) {
    if (!chargeCode) return 'Other';
    
    const code = chargeCode.toUpperCase();
    
    if (code.includes('TP') || code.includes('TRANSPORT')) return 'Transport';
    if (code.includes('TA') || code.includes('ACCESS')) return 'Internet Access';
    if (code.includes('TEM') || code.includes('MANAGE')) return 'Managed Services';
    if (code.includes('VZ') || code.includes('BACKUP')) return 'Backup Services';
    if (code.includes('SEC') || code.includes('SECURITY')) return 'Security';
    if (code.includes('VOICE') || code.includes('PHONE')) return 'Voice Services';
    if (code.includes('CLOUD')) return 'Cloud Services';
    
    return 'Other Services';
  },

  /**
   * Map billing line items to service bundle components
   */
  mapToServiceBundle(lineItems) {
    const bundleComponents = [];
    
    lineItems.forEach(item => {
      bundleComponents.push({
        service_type: item.category,
        charge_code: item.charge_code,
        description: item.description,
        quantity: item.quantity,
        monthly_cost: item.total_amount,
        suggested_product: null, // To be mapped later
        suggested_bundle_id: null // To be mapped later
      });
    });

    return bundleComponents;
  },

  /**
   * Get suggested service bundles based on billing line items
   */
  async getSuggestedBundles(customerId, lineItems) {
    try {
      // This would call an API to get bundle suggestions based on line items
      const response = await auditClient.http.post(
        `/contracts/suggest-bundles`,
        {
          customer_id: customerId,
          line_items: lineItems
        }
      );
      return response.data?.suggestions || [];
    } catch (error) {
      console.error('Failed to get bundle suggestions:', error);
      return [];
    }
  }
};