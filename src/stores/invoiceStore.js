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
  
  // Template state
  const availableTemplates = ref([]);
  const loadingTemplates = ref(false);
  const templatesError = ref(null);
  const generatedFiles = ref([]);
  const loadingGeneratedFiles = ref(false);
  const generatedFilesError = ref(null);
  const generatingTemplate = ref(false);
  const generateTemplateError = ref(null);
  const customerDocuments = ref([]);
  const loadingCustomerDocuments = ref(false);
  const customerDocumentsError = ref(null);

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
        error.value = 'Unexpected response format';
      }
      return invoices.value;
    } catch (err) {
      error.value = err.message || 'Failed to fetch invoices';
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
        customerInvoicesError.value = 'Unexpected response format';
      }
      return customerInvoices.value;
    } catch (err) {
      customerInvoicesError.value = err.message || `Failed to fetch invoices`;
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
          error.value = 'Unexpected response format';
        }
        return currentInvoice.value;
      }
    } catch (err) {
      error.value = err.message || `Failed to fetch invoice #${id}`;
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
        enrichedInvoiceError.value = 'Failed to parse enriched invoice data';
        return null;
      }
    } catch (err) {
      enrichedInvoiceError.value = err.message || `Failed to fetch enriched invoice #${documentNumber}`;
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

  // Template Actions
  
  // Fetch available templates for a client and optionally an invoice number
  async function fetchAvailableTemplates(clientId, invoiceNumber = null) {
    if (!clientId) {
      templatesError.value = 'Client ID is required';
      availableTemplates.value = [];
      return [];
    }
    
    loadingTemplates.value = true;
    templatesError.value = null;
    
    try {
      const response = await InvoiceService.getAvailableTemplates(clientId, invoiceNumber);
      
      if (response.data && response.data.success && response.data.data) {
        availableTemplates.value = response.data.data;
        return availableTemplates.value;
      } else {
        availableTemplates.value = [];
        templatesError.value = 'Failed to load available templates';
        return [];
      }
    } catch (err) {
      templatesError.value = err.message || 'Failed to fetch available templates';
      availableTemplates.value = [];
      return [];
    } finally {
      loadingTemplates.value = false;
    }
  }
  
  // Generate a document from a template for an invoice
  async function generateTemplate(invoiceNumber, templateId) {
    if (!invoiceNumber || !templateId) {
      generateTemplateError.value = 'Invoice number and template ID are required';
      return null;
    }
    
    generatingTemplate.value = true;
    generateTemplateError.value = null;
    
    try {
      const response = await InvoiceService.generateTemplate(invoiceNumber, templateId);
      
      if (response.data && response.data.success && response.data.data) {
        // After successful generation, refresh the list of generated files
        await fetchGeneratedFiles(invoiceNumber);
        return response.data.data;
      } else {
        generateTemplateError.value = 'Failed to generate template';
        return null;
      }
    } catch (err) {
      generateTemplateError.value = err.message || 'Failed to generate template';
      return null;
    } finally {
      generatingTemplate.value = false;
    }
  }
  
  // Fetch generated files for an invoice
  async function fetchGeneratedFiles(invoiceNumber) {
    if (!invoiceNumber) {
      generatedFilesError.value = 'Invoice number is required';
      generatedFiles.value = [];
      return [];
    }
    
    loadingGeneratedFiles.value = true;
    generatedFilesError.value = null;
    
    try {
      const response = await InvoiceService.getInvoiceDocuments(invoiceNumber);
      
      if (response.data && response.data.success) {
        let processedFiles = [];
        
        // Check if documents is a single job object
        if (response.data.documents && response.data.documents.outputs) {
          const job = response.data.documents;
          processedFiles = extractFilesFromJob(job);
        } 
        // Check if documents is an array of jobs
        else if (Array.isArray(response.data.documents)) {
          response.data.documents.forEach(job => {
            if (job && job.outputs) {
              processedFiles.push(...extractFilesFromJob(job));
            }
          });
        }
        // Check if documents is an object containing jobs (with job_id keys)
        else if (typeof response.data.documents === 'object') {
          Object.values(response.data.documents).forEach(job => {
            if (job && job.outputs) {
              processedFiles.push(...extractFilesFromJob(job));
            }
          });
        }
        // Fallback for legacy format
        else if (Array.isArray(response.data.jobs)) {
          response.data.jobs.forEach(job => {
            if (job && job.outputs) {
              processedFiles.push(...extractFilesFromJob(job));
            }
          });
        }
        
        generatedFiles.value = processedFiles;
        return processedFiles;
      } else {
        generatedFiles.value = [];
        generatedFilesError.value = response.data.message || 'Failed to load generated files';
        return [];
      }
    } catch (err) {
      generatedFilesError.value = err.message || 'Failed to fetch generated files';
      generatedFiles.value = [];
      return [];
    } finally {
      loadingGeneratedFiles.value = false;
    }
  }
  
  // Helper function to extract files from a job's outputs structure
  function extractFilesFromJob(job) {
    const files = [];
    
    if (!job.outputs) return files;
    
    // Process PDF files which are in an object with keys like 'summary', 'consolidated', etc.
    if (job.outputs.pdf && typeof job.outputs.pdf === 'object') {
      Object.entries(job.outputs.pdf).forEach(([type, path]) => {
        // Extract filename from path (e.g., "invoices/MRC00926/APR_2025_MRC_Summary.pdf" -> "APR_2025_MRC_Summary.pdf")
        const filename = path.split('/').pop() || path;
        files.push({
          id: `${job.job_id}_pdf_${type}`,
          job_id: job.job_id,
          filename: filename,
          fullPath: path, 
          created_at: job.created_at,
          template_name: job.template,
          invoice_number: job.invoice_number,
          fileType: 'pdf',
          fileCategory: type,
          icon: 'pi pi-file-pdf',
          originalData: { ...job, type: 'pdf', subtype: type, path: path }
        });
      });
    }
    
    // Process Excel files which are in an array
    if (job.outputs.excel && Array.isArray(job.outputs.excel)) {
      job.outputs.excel.forEach((path, index) => {
        // Extract filename from path
        const filename = path.split('/').pop() || path;
        files.push({
          id: `${job.job_id}_excel_${index}`,
          job_id: job.job_id,
          filename: filename,
          fullPath: path,
          created_at: job.created_at,
          template_name: job.template,
          invoice_number: job.invoice_number,
          fileType: 'excel',
          icon: 'pi pi-file-excel',
          originalData: { ...job, type: 'excel', index: index, path: path }
        });
      });
    }
    
    return files;
  }
  
  // Fetch all documents for a customer
  async function fetchCustomerDocuments(customerNumber) {
    if (!customerNumber) {
      customerDocumentsError.value = 'Customer number is required';
      customerDocuments.value = [];
      return [];
    }
    
    loadingCustomerDocuments.value = true;
    customerDocumentsError.value = null;
    
    try {
      const response = await InvoiceService.getCustomerDocuments(customerNumber);
      
      if (response.data && response.data.success) {
        let processedFiles = [];
        
        // Handle different response structures
        if (Array.isArray(response.data.documents)) {
          response.data.documents.forEach(job => {
            if (job && job.outputs) {
              processedFiles.push(...extractFilesFromJob(job));
            }
          });
        } else if (response.data.documents && typeof response.data.documents === 'object') {
          Object.values(response.data.documents).forEach(job => {
            if (job && job.outputs) {
              processedFiles.push(...extractFilesFromJob(job));
            }
          });
        }
        
        customerDocuments.value = processedFiles;
        return processedFiles;
      } else {
        customerDocuments.value = [];
        customerDocumentsError.value = response.data.message || 'Failed to load customer documents';
        return [];
      }
    } catch (err) {
      customerDocumentsError.value = err.message || 'Failed to fetch customer documents';
      customerDocuments.value = [];
      return [];
    } finally {
      loadingCustomerDocuments.value = false;
    }
  }
  
  // Download a generated file
  async function downloadGeneratedFile(fileId, fileType = 'pdf', subtype = null) {
    try {
      console.log(`Downloading file: ID=${fileId}, Type=${fileType}, Subtype=${subtype || 'none'}`);
      
      // For composite IDs, extract the parts
      let jobId = fileId;
      let actualFileType = fileType;
      let actualSubtype = subtype;
      
      // Check if fileId contains our composite format (jobId_type_subtype)
      if (typeof fileId === 'string' && fileId.includes('_')) {
        const parts = fileId.split('_');
        if (parts.length >= 2) {
          jobId = parts[0];
          actualFileType = parts[1] || fileType;
          
          if (parts.length > 2) {
            actualSubtype = parts.slice(2).join('_');
          }
        }
      }
      
      console.log(`Processed download parameters: JobID=${jobId}, ActualType=${actualFileType}, ActualSubtype=${actualSubtype || 'none'}`);
      
      const success = await InvoiceService.downloadGeneratedFile(jobId, actualFileType, actualSubtype);
      return success;
    } catch (err) {
      console.error('Error downloading file:', err);
      return false;
    }
  }
  
  // Merge functionality
  async function mergeInvoices(mergeRequest) {
    try {
      const response = await InvoiceService.mergeInvoices(mergeRequest);
      return response.data;
    } catch (err) {
      // Preserve the original error response for proper error handling
      throw err;
    }
  }

  async function getCustomerMergeHistory(customerNumber, limit = 25) {
    try {
      const response = await InvoiceService.getCustomerMergeHistory(customerNumber, limit);
      return response.data;
    } catch (err) {
      // Preserve the original error response for proper error handling
      throw err;
    }
  }

  async function getMergeHistory(mergedInvoiceNumber) {
    try {
      const response = await InvoiceService.getMergeHistory(mergedInvoiceNumber);
      return response.data;
    } catch (err) {
      // Preserve the original error response for proper error handling
      throw err;
    }
  }

  async function findMergeContaining(originalInvoiceNumber) {
    try {
      const response = await InvoiceService.findMergeContaining(originalInvoiceNumber);
      return response.data;
    } catch (err) {
      // Preserve the original error response for proper error handling
      throw err;
    }
  }

  function resetTemplateState() {
    availableTemplates.value = [];
    generatedFiles.value = [];
    customerDocuments.value = [];
    templatesError.value = null;
    generatedFilesError.value = null;
    customerDocumentsError.value = null;
    generateTemplateError.value = null;
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
    
    // Template state
    availableTemplates,
    loadingTemplates,
    templatesError,
    generatedFiles,
    loadingGeneratedFiles,
    generatedFilesError,
    generatingTemplate,
    generateTemplateError,
    customerDocuments,
    loadingCustomerDocuments,
    customerDocumentsError,
    
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
    resetState,
    
    // Template actions
    fetchAvailableTemplates,
    generateTemplate,
    fetchGeneratedFiles,
    fetchCustomerDocuments,
    downloadGeneratedFile,
    resetTemplateState,
    
    // Merge functionality
    mergeInvoices,
    getCustomerMergeHistory,
    getMergeHistory,
    findMergeContaining
  };
}); 