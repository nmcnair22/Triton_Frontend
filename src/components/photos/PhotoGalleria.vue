<template>
    <div class="photo-galleria">
        <!-- Loading State -->
        <div v-if="loading" class="loading-state">
            <ProgressSpinner />
            <p class="mt-4">Loading photos...</p>
        </div>

        <!-- Error State -->
        <div v-if="error" class="error-state">
            <i class="pi pi-exclamation-triangle text-4xl text-orange-500 mb-4"></i>
            <p class="text-lg">{{ error }}</p>
            <Button label="Retry" @click="loadPhotos" class="mt-4" />
        </div>

        <!-- Photo Grid with Galleria Modal -->
        <div v-if="!loading && photos.length > 0" class="photo-content">
            <!-- Photo Count and Actions -->
            <div class="flex justify-between items-center mb-4">
                <div class="flex items-center gap-4">
                    <h4 class="font-semibold">{{ photos.length }} Photos</h4>
                    <div class="text-sm text-surface-500">
                        Click any photo to view full size
                    </div>
                </div>
                <div class="flex gap-2">
                    <Button 
                        icon="pi pi-download" 
                        label="Download All" 
                        @click="downloadAllPhotos"
                        outlined
                        size="small" />
                </div>
            </div>

            <!-- Compact Grid for Drawer -->
            <div v-if="compact" class="photo-grid-compact">
                <div 
                    v-for="(photo, index) in paginatedPhotos" 
                    :key="photo.id"
                    class="photo-item-compact"
                    @click="openGalleria(index)"
                >
                    <img 
                        :src="photo.thumbnail_url"
                        :alt="photo.original_filename"
                        class="photo-thumbnail-compact"
                        loading="lazy"
                        @error="handleImageError"
                    />
                    <div class="photo-overlay-compact">
                        <div class="text-xs font-medium">{{ getPhotoDisplayName(photo) }}</div>
                        <div class="text-xs opacity-75">{{ formatFileSize(photo.size) }}</div>
                    </div>
                </div>
            </div>

            <!-- Full Grid for Normal View -->
            <div v-else class="photo-grid">
                <div 
                    v-for="(photo, index) in paginatedPhotos" 
                    :key="photo.id"
                    class="photo-item"
                    @click="openGalleria(index)"
                >
                    <img 
                        :src="photo.thumbnail_url"
                        :alt="photo.original_filename"
                        class="photo-thumbnail"
                        loading="lazy"
                        @error="handleImageError"
                    />
                    <div class="photo-overlay">
                        <div class="font-medium">{{ getPhotoDisplayName(photo) }}</div>
                        <div class="text-sm opacity-75">{{ formatFileSize(photo.size) }}</div>
                        <div class="text-xs opacity-75">{{ formatDate(photo.created_at) }}</div>
                    </div>
                    <div class="photo-actions">
                        <Button 
                            icon="pi pi-eye" 
                            @click.stop="openGalleria(index)"
                            rounded
                            text
                            size="small"
                            class="mr-1" />
                        <Button 
                            icon="pi pi-download" 
                            @click.stop="downloadPhoto(photo)"
                            rounded
                            text
                            size="small" />
                    </div>
                </div>
            </div>

            <!-- Pagination -->
            <div v-if="totalPages > 1" class="pagination-controls">
                <Button 
                    icon="pi pi-chevron-left" 
                    @click="previousPage"
                    :disabled="currentPage === 1"
                    text />
                <span class="mx-4">
                    Page {{ currentPage }} of {{ totalPages }}
                </span>
                <Button 
                    icon="pi pi-chevron-right" 
                    @click="nextPage"
                    :disabled="currentPage === totalPages"
                    text />
            </div>

            <!-- PrimeVue Galleria Modal -->
            <Galleria 
                v-model:visible="galleriaVisible"
                v-model:activeIndex="activeIndex"
                :value="photos"
                :responsiveOptions="responsiveOptions"
                :numVisible="5"
                containerStyle="max-width: 100vw; max-height: 100vh; background-color: black;"
                :circular="true"
                :fullScreen="true"
                :showItemNavigators="true"
                :showThumbnails="true"
                :showIndicators="false"
                :autoPlay="false"
                :changeItemOnIndicatorHover="false"
                :showItemNavigatorsOnHover="false"
                :showThumbnailNavigators="true"
            >
                <!-- Main Photo Template -->
                <template #item="slotProps">
                    <div class="galleria-item">
                        <div class="photo-loading-container" v-if="imageLoading">
                            <ProgressSpinner />
                            <p class="mt-4">Loading {{ slotProps.item.original_filename }}...</p>
                            <div class="progress-details">
                                <p class="text-sm text-surface-500">{{ formatFileSize(slotProps.item.size) }}</p>
                                <p class="text-xs text-surface-300 mt-2">Optimizing image for viewing...</p>
                                <div class="w-48 bg-surface-700 rounded-full h-1 mt-2">
                                    <div class="bg-primary-500 h-1 rounded-full progress-bar"></div>
                                </div>
                            </div>
                        </div>
                        <div v-else class="image-container">
                            <!-- Progressive loading: Low-quality placeholder first -->
                            <img 
                                v-if="!imageLoaded"
                                :src="createProgressivePlaceholder(slotProps.item)"
                                :alt="slotProps.item.original_filename"
                                class="galleria-image placeholder-image"
                                style="filter: blur(2px); transition: opacity 0.3s ease;"
                            />
                            <!-- High-quality image -->
                            <img 
                                :src="getOptimizedImageUrl(slotProps.item)"
                                :alt="slotProps.item.original_filename"
                                class="galleria-image main-image"
                                :style="{ 
                                    opacity: imageLoaded ? 1 : 0,
                                    transition: 'opacity 0.5s ease',
                                    position: imageLoaded ? 'relative' : 'absolute',
                                    top: imageLoaded ? 'auto' : '0',
                                    left: imageLoaded ? 'auto' : '0',
                                    width: '100%',
                                    height: '100%'
                                }"
                                @load="onImageLoad"
                                @error="onImageError"
                                loading="eager"
                            />
                        </div>
                        <div v-if="!imageLoading" class="debug-info" style="position: absolute; top: 10px; left: 10px; background: rgba(0,0,0,0.8); color: white; padding: 8px; font-size: 11px; max-width: 200px; border-radius: 4px; z-index: 20;">
                            <div>Index: {{ activeIndex }}</div>
                            <div>Filename: {{ slotProps.item.original_filename }}</div>
                            <div>Size: {{ formatFileSize(slotProps.item.size) }}</div>
                            <div>Loading: {{ imageLoading }}</div>
                        </div>
                    </div>
                </template>

                <!-- Thumbnail Template -->
                <template #thumbnail="slotProps">
                    <div class="galleria-thumbnail-wrapper">
                        <img 
                            :src="slotProps.item.thumbnail_url" 
                            :alt="slotProps.item.original_filename"
                            class="galleria-thumbnail"
                        />
                    </div>
                </template>

                <!-- Caption Template -->
                <template #caption="slotProps">
                    <div class="galleria-caption">
                        <div class="flex items-center justify-between w-full">
                            <!-- Left: Filename and metadata -->
                            <div class="flex items-center gap-4">
                                <span class="font-semibold">{{ slotProps.item.original_filename }}</span>
                                <span class="text-sm">{{ formatFileSize(slotProps.item.size) }}</span>
                                <span class="text-sm">{{ slotProps.item.content_type }}</span>
                                <span class="text-sm">{{ formatDate(slotProps.item.created_at) }}</span>
                            </div>
                            <!-- Right: Action buttons -->
                            <div class="flex items-center gap-2">
                                <Button 
                                    icon="pi pi-download" 
                                    @click="downloadPhoto(slotProps.item)"
                                    text
                                    size="small"
                                    class="text-white hover:bg-white hover:bg-opacity-20"
                                    style="color: white;" />
                                <Button 
                                    icon="pi pi-external-link" 
                                    @click="openInNewTab(slotProps.item)"
                                    text
                                    size="small"
                                    class="text-white hover:bg-white hover:bg-opacity-20"
                                    style="color: white;" />
                            </div>
                        </div>
                    </div>
                </template>
            </Galleria>
        </div>

        <!-- No Photos State -->
        <div v-if="!loading && photos.length === 0" class="no-photos">
            <i class="pi pi-image text-4xl text-surface-400 mb-4"></i>
            <p class="text-surface-600">No photos available for this ticket.</p>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { usePhotosStore } from '@/stores/photosStore';
import { useToast } from 'primevue/usetoast';
import Button from 'primevue/button';
import ProgressSpinner from 'primevue/progressspinner';
import Galleria from 'primevue/galleria';

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
const galleriaVisible = ref(false);
const activeIndex = ref(0);
const imageLoading = ref(false);
const imageLoaded = ref(false);
const loadingTimeout = ref(null);
const preloadedImages = ref(new Set());

// Galleria responsive options
const responsiveOptions = ref([
    {
        breakpoint: '1024px',
        numVisible: 5
    },
    {
        breakpoint: '768px',
        numVisible: 3
    },
    {
        breakpoint: '560px',
        numVisible: 1
    }
]);

// Computed properties
const photos = computed(() => {
    const photoData = photosStore.getTicketPhotos(props.ticketId);
    console.log('PhotoGalleria: Computed photos for ticket', props.ticketId, ':', photoData);
    if (photoData && photoData.length > 0) {
        console.log('PhotoGalleria: First photo structure:', photoData[0]);
        console.log('PhotoGalleria: First photo download_url:', photoData[0]?.download_url);
        console.log('PhotoGalleria: First photo thumbnail_url:', photoData[0]?.thumbnail_url);
    }
    return photoData;
});
const loading = computed(() => photosStore.isLoading(props.ticketId));
const error = computed(() => photosStore.getError(props.ticketId));

const totalPages = computed(() => {
    return Math.ceil(photos.value.length / props.photosPerPage);
});

const paginatedPhotos = computed(() => {
    const start = (currentPage.value - 1) * props.photosPerPage;
    const end = start + props.photosPerPage;
    return photos.value.slice(start, end);
});

// Watch for ticket changes
watch(() => props.ticketId, async (newTicketId) => {
    if (newTicketId) {
        currentPage.value = 1;
        await loadPhotos();
    }
}, { immediate: true });

// Watch for galleria visibility changes
watch(galleriaVisible, (visible) => {
    console.log('PhotoGalleria: galleriaVisible changed to:', visible);
    if (visible) {
        imageLoading.value = true;
        console.log('PhotoGalleria: Set imageLoading to true');
        const currentPhoto = photos.value[activeIndex.value];
        console.log('PhotoGalleria: Current photo when opening:', currentPhoto);
        if (currentPhoto) {
            console.log('PhotoGalleria: Current photo download_url:', currentPhoto.download_url);
        }
        
        // Set timeout to clear loading state
        if (loadingTimeout.value) {
            clearTimeout(loadingTimeout.value);
        }
        loadingTimeout.value = setTimeout(() => {
            console.warn('PhotoGalleria: Image loading timeout after 5 seconds');
            imageLoading.value = false;
        }, 5000);
    } else {
        // Clear timeout when closing
        if (loadingTimeout.value) {
            clearTimeout(loadingTimeout.value);
            loadingTimeout.value = null;
        }
    }
});

// Watch for active index changes in galleria
watch(activeIndex, (newIndex, oldIndex) => {
    console.log('PhotoGalleria: activeIndex changed from', oldIndex, 'to', newIndex);
    if (galleriaVisible.value) {
        const currentPhoto = photos.value[newIndex];
        
        // Reset state for new image
        imageLoaded.value = false;
        
        // Check if image is already preloaded
        const optimizedUrl = currentPhoto ? getOptimizedImageUrl(currentPhoto) : null;
        if (currentPhoto && optimizedUrl && preloadedImages.value.has(optimizedUrl)) {
            console.log('PhotoGalleria: Image already preloaded, loading instantly');
            imageLoading.value = false;
            imageLoaded.value = true;
        } else {
            imageLoading.value = true;
            console.log('PhotoGalleria: Set imageLoading to true for index change');
            console.log('PhotoGalleria: New photo for index', newIndex, ':', currentPhoto);
            if (currentPhoto) {
                console.log('PhotoGalleria: New photo download_url:', currentPhoto.download_url);
                console.log('PhotoGalleria: New photo size:', currentPhoto.size, 'bytes');
            }
            
            // Set timeout to clear loading state
            if (loadingTimeout.value) {
                clearTimeout(loadingTimeout.value);
            }
            loadingTimeout.value = setTimeout(() => {
                console.warn('PhotoGalleria: Image loading timeout after 5 seconds for index', newIndex);
                imageLoading.value = false;
                imageLoaded.value = true; // Show image even if timeout occurs
            }, 5000);
        }
        
        // Preload adjacent images for faster navigation
        preloadAdjacentImages(newIndex);
    }
});

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

// Image preloading function
function preloadImage(url) {
    return new Promise((resolve, reject) => {
        if (preloadedImages.value.has(url)) {
            resolve(url);
            return;
        }
        
        const img = new Image();
        img.onload = () => {
            preloadedImages.value.add(url);
            console.log('PhotoGalleria: Preloaded image:', url);
            resolve(url);
        };
        img.onerror = (error) => {
            console.warn('PhotoGalleria: Failed to preload image:', url, error);
            reject(error);
        };
        img.src = url;
    });
}

// Preload adjacent images for faster navigation
function preloadAdjacentImages(currentIndex) {
    const indicesToPreload = [];
    
    // Preload previous image
    if (currentIndex > 0) {
        indicesToPreload.push(currentIndex - 1);
    }
    
    // Preload next image
    if (currentIndex < photos.value.length - 1) {
        indicesToPreload.push(currentIndex + 1);
    }
    
    // Preload 2 images ahead and behind for smoother navigation
    if (currentIndex > 1) indicesToPreload.push(currentIndex - 2);
    if (currentIndex < photos.value.length - 2) indicesToPreload.push(currentIndex + 2);
    
    indicesToPreload.forEach(index => {
        const photo = photos.value[index];
        if (photo?.download_url) {
            const optimizedUrl = getOptimizedImageUrl(photo);
            preloadImage(optimizedUrl).catch(() => {
                // Silently handle preload failures
            });
        }
    });
}

function openGalleria(index) {
    console.log('PhotoGalleria: Opening galleria at index', index);
    console.log('PhotoGalleria: Total photos available:', photos.value.length);
    console.log('PhotoGalleria: Photo at index', index, ':', photos.value[index]);
    
    activeIndex.value = index;
    galleriaVisible.value = true;
    
    // Start preloading adjacent images
    preloadAdjacentImages(index);
    
    emit('photo-clicked', { photo: photos.value[index], index });
}

function onImageLoad() {
    console.log('PhotoGalleria: Image loaded successfully');
    console.log('PhotoGalleria: Setting imageLoading to false and imageLoaded to true');
    
    // Clear timeout since image loaded successfully
    if (loadingTimeout.value) {
        clearTimeout(loadingTimeout.value);
        loadingTimeout.value = null;
    }
    
    imageLoading.value = false;
    imageLoaded.value = true;
    
    // Preload adjacent images for smoother navigation
    preloadAdjacentImages(activeIndex.value);
}

function onImageError(event) {
    console.error('PhotoGalleria: Image load error:', event);
    console.log('PhotoGalleria: Error target src:', event.target?.src);
    console.log('PhotoGalleria: Setting imageLoading to false due to error');
    
    // Clear timeout since image failed to load
    if (loadingTimeout.value) {
        clearTimeout(loadingTimeout.value);
        loadingTimeout.value = null;
    }
    
    imageLoading.value = false;
    toast.add({
        severity: 'warn',
        summary: 'Image Load Error',
        detail: 'Failed to load the full-size image',
        life: 3000
    });
}

function downloadPhoto(photo) {
    const link = document.createElement('a');
    link.href = photo.download_url;
    link.download = photo.original_filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

async function downloadAllPhotos() {
    if (photos.value.length === 0) return;
    
    toast.add({
        severity: 'info',
        summary: 'Bulk Download Started',
        detail: `Downloading ${photos.value.length} photos...`,
        life: 5000
    });
    
    for (const photo of photos.value) {
        downloadPhoto(photo);
        // Small delay between downloads
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    toast.add({
        severity: 'success',
        summary: 'Download Complete',
        detail: `Successfully started downloads for ${photos.value.length} photos`,
        life: 5000
    });
}

function openInNewTab(photo) {
    window.open(photo.download_url, '_blank');
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

function handleImageError(event) {
    event.target.src = '/images/photo-error-placeholder.png';
    event.target.alt = 'Image failed to load';
}

function getPhotoDisplayName(photo) {
    const name = photo.original_filename || photo.filename;
    return name.length > 20 ? `${name.substring(0, 17)}...` : name;
}

function formatFileSize(bytes) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}

function formatDate(dateString) {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString();
}

// Advanced Azure image optimization with progressive loading and modern formats
function getOptimizedImageUrl(photo, options = {}) {
    const {
        width = 1920,
        height = 1080,
        quality = 85,
        progressive = false,
        thumbnailMode = false
    } = options;
    
    // Advanced format detection with AVIF and WebP support
    const formatSupport = (() => {
        const cache = getOptimizedImageUrl._formatCache || {};
        if (Object.keys(cache).length === 0) {
            // Test AVIF support
            const avifCanvas = document.createElement('canvas');
            avifCanvas.width = 1;
            avifCanvas.height = 1;
            cache.avif = avifCanvas.toDataURL('image/avif').indexOf('data:image/avif') === 0;
            
            // Test WebP support
            const webpCanvas = document.createElement('canvas');
            webpCanvas.width = 1;
            webpCanvas.height = 1;
            cache.webp = webpCanvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
            
            getOptimizedImageUrl._formatCache = cache;
        }
        return cache;
    })();
    
    const originalUrl = photo.download_url;
    
    // Enhanced Azure Blob Storage / CDN optimization
    if (originalUrl.includes('azure') || originalUrl.includes('blob') || originalUrl.includes('azureedge')) {
        try {
            const url = new URL(originalUrl);
            const params = new URLSearchParams();
            
            // Determine optimal format (AVIF > WebP > JPEG)
            let format = 'jpeg';
            if (formatSupport.avif) {
                format = 'avif';
            } else if (formatSupport.webp) {
                format = 'webp';
            }
            
            // Responsive sizing based on viewport and device pixel ratio
            const dpr = window.devicePixelRatio || 1;
            const viewportWidth = window.innerWidth || 1920;
            
            // Adaptive sizing for performance
            let adaptiveWidth = width;
            let adaptiveHeight = height;
            
            if (thumbnailMode) {
                adaptiveWidth = 300;
                adaptiveHeight = 200;
            } else if (viewportWidth < 768) {
                // Mobile optimization
                adaptiveWidth = Math.min(width, viewportWidth * dpr);
                adaptiveHeight = Math.min(height, (viewportWidth * dpr * 0.75));
            }
            
            // Azure Image Transformation parameters
            params.set('format', format);
            params.set('quality', progressive ? Math.max(quality - 15, 60) : quality);
            params.set('width', Math.round(adaptiveWidth).toString());
            params.set('height', Math.round(adaptiveHeight).toString());
            params.set('mode', 'crop'); // Better for consistent aspect ratios
            params.set('scale', 'both');
            
            // Performance optimizations
            if (progressive) {
                params.set('progressive', 'true');
            }
            
            // Cache control headers for CDN
            params.set('cache', '604800'); // 7 days cache
            params.set('optimize', 'true');
            
            // Lossless optimization for high-quality images
            if (quality >= 90) {
                params.set('lossless', 'true');
            }
            
            return `${url.origin}${url.pathname}?${params.toString()}`;
            
        } catch (error) {
            console.warn('PhotoGalleria: URL optimization failed:', error);
            return originalUrl;
        }
    }
    
    // Fallback to original URL
    return originalUrl;
}

// Create progressive loading placeholder (blur-up effect)
function createProgressivePlaceholder(photo) {
    return getOptimizedImageUrl(photo, {
        width: 40,
        height: 30,
        quality: 20,
        progressive: true,
        thumbnailMode: true
    });
}
</script>

<style scoped>
.photo-galleria {
    padding: 1rem 0;
}

/* Compact Grid for Drawer */
.photo-grid-compact {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 0.75rem;
}

.photo-item-compact {
    position: relative;
    cursor: pointer;
    border-radius: 6px;
    overflow: hidden;
    box-shadow: 0 1px 4px rgba(0,0,0,0.1);
    transition: transform 0.2s ease;
}

.photo-item-compact:hover {
    transform: scale(1.05);
}

.photo-thumbnail-compact {
    width: 100%;
    height: 100px;
    object-fit: cover;
}

.photo-overlay-compact {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: linear-gradient(transparent, rgba(0,0,0,0.8));
    color: white;
    padding: 0.5rem;
    text-align: center;
}

/* Full Grid */
.photo-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1rem;
}

.photo-item {
    position: relative;
    cursor: pointer;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    transition: transform 0.2s ease;
}

.photo-item:hover {
    transform: scale(1.02);
}

.photo-item:hover .photo-actions {
    opacity: 1;
}

.photo-thumbnail {
    width: 100%;
    height: 200px;
    object-fit: cover;
}

.photo-overlay {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: linear-gradient(transparent, rgba(0,0,0,0.8));
    color: white;
    padding: 1rem;
}

.photo-actions {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    opacity: 0;
    transition: opacity 0.2s ease;
}

/* Galleria Styles */
.galleria-item {
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    width: 100%;
    height: 100%;
    background-color: #000;
}

.photo-loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    color: white;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 10;
}

.progress-details {
    margin-top: 1rem;
    max-width: 300px;
}

.progress-bar {
    animation: indeterminate 2s linear infinite;
    width: 0%;
}

@keyframes indeterminate {
    0% {
        width: 0%;
        margin-left: 0%;
    }
    50% {
        width: 60%;
        margin-left: 20%;
    }
    100% {
        width: 0%;
        margin-left: 100%;
    }
}

/* Progressive image loading styles */
.image-container {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
}

.placeholder-image {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    filter: blur(2px) brightness(1.1);
    transform: scale(1.05); /* Slight scale to hide blur edges */
}

.main-image {
    position: relative;
    width: 100%;
    height: 100%;
    object-fit: cover;
}

/* Performance optimizations */
.galleria-image {
    will-change: opacity, transform;
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
}

.galleria-image {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain; /* Ensures image fits within frame without distortion */
    width: auto;
    height: auto;
    background-color: transparent;
}

.galleria-thumbnail-wrapper {
    padding: 4px;
}

.galleria-thumbnail {
    width: 60px;
    height: 60px;
    object-fit: cover;
    border-radius: 4px;
}

.galleria-caption {
    background: rgba(0,0,0,0.7);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    color: white;
    padding: 0.5rem 1rem;
    position: absolute;
    bottom: 60px; /* Just above thumbnail strip */
    left: 0;
    right: 0;
    z-index: 15;
    width: 100%;
    height: auto;
    min-height: 40px;
    border-top: 1px solid rgba(255,255,255,0.1);
    transition: all 0.3s ease;
    opacity: 0.95;
}

.galleria-caption:hover {
    opacity: 1;
    background: rgba(0,0,0,0.85);
}

.galleria-caption span {
    color: #ffffff !important;
    text-shadow: 0 1px 2px rgba(0,0,0,0.8);
}

.galleria-caption .font-semibold {
    color: #ffffff !important;
    text-shadow: 0 1px 3px rgba(0,0,0,0.9);
}

/* Utility Styles */
.loading-state, .error-state, .no-photos {
    text-align: center;
    padding: 2rem;
    color: var(--p-surface-600);
}

.error-state {
    color: var(--p-red-500);
}

.pagination-controls {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 1rem;
}

/* Galleria Modal Customizations */
:deep(.p-galleria-mask) {
    background-color: rgba(0, 0, 0, 0.95) !important; /* Solid dark backdrop instead of transparent */
}

:deep(.p-galleria-content) {
    background-color: #000 !important; /* Black background for content area */
}

:deep(.p-galleria-item-wrapper) {
    background-color: #000 !important; /* Black background behind images */
}

:deep(.p-galleria-item-container) {
    width: 80vw !important; /* Fixed width */
    height: 70vh !important; /* Fixed height */
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    background-color: #000 !important; /* Black fill for unused space */
    position: relative !important;
}

:deep(.p-galleria-item) {
    width: 100% !important;
    height: 100% !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    background-color: #000 !important;
}

/* Ensure navigation controls stay in consistent positions */
:deep(.p-galleria-item-prev),
:deep(.p-galleria-item-next) {
    position: absolute !important;
    top: 50% !important;
    transform: translateY(-50%) !important;
    z-index: 1000 !important;
    background-color: rgba(255, 255, 255, 0.1) !important;
    border-radius: 50% !important;
    width: 3rem !important;
    height: 3rem !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
}

:deep(.p-galleria-item-prev) {
    left: 2rem !important;
}

:deep(.p-galleria-item-next) {
    right: 2rem !important;
}

/* Fixed positioning for thumbnail strip */
:deep(.p-galleria-thumbnail-wrapper) {
    background-color: rgba(0, 0, 0, 0.8) !important;
    padding: 1rem !important;
    position: fixed !important;
    bottom: 0 !important;
    left: 0 !important;
    right: 0 !important;
    z-index: 1000 !important;
    backdrop-filter: blur(5px) !important;
    -webkit-backdrop-filter: blur(5px) !important;
}

/* Close button positioning */
:deep(.p-galleria-close) {
    position: fixed !important;
    top: 2rem !important;
    right: 2rem !important;
    z-index: 1001 !important;
    background-color: rgba(255, 255, 255, 0.1) !important;
    border-radius: 50% !important;
    width: 3rem !important;
    height: 3rem !important;
}

/* Caption button styling for dark background */
:deep(.galleria-caption .p-button) {
    border-color: #ffffff !important;
    color: #ffffff !important;
    background-color: rgba(255,255,255,0.1) !important;
    transition: all 0.2s ease !important;
}

:deep(.galleria-caption .p-button:hover) {
    background-color: rgba(255,255,255,0.9) !important;
    color: #000000 !important;
    border-color: #ffffff !important;
}

:deep(.galleria-caption .p-button:focus) {
    box-shadow: 0 0 0 2px rgba(255,255,255,0.3) !important;
}
</style>