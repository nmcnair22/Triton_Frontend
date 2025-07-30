import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { ApiService } from '@/service/ApiService';


export const usePhotosStore = defineStore('photos', {
    state: () => ({
        // Photos organized by ticket ID
        photosByTicket: {}, // { ticketId: { photos: [], loading: false, error: null, lastFetched: null } }
        
        // Cache for photo metadata to avoid repeated API calls
        metadataCache: {},
        
        // Current selected photo for modal view
        selectedPhoto: null,
        
        // Gallery view state
        currentGalleryTicket: null,
        isGalleryOpen: false,
        
        // Performance settings
        cacheDuration: 5 * 60 * 1000, // 5 minutes cache
        photosPerPage: 20,
    }),

    getters: {
        // Get photos for a specific ticket
        getTicketPhotos: (state) => (ticketId) => {
            return state.photosByTicket[ticketId]?.photos || [];
        },

        // Check if photos are loading for a ticket
        isLoading: (state) => (ticketId) => {
            return state.photosByTicket[ticketId]?.loading || false;
        },

        // Get error state for a ticket
        getError: (state) => (ticketId) => {
            return state.photosByTicket[ticketId]?.error;
        },

        // Get total photo count for a ticket
        getPhotoCount: (state) => (ticketId) => {
            return state.photosByTicket[ticketId]?.photos?.length || 0;
        },

        // Check if data is cached and still valid
        isCacheValid: (state) => (ticketId) => {
            const ticketData = state.photosByTicket[ticketId];
            if (!ticketData?.lastFetched) return false;
            
            const now = Date.now();
            return (now - ticketData.lastFetched) < state.cacheDuration;
        },

        // Get all tickets that have photos
        ticketsWithPhotos: (state) => {
            return Object.keys(state.photosByTicket).filter(ticketId => 
                state.photosByTicket[ticketId]?.photos?.length > 0
            );
        },

        // Get total photo count across all tickets
        totalPhotoCount: (state) => {
            return Object.values(state.photosByTicket).reduce((total, ticketData) => {
                return total + (ticketData?.photos?.length || 0);
            }, 0);
        }
    },

    actions: {
        // Initialize ticket photo state
        initializeTicketState(ticketId) {
            if (!this.photosByTicket[ticketId]) {
                this.photosByTicket[ticketId] = {
                    photos: [],
                    loading: false,
                    error: null,
                    lastFetched: null
                };
            }
        },

        // Load photos for a single ticket
        async loadTicketPhotos(ticketId, force = false) {
            console.log(`Loading photos for ticket ${ticketId}, force: ${force}`);
            
            this.initializeTicketState(ticketId);
            
            // Check cache validity
            if (!force && this.isCacheValid(ticketId)) {
                console.log(`Using cached photos for ticket ${ticketId}`);
                return this.photosByTicket[ticketId].photos;
            }

            const ticketData = this.photosByTicket[ticketId];
            ticketData.loading = true;
            ticketData.error = null;

            try {
                const response = await ApiService.get(`flynn/tickets/${ticketId}/photos`);
                
                // ApiService returns Axios response, so API data is in response.data
                const apiData = response.data;
                
                if (apiData.success && apiData.data && apiData.data.photos) {
                    ticketData.photos = apiData.data.photos;
                    ticketData.lastFetched = Date.now();
                    console.log(`Loaded ${ticketData.photos.length} photos for ticket ${ticketId}`);
                } else {
                    console.warn(`No photo data received for ticket ${ticketId}`, apiData);
                    ticketData.photos = [];
                }

                return ticketData.photos;
            } catch (error) {
                console.error(`Failed to load photos for ticket ${ticketId}:`, error);
                ticketData.error = error.message || 'Failed to load photos';
                ticketData.photos = [];
                throw error;
            } finally {
                ticketData.loading = false;
            }
        },

        // Load photos for multiple tickets (batch operation)
        async loadMultipleTicketPhotos(ticketIds, force = false) {
            console.log(`Loading photos for multiple tickets:`, ticketIds);
            
            // Filter out tickets that have valid cache (unless forcing)
            const ticketsToFetch = force ? ticketIds : ticketIds.filter(ticketId => {
                this.initializeTicketState(ticketId);
                return !this.isCacheValid(ticketId);
            });

            if (ticketsToFetch.length === 0) {
                console.log('All ticket photos are cached and valid');
                return;
            }

            try {
                const response = await ApiService.post('flynn/tickets/photos', {
                    ticket_ids: ticketsToFetch
                });

                // ApiService returns Axios response, so API data is in response.data
                const apiData = response.data;

                if (apiData.success && apiData.data?.photos_by_ticket) {
                    const photosByTicket = apiData.data.photos_by_ticket;
                    
                    // Update store with results
                    Object.entries(photosByTicket).forEach(([ticketId, photos]) => {
                        this.initializeTicketState(ticketId);
                        const ticketData = this.photosByTicket[ticketId];
                        ticketData.photos = photos || [];
                        ticketData.lastFetched = Date.now();
                        ticketData.loading = false;
                        ticketData.error = null;
                        
                        console.log(`Loaded ${photos?.length || 0} photos for ticket ${ticketId}`);
                    });

                    // Mark tickets with no photos as having empty arrays
                    ticketsToFetch.forEach(ticketId => {
                        if (!photosByTicket[ticketId]) {
                            this.initializeTicketState(ticketId);
                            const ticketData = this.photosByTicket[ticketId];
                            ticketData.photos = [];
                            ticketData.lastFetched = Date.now();
                            ticketData.loading = false;
                            ticketData.error = null;
                        }
                    });
                }
            } catch (error) {
                console.error('Failed to load multiple ticket photos:', error);
                
                // Mark all failed tickets as having errors
                ticketsToFetch.forEach(ticketId => {
                    this.initializeTicketState(ticketId);
                    const ticketData = this.photosByTicket[ticketId];
                    ticketData.loading = false;
                    ticketData.error = error.message || 'Failed to load photos';
                });
                
                throw error;
            }
        },

        // Generate authenticated photo download URL
        getPhotoDownloadUrl(filename, size = 'full') {
            const baseUrl = `/api/flynn/photos/${filename}/download`;
            // Note: Backend should handle authentication via Bearer token in headers
            return baseUrl;
        },

        // Generate photo thumbnail URL
        getPhotoThumbnailUrl(filename) {
            return `/api/flynn/photos/${filename}/thumbnail`;
        },

        // Get photo metadata
        async getPhotoMetadata(filename) {
            if (this.metadataCache[filename]) {
                return this.metadataCache[filename];
            }

            try {
                const response = await ApiService.get(`flynn/photos/${filename}/metadata`);
                if (response.success && response.data) {
                    this.metadataCache[filename] = response.data;
                    return response.data;
                }
            } catch (error) {
                console.error(`Failed to get metadata for photo ${filename}:`, error);
                return null;
            }
        },

        // Download a photo
        async downloadPhoto(photo) {
            try {
                const response = await fetch(this.getPhotoDownloadUrl(photo.filename), {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
                    }
                });

                if (!response.ok) {
                    throw new Error(`Download failed: ${response.statusText}`);
                }

                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = photo.original_filename || photo.filename;
                document.body.appendChild(link);
                link.click();
                link.remove();
                window.URL.revokeObjectURL(url);
                
                console.log(`Downloaded photo: ${photo.original_filename}`);
            } catch (error) {
                console.error('Photo download failed:', error);
                throw error;
            }
        },

        // Bulk download all photos for a ticket
        async downloadTicketPhotos(ticketId) {
            const photos = this.getTicketPhotos(ticketId);
            
            for (let i = 0; i < photos.length; i++) {
                try {
                    await this.downloadPhoto(photos[i]);
                    // Add small delay to avoid overwhelming the server
                    if (i < photos.length - 1) {
                        await new Promise(resolve => setTimeout(resolve, 200));
                    }
                } catch (error) {
                    console.error(`Failed to download photo ${i + 1}:`, error);
                    // Continue with other photos even if one fails
                }
            }
        },

        // Gallery management
        openGallery(ticketId, photoIndex = 0) {
            this.currentGalleryTicket = ticketId;
            const photos = this.getTicketPhotos(ticketId);
            if (photos.length > 0 && photoIndex < photos.length) {
                this.selectedPhoto = photos[photoIndex];
                this.isGalleryOpen = true;
            }
        },

        closeGallery() {
            this.isGalleryOpen = false;
            this.selectedPhoto = null;
            this.currentGalleryTicket = null;
        },

        navigateGallery(direction) {
            if (!this.currentGalleryTicket || !this.selectedPhoto) return;
            
            const photos = this.getTicketPhotos(this.currentGalleryTicket);
            const currentIndex = photos.findIndex(p => p.id === this.selectedPhoto.id);
            
            let newIndex;
            if (direction === 'next') {
                newIndex = (currentIndex + 1) % photos.length;
            } else {
                newIndex = currentIndex === 0 ? photos.length - 1 : currentIndex - 1;
            }
            
            this.selectedPhoto = photos[newIndex];
        },

        // Clear cache
        clearCache() {
            this.photosByTicket = {};
            this.metadataCache = {};
        },

        // Clear specific ticket cache
        clearTicketCache(ticketId) {
            if (this.photosByTicket[ticketId]) {
                delete this.photosByTicket[ticketId];
            }
        }
    }
});