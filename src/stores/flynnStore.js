import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { ApiService } from '@/service/ApiService';

export const useFlynnStore = defineStore('flynn', () => {
  // State
  const locations = ref([]);
  const selectedLocation = ref(null);
  const locationDetails = ref(null);
  const loading = ref(false);
  const locationDetailsLoading = ref(false);
  const error = ref(null);
  
  // Analysis data
  const completionData = ref({});
  const networkData = ref({});
  const comments = ref([]);
  const tickets = ref([]);
  const ticketPosts = ref({});
  const reviewNotes = ref([]);
  
  // Project data (same for all locations)
  const projectInfo = ref(null);
  const projectPhases = ref([]);
  const projectLoading = ref(false);
  
  // Scope review data
  const scopeReview = ref(null);
  const scopeReviewLoading = ref(false);
  const scopeReviewStarted = ref(false);
  
  // Analysis Sessions State
  const analysisSessions = ref([]);
  const selectedSessionId = ref(null);
  const currentAnalysisResults = ref({ pass1: null, pass2: null, pass3: null, installation_document: null });
  const sessionsLoading = ref(false);
  
  // Enhanced Scope Summary State
  const enhancedScopeData = ref(null);
  const scopeDeduplication = ref([]);
  const scopeRecommendations = ref({});
  const enhancedScopeLoading = ref(false);
  
  // Installation Document State (2-Pass Model)
  const installationDocumentState = ref({
    ready: false,
    hasDocument: false,
    documentLength: 0,
    lastGenerated: null,
    generating: false,
    sessionId: null
  });
  const currentInstallationDocument = ref('');
  const availableModels = ref({
    models: {},
    configurations: {},
    selected: 'balanced'
  });

  // Computed
  const totalLocations = computed(() => locations.value.length);
  
  const filteredLocations = computed(() => {
    return locations.value.filter(location => {
      // Add filtering logic based on completion status, network status, etc.
      return true;
    });
  });

  const completionStats = computed(() => {
    if (!locations.value.length) return { high: 0, medium: 0, low: 0 };
    
    const stats = { high: 0, medium: 0, low: 0 };
    locations.value.forEach(location => {
      const completion = Number(location.completionPercentage) || 0;
      if (completion >= 80) stats.high++;
      else if (completion >= 50) stats.medium++;
      else stats.low++;
    });
    
    return stats;
  });

  const totalPhotoCount = computed(() => {
    return tickets.value.reduce((total, ticket) => {
      return total + (ticket.photo_count || 0);
    }, 0);
  });

  // Actions
  async function fetchLocations() {
    loading.value = true;
    error.value = null;
    
    try {
      console.log('Fetching Flynn Project locations...');
      
      // Use correct Flynn API endpoint with project location filter
      const response = await ApiService.get('flynn/locations', {
        is_project_location: 'true',  // Only get project locations
        per_page: 100,                // Get more locations per page
        sort_by: 'completion_percentage',
        sort_order: 'desc'
      });
      
      if (response.data && response.data.success) {
        const apiData = response.data.data;
        
        // Handle paginated response structure
        if (apiData && Array.isArray(apiData.data)) {
          locations.value = apiData.data.map(location => ({
            id: location.id,
            siteNumber: location.site_number,
            locationName: location.location_name,
            city: location.city,
            state: location.state,
            address: location.address,
            completionPercentage: location.completion_percentage || 0,
            networkStatus: location.network_status || 'Unknown',
            lastCommentDate: location.last_comment_date,
            issueCount: location.unresolved_comments_count || 0,
            lastActivity: location.last_comment_date,
            reviewStatus: location.review_status,
            isNetworkRefreshProject: location.is_network_refresh_project,
            // Additional fields
            region: location.region,
            coordinates: location.coordinates,
            projectManager: location.project_manager,
            installationDate: location.installation_date,
            estimatedCompletion: location.estimated_completion,
            // Store the embedded data directly
            scopeCompletion: location.scope_completion,
            smartSheetData: location.smart_sheet_data,
            siteComments: location.site_comments || []
          }));
          
          console.log(`Fetched ${locations.value.length} Flynn project locations out of ${apiData.total} total`);
        } else {
          console.warn('Unexpected API response structure:', response.data);
          locations.value = [];
        }
      } else {
        console.warn('API returned unsuccessful response:', response.data);
        locations.value = [];
      }
      
    } catch (err) {
      console.error('Error fetching Flynn locations:', err);
      error.value = err.message || 'Failed to fetch locations';
      locations.value = [];
    } finally {
      loading.value = false;
    }
  }

  async function fetchLocationDetails(locationId) {
    locationDetailsLoading.value = true;
    error.value = null;
    
    try {
      console.log(`Fetching analysis data for location ${locationId}...`);
      
      // Use the comprehensive analysis endpoint
      const response = await ApiService.get(`flynn/locations/${locationId}/analysis`);
      
      if (response.data && response.data.success) {
        const data = response.data.data;
        locationDetails.value = data.location;
        
        // Map the location data to match the expected frontend structure
        selectedLocation.value = {
          id: data.location.id,
          siteNumber: data.location.site_number,
          locationName: data.location.location_name,
          city: data.location.city,
          state: data.location.state,
          address: data.location.address,
          completionPercentage: data.location.completion_percentage || 0,
          ...data.location // Spread the rest of the properties
        };
        
        // Also populate other data from the analysis response
        if (data.location.scope_completion) {
          completionData.value = data.location.scope_completion;
        }
        if (data.location.smart_sheet_data) {
          networkData.value = data.location.smart_sheet_data;
        }
        if (data.location.site_comments) {
          comments.value = data.location.site_comments;
          console.log(`Successfully loaded ${data.location.site_comments.length} site comments from analysis endpoint`);
        }
        if (data.tickets) {
          tickets.value = data.tickets;
        }
        
        console.log('Location analysis data loaded successfully');
      }
    } catch (err) {
      console.error('Error fetching location analysis:', err);
      error.value = err.message;
    } finally {
      locationDetailsLoading.value = false;
    }
  }

  async function fetchLocationCompletion(locationId) {
    try {
      console.log(`Fetching scope completion for location ${locationId}...`);
      const response = await ApiService.get(`flynn/locations/${locationId}/scope-completion`);
      if (response.data && response.data.success) {
        completionData.value = response.data.data;
        console.log('Completion data loaded:', completionData.value);
      }
    } catch (err) {
      console.error('Error fetching completion data:', err);
    }
  }

  async function fetchLocationNetwork(locationId) {
    try {
      console.log(`Fetching smart sheet data for location ${locationId}...`);
      const response = await ApiService.get(`flynn/locations/${locationId}/smart-sheet-data`);
      if (response.data && response.data.success) {
        networkData.value = response.data.data;
        console.log('Network data loaded:', networkData.value);
      }
    } catch (err) {
      console.error('Error fetching network data:', err);
    }
  }

  async function fetchLocationComments(locationId) {
    try {
      console.log(`Fetching site comments for location ${locationId}...`);
      const response = await ApiService.get(`flynn/locations/${locationId}/site-comments`);
      if (response.data && response.data.success) {
        comments.value = response.data.data;
        console.log('Comments data loaded:', comments.value);
      }
    } catch (err) {
      console.error('Error fetching comments:', err);
    }
  }

  async function fetchLocationTickets(locationId) {
    try {
      console.log(`Fetching tickets for location ${locationId}...`);
      const response = await ApiService.get(`flynn/locations/${locationId}/tickets`);
      if (response.data && response.data.success) {
        tickets.value = response.data.data.tickets || [];
        
        // Also fetch ticket posts if we have tickets
        if (tickets.value.length > 0) {
          const ticketIds = tickets.value.map(ticket => ticket.ticketid);
          await fetchTicketPosts(ticketIds);
        }
      }
    } catch (err) {
      console.error('Error fetching tickets:', err);
    }
  }

  async function fetchTicketPosts(ticketIds) {
    try {
      console.log(`Fetching posts for ${ticketIds.length} tickets...`);
      const response = await ApiService.post('flynn/ticket-posts', { ticket_ids: ticketIds });
      if (response.data && response.data.success) {
        ticketPosts.value = response.data.data.posts || {};
        console.log(`Fetched ${response.data.data.total_posts || 0} total posts across tickets`);
      }
    } catch (err) {
      console.error('Error fetching ticket posts:', err);
    }
  }

  async function addReviewNote(locationId, note) {
    try {
      const response = await ApiService.post(`flynn/locations/${locationId}/review-notes`, note);
      if (response.data) {
        reviewNotes.value.push(response.data.data || response.data);
      }
    } catch (err) {
      console.error('Error adding review note:', err);
      throw err;
    }
  }

  async function updateReviewStatus(locationId, status) {
    try {
      await ApiService.patch(`flynn/locations/${locationId}/review-status`, { status });
      // Update local state
      if (selectedLocation.value && selectedLocation.value.id === locationId) {
        selectedLocation.value.reviewStatus = status;
      }
    } catch (err) {
      console.error('Error updating review status:', err);
      throw err;
    }
  }

  async function fetchProjectInformation() {
    if (projectInfo.value) return; // Only fetch once since it's the same for all locations
    
    projectLoading.value = true;
    try {
      console.log('Fetching Flynn project information...');
      const response = await ApiService.get('flynn/project');
      
      if (response.data && response.data.success) {
        projectInfo.value = response.data.data.project;
        projectPhases.value = response.data.data.phases || [];
        console.log(`Loaded project: ${projectInfo.value.project_name} with ${projectPhases.value.length} phases`);
      }
    } catch (err) {
      console.error('Error fetching project information:', err);
    } finally {
      projectLoading.value = false;
    }
  }

  async function fetchPhaseDetails(phaseId) {
    try {
      console.log(`Fetching details for phase ${phaseId}...`);
      const response = await ApiService.get(`flynn/phases/${phaseId}`);
      
      if (response.data && response.data.success) {
        // Update the phase in our local array with detailed task information
        const phaseIndex = projectPhases.value.findIndex(p => p.phase_id === phaseId);
        if (phaseIndex !== -1) {
          projectPhases.value[phaseIndex] = { 
            ...projectPhases.value[phaseIndex], 
            ...response.data.data.phase,
            tasksLoaded: true 
          };
        }
        return response.data.data.phase;
      }
    } catch (err) {
      console.error(`Error fetching phase ${phaseId} details:`, err);
      throw err;
    }
  }

  async function startScopeReview(locationId, createdBy = 'Current User') {
    scopeReviewLoading.value = true;
    try {
      console.log(`Starting scope review for location ${locationId}...`);
      const response = await ApiService.post(`flynn/locations/${locationId}/scope-review`, {
        created_by: createdBy,
        summary: `Scope review started for location ${locationId}`
      });
      
      if (response.data && response.data.success) {
        scopeReview.value = response.data.data.scope_review;
        scopeReviewStarted.value = true;
        console.log('Scope review started successfully:', scopeReview.value.id);
        return scopeReview.value;
      }
    } catch (err) {
      console.error('Error starting scope review:', err);
      throw err;
    } finally {
      scopeReviewLoading.value = false;
    }
  }

  async function fetchScopeReview(locationId) {
    try {
      console.log(`Fetching scope review for location ${locationId}...`);
      const response = await ApiService.get(`flynn/locations/${locationId}/scope-review`);
      
      if (response.data && response.data.success) {
        scopeReview.value = response.data.data.scope_review;
        scopeReviewStarted.value = !!scopeReview.value;
        console.log('Scope review loaded:', scopeReview.value?.id || 'No active review');
        return response.data.data;
      }
    } catch (err) {
      // No active review found is expected behavior
      if (err.response?.status !== 404) {
        console.error('Error fetching scope review:', err);
      }
      scopeReview.value = null;
      scopeReviewStarted.value = false;
    }
  }

  async function addScopeNote(scopeReviewId, noteData) {
    try {
      console.log(`Adding note to scope review ${scopeReviewId}...`);
      const response = await ApiService.post(`flynn/scope-reviews/${scopeReviewId}/notes`, noteData);
      
      if (response.data && response.data.success) {
        console.log('Note added successfully');
        return response.data.data;
      }
    } catch (err) {
      console.error('Error adding scope note:', err);
      throw err;
    }
  }

  async function addScopeTask(scopeReviewId, taskData) {
    try {
      console.log(`Adding task to scope review ${scopeReviewId}...`);
      const response = await ApiService.post(`flynn/scope-reviews/${scopeReviewId}/tasks`, taskData);
      
      if (response.data && response.data.success) {
        console.log('Task added successfully');
        return response.data.data;
      }
    } catch (err) {
      console.error('Error adding scope task:', err);
      throw err;
    }
  }

  async function addScopeReviewNote(locationId, noteData) {
    if (!scopeReview.value) {
      console.warn('No active scope review found');
      return;
    }
    
    try {
      const response = await addScopeNote(scopeReview.value.id, {
        ...noteData,
        created_by: 'Current User'
      });
      console.log('Scope review note added successfully');
      return response;
    } catch (err) {
      console.error('Error adding scope review note:', err);
      throw err;
    }
  }

  async function addScopeReviewTask(locationId, taskData) {
    if (!scopeReview.value) {
      console.warn('No active scope review found');
      return;
    }
    
    try {
      const response = await addScopeTask(scopeReview.value.id, {
        ...taskData,
        created_by: 'Current User'
      });
      console.log('Scope review task added successfully');
      return response;
    } catch (err) {
      console.error('Error adding scope review task:', err);
      throw err;
    }
  }

  // Scope Analysis Actions
  async function startScopeAnalysis(locationId, analysisForm) {
    try {
      console.log('Starting scope analysis for location:', locationId, 'with form:', analysisForm);
      
      const requestPayload = {
        analysis_template: analysisForm.analysis_template,
        analysis_options: analysisForm.analysis_options,
        async: analysisForm.async  // ✅ ADD THIS CRITICAL LINE
      };
      
      console.log('🚀 REQUEST PAYLOAD:', requestPayload);  // Debug what we're actually sending
      
      const response = await ApiService.post(`flynn/locations/${locationId}/scope-analysis`, requestPayload);
      
      if (response.data.success) {
        console.log('Scope analysis started successfully:', response.data);
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to start scope analysis');
      }
    } catch (error) {
      console.error('Error starting scope analysis:', error);
      throw error;
    }
  }

  // Helper function to parse JSON strings in session data
  function parseSessionDataStrings(sessionData) {
    if (!sessionData) return sessionData;
    
    const fieldsToparse = ['pass_1', 'pass_2', 'pass_3', 'installation_document'];
    
    fieldsToparse.forEach(field => {
      if (sessionData[field] && typeof sessionData[field] === 'string') {
        console.log(`Parsing ${field} from JSON string`);
        try {
          sessionData[field] = JSON.parse(sessionData[field]);
        } catch (e) {
          console.error(`Failed to parse ${field} JSON string:`, e);
          sessionData[field] = null;
        }
      }
    });
    
    console.log('Session data after JSON parsing:', sessionData);
    return sessionData;
  }

  async function getScopeAnalysisResults(locationId, sessionId = null) {
    try {
      const endpoint = sessionId 
        ? `flynn/locations/${locationId}/scope-analysis/${sessionId}`
        : `flynn/locations/${locationId}/scope-analysis`;
      
      const response = await ApiService.get(endpoint);
      
      if (response.data.success) {
        console.log('Scope analysis results retrieved:', response.data);
        let sessionData = response.data.data;
        
        // Parse any JSON strings in the response
        sessionData = parseSessionDataStrings(sessionData);
        
        return sessionData;
      } else {
        throw new Error(response.data.message || 'Failed to get scope analysis results');
      }
    } catch (error) {
      console.error('Error getting scope analysis results:', error);
      throw error;
    }
  }

  async function generateInstallationDocument(locationId, sessionId = null) {
    try {
      const endpoint = sessionId
        ? `flynn/locations/${locationId}/scope-analysis/${sessionId}/installation-document`
        : `flynn/locations/${locationId}/scope-analysis/installation-document`;
      
      const response = await ApiService.post(endpoint);
      
      if (response.data.success) {
        console.log('Installation document generated:', response.data);
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to generate installation document');
      }
    } catch (error) {
      console.error('Error generating installation document:', error);
      throw error;
    }
  }

  async function getScopeAnalysisProgress(sessionId) {
    try {
      const response = await ApiService.get(`flynn/scope-analysis/${sessionId}/status`);
      
      if (response.data.success) {
        console.log('Scope analysis progress retrieved:', response.data);
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to get scope analysis progress');
      }
    } catch (error) {
      console.error('Error getting scope analysis progress:', error);
      throw error;
    }
  }

  async function cancelScopeAnalysis(sessionId) {
    try {
      const response = await ApiService.delete(`flynn/scope-analysis/${sessionId}`);
      
      if (response.data.success) {
        console.log('Scope analysis cancelled:', response.data);
        return response.data;
      } else {
        throw new Error(response.data.message || 'Failed to cancel scope analysis');
      }
    } catch (error) {
      console.error('Error cancelling scope analysis:', error);
      throw error;
    }
  }

  // Session History Management
  async function fetchScopeAnalysisSessions(locationId) {
    try {
      console.log('Fetching scope analysis sessions for location:', locationId);
      sessionsLoading.value = true;
      
      const response = await ApiService.get(`flynn/locations/${locationId}/scope-analysis-sessions`);
      
      if (response.data.success) {
        console.log('Scope analysis sessions retrieved:', response.data);
        analysisSessions.value = response.data.data;
        
        // Auto-select the most recent session if available
        if (analysisSessions.value.length > 0) {
          const mostRecentSession = analysisSessions.value[0]; // Sessions are ordered most recent first
          await loadSessionResults(locationId, mostRecentSession.session_id);
        } else {
          // No sessions available, clear current results
          currentAnalysisResults.value = { pass1: null, pass2: null, pass3: null, installation_document: null };
          selectedSessionId.value = null;
        }
        
        return analysisSessions.value;
      } else {
        throw new Error(response.data.message || 'Failed to fetch scope analysis sessions');
      }
    } catch (error) {
      console.error('Error fetching scope analysis sessions:', error);
      analysisSessions.value = [];
      currentAnalysisResults.value = { pass1: null, pass2: null, pass3: null, installation_document: null };
      selectedSessionId.value = null;
      throw error;
    } finally {
      sessionsLoading.value = false;
    }
  }

  async function loadSessionResults(locationId, sessionId) {
    try {
      console.log('Loading results for session:', sessionId);
      
      const sessionData = await getSpecificSessionResults(locationId, sessionId);
      
      // Update current analysis results
      currentAnalysisResults.value = {
        pass1: sessionData.pass_1 || null,
        pass2: sessionData.pass_2 || null,
        pass3: sessionData.pass_3 || null,
        installation_document: sessionData.installation_document || null
      };
      
      selectedSessionId.value = sessionId;
      console.log('Session results loaded:', currentAnalysisResults.value);
      
      // Fetch enhanced scope summary for this session
      try {
        await fetchEnhancedScopeSummary(locationId, sessionId);
        console.log('Enhanced scope data loaded for session:', sessionId);
      } catch (enhancedError) {
        console.warn('Failed to load enhanced scope data, continuing with basic data:', enhancedError);
      }
      
      // Check installation document readiness for 2-pass workflow
      try {
        await checkInstallationDocumentReady(locationId, sessionId);
        console.log('Installation document readiness checked for session:', sessionId);
      } catch (readinessError) {
        console.warn('Failed to check installation document readiness:', readinessError);
      }
      
      return currentAnalysisResults.value;
    } catch (error) {
      console.error('Error loading session results:', error);
      throw error;
    }
  }

  async function deleteSessionAndRefresh(locationId, sessionId) {
    try {
      console.log('Deleting session and refreshing list:', sessionId);
      
      await deleteAnalysisSession(sessionId);
      
      // If we deleted the currently selected session, we need to handle that
      if (selectedSessionId.value === sessionId) {
        selectedSessionId.value = null;
        currentAnalysisResults.value = { pass1: null, pass2: null, pass3: null, installation_document: null };
      }
      
      // Refresh the sessions list
      await fetchScopeAnalysisSessions(locationId);
      
      return true;
    } catch (error) {
      console.error('Error deleting session:', error);
      throw error;
    }
  }

  async function getSpecificSessionResults(locationId, sessionId) {
    try {
      console.log('Getting results for session:', sessionId);
      
      const response = await ApiService.get(`flynn/locations/${locationId}/scope-analysis/${sessionId}`);
      
      if (response.data.success) {
        console.log('Session results retrieved:', response.data);
        let sessionData = response.data.data;
        
        // Parse any JSON strings in the response
        sessionData = parseSessionDataStrings(sessionData);
        
        return sessionData;
      } else {
        throw new Error(response.data.message || 'Failed to get session results');
      }
    } catch (error) {
      console.error('Error getting session results:', error);
      throw error;
    }
  }

  async function deleteAnalysisSession(sessionId) {
    try {
      console.log('Deleting analysis session:', sessionId);
      
      const response = await ApiService.delete(`flynn/scope-analysis/${sessionId}`);
      
      if (response.data.success) {
        console.log('Analysis session deleted:', response.data);
        return response.data;
      } else {
        throw new Error(response.data.message || 'Failed to delete analysis session');
      }
    } catch (error) {
      console.error('Error deleting analysis session:', error);
      throw error;
    }
  }

  // Enhanced Scope Analysis Methods
  async function fetchEnhancedScopeSummary(locationId, sessionId = null) {
    try {
      console.log('Fetching enhanced scope summary for location:', locationId, 'session:', sessionId);
      enhancedScopeLoading.value = true;
      
      const endpoint = sessionId 
        ? `flynn/locations/${locationId}/enhanced-scope-summary/${sessionId}`
        : `flynn/locations/${locationId}/enhanced-scope-summary`;
      
      const response = await ApiService.get(endpoint);
      
      if (response.data.success) {
        console.log('Enhanced scope summary retrieved:', response.data);
        
        enhancedScopeData.value = response.data.data;
        scopeDeduplication.value = response.data.data.remaining_scope_analysis?.deduplication_analysis || [];
        scopeRecommendations.value = response.data.data.recommendations || {};
        
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to fetch enhanced scope summary');
      }
    } catch (error) {
      console.error('Error fetching enhanced scope summary:', error);
      enhancedScopeData.value = null;
      scopeDeduplication.value = [];
      scopeRecommendations.value = {};
      throw error;
    } finally {
      enhancedScopeLoading.value = false;
    }
  }

  async function getAvailableModels() {
    try {
      console.log('Fetching available analysis models');
      
      const response = await ApiService.get('flynn/scope-analysis/available-models');
      
      if (response.data.success) {
        console.log('Available models retrieved:', response.data);
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to fetch available models');
      }
    } catch (error) {
      console.error('Error fetching available models:', error);
      throw error;
    }
  }

  async function generateEnhancedInstallationDocument(locationId, sessionId = null) {
    try {
      console.log('Generating enhanced installation document for location:', locationId, 'session:', sessionId);
      
      const endpoint = sessionId
        ? `flynn/locations/${locationId}/scope-analysis/${sessionId}/installation-document`
        : `flynn/locations/${locationId}/scope-analysis/installation-document`;
      
      const response = await ApiService.post(endpoint);
      
      if (response.data.success) {
        console.log('Enhanced installation document generated:', response.data);
        
        // Update the current analysis results with the new document
        if (currentAnalysisResults.value) {
          currentAnalysisResults.value.installation_document = response.data.data;
        }
        
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to generate enhanced installation document');
      }
    } catch (error) {
      console.error('Error generating enhanced installation document:', error);
      throw error;
    }
  }

  // 2-Pass Installation Document API Methods
  async function checkInstallationDocumentReady(locationId, sessionId = null) {
    try {
      console.log('Checking installation document readiness for location:', locationId, 'session:', sessionId);
      
      const endpoint = sessionId 
        ? `flynn/locations/${locationId}/installation-document-ready/${sessionId}`
        : `flynn/locations/${locationId}/installation-document-ready`;
      
      const response = await ApiService.get(endpoint);
      
      if (response.data.success) {
        console.log('Installation document readiness checked:', response.data);
        
        installationDocumentState.value = {
          ready: response.data.data.ready_for_installation_document,
          hasDocument: response.data.data.has_installation_document,
          documentLength: response.data.data.installation_document_length,
          sessionId: response.data.data.session_id,
          lastGenerated: response.data.data.completed_at,
          generating: false
        };
        
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to check installation document readiness');
      }
    } catch (error) {
      console.error('Error checking installation document readiness:', error);
      throw error;
    }
  }

  async function generateInstallationDocumentV2(locationId, sessionId, modelConfiguration = null) {
    try {
      console.log('Generating installation document (v2) for location:', locationId, 'session:', sessionId);
      installationDocumentState.value.generating = true;
      
      const payload = modelConfiguration ? { model_configuration: modelConfiguration } : {};
      
      const response = await ApiService.post(
        `flynn/locations/${locationId}/sessions/${sessionId}/generate-installation-document`,
        payload
      );
      
      if (response.data.success) {
        console.log('Installation document (v2) generated successfully:', response.data);
        
        // Update state with new document
        installationDocumentState.value = {
          ready: true,
          hasDocument: true,
          documentLength: response.data.data.generation_metadata?.document_length || response.data.data.installation_document?.length || 0,
          sessionId: sessionId,
          lastGenerated: response.data.data.generated_at,
          generating: false
        };
        
        // Store the document for immediate viewing
        currentInstallationDocument.value = response.data.data.installation_document;
        
        // Also update the current analysis results
        if (currentAnalysisResults.value) {
          currentAnalysisResults.value.installation_document = response.data.data.installation_document;
        }
        
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to generate installation document');
      }
    } catch (error) {
      installationDocumentState.value.generating = false;
      console.error('Error generating installation document (v2):', error);
      throw error;
    }
  }

  async function getInstallationDocumentV2(locationId, sessionId = null) {
    try {
      console.log('Getting installation document for location:', locationId, 'session:', sessionId);
      
      const endpoint = sessionId 
        ? `flynn/locations/${locationId}/installation-document/${sessionId}`
        : `flynn/locations/${locationId}/installation-document`;
      
      const response = await ApiService.get(endpoint);
      
      if (response.data.success) {
        console.log('Installation document retrieved:', response.data);
        currentInstallationDocument.value = response.data.data.installation_document;
        
        // Update state
        installationDocumentState.value = {
          ...installationDocumentState.value,
          hasDocument: true,
          documentLength: response.data.data.document_length,
          lastGenerated: response.data.data.generated_at
        };
        
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to get installation document');
      }
    } catch (error) {
      console.error('Error getting installation document:', error);
      throw error;
    }
  }

  async function getAvailableModelsV2() {
    try {
      console.log('Fetching available AI models');
      
      const response = await ApiService.get('flynn/scope-analysis/available-models');
      
      if (response.data.success) {
        console.log('Available models retrieved:', response.data);
        availableModels.value = response.data.data;
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to fetch available models');
      }
    } catch (error) {
      console.error('Error fetching available models:', error);
      throw error;
    }
  }

  async function getPatchPanelMatrix() {
    try {
      console.log('Fetching patch panel matrix');
      
      const response = await ApiService.get('flynn/patch-panel-matrix');
      
      if (response.data.success) {
        console.log('Patch panel matrix retrieved:', response.data);
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to fetch patch panel matrix');
      }
    } catch (error) {
      console.error('Error fetching patch panel matrix:', error);
      throw error;
    }
  }

  async function getProjectAddendums() {
    try {
      console.log('Fetching project addendums');
      
      const response = await ApiService.get('flynn/project-addendums');
      
      if (response.data.success) {
        console.log('Project addendums retrieved:', response.data);
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to fetch project addendums');
      }
    } catch (error) {
      console.error('Error fetching project addendums:', error);
      throw error;
    }
  }

  function selectLocation(location) {
    selectedLocation.value = location;
    console.log('Selected location:', location);
    
    // Always call fetchLocationDetails to get the comprehensive analysis data
    // which includes all comments (not just the limited embedded siteComments)
    fetchLocationDetails(location.id);
    
    // Load analysis session history for this location
    fetchScopeAnalysisSessions(location.id).catch(error => {
      console.warn('Failed to load analysis sessions:', error);
      // Don't throw error since this shouldn't block location selection
    });
    
    // Fetch other location data
    fetchLocationTickets(location.id);
  }

  function clearSelection() {
    selectedLocation.value = null;
    locationDetails.value = null;
    completionData.value = {};
    networkData.value = {};
    comments.value = [];
    tickets.value = [];
    ticketPosts.value = {};
    reviewNotes.value = [];
  }

  return {
    // State
    locations,
    selectedLocation,
    locationDetails,
    loading,
    locationDetailsLoading,
    error,
    completionData,
    networkData,
    comments,
    tickets,
    ticketPosts,
    reviewNotes,
    
    // Project data
    projectInfo,
    projectPhases,
    projectLoading,
    
    // Scope review data
    scopeReview,
    scopeReviewLoading,
    scopeReviewStarted,
    
    // Analysis Sessions State
    analysisSessions,
    selectedSessionId,
    currentAnalysisResults,
    sessionsLoading,
    
    // Enhanced Scope Summary State
    enhancedScopeData,
    scopeDeduplication,
    scopeRecommendations,
    enhancedScopeLoading,
    
    // Installation Document State (2-Pass Model)
    installationDocumentState,
    currentInstallationDocument,
    availableModels,
    
    // Computed
    totalLocations,
    filteredLocations,
    completionStats,
    totalPhotoCount,
    
    // Actions
    fetchLocations,
    fetchLocationDetails,
    fetchLocationCompletion,
    fetchLocationNetwork,
    fetchLocationComments,
    fetchLocationTickets,
    fetchTicketPosts,
    addReviewNote,
    updateReviewStatus,
    selectLocation,
    clearSelection,
    
    // Project actions
    fetchProjectInformation,
    fetchPhaseDetails,
    startScopeReview,
    fetchScopeReview,
    addScopeNote,
    addScopeTask,
    addScopeReviewNote,
    addScopeReviewTask,
    
    // Scope Analysis Actions
    startScopeAnalysis,
    getScopeAnalysisResults,
    generateInstallationDocument,
    getScopeAnalysisProgress,
    cancelScopeAnalysis,
    
    // Session History Management
    fetchScopeAnalysisSessions,
    loadSessionResults,
    deleteSessionAndRefresh,
    getSpecificSessionResults,
    deleteAnalysisSession,
    
    // Enhanced Scope Analysis Methods
    fetchEnhancedScopeSummary,
    getAvailableModels,
    generateEnhancedInstallationDocument,
    
    // 2-Pass Installation Document API Methods
    checkInstallationDocumentReady,
    generateInstallationDocumentV2,
    getInstallationDocumentV2,
    getAvailableModelsV2,
    getPatchPanelMatrix,
    getProjectAddendums
  };
});