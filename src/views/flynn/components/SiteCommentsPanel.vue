<template>
    <div class="site-comments-panel">
        <!-- Comments Filter Bar -->
        <div class="mb-4 p-4 bg-surface-50 dark:bg-surface-800 rounded-lg border border-surface-200 dark:border-surface-700">
            <div class="flex flex-wrap items-center gap-4 mb-3">
                <IconField iconPosition="left">
                    <InputIcon class="pi pi-search" />
                    <InputText 
                        v-model="searchFilter" 
                        placeholder="Search comments..." 
                        class="w-64" />
                </IconField>
                
                <Select 
                    v-model="statusFilter" 
                    :options="statusOptions" 
                    placeholder="Filter by status" 
                    class="w-48" />
                    
                <Select 
                    v-model="authorFilter" 
                    :options="authorOptions" 
                    placeholder="Filter by author" 
                    class="w-48" />
                    
                <Button 
                    label="Clear Filters" 
                    icon="pi pi-times" 
                    size="small" 
                    severity="secondary" 
                    outlined
                    @click="clearFilters" />
            </div>
            
            <div class="flex items-center gap-4 text-sm text-surface-600 dark:text-surface-400">
                <span><strong>{{ filteredComments.length }}</strong> comments</span>
                <span><strong>{{ unresolvedCount }}</strong> unresolved</span>
                <span><strong>{{ recentActivityCount }}</strong> recent activity</span>
            </div>
        </div>

        <!-- Comments Stream -->
        <div class="comments-stream space-y-4">
            <div v-if="filteredComments.length === 0" class="text-center py-8">
                <i class="pi pi-comment text-4xl text-surface-300 dark:text-surface-600 mb-3"></i>
                <p class="text-surface-500 dark:text-surface-400">No comments found</p>
            </div>

            <Card v-for="comment in filteredComments" :key="comment.id" class="comment-card">
                <template #content>
                    <div class="flex items-start gap-4">
                        <!-- Avatar -->
                        <Avatar 
                            :label="comment.author.charAt(0).toUpperCase()" 
                            class="flex-shrink-0"
                            shape="circle" 
                            :style="{ backgroundColor: getAuthorColor(comment.author) }" />
                        
                        <!-- Comment Content -->
                        <div class="flex-1">
                            <div class="flex items-start justify-between mb-2">
                                <div>
                                    <h6 class="font-semibold text-surface-900 dark:text-surface-0 mb-1">
                                        {{ comment.author }}
                                    </h6>
                                    <div class="flex items-center gap-2 text-sm text-surface-500 dark:text-surface-400">
                                        <span>{{ formatDate(comment.date) }}</span>
                                        <span>•</span>
                                        <Tag 
                                            :value="comment.type" 
                                            :severity="getCommentTypeSeverity(comment.type)"
                                            size="small" />
                                    </div>
                                </div>
                                
                                <!-- Comment Actions -->
                                <div class="flex items-center gap-2">
                                    <Tag 
                                        :value="comment.status" 
                                        :severity="getStatusSeverity(comment.status)"
                                        :class="comment.status === 'Unresolved' ? 'animate-pulse' : ''" />
                                    <Button 
                                        v-if="comment.status === 'Unresolved'"
                                        icon="pi pi-check" 
                                        size="small" 
                                        severity="success" 
                                        rounded
                                        v-tooltip.top="'Mark as Resolved'"
                                        @click="resolveComment(comment)" />
                                    <Button 
                                        icon="pi pi-flag" 
                                        size="small" 
                                        :severity="comment.flagged ? 'danger' : 'secondary'" 
                                        rounded
                                        v-tooltip.top="comment.flagged ? 'Remove Flag' : 'Flag as Important'"
                                        @click="toggleFlag(comment)" />
                                </div>
                            </div>
                            
                            <!-- Comment Text -->
                            <div class="mb-3">
                                <p class="text-surface-700 dark:text-surface-300 leading-relaxed">
                                    {{ comment.content }}
                                </p>
                            </div>
                            
                            <!-- Attachments -->
                            <div v-if="comment.attachments && comment.attachments.length > 0" class="mb-3">
                                <h6 class="text-sm font-medium mb-2">Attachments:</h6>
                                <div class="flex flex-wrap gap-2">
                                    <div v-for="attachment in comment.attachments" :key="attachment.id"
                                         class="flex items-center gap-2 p-2 bg-surface-100 dark:bg-surface-700 rounded text-sm">
                                        <i :class="getFileIcon(attachment.type)" class="text-blue-500"></i>
                                        <span>{{ attachment.name }}</span>
                                        <Button 
                                            icon="pi pi-download" 
                                            size="small" 
                                            text 
                                            @click="downloadAttachment(attachment)" />
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Reply Section -->
                            <div class="border-t border-surface-200 dark:border-surface-700 pt-3">
                                <div class="flex gap-2">
                                    <InputText 
                                        v-model="replyText[comment.id]" 
                                        placeholder="Add a reply..." 
                                        class="flex-1" 
                                        size="small" />
                                    <Button 
                                        label="Reply" 
                                        icon="pi pi-send" 
                                        size="small" 
                                        @click="addReply(comment)" 
                                        :disabled="!replyText[comment.id]" />
                                </div>
                            </div>
                        </div>
                    </div>
                </template>
            </Card>
        </div>

        <!-- Add New Comment -->
        <Card class="mt-6">
            <template #header>
                <div class="flex items-center gap-2 p-4">
                    <i class="pi pi-plus text-green-600"></i>
                    <h6 class="text-lg font-semibold mb-0">Add New Comment</h6>
                </div>
            </template>
            <template #content>
                <div class="space-y-4">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Select 
                            v-model="newComment.type" 
                            :options="commentTypes" 
                            placeholder="Select comment type" />
                        <Select 
                            v-model="newComment.priority" 
                            :options="priorityOptions" 
                            placeholder="Select priority" />
                    </div>
                    
                    <Textarea 
                        v-model="newComment.content" 
                        placeholder="Enter your comment..." 
                        rows="4" 
                        class="w-full" />
                    
                    <div class="flex justify-end gap-2">
                        <Button 
                            label="Cancel" 
                            severity="secondary" 
                            outlined
                            @click="clearNewComment" />
                        <Button 
                            label="Add Comment" 
                            icon="pi pi-plus" 
                            @click="addNewComment" 
                            :disabled="!newComment.content || !newComment.type" />
                    </div>
                </div>
            </template>
        </Card>
    </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import Card from 'primevue/card';
import InputText from 'primevue/inputtext';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import Select from 'primevue/select';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import Avatar from 'primevue/avatar';
import Textarea from 'primevue/textarea';

// Props
const props = defineProps({
    location: {
        type: Object,
        required: true
    },
    comments: {
        type: Array,
        default: () => []
    }
});

// Reactive data
const searchFilter = ref('');
const statusFilter = ref('');
const authorFilter = ref('');
const replyText = ref({});
const newComment = ref({
    type: '',
    priority: '',
    content: ''
});

// Filter options
const statusOptions = ref(['All', 'Resolved', 'Unresolved']);
const commentTypes = ref(['General', 'Issue', 'Question', 'Update', 'Technical']);
const priorityOptions = ref(['Low', 'Medium', 'High', 'Critical']);

// Use comments from props - NO MOCK DATA

// Computed - using props.comments, NO MOCK DATA
const authorOptions = computed(() => {
    if (!props.comments || props.comments.length === 0) return ['All'];
    const authors = ['All', ...new Set(props.comments.map(c => c.author || c.author_display_name || 'Unknown'))];
    return authors;
});

const filteredComments = computed(() => {
    if (!props.comments || props.comments.length === 0) return [];
    
    let filtered = props.comments.map(comment => ({
        id: comment.id,
        author: comment.author || comment.author_display_name || 'Unknown',
        date: comment.comment_date || comment.created_at,
        type: comment.comment_type || comment.category || 'General',
        priority: comment.priority || 'Medium',
        status: comment.is_resolved ? 'Resolved' : 'Unresolved',
        flagged: comment.requires_follow_up || false,
        content: comment.comment || comment.content || 'No content',
        attachments: comment.attachments || []
    }));
    
    // Search filter
    if (searchFilter.value) {
        const search = searchFilter.value.toLowerCase();
        filtered = filtered.filter(comment => 
            comment.content.toLowerCase().includes(search) ||
            comment.author.toLowerCase().includes(search)
        );
    }
    
    // Status filter
    if (statusFilter.value && statusFilter.value !== 'All') {
        filtered = filtered.filter(comment => comment.status === statusFilter.value);
    }
    
    // Author filter
    if (authorFilter.value && authorFilter.value !== 'All') {
        filtered = filtered.filter(comment => comment.author === authorFilter.value);
    }
    
    // Sort by date (newest first)
    return filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
});

const unresolvedCount = computed(() => {
    if (!props.comments) return 0;
    return props.comments.filter(c => !c.is_resolved).length;
});

const recentActivityCount = computed(() => {
    if (!props.comments) return 0;
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return props.comments.filter(c => {
        const commentDate = new Date(c.comment_date || c.created_at);
        return commentDate > oneDayAgo;
    }).length;
});

// Methods
const clearFilters = () => {
    searchFilter.value = '';
    statusFilter.value = '';
    authorFilter.value = '';
};

const getAuthorColor = (author) => {
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];
    const index = author.charCodeAt(0) % colors.length;
    return colors[index];
};

const getCommentTypeSeverity = (type) => {
    switch (type) {
        case 'Issue':
            return 'danger';
        case 'Question':
            return 'info';
        case 'Update':
            return 'success';
        case 'Technical':
            return 'warning';
        default:
            return 'secondary';
    }
};

const getStatusSeverity = (status) => {
    return status === 'Resolved' ? 'success' : 'warning';
};

const getFileIcon = (type) => {
    switch (type) {
        case 'pdf':
            return 'pi pi-file-pdf';
        case 'image':
            return 'pi pi-image';
        case 'doc':
            return 'pi pi-file-word';
        default:
            return 'pi pi-file';
    }
};

const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString();
};

const resolveComment = (comment) => {
    comment.status = 'Resolved';
};

const toggleFlag = (comment) => {
    comment.flagged = !comment.flagged;
};

const addReply = (comment) => {
    const reply = replyText.value[comment.id];
    if (reply && reply.trim()) {
        // Add reply logic here
        console.log(`Reply to ${comment.id}: ${reply}`);
        replyText.value[comment.id] = '';
    }
};

const downloadAttachment = (attachment) => {
    // Download logic here
    console.log(`Downloading: ${attachment.name}`);
};

const addNewComment = () => {
    // NO MOCK DATA - this would need to call backend API to add comment
    if (newComment.value.content && newComment.value.type) {
        console.log('Would add comment to backend:', {
            content: newComment.value.content,
            type: newComment.value.type,
            priority: newComment.value.priority,
            locationId: props.location?.id
        });
        clearNewComment();
        // TODO: Implement backend API call to add comment
        // await addCommentToLocation(props.location.id, newComment.value);
    }
};

const clearNewComment = () => {
    newComment.value = {
        type: '',
        priority: '',
        content: ''
    };
};

// Initialize reply text refs for backend comments
watch(() => props.comments, (newComments) => {
    if (newComments && Array.isArray(newComments)) {
        newComments.forEach(comment => {
            if (!replyText.value[comment.id]) {
                replyText.value[comment.id] = '';
            }
        });
    }
}, { immediate: true, deep: true });
</script>

<style scoped>
.site-comments-panel {
    height: 100%;
    overflow-y: auto;
}

.comment-card {
    transition: all 0.2s ease;
}

.comment-card:hover {
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.comments-stream {
    max-height: calc(100vh - 400px);
    overflow-y: auto;
}
</style>