<template>
    <div class="photo-gallery">
        <!-- Loading State -->
        <div v-if="photosStore.isLoading(ticketId)" class="flex items-center justify-center py-8">
            <ProgressSpinner size="small" />
            <span class="ml-2 text-surface-600">Loading photos...</span>
        </div>

        <!-- Error State -->
        <div v-else-if="photosStore.getError(ticketId)" class="text-center py-8">
            <i class="pi pi-exclamation-triangle text-4xl text-orange-500 mb-4"></i>
            <h3 class="text-lg font-semibold mb-2">Failed to Load Photos</h3>
            <p class="text-surface-600 mb-4">{{ photosStore.getError(ticketId) }}</p>
            <Button 
                label="Retry" 
                icon="pi pi-refresh" 
                @click="retryLoading"
                outlined 
                size="small" />
        </div>

        <!-- No Photos State -->
        <div v-else-if="photos.length === 0" class="text-center py-8 text-surface-500">
            <i class="pi pi-image text-4xl mb-4"></i>
            <h3 class="text-lg font-semibold mb-2">No Photos Available</h3>
            <p>This ticket doesn't have any associated photos.</p>
        </div>

        <!-- Photo Grid -->
        <div v-else class="space-y-4">
            <!-- Gallery Header -->
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                    <i class="pi pi-images text-blue-600"></i>
                    <span class="font-semibold">{{ photos.length }} Photo{{ photos.length !== 1 ? 's' : '' }}</span>
                </div>
                <div class="flex gap-2">
                    <Button 
                        label="View All" 
                        icon="pi pi-eye"
                        @click="openFullGallery"
                        outlined 
                        size="small" />
                    <Button 
                        label="Download All" 
                        icon="pi pi-download"
                        @click="downloadAllPhotos"
                        outlined 
                        size="small" />
                </div>
            </div>

            <!-- Photo Grid -->
            <div class="photo-grid">
                <div 
                    v-for="(photo, index) in paginatedPhotos" 
                    :key="photo.id || `${photo.filename}-${index}`"
                    class="photo-item"
                    @click="openPhoto(index + (currentPage - 1) * photosPerPage)"
                >
                    <!-- Photo Thumbnail -->
                    <div class="photo-thumbnail">
                        <img 
                            :src="getPhotoUrl(photo)"
                            :alt="photo.original_filename || photo.filename"
                            class="photo-image"
                            loading="lazy"
                            @error="handleImageError"
                            @load="handleImageLoad(photo.filename)"
                        />
                        
                        <!-- Loading overlay -->
                        <div v-if="!loadedImages.has(photo.filename)" class="photo-loading">
                            <ProgressSpinner size="small" />
                        </div>
                    </div>

                    <!-- Photo Info Overlay -->
                    <div class="photo-overlay">
                        <div class="photo-name">{{ getPhotoDisplayName(photo) }}</div>
                        <div class="photo-meta">
                            <span v-if="photo.size">{{ formatFileSize(photo.size) }}</span>
                            <span v-if="photo.created_at">{{ formatDate(photo.created_at) }}</span>
                        </div>
                    </div>

                    <!-- Action Buttons -->
                    <div class="photo-actions">
                        <Button 
                            icon="pi pi-eye"
                            @click.stop="openPhoto(index + (currentPage - 1) * photosPerPage)"
                            text
                            rounded
                            size="small"
                            severity="secondary"
                            class="photo-action-btn"
                            v-tooltip="'View Photo'" />
                        <Button 
                            icon="pi pi-download"
                            @click.stop="downloadPhoto(photo)"
                            text
                            rounded
                            size="small"
                            severity="secondary"
                            class="photo-action-btn"
                            v-tooltip="'Download Photo'" />
                    </div>
                </div>
            </div>

            <!-- Pagination -->
            <div v-if="totalPages > 1" class="flex items-center justify-center gap-2 pt-4">
                <Button 
                    icon="pi pi-chevron-left"
                    @click="previousPage"
                    :disabled="currentPage === 1"
                    text
                    rounded
                    size="small" />
                <span class="text-sm text-surface-600">
                    Page {{ currentPage }} of {{ totalPages }}
                </span>
                <Button 
                    icon="pi pi-chevron-right"
                    @click="nextPage"
                    :disabled="currentPage === totalPages"
                    text
                    rounded
                    size="small" />
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { usePhotosStore } from '@/stores/photosStore';
import { useToast } from 'primevue/usetoast';
import Button from 'primevue/button';
import ProgressSpinner from 'primevue/progressspinner';

const props = defineProps({
    ticketId: {
        type: [String, Number],
        required: true
    },
    compact: {
        type: Boolean,
        default: false
    },
    photosPerPage: {
        type: Number,
        default: 12
    }
});

const emit = defineEmits(['photo-clicked']);

const photosStore = usePhotosStore();
const toast = useToast();

// Reactive state
const currentPage = ref(1);
const loadedImages = ref(new Set());



// Computed properties
const photos = computed(() => photosStore.getTicketPhotos(props.ticketId));

const totalPages = computed(() => {
    return Math.ceil(photos.value.length / props.photosPerPage);
});

const paginatedPhotos = computed(() => {
    const start = (currentPage.value - 1) * props.photosPerPage;
    const end = start + props.photosPerPage;
    return photos.value.slice(start, end);
});

// Watch for ticket ID changes
watch(() => props.ticketId, async (newTicketId) => {
    if (newTicketId) {
        currentPage.value = 1;
        loadedImages.value.clear();
        await loadPhotos();
    }
}, { immediate: true });

// Methods
async function loadPhotos() {
    try {
        await photosStore.loadTicketPhotos(props.ticketId);
    } catch (error) {
        console.error('Failed to load photos:', error);
        toast.add({
            severity: 'error',
            summary: 'Error Loading Photos',
            detail: 'Failed to load photos for this ticket',
            life: 5000
        });
    }
}

async function retryLoading() {
    await loadPhotos();
}

function getPhotoUrl(photo) {
    // Use the thumbnail_url directly from the API response
    // Backend now includes the auth token in the URL
    return photo.thumbnail_url;
}

function getPhotoDisplayName(photo) {
    const name = photo.original_filename || photo.filename;
    // Truncate long filenames
    return name.length > 20 ? `${name.substring(0, 17)}...` : name;
}

function openPhoto(photoIndex) {
    photosStore.openGallery(props.ticketId, photoIndex);
    emit('photo-clicked', { photo: photos.value[photoIndex], index: photoIndex });
}

function openFullGallery() {
    photosStore.openGallery(props.ticketId, 0);
}

async function downloadPhoto(photo) {
    try {
        await photosStore.downloadPhoto(photo);
        toast.add({
            severity: 'success',
            summary: 'Download Started',
            detail: `Downloading ${photo.original_filename || photo.filename}`,
            life: 3000
        });
    } catch (error) {
        console.error('Download failed:', error);
        toast.add({
            severity: 'error',
            summary: 'Download Failed',
            detail: `Failed to download ${photo.original_filename || photo.filename}`,
            life: 5000
        });
    }
}

async function downloadAllPhotos() {
    if (photos.value.length === 0) return;
    
    try {
        toast.add({
            severity: 'info',
            summary: 'Bulk Download Started',
            detail: `Downloading ${photos.value.length} photos...`,
            life: 5000
        });
        
        await photosStore.downloadTicketPhotos(props.ticketId);
        
        toast.add({
            severity: 'success',
            summary: 'Download Complete',
            detail: `Successfully downloaded ${photos.value.length} photos`,
            life: 5000
        });
    } catch (error) {
        console.error('Bulk download failed:', error);
        toast.add({
            severity: 'error',
            summary: 'Bulk Download Failed',
            detail: 'Some photos may not have downloaded successfully',
            life: 5000
        });
    }
}

function handleImageError(event) {
    // Set a placeholder image or hide the failed image
    event.target.style.display = 'none';
    // Optionally show an error icon
    const parent = event.target.parentElement;
    if (parent && !parent.querySelector('.image-error')) {
        const errorIcon = document.createElement('div');
        errorIcon.className = 'image-error flex items-center justify-center h-full text-surface-400';
        errorIcon.innerHTML = '<i class="pi pi-image text-4xl"></i>';
        parent.appendChild(errorIcon);
    }
}

function handleImageLoad(filename) {
    loadedImages.value.add(filename);
}

function nextPage() {
    if (currentPage.value < totalPages.value) {
        currentPage.value++;
    }
}

function previousPage() {
    if (currentPage.value > 1) {
        currentPage.value--;
    }
}

function formatFileSize(bytes) {
    if (!bytes) return '';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}

function formatDate(dateString) {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString();
}

// Load photos on mount
onMounted(async () => {
    if (props.ticketId) {
        await loadPhotos();
    }
});
</script>

<style scoped>
.photo-gallery {
    width: 100%;
}

.photo-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 1rem;
}

.photo-item {
    position: relative;
    cursor: pointer;
    border-radius: 8px;
    overflow: hidden;
    background: var(--p-surface-0);
    border: 1px solid var(--p-surface-200);
    transition: all 0.2s ease;
}

.photo-item:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    border-color: var(--p-primary-500);
}

.photo-thumbnail {
    position: relative;
    width: 100%;
    height: 140px;
    background: var(--p-surface-50);
    display: flex;
    align-items: center;
    justify-content: center;
}

.photo-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: opacity 0.2s ease;
}

.photo-loading {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--p-surface-50);
}

.photo-overlay {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
    color: white;
    padding: 0.75rem;
    font-size: 0.875rem;
}

.photo-name {
    font-weight: 500;
    margin-bottom: 0.25rem;
    line-height: 1.2;
}

.photo-meta {
    font-size: 0.75rem;
    opacity: 0.9;
    display: flex;
    gap: 0.5rem;
}

.photo-actions {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    display: flex;
    gap: 0.25rem;
    opacity: 0;
    transition: opacity 0.2s ease;
}

.photo-item:hover .photo-actions {
    opacity: 1;
}

.photo-action-btn {
    background: rgba(255, 255, 255, 0.9) !important;
    color: var(--p-surface-700) !important;
    border: none !important;
    width: 2rem;
    height: 2rem;
}

.photo-action-btn:hover {
    background: rgba(255, 255, 255, 1) !important;
}

/* Compact mode styles */
.photo-gallery.compact .photo-grid {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 0.5rem;
}

.photo-gallery.compact .photo-thumbnail {
    height: 100px;
}

.photo-gallery.compact .photo-overlay {
    padding: 0.5rem;
    font-size: 0.75rem;
}

.photo-gallery.compact .photo-meta {
    font-size: 0.625rem;
}

/* Dark mode support */
:global(.p-dark) .photo-item {
    background: var(--p-surface-800);
    border-color: var(--p-surface-700);
}

:global(.p-dark) .photo-item:hover {
    border-color: var(--p-primary-400);
}

:global(.p-dark) .photo-thumbnail {
    background: var(--p-surface-700);
}

:global(.p-dark) .photo-loading {
    background: var(--p-surface-700);
}
</style>