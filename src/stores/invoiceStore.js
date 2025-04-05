import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { InvoiceService } from '@/service/ApiService';

export const useInvoiceStore = defineStore('invoice', () => {
  // State
  const invoices = ref([]);
  const customerInvoices = ref([]);
  const currentInvoice = ref(null);
  const currentEnrichedInvoice = ref(null);
  const loading = ref(false);
  const loadingCustomerInvoices = ref(false);
  const loadingEnrichedInvoice = ref(false);
  const error = ref(null);
  const customerInvoicesError = ref(null);
  const enrichedInvoiceError = ref(null);

  // Getters
  const getInvoiceById = computed(() => {
    return (id) => invoices.value.find(invoice => invoice.id === id);
  });

  const totalInvoices = computed(() => invoices.value.length);
  const totalCustomerInvoices = computed(() => customerInvoices.value.length);

  // Field mapping function for normalized line item data
  const mapEnrichedLineFields = (enrichedLine) => {
    return {
      sequence: enrichedLine.Line_No,
      lineObjectNumber: enrichedLine.No,
      lineType: enrichedLine.Type,
      description: enrichedLine.Description,
      description2: enrichedLine.Description_2,
      quantity: enrichedLine.Quantity,
      unitPrice: enrichedLine.Unit_Price,
      amountExcludingTax: enrichedLine.Line_Amount,
      amountIncludingTax: enrichedLine.Amount_Including_VAT,
      unitOfMeasureCode: enrichedLine.Unit_of_Measure_Code,
      taxPercent: enrichedLine.VAT_Percent,
      discountPercent: enrichedLine.Line_Discount_Percent,
      discountAmount: enrichedLine.Line_Discount_Amount,
      invoiceDiscountAllocation: enrichedLine.Invoice_Discount_Amount,
      // Additional enriched fields
      documentNo: enrichedLine.Document_No,
      genProdPostingGroup: enrichedLine.Gen_Prod_Posting_Group,
      jobNo: enrichedLine.Job_No,
      jobTaskNo: enrichedLine.Job_Task_No,
      cisId: enrichedLine.CIS_ID,
      jobContractEntryNo: enrichedLine.Job_Contract_Entry_No,
      glAccountCategory: enrichedLine.GLAccountCategory,
      glAccountSubCategory: enrichedLine.GLAccountSubCategory,
      glAccountName: enrichedLine.GLAccountName,
      glAccountId: enrichedLine.GLAccountId,
      udfL1: enrichedLine.Bssi_UDF_L1,
      udfL2: enrichedLine.Bssi_UDF_L2,
      udfL3: enrichedLine.Bssi_UDF_L3,
      udfL4: enrichedLine.Bssi_UDF_L4,
      udfL13: enrichedLine.Bssi_UDF_L13
    };
  };

  // Actions
  async function fetchInvoices(params = {}) {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await InvoiceService.getInvoices(params);
      if (response.data && response.data.data) {
        invoices.value = response.data.data;
      } else {
        invoices.value = [];
        console.error('Unexpected response format:', response.data);
      }
      return invoices.value;
    } catch (err) {
      error.value = err.message || 'Failed to fetch invoices';
      console.error('Error fetching invoices:', err);
      return [];
    } finally {
      loading.value = false;
    }
  }

  async function fetchCustomerInvoices(filterConditions, params = {}) {
    if (!filterConditions) {
      customerInvoices.value = [];
      return [];
    }
    
    loadingCustomerInvoices.value = true;
    customerInvoicesError.value = null;
    
    try {
      const response = await InvoiceService.getCustomerInvoices(filterConditions, params);
      
      if (response.data && response.data.success && response.data.data && response.data.data.value) {
        // Process the invoice data to match the expected format for the frontend
        customerInvoices.value = response.data.data.value.map(invoice => ({
          id: invoice.id,
          number: invoice.number,
          customerId: invoice.customerId,
          customerName: invoice.customerName,
          date: invoice.invoiceDate,
          dueDate: invoice.dueDate,
          total: invoice.totalAmountIncludingTax,
          remainingAmount: invoice.remainingAmount || 0,
          status: invoice.status.toLowerCase(),
          items: [] // Invoice items would need to be fetched separately if needed
        }));
      } else {
        customerInvoices.value = [];
        console.error('Unexpected response format:', response.data);
      }
      return customerInvoices.value;
    } catch (err) {
      customerInvoicesError.value = err.message || `Failed to fetch invoices`;
      console.error(`Error fetching invoices:`, err);
      return [];
    } finally {
      loadingCustomerInvoices.value = false;
    }
  }

  async function fetchInvoice(id) {
    loading.value = true;
    error.value = null;
    
    try {
      // Try to fetch the detailed sales invoice first
      const invoiceResponse = await InvoiceService.getSalesInvoice(id);
      
      if (invoiceResponse.data && invoiceResponse.data.success && invoiceResponse.data.data) {
        const invoiceData = invoiceResponse.data.data;
        
        // Fetch invoice lines
        const linesResponse = await InvoiceService.getSalesInvoiceLines(id);
        let invoiceLines = [];
        
        if (linesResponse.data && linesResponse.data.success && linesResponse.data.data.value) {
          invoiceLines = linesResponse.data.data.value.map(line => ({
            description: line.description,
            quantity: line.quantity.toString(),
            price: `$${line.unitPrice.toFixed(2)}`,
            total: `$${line.amountIncludingTax.toFixed(2)}`
          }));
        }
        
        // Format the invoice data
        const formattedInvoice = {
          id: invoiceData.id,
          number: invoiceData.number,
          date: invoiceData.invoiceDate,
          dueDate: invoiceData.dueDate,
          status: invoiceData.status.toLowerCase(),
          customer: {
            id: invoiceData.customerNumber,
            name: invoiceData.customerName,
            company: invoiceData.billToName,
            address: [
              invoiceData.billToAddressLine1,
              invoiceData.billToAddressLine2,
              `${invoiceData.billToCity}, ${invoiceData.billToState} ${invoiceData.billToPostCode}`
            ].filter(Boolean).join('\n')
          },
          subtotal: invoiceData.totalAmountExcludingTax,
          vat: invoiceData.totalTaxAmount,
          vatRate: invoiceData.totalTaxAmount > 0 ? ((invoiceData.totalTaxAmount / invoiceData.totalAmountExcludingTax) * 100).toFixed(0) : 0,
          total: invoiceData.totalAmountIncludingTax,
          remainingAmount: invoiceData.remainingAmount || 0,
          items: invoiceLines
        };
        
        currentInvoice.value = formattedInvoice;
        return formattedInvoice;
      } else {
        // Fall back to the original method if the sales invoice fetching fails
        const response = await InvoiceService.getInvoice(id);
        if (response.data && response.data.data) {
          currentInvoice.value = response.data.data;
        } else {
          currentInvoice.value = null;
          console.error('Unexpected response format:', response.data);
        }
        return currentInvoice.value;
      }
    } catch (err) {
      error.value = err.message || `Failed to fetch invoice #${id}`;
      console.error(`Error fetching invoice #${id}:`, err);
      return null;
    } finally {
      loading.value = false;
    }
  }

  async function fetchEnrichedInvoiceLines(documentNumber) {
    if (!documentNumber) {
      enrichedInvoiceError.value = 'Document number is required';
      return null;
    }
    
    loadingEnrichedInvoice.value = true;
    enrichedInvoiceError.value = null;
    
    try {
      const response = await InvoiceService.getEnrichedSalesInvoiceLines(documentNumber);
      
      if (response.data && response.data.success && response.data.data && response.data.data.value) {
        // Store both the raw and normalized data
        const rawEnrichedLines = response.data.data.value;
        const enrichedLines = rawEnrichedLines.map(mapEnrichedLineFields);
        
        // Create a copy of the current invoice and add the enriched line items
        if (currentInvoice.value) {
          currentEnrichedInvoice.value = {
            ...currentInvoice.value,
            enrichedItems: enrichedLines,
            rawEnrichedItems: rawEnrichedLines,
            rawResponse: response.data,
            isEnriched: true
          };
        } else {
          // If no current invoice exists, create a minimal structure
          currentEnrichedInvoice.value = {
            documentNumber,
            enrichedItems: enrichedLines,
            rawEnrichedItems: rawEnrichedLines,
            rawResponse: response.data,
            isEnriched: true
          };
        }
        
        return currentEnrichedInvoice.value;
      } else {
        currentEnrichedInvoice.value = null;
        console.error('Unexpected response format in enriched invoice data:', response.data);
        enrichedInvoiceError.value = 'Failed to parse enriched invoice data';
        return null;
      }
    } catch (err) {
      enrichedInvoiceError.value = err.message || `Failed to fetch enriched invoice #${documentNumber}`;
      console.error(`Error fetching enriched invoice #${documentNumber}:`, err);
      return null;
    } finally {
      loadingEnrichedInvoice.value = false;
    }
  }

  async function createInvoice(invoice) {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await InvoiceService.createInvoice(invoice);
      if (response.data && response.data.data) {
        invoices.value.push(response.data.data);
        return response.data.data;
      }
      return null;
    } catch (err) {
      error.value = err.message || 'Failed to create invoice';
      console.error('Error creating invoice:', err);
      return null;
    } finally {
      loading.value = false;
    }
  }

  async function updateInvoice(invoice) {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await InvoiceService.updateInvoice(invoice);
      if (response.data && response.data.data) {
        const index = invoices.value.findIndex(i => i.id === invoice.id);
        if (index !== -1) {
          invoices.value[index] = response.data.data;
        }
        if (currentInvoice.value && currentInvoice.value.id === invoice.id) {
          currentInvoice.value = response.data.data;
        }
        return response.data.data;
      }
      return null;
    } catch (err) {
      error.value = err.message || `Failed to update invoice #${invoice.id}`;
      console.error(`Error updating invoice #${invoice.id}:`, err);
      return null;
    } finally {
      loading.value = false;
    }
  }

  async function deleteInvoice(id) {
    loading.value = true;
    error.value = null;
    
    try {
      await InvoiceService.deleteInvoice(id);
      invoices.value = invoices.value.filter(invoice => invoice.id !== id);
      if (currentInvoice.value && currentInvoice.value.id === id) {
        currentInvoice.value = null;
      }
      return true;
    } catch (err) {
      error.value = err.message || `Failed to delete invoice #${id}`;
      console.error(`Error deleting invoice #${id}:`, err);
      return false;
    } finally {
      loading.value = false;
    }
  }

  // Reset state
  function resetState() {
    invoices.value = [];
    customerInvoices.value = [];
    currentInvoice.value = null;
    currentEnrichedInvoice.value = null;
    error.value = null;
    customerInvoicesError.value = null;
    enrichedInvoiceError.value = null;
  }

  return {
    // State
    invoices,
    customerInvoices,
    currentInvoice,
    currentEnrichedInvoice,
    loading,
    loadingCustomerInvoices,
    loadingEnrichedInvoice,
    error,
    customerInvoicesError,
    enrichedInvoiceError,
    
    // Getters
    getInvoiceById,
    totalInvoices,
    totalCustomerInvoices,
    
    // Actions
    fetchInvoices,
    fetchCustomerInvoices,
    fetchInvoice,
    fetchEnrichedInvoiceLines,
    createInvoice,
    updateInvoice,
    deleteInvoice,
    resetState
  };
}); 