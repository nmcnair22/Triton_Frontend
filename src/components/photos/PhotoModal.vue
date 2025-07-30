<template>
    <Dialog 
        v-model:visible="isOpen"
        modal
        :dismissable-mask="true"
        :closable="false"
        :style="{ width: '95vw', height: '95vh' }"
        class="photo-modal"
        @hide="closeModal">
        
        <template #header>
            <div class="flex items-center justify-between w-full">
                <div class="flex items-center gap-3">
                    <i class="pi pi-image text-blue-600"></i>
                    <div>
                        <h3 class="text-lg font-semibold">{{ currentPhoto?.original_filename || currentPhoto?.filename }}</h3>
                        <p class="text-sm text-surface-600" v-if="photoCount > 1">
                            {{ currentIndex + 1 }} of {{ photoCount }}
                        </p>
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    <Button 
                        icon="pi pi-download" 
                        @click="downloadCurrentPhoto"
                        outlined
                        size="small"
                        v-tooltip="'Download Photo'" />
                    <Button 
                        icon="pi pi-external-link" 
                        @click="openInNewTab"
                        outlined
                        size="small"
                        v-tooltip="'Open in New Tab'" />
                    <Button 
                        icon="pi pi-times" 
                        @click="closeModal"
                        text
                        size="small"
                        v-tooltip="'Close (Esc)'" />
                </div>
            </div>
        </template>

        <div class="photo-modal-content">
            <!-- Navigation Arrows -->
            <Button 
                v-if="photoCount > 1"
                icon="pi pi-chevron-left"
                @click="previousPhoto"
                :disabled="currentIndex === 0"
                class="nav-btn nav-prev"
                text
                rounded
                size="large"
                v-tooltip="'Previous (←)'" />
            
            <Button 
                v-if="photoCount > 1"
                icon="pi pi-chevron-right"
                @click="nextPhoto"
                :disabled="currentIndex === photoCount - 1"
                class="nav-btn nav-next"
                text
                rounded
                size="large"
                v-tooltip="'Next (→)'" />

            <!-- Photo Container -->
            <div class="photo-container" @click="toggleFullscreen">
                <div v-if="isLoading" class="photo-loading">
                    <ProgressSpinner />
                    <p class="mt-4">Loading photo...</p>
                </div>
                
                <img 
                    v-else
                    :src="currentPhotoUrl"
                    :alt="currentPhoto?.original_filename || currentPhoto?.filename"
                    class="modal-photo"
                    @load="onPhotoLoad"
                    @error="onPhotoError"
                    @click.stop />
                
                <div v-if="photoError" class="photo-error">
                    <i class="pi pi-exclamation-triangle text-4xl text-orange-500 mb-4"></i>
                    <h3 class="text-lg font-semibold mb-2">Failed to Load Photo</h3>
                    <p class="text-surface-600 mb-4">{{ photoError }}</p>
                    <Button 
                        label="Retry" 
                        icon="pi pi-refresh" 
                        @click="retryPhoto"
                        outlined />
                </div>
            </div>

            <!-- Photo Information Panel -->
            <div class="photo-info-panel" v-if="currentPhoto && showInfo">
                <Card>
                    <template #title>Photo Information</template>
                    <template #content>
                        <div class="space-y-3">
                            <div>
                                <label class="text-sm font-medium text-surface-600">Filename</label>
                                <p class="font-medium">{{ currentPhoto.original_filename || currentPhoto.filename }}</p>
                            </div>
                            <div v-if="currentPhoto.size">
                                <label class="text-sm font-medium text-surface-600">File Size</label>
                                <p>{{ formatFileSize(currentPhoto.size) }}</p>
                            </div>
                            <div v-if="currentPhoto.content_type">
                                <label class="text-sm font-medium text-surface-600">Type</label>
                                <p>{{ currentPhoto.content_type }}</p>
                            </div>
                            <div v-if="currentPhoto.created_at">
                                <label class="text-sm font-medium text-surface-600">Date Created</label>
                                <p>{{ formatDate(currentPhoto.created_at) }}</p>
                            </div>
                            <div v-if="currentPhoto.width && currentPhoto.height">
                                <label class="text-sm font-medium text-surface-600">Dimensions</label>
                                <p>{{ currentPhoto.width }} × {{ currentPhoto.height }}</p>
                            </div>
                        </div>
                    </template>
                </Card>
            </div>

            <!-- Zoom Controls -->
            <div class="zoom-controls">
                <Button 
                    icon="pi pi-search-minus"
                    @click="zoomOut"
                    text
                    rounded
                    size="small"
                    v-tooltip="'Zoom Out'" />
                <span class="zoom-level">{{ Math.round(zoomLevel * 100) }}%</span>
                <Button 
                    icon="pi pi-search-plus"
                    @click="zoomIn"
                    text
                    rounded
                    size="small"
                    v-tooltip="'Zoom In'" />
                <Button 
                    icon="pi pi-refresh"
                    @click="resetZoom"
                    text
                    rounded
                    size="small"
                    v-tooltip="'Reset Zoom'" />
            </div>

            <!-- Thumbnail Strip -->
            <div v-if="photoCount > 1" class="thumbnail-strip">
                <div class="thumbnail-container">
                    <div 
                        v-for="(photo, index) in photos" 
                        :key="photo.id || `${photo.filename}-${index}`"
                        class="thumbnail-item"
                        :class="{ active: index === currentIndex }"
                        @click="goToPhoto(index)">
                        <img 
                            :src="photo.thumbnail_url"
                            :alt="photo.original_filename || photo.filename"
                            class="thumbnail-image" />
                    </div>
                </div>
            </div>
        </div>
    </Dialog>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { usePhotosStore } from '@/stores/photosStore';
import { useToast } from 'primevue/usetoast';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import Card from 'primevue/card';
import ProgressSpinner from 'primevue/progressspinner';

const photosStore = usePhotosStore();
const toast = useToast();

// Reactive state
const isLoading = ref(false);
const photoError = ref(null);
const showInfo = ref(false);
const zoomLevel = ref(1);

// Computed properties
const isOpen = computed({
    get: () => photosStore.isGalleryOpen,
    set: (value) => {
        if (!value) {
            photosStore.closeGallery();
        }
    }
});

const currentPhoto = computed(() => photosStore.selectedPhoto);
const currentIndex = computed(() => {
    if (!photosStore.currentGalleryTicket || !currentPhoto.value) return 0;
    const photos = photosStore.getTicketPhotos(photosStore.currentGalleryTicket);
    return photos.findIndex(p => p.id === currentPhoto.value.id);
});

const photos = computed(() => {
    if (!photosStore.currentGalleryTicket) return [];
    return photosStore.getTicketPhotos(photosStore.currentGalleryTicket);
});

const photoCount = computed(() => photos.value.length);

const currentPhotoUrl = computed(() => {
    if (!currentPhoto.value) return '';
    return currentPhoto.value.download_url;
});

// Watch for photo changes
watch(currentPhoto, (newPhoto) => {
    if (newPhoto) {
        isLoading.value = true;
        photoError.value = null;
        resetZoom();
    }
});

// Methods
function closeModal() {
    photosStore.closeGallery();
}

function nextPhoto() {
    if (currentIndex.value < photoCount.value - 1) {
        photosStore.navigateGallery('next');
    }
}

function previousPhoto() {
    if (currentIndex.value > 0) {
        photosStore.navigateGallery('prev');
    }
}

function goToPhoto(index) {
    if (index >= 0 && index < photoCount.value) {
        const targetPhoto = photos.value[index];
        photosStore.selectedPhoto = targetPhoto;
    }
}

async function downloadCurrentPhoto() {
    if (!currentPhoto.value) return;
    
    try {
        await photosStore.downloadPhoto(currentPhoto.value);
        toast.add({
            severity: 'success',
            summary: 'Download Started',
            detail: `Downloading ${currentPhoto.value.original_filename || currentPhoto.value.filename}`,
            life: 3000
        });
    } catch (error) {
        console.error('Download failed:', error);
        toast.add({
            severity: 'error',
            summary: 'Download Failed',
            detail: 'Failed to download the photo',
            life: 5000
        });
    }
}

function openInNewTab() {
    if (currentPhotoUrl.value) {
        window.open(currentPhotoUrl.value, '_blank');
    }
}

function toggleFullscreen() {
    if (document.fullscreenElement) {
        document.exitFullscreen();
    } else {
        document.documentElement.requestFullscreen();
    }
}

function zoomIn() {
    zoomLevel.value = Math.min(zoomLevel.value * 1.2, 5);
}

function zoomOut() {
    zoomLevel.value = Math.max(zoomLevel.value / 1.2, 0.1);
}

function resetZoom() {
    zoomLevel.value = 1;
}

function onPhotoLoad() {
    isLoading.value = false;
    photoError.value = null;
}

function onPhotoError() {
    isLoading.value = false;
    photoError.value = 'Failed to load the photo. It may be corrupted or unavailable.';
}

function retryPhoto() {
    isLoading.value = true;
    photoError.value = null;
    // Force reload the image by changing the src
    const img = document.querySelector('.modal-photo');
    if (img) {
        img.src = currentPhotoUrl.value + '?retry=' + Date.now();
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
    return new Date(dateString).toLocaleString();
}

// Keyboard navigation
function handleKeydown(event) {
    if (!isOpen.value) return;
    
    switch (event.key) {
        case 'Escape':
            closeModal();
            break;
        case 'ArrowLeft':
            previousPhoto();
            break;
        case 'ArrowRight':
            nextPhoto();
            break;
        case 'Home':
            goToPhoto(0);
            break;
        case 'End':
            goToPhoto(photoCount.value - 1);
            break;
        case 'i':
        case 'I':
            showInfo.value = !showInfo.value;
            break;
        case '+':
        case '=':
            zoomIn();
            break;
        case '-':
            zoomOut();
            break;
        case '0':
            resetZoom();
            break;
        case 'd':
        case 'D':
            downloadCurrentPhoto();
            break;
    }
}

// Lifecycle
onMounted(() => {
    document.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
    document.removeEventListener('keydown', handleKeydown);
});
</script>

<style scoped>
.photo-modal :deep(.p-dialog) {
    margin: 0;
    padding: 0;
}

.photo-modal :deep(.p-dialog-content) {
    padding: 0;
    border-radius: 0 0 8px 8px;
}

.photo-modal-content {
    position: relative;
    height: calc(95vh - 60px);
    display: flex;
    flex-direction: column;
    background: var(--p-surface-900);
}

.photo-container {
    flex: 1;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--p-surface-900);
    cursor: pointer;
    overflow: hidden;
}

.modal-photo {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
    transform: scale(v-bind(zoomLevel));
    transition: transform 0.2s ease;
    cursor: zoom-in;
}

.modal-photo:active {
    cursor: zoom-out;
}

.photo-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: white;
}

.photo-error {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: white;
    text-align: center;
    padding: 2rem;
}

.nav-btn {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    z-index: 10;
    background: rgba(0, 0, 0, 0.5) !important;
    color: white !important;
    border: none !important;
    width: 3rem;
    height: 3rem;
}

.nav-btn:hover {
    background: rgba(0, 0, 0, 0.7) !important;
}

.nav-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
}

.nav-prev {
    left: 1rem;
}

.nav-next {
    right: 1rem;
}

.photo-info-panel {
    position: absolute;
    top: 1rem;
    right: 1rem;
    width: 300px;
    max-height: 400px;
    overflow-y: auto;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border-radius: 8px;
    z-index: 20;
}

.zoom-controls {
    position: absolute;
    bottom: 1rem;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 0.5rem 1rem;
    border-radius: 20px;
    z-index: 10;
}

.zoom-level {
    font-size: 0.875rem;
    min-width: 3rem;
    text-align: center;
    color: white;
}

.zoom-controls .p-button {
    color: white !important;
    border: none !important;
}

.thumbnail-strip {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 80px;
    background: rgba(0, 0, 0, 0.8);
    z-index: 10;
    overflow-x: auto;
    overflow-y: hidden;
}

.thumbnail-container {
    display: flex;
    height: 100%;
    padding: 0.5rem;
    gap: 0.5rem;
    align-items: center;
}

.thumbnail-item {
    flex-shrink: 0;
    width: 60px;
    height: 60px;
    cursor: pointer;
    border: 2px solid transparent;
    border-radius: 4px;
    overflow: hidden;
    transition: all 0.2s ease;
}

.thumbnail-item:hover {
    border-color: var(--p-primary-400);
    transform: scale(1.05);
}

.thumbnail-item.active {
    border-color: var(--p-primary-500);
    box-shadow: 0 0 10px rgba(var(--p-primary-500-rgb), 0.5);
}

.thumbnail-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

/* Dark mode adjustments */
:global(.p-dark) .photo-info-panel {
    background: rgba(30, 30, 30, 0.95);
    color: white;
}

/* Responsive adjustments */
@media (max-width: 768px) {
    .photo-modal :deep(.p-dialog) {
        width: 100vw !important;
        height: 100vh !important;
        margin: 0;
        border-radius: 0;
    }
    
    .photo-modal-content {
        height: calc(100vh - 60px);
    }
    
    .nav-btn {
        width: 2.5rem;
        height: 2.5rem;
    }
    
    .nav-prev {
        left: 0.5rem;
    }
    
    .nav-next {
        right: 0.5rem;
    }
    
    .photo-info-panel {
        width: 280px;
        right: 0.5rem;
        top: 0.5rem;
    }
    
    .zoom-controls {
        bottom: 90px;
        padding: 0.25rem 0.75rem;
    }
}
</style>