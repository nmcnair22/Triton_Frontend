import { auditClient } from '@/services/auditClient';

/**
 * Charge Signature Service
 * Manages charge signatures from audit data for location profile creation
 */
export const chargeSignatureService = {
  /**
   * Get unique charge signatures from latest audit
   */
  async getChargeSignatures(customerId) {
    try {
      const response = await auditClient.http.get(`/audit-signatures/customers/${customerId}/charge-signatures`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch charge signatures:', error);
      return {
        charge_signatures: { unique_signatures: [] },
        asset_signatures: { unique_signatures: [] },
        top_configurations: []
      };
    }
  },

  /**
   * Get detailed breakdown for a specific charge signature
   */
  async getSignatureDetails(customerId, signature) {
    try {
      const response = await auditClient.http.get(
        `/audit-signatures/customers/${customerId}/charge-signatures/${encodeURIComponent(signature)}`
      );
      return response.data;
    } catch (error) {
      console.error('Failed to fetch signature details:', error);
      return null;
    }
  },

  /**
   * Format signature for display
   */
  formatSignature(signature) {
    // Convert TP-TA-TEM to more readable format
    return signature.split('-').join(' + ');
  },

  /**
   * Parse combined signature
   */
  parseCombinedSignature(combinedSignature) {
    // Parse "CP:1-MD:6|TP-TA-TEM" format
    const [assetPart, chargePart] = combinedSignature.split('|');
    return {
      asset_signature: assetPart || '',
      charge_signature: chargePart || '',
      display: `${assetPart} with ${chargePart}`
    };
  },

  /**
   * Get signature statistics
   */
  getSignatureStats(signatures) {
    if (!signatures || !signatures.unique_signatures) return null;
    
    const totalLocations = signatures.unique_signatures.reduce(
      (sum, sig) => sum + sig.location_count, 0
    );
    
    const avgCost = signatures.unique_signatures.reduce(
      (sum, sig) => sum + (sig.avg_monthly_cost * sig.location_count), 0
    ) / totalLocations;
    
    return {
      total_signatures: signatures.unique_signatures.length,
      total_locations: totalLocations,
      avg_monthly_cost: avgCost || 0
    };
  }
};