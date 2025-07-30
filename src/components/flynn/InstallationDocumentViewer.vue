<template>
  <Dialog 
    :visible="visible" 
    @update:visible="$emit('update:visible', $event)"
    modal 
    :style="{ width: '90vw', height: '90vh' }"
    :breakpoints="{ '1199px': '75vw', '575px': '90vw' }"
    class="installation-document-dialog"
  >
    <template #header>
      <div class="document-header w-full">
        <div class="flex items-center gap-2">
          <i class="pi pi-file-edit text-blue-600"></i>
          <h3 class="text-lg font-semibold">Installation Work Order</h3>
          <Tag v-if="sessionId" :value="`Session ${sessionId}`" severity="info" size="small" />
        </div>
        <div class="document-actions flex items-center gap-2">
          <Button 
            @click="printDocument"
            label="Print"
            icon="pi pi-print"
            outlined
            size="small"
          />
          <Button 
            @click="downloadDocument"
            label="Download"
            icon="pi pi-download"
            outlined
            size="small"
          />
          <Button 
            @click="copyToClipboard"
            label="Copy"
            icon="pi pi-copy"
            outlined
            size="small"
          />
        </div>
      </div>
    </template>
    
    <div class="document-content" ref="documentContent">
      <div v-if="loading" class="flex items-center justify-center h-64">
        <ProgressSpinner size="50" />
        <span class="ml-3">Loading installation document...</span>
      </div>
      
      <div v-else-if="!document" class="flex items-center justify-center h-64 text-surface-500">
        <div class="text-center">
          <i class="pi pi-file-edit text-4xl mb-3 block"></i>
          <p>No installation document available</p>
        </div>
      </div>
      
      <div v-else class="markdown-content" v-html="renderedMarkdown"></div>
    </div>
    
    <template #footer>
      <div class="flex justify-between items-center w-full">
        <div class="text-sm text-surface-500">
          <span v-if="documentLength">{{ documentLength.toLocaleString() }} characters</span>
          <span v-if="lastGenerated" class="ml-3">Generated: {{ formatDate(lastGenerated) }}</span>
        </div>
        <div class="flex gap-2">
          <Button 
            label="Close" 
            icon="pi pi-times" 
            @click="$emit('update:visible', false)" 
            outlined 
          />
          <Button 
            v-if="!document && sessionId && locationId"
            label="Generate Document" 
            icon="pi pi-plus" 
            @click="$emit('generate-document')"
          />
        </div>
      </div>
    </template>
  </Dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  document: {
    type: String,
    default: ''
  },
  sessionId: {
    type: Number,
    default: null
  },
  locationId: {
    type: Number,
    default: null
  },
  documentLength: {
    type: Number,
    default: 0
  },
  lastGenerated: {
    type: String,
    default: null
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:visible', 'generate-document'])

const documentContent = ref()

// Simple Markdown to HTML converter (basic implementation)
const renderedMarkdown = computed(() => {
  if (!props.document) return ''
  
  // Basic Markdown to HTML conversion
  let html = props.document
    // Headers
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    // Bold
    .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.*)\*/gim, '<em>$1</em>')
    // Code blocks
    .replace(/```([\s\S]*?)```/gim, '<pre><code>$1</code></pre>')
    // Inline code
    .replace(/`([^`]*)`/gim, '<code>$1</code>')
    // Links
    .replace(/\[([^\]]*)\]\(([^\)]*)\)/gim, '<a href="$2" target="_blank">$1</a>')
    // Lists
    .replace(/^\* (.*$)/gim, '<li>$1</li>')
    .replace(/^\- (.*$)/gim, '<li>$1</li>')
    // Checkboxes
    .replace(/^\- \[ \] (.*$)/gim, '<li class="checkbox">☐ $1</li>')
    .replace(/^\- \[x\] (.*$)/gim, '<li class="checkbox">☑ $1</li>')
    // Line breaks
    .replace(/\n/gim, '<br>')
    
  // Wrap lists
  html = html.replace(/(<li>.*<\/li>)/gims, '<ul>$1</ul>')
  
  // Tables (basic support)
  const lines = html.split('<br>')
  let inTable = false
  let tableHtml = ''
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    
    if (line.includes('|') && line.split('|').length > 2) {
      if (!inTable) {
        tableHtml += '<table class="table">'
        inTable = true
      }
      
      const cells = line.split('|').map(cell => cell.trim()).filter(cell => cell)
      
      // Check if it's a header separator
      if (cells.every(cell => cell.match(/^[-:]+$/))) {
        continue // Skip separator row
      }
      
      // Determine if this is a header row (first table row)
      const isHeader = tableHtml === '<table class="table">'
      const tag = isHeader ? 'th' : 'td'
      
      tableHtml += `<tr>${cells.map(cell => `<${tag}>${cell}</${tag}>`).join('')}</tr>`
    } else {
      if (inTable) {
        tableHtml += '</table>'
        html = html.replace(/(\|[^<]*\|[^<]*<br>)+/gm, tableHtml)
        inTable = false
        tableHtml = ''
      }
    }
  }
  
  if (inTable) {
    tableHtml += '</table>'
    html = html.replace(/(\|[^<]*\|[^<]*<br>)+/gm, tableHtml)
  }
  
  return html
})

// Format date utility
const formatDate = (dateString) => {
  if (!dateString) return 'Unknown'
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch (e) {
    return 'Invalid Date'
  }
}

// Print functionality
const printDocument = () => {
  const printWindow = window.open('', '_blank')
  printWindow.document.write(`
    <html>
      <head>
        <title>Installation Work Order - Session ${props.sessionId}</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            margin: 20px; 
            line-height: 1.6;
            color: #333;
          }
          h1 { 
            color: #2c3e50; 
            border-bottom: 2px solid #3498db; 
            padding-bottom: 10px; 
            margin-bottom: 20px;
          }
          h2 { 
            color: #34495e; 
            border-bottom: 1px solid #bdc3c7; 
            padding-bottom: 5px; 
            margin-top: 30px;
            margin-bottom: 15px;
          }
          h3 { 
            color: #2c3e50; 
            margin-top: 25px;
            margin-bottom: 10px;
          }
          table { 
            border-collapse: collapse; 
            width: 100%; 
            margin: 15px 0; 
            font-size: 14px;
          }
          th, td { 
            border: 1px solid #ddd; 
            padding: 8px; 
            text-align: left; 
          }
          th { 
            background-color: #f8f9fa; 
            font-weight: bold;
          }
          .checkbox { 
            font-family: monospace; 
            list-style: none;
            margin-left: -20px;
          }
          ul { margin: 10px 0; }
          li { margin: 5px 0; }
          code {
            background-color: #f4f4f4;
            padding: 2px 4px;
            border-radius: 3px;
            font-family: monospace;
            font-size: 90%;
          }
          pre {
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            overflow-x: auto;
            border-left: 4px solid #3498db;
          }
          pre code {
            background: none;
            padding: 0;
          }
          strong { color: #2c3e50; }
          @media print { 
            body { margin: 0; }
            h1, h2 { page-break-after: avoid; }
            table { page-break-inside: avoid; }
          }
          @page {
            margin: 1in;
          }
        </style>
      </head>
      <body>
        ${renderedMarkdown.value}
        <div style="margin-top: 30px; font-size: 12px; color: #7f8c8d; border-top: 1px solid #ecf0f1; padding-top: 10px;">
          <p>Generated: ${formatDate(props.lastGenerated)} | Session: ${props.sessionId} | Location: ${props.locationId}</p>
        </div>
      </body>
    </html>
  `)
  printWindow.document.close()
  printWindow.print()
}

// Download functionality
const downloadDocument = () => {
  const blob = new Blob([props.document], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `installation-work-order-session-${props.sessionId}.md`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// Copy to clipboard functionality
const copyToClipboard = async () => {
  try {
    await navigator.clipboard.writeText(props.document)
    // TODO: Show success toast
    console.log('Document copied to clipboard')
  } catch (err) {
    console.error('Failed to copy to clipboard:', err)
    // Fallback for older browsers
    const textArea = document.createElement('textarea')
    textArea.value = props.document
    document.body.appendChild(textArea)
    textArea.select()
    try {
      document.execCommand('copy')
      console.log('Document copied to clipboard (fallback)')
    } catch (fallbackErr) {
      console.error('Fallback copy failed:', fallbackErr)
    }
    document.body.removeChild(textArea)
  }
}
</script>

<style scoped>
.installation-document-dialog :deep(.p-dialog-content) {
  padding: 0;
}

.document-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  gap: 1rem;
}

.document-content {
  height: calc(90vh - 180px);
  overflow-y: auto;
  padding: 20px;
  background: white;
}

.markdown-content {
  max-width: none;
  line-height: 1.6;
  color: #333;
}

.markdown-content :deep(h1) {
  color: #2c3e50;
  border-bottom: 2px solid #3498db;
  padding-bottom: 10px;
  margin-bottom: 20px;
}

.markdown-content :deep(h2) {
  color: #34495e;
  border-bottom: 1px solid #bdc3c7;
  padding-bottom: 5px;
  margin-top: 30px;
  margin-bottom: 15px;
}

.markdown-content :deep(h3) {
  color: #2c3e50;
  margin-top: 25px;
  margin-bottom: 10px;
}

.markdown-content :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin: 15px 0;
  font-size: 14px;
}

.markdown-content :deep(th),
.markdown-content :deep(td) {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: left;
}

.markdown-content :deep(th) {
  background-color: #f8f9fa;
  font-weight: bold;
}

.markdown-content :deep(code) {
  background-color: #f4f4f4;
  padding: 2px 4px;
  border-radius: 3px;
  font-family: monospace;
  font-size: 90%;
}

.markdown-content :deep(pre) {
  background-color: #f8f9fa;
  padding: 15px;
  border-radius: 5px;
  overflow-x: auto;
  border-left: 4px solid #3498db;
}

.markdown-content :deep(pre code) {
  background: none;
  padding: 0;
}

.markdown-content :deep(.checkbox) {
  font-family: monospace;
  list-style: none;
  margin-left: -20px;
}

.markdown-content :deep(ul) {
  margin: 10px 0;
  padding-left: 20px;
}

.markdown-content :deep(li) {
  margin: 5px 0;
}

.markdown-content :deep(strong) {
  color: #2c3e50;
}

.markdown-content :deep(a) {
  color: #3498db;
  text-decoration: none;
}

.markdown-content :deep(a:hover) {
  text-decoration: underline;
}
</style> 