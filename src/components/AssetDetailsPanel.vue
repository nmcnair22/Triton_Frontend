<template>
  <div class="asset-details-panel h-full flex flex-col">
    <!-- Loading State -->
    <div v-if="loading" class="text-center py-8">
      <ProgressSpinner />
      <p class="mt-4 text-gray-600">Loading {{ getAssetTypeName(assetType) }} details...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="text-center py-8">
      <i class="pi pi-exclamation-triangle text-4xl text-red-500 mb-4"></i>
      <p class="text-red-600 mb-2">Failed to load asset details</p>
      <p class="text-sm text-gray-600">{{ error }}</p>
      <Button 
        label="Retry" 
        @click="fetchAssetDetails"
        class="mt-4"
        outlined
      />
    </div>

    <!-- Asset Details Content -->
    <div v-else-if="assetData" class="asset-content flex-1 p-4">
      <!-- Header Info -->
      <div class="mb-6 p-4 bg-gray-50 rounded-lg">
        <h5 class="font-semibold mb-2">{{ assetData.location?.name }}</h5>
        <div class="text-sm text-gray-600 space-y-1">
          <div><strong>Asset Type:</strong> {{ getAssetTypeName(assetData.asset_type) }}</div>
          <div><strong>Total Count:</strong> {{ assetData.total_count }}</div>
          <div><strong>Location ID:</strong> {{ assetData.location?.id }}</div>
        </div>
      </div>

      <!-- Assets List -->
      <div class="assets-list">
        <h6 class="font-medium mb-3">{{ getAssetTypeName(assetType) }} Details</h6>
        
        <!-- Cradlepoint Devices -->
        <div v-if="assetType === 'CP'" class="space-y-4">
          <div 
            v-for="(asset, index) in assetData.assets" 
            :key="index"
            class="border rounded-lg p-6 bg-white shadow-sm hover:shadow-md transition-shadow"
          >
            <!-- Device Header -->
            <div class="border-b pb-4 mb-4">
              <h5 class="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <i class="pi pi-mobile text-orange-600"></i>
                Cradlepoint Device – {{ asset.hostname || 'Unknown Device' }}
              </h5>
              <div class="flex flex-wrap items-center gap-4 mt-2 text-sm">
                <span class="px-2 py-1 bg-orange-100 text-orange-800 rounded-full font-medium">
                  {{ asset.full_product_name || asset.model || 'Unknown Model' }} 
                  {{ asset.model ? `(${asset.model})` : '' }}
                </span>
                <span class="text-gray-600">Serial: {{ asset.serial || 'N/A' }}</span>
                <span class="text-gray-600">Asset Type: CP</span>
              </div>
            </div>

            <!-- Status & System Info Row -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div>
                <div class="flex items-center gap-2 mb-2">
                  <span class="text-2xl">{{ getCradlepointConnectionStatus(asset.connection_state) }}</span>
                  <span class="font-medium capitalize">
                    {{ asset.connection_state || 'Unknown' }}
                  </span>
                </div>
              </div>
              <div>
                <div class="text-sm text-gray-600">Firmware:</div>
                <div class="font-medium">{{ asset.firmware?.group || asset.firmware?.version || 'N/A' }}</div>
              </div>
              <div>
                <div class="text-sm text-gray-600">Uptime:</div>
                <div class="font-medium">{{ formatUptimeDetailed(asset.uptime) }}</div>
              </div>
            </div>

            <!-- Monitoring Alerts Status -->
            <div class="mb-6">
              <div class="text-sm text-gray-600">Monitoring Alerts:</div>
              <div class="font-medium capitalize">{{ asset.status || 'Unknown' }}</div>
            </div>

            <!-- Last Updated -->
            <div class="mb-6">
              <div class="text-sm text-gray-600">Last Updated:</div>
              <div class="font-medium">{{ formatDate(asset.last_updated) }}</div>
            </div>

            <!-- Location Section -->
            <div class="mb-6">
              <h6 class="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <span class="text-lg">📍</span>
                Location:
              </h6>
              <div class="bg-gray-50 rounded-lg p-4">
                <div class="font-medium mb-1">
                  {{ assetData.location?.name || 'Unknown Location' }} 
                  <span v-if="assetData.location?.site_number">(Site {{ assetData.location.site_number }})</span>
                </div>
                <div v-if="assetData.location?.city && assetData.location?.state" class="text-sm text-gray-600 mb-2">
                  {{ assetData.location.city }}, {{ assetData.location.state }}
                </div>
                <div v-if="assetData.location?.customer_id" class="text-xs text-gray-500">
                  Customer ID: {{ assetData.location.customer_id }}
                </div>
              </div>
            </div>

            <!-- Network Info Section -->
            <div class="mb-6">
              <h6 class="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <i class="pi pi-globe text-blue-600"></i>
                Network Info:
              </h6>
              <div class="bg-gray-50 rounded-lg p-4">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div class="flex items-center gap-2">
                    <span class="w-2 h-2 bg-blue-500 rounded-full"></span>
                    <span class="text-gray-600">Public IP:</span>
                    <span class="font-mono">{{ asset.network?.ipv4_address || 'N/A' }}</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span class="text-gray-600">Gateway:</span>
                    <span class="font-mono">{{ asset.network?.gateway || 'N/A' }}</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="w-2 h-2 bg-purple-500 rounded-full"></span>
                    <span class="text-gray-600">DNS:</span>
                    <span class="font-mono text-xs">
                      {{ asset.network?.dns?.primary || 'N/A' }}
                      <span v-if="asset.network?.dns?.secondary"> / {{ asset.network.dns.secondary }}</span>
                    </span>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="w-2 h-2 bg-yellow-500 rounded-full"></span>
                    <span class="text-gray-600">MAC:</span>
                    <span class="font-mono">{{ asset.network?.mac || 'N/A' }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Cellular Details Section -->
            <div v-if="asset.cellular" class="border-t pt-4">
              <h6 class="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <i class="pi pi-phone text-green-600"></i>
                Cellular Details:
              </h6>
              <div class="bg-gray-50 rounded-lg p-4">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div class="flex items-center gap-2">
                    <span class="w-2 h-2 bg-red-500 rounded-full"></span>
                    <span class="text-gray-600">Carrier:</span>
                    <span class="font-medium">{{ asset.cellular.carrier || 'N/A' }}</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="w-2 h-2 bg-blue-500 rounded-full"></span>
                    <span class="text-gray-600">ICCID:</span>
                    <span class="font-mono text-xs">{{ asset.cellular.iccid || 'N/A' }}</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span class="text-gray-600">IMEI:</span>
                    <span class="font-mono text-xs">{{ asset.cellular.imei || 'N/A' }}</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="w-2 h-2 bg-purple-500 rounded-full"></span>
                    <span class="text-gray-600">IMSI:</span>
                    <span class="font-mono text-xs">{{ asset.cellular.imsi || 'N/A' }}</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="w-2 h-2 bg-yellow-500 rounded-full"></span>
                    <span class="text-gray-600">MDN:</span>
                    <span class="font-mono">{{ asset.cellular.mdn || 'N/A' }}</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="w-2 h-2 bg-orange-500 rounded-full"></span>
                    <span class="text-gray-600">Plan:</span>
                    <span class="font-medium">
                      {{ asset.cellular.sim_details?.cis_plan_label || asset.cellular.sim_details?.plan_label || 'N/A' }}
                      <span v-if="asset.cellular.sim_details?.datasource" class="text-xs text-gray-500">
                        ({{ asset.cellular.sim_details.datasource }} datasource)
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Meraki Devices -->
        <div v-else-if="assetType === 'MD'" class="space-y-4">
          <div 
            v-for="(asset, index) in assetData.assets" 
            :key="index"
            class="border rounded-lg p-6 bg-white shadow-sm hover:shadow-md transition-shadow"
          >
            <!-- Device Header -->
            <div class="border-b pb-4 mb-4">
              <h5 class="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <i class="pi pi-wifi text-blue-600"></i>
                Meraki Device – {{ asset.name?.trim() || 'Unknown Device' }}
              </h5>
              <div class="flex items-center gap-4 mt-2 text-sm">
                <span class="px-2 py-1 bg-blue-100 text-blue-800 rounded-full font-medium">
                  {{ asset.model || 'Unknown Model' }} ({{ asset.device_type || 'Unknown Type' }})
                </span>
                <span class="text-gray-600">Asset ID: {{ asset.asset_id || 'N/A' }}</span>
              </div>
            </div>

            <!-- Status & Firmware Row -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div>
                <div class="flex items-center gap-2 mb-2">
                  <span class="text-2xl">{{ getStatusEmoji(asset.status) }}</span>
                  <span class="font-medium capitalize">{{ asset.status || 'Unknown' }}</span>
                </div>
              </div>
              <div>
                <div class="text-sm text-gray-600">Firmware:</div>
                <div class="font-medium">{{ asset.firmware || 'N/A' }}</div>
              </div>
              <div>
                <div class="text-sm text-gray-600">Last Updated:</div>
                <div class="font-medium">{{ formatDate(asset.last_updated) }}</div>
              </div>
            </div>

            <!-- Network Info Section -->
            <div class="mb-6">
              <h6 class="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <i class="pi pi-sitemap text-green-600"></i>
                Network Info:
              </h6>
              <div class="bg-gray-50 rounded-lg p-4">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div class="flex items-center gap-2">
                    <span class="w-2 h-2 bg-blue-500 rounded-full"></span>
                    <span class="text-gray-600">LAN IP:</span>
                    <span class="font-mono">{{ asset.network?.lan_ip || 'N/A' }}</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span class="text-gray-600">MAC:</span>
                    <span class="font-mono">{{ asset.network?.mac || 'N/A' }}</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="w-2 h-2 bg-purple-500 rounded-full"></span>
                    <span class="text-gray-600">Network ID:</span>
                    <span class="font-mono text-xs">{{ asset.network?.network_id || 'N/A' }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Location Section -->
            <div v-if="asset.location?.address" class="mb-6">
              <h6 class="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <span class="text-lg">📍</span>
                Location:
              </h6>
              <div class="bg-gray-50 rounded-lg p-4">
                <div class="font-medium mb-2">{{ asset.location.address }}</div>
                <div v-if="asset.location.latitude && asset.location.longitude" class="text-sm text-gray-600">
                  ({{ asset.location.latitude }}, {{ asset.location.longitude }})
                </div>
              </div>
            </div>

            <!-- Management Section -->
            <div class="border-t pt-4">
              <h6 class="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <i class="pi pi-cog text-gray-600"></i>
                Management:
              </h6>
              <div class="flex flex-col sm:flex-row gap-4">
                <Button 
                  v-if="asset.url"
                  :label="'🔗 Open in Meraki Dashboard'"
                  @click="openMerakiDashboard(asset.url)"
                  size="small"
                  outlined
                  class="flex-1"
                />
                <div v-if="asset.notes" class="flex items-center gap-2 text-sm">
                  <span class="text-lg">📧</span>
                  <span class="text-gray-600">Alerts:</span>
                  <a :href="`mailto:${asset.notes}`" class="text-blue-600 hover:underline">
                    {{ asset.notes }}
                  </a>
                </div>
              </div>
            </div>

            <!-- Tags Section (if any) -->
            <div v-if="asset.tags && asset.tags.length > 0" class="mt-4 pt-4 border-t">
              <h6 class="font-semibold text-gray-700 mb-2">Tags:</h6>
              <div class="flex flex-wrap gap-2">
                <Badge 
                  v-for="tag in asset.tags" 
                  :key="tag"
                  :value="tag"
                  severity="secondary"
                  class="text-xs"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Meraki Networks -->
        <div v-else-if="assetType === 'MN'" class="space-y-4">
          <div 
            v-for="(asset, index) in assetData.assets" 
            :key="index"
            class="border rounded-lg p-6 bg-white shadow-sm hover:shadow-md transition-shadow"
          >
            <!-- Network Header -->
            <div class="border-b pb-4 mb-4">
              <h5 class="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <i class="pi pi-sitemap text-purple-600"></i>
                Meraki Network – {{ asset.name || 'Unknown Network' }}
              </h5>
              <div class="flex flex-wrap items-center gap-4 mt-2 text-sm">
                <span class="px-2 py-1 bg-purple-100 text-purple-800 rounded-full font-medium capitalize">
                  {{ asset.type || 'Unknown' }} Network
                </span>
                <span class="text-gray-600">Asset ID: {{ asset.asset_id || 'N/A' }}</span>
              </div>
            </div>

            <!-- Network Details Grid -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <div class="text-sm text-gray-600 mb-1">Organization ID:</div>
                <div class="font-mono text-sm">{{ asset.organization_id || 'N/A' }}</div>
              </div>
              <div>
                <div class="text-sm text-gray-600 mb-1">Config Template:</div>
                <div class="font-mono text-sm">{{ asset.config_template_id || 'N/A' }}</div>
              </div>
            </div>

            <!-- Timezone and Last Updated -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <div class="text-sm text-gray-600 mb-1">Timezone:</div>
                <div class="font-medium">{{ asset.timezone || 'N/A' }}</div>
              </div>
              <div>
                <div class="text-sm text-gray-600 mb-1">Last Updated:</div>
                <div class="font-medium">{{ formatDate(asset.last_updated) }}</div>
              </div>
            </div>

            <!-- Tags Section -->
            <div v-if="asset.tags && asset.tags.length > 0" class="mb-6">
              <h6 class="font-semibold text-gray-700 mb-3">Tags:</h6>
              <div class="flex flex-wrap gap-2">
                <span 
                  v-for="(tag, tagIndex) in asset.tags" 
                  :key="tagIndex"
                  class="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium"
                >
                  {{ tag }}
                </span>
              </div>
            </div>

            <!-- Management Section -->
            <div class="border-t pt-4">
              <h6 class="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <i class="pi pi-cog text-gray-600"></i>
                Management:
              </h6>
              <Button 
                v-if="asset.network_url"
                :label="'🔗 Open in Meraki Dashboard'"
                @click="openMerakiDashboard(asset.network_url)"
                size="small"
                outlined
                class="w-full sm:w-auto"
              />
            </div>
          </div>
        </div>

        <!-- TEM Accounts -->
        <div v-else-if="assetType === 'TEM'" class="space-y-4">
          <div 
            v-for="(asset, index) in assetData.assets" 
            :key="index"
            class="border rounded-lg p-4"
          >
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h6 class="font-medium mb-2">{{ asset.account?.vendor_name || 'TEM Account' }}</h6>
                <div class="text-sm space-y-1">
                  <div><strong>Account:</strong> {{ asset.account?.number || 'N/A' }}</div>
                  <div><strong>Provider:</strong> {{ asset.account?.provider_name || 'N/A' }}</div>
                  <div><strong>Status:</strong> 
                    <Badge 
                      :value="asset.status?.active ? 'Active' : 'Inactive'" 
                      :class="asset.status?.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'"
                    />
                  </div>
                </div>
              </div>
              <div>
                <h6 class="font-medium mb-2">Billing Information</h6>
                <div class="text-sm space-y-1">
                  <div><strong>Expected:</strong> ${{ formatCurrency(asset.billing?.expected_amount) }}</div>
                  <div><strong>Last Amount:</strong> ${{ formatCurrency(asset.billing?.last_amount) }}</div>
                  <div><strong>Last Invoice:</strong> {{ asset.billing?.last_invoice || 'N/A' }}</div>
                  <div><strong>Bill Type:</strong> {{ asset.billing?.bill_type || 'N/A' }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Orion Nodes -->
        <div v-else-if="assetType === 'OR'" class="space-y-4">
          <div 
            v-for="(asset, index) in assetData.assets" 
            :key="index"
            class="border rounded-lg p-6 bg-white shadow-sm hover:shadow-md transition-shadow"
          >
            <!-- Node Header -->
            <div class="border-b pb-4 mb-4">
              <h5 class="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <i class="pi pi-server text-teal-600"></i>
                Orion Node – {{ asset.caption || 'Unknown Node' }}
              </h5>
              <div class="flex flex-wrap items-center gap-4 mt-2 text-sm">
                <span class="px-2 py-1 bg-teal-100 text-teal-800 rounded-full font-medium">
                  {{ getOrionNodeType(asset.caption) }}
                </span>
                <span class="text-gray-600">Asset ID: {{ asset.asset_id || 'N/A' }}</span>
                <span class="text-gray-600">Site: {{ asset.site_number || 'N/A' }}</span>
              </div>
            </div>

            <!-- Status & Network Info Row -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div>
                <div class="flex items-center gap-2 mb-2">
                  <span class="text-2xl">{{ getOrionNodeStatus(asset.status?.removed, asset.monitoring?.alert) }}</span>
                  <span class="font-medium">
                    {{ asset.status?.removed ? 'Removed' : 'Active' }}
                  </span>
                </div>
              </div>
              <div>
                <div class="text-sm text-gray-600">IP Address:</div>
                <div class="font-mono font-medium">{{ asset.network?.ip_address || 'N/A' }}</div>
              </div>
              <div>
                <div class="text-sm text-gray-600">Last Updated:</div>
                <div class="font-medium">{{ formatDate(asset.last_updated) }}</div>
              </div>
            </div>

            <!-- Location Section -->
            <div class="mb-6">
              <h6 class="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <span class="text-lg">📍</span>
                Location:
              </h6>
              <div class="bg-gray-50 rounded-lg p-4">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <div class="font-medium mb-1">{{ asset.customer_name || 'Unknown Customer' }}</div>
                    <div class="text-gray-600">
                      {{ asset.location?.address || 'N/A' }}
                      <span v-if="asset.location?.city && asset.location?.state">
                        , {{ asset.location.city }}, {{ asset.location.state }}
                      </span>
                    </div>
                  </div>
                  <div v-if="asset.location?.telephone">
                    <div class="flex items-center gap-2">
                      <i class="pi pi-phone text-gray-500"></i>
                      <span>{{ asset.location.telephone }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Monitoring Section -->
            <div class="border-t pt-4">
              <h6 class="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <i class="pi pi-eye text-blue-600"></i>
                Monitoring:
              </h6>
              <div class="bg-gray-50 rounded-lg p-4">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div class="flex items-center gap-2" v-if="asset.monitoring?.primary_carrier">
                    <span class="w-2 h-2 bg-blue-500 rounded-full"></span>
                    <span class="text-gray-600">Carrier:</span>
                    <span class="font-medium">{{ asset.monitoring.primary_carrier }}</span>
                  </div>
                  <div class="flex items-center gap-2" v-if="asset.monitoring?.account_number">
                    <span class="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span class="text-gray-600">Account:</span>
                    <span class="font-mono text-xs">{{ asset.monitoring.account_number }}</span>
                  </div>
                  <div class="flex items-center gap-2" v-if="asset.monitoring?.profile">
                    <span class="w-2 h-2 bg-purple-500 rounded-full"></span>
                    <span class="text-gray-600">Profile:</span>
                    <span class="font-medium">{{ asset.monitoring.profile }}</span>
                  </div>
                  <div class="flex items-center gap-2" v-if="asset.monitoring?.email_notifications">
                    <span class="w-2 h-2 bg-orange-500 rounded-full"></span>
                    <span class="text-gray-600">Notifications:</span>
                    <a :href="`mailto:${asset.monitoring.email_notifications}`" class="text-blue-600 hover:underline text-xs">
                      {{ asset.monitoring.email_notifications }}
                    </a>
                  </div>
                </div>
                
                <!-- Alert Status -->
                <div v-if="asset.monitoring?.alert && asset.monitoring.alert !== 'False'" class="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div class="flex items-center gap-2 text-red-700">
                    <i class="pi pi-exclamation-triangle"></i>
                    <span class="font-medium">Alert: {{ asset.monitoring.alert }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Removal Status (if removed) -->
            <div v-if="asset.status?.removed" class="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div class="flex items-center gap-2 text-red-700">
                <i class="pi pi-times-circle"></i>
                <span class="font-medium">
                  Removed on {{ formatDate(asset.status.removed_date) }}
                  <span v-if="asset.status.removed_msg">: {{ asset.status.removed_msg }}</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- All SIMs -->
        <div v-else-if="assetType === 'ALL_SIMS'" class="space-y-4">
          <div 
            v-for="(asset, index) in assetData.assets" 
            :key="index"
            class="border rounded-lg p-6 bg-white shadow-sm hover:shadow-md transition-shadow"
          >
            <!-- SIM Header -->
            <div class="border-b pb-4 mb-4">
              <h5 class="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <i class="pi pi-sim-card text-orange-600"></i>
                SIM Card – {{ asset.carrier || 'Unknown Carrier' }}
              </h5>
              <div class="flex flex-wrap items-center gap-4 mt-2 text-sm">
                <span class="px-2 py-1 bg-orange-100 text-orange-800 rounded-full font-medium">
                  {{ asset.plan || asset.cis_plan_label || asset.plan_label || 'Unknown Plan' }}
                </span>
                <span class="text-gray-600">ICCID: {{ asset.iccid || 'N/A' }}</span>
              </div>
            </div>

            <!-- Status & Identifiers Row -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div>
                <div class="flex items-center gap-2 mb-2">
                  <span class="text-2xl">{{ getSIMStatusEmoji(asset.status, asset.date_activated) }}</span>
                  <span class="font-medium capitalize">
                    {{ asset.status || 'Unknown' }}
                  </span>
                </div>
              </div>
              <div>
                <div class="text-sm text-gray-600">Phone Number:</div>
                <div class="font-mono font-medium">{{ asset.phone || asset.mobile_number || asset.mdn || 'N/A' }}</div>
              </div>
              <div>
                <div class="text-sm text-gray-600">Data Source:</div>
                <div class="font-medium">{{ asset.datasource || getSIMDatasource(asset) }}</div>
              </div>
            </div>

            <!-- Technical Details Section -->
            <div class="mb-6">
              <h6 class="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <i class="pi pi-microchip text-blue-600"></i>
                Technical Details:
              </h6>
              <div class="bg-gray-50 rounded-lg p-4">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div class="flex items-center gap-2" v-if="asset.iccid">
                    <span class="w-2 h-2 bg-blue-500 rounded-full"></span>
                    <span class="text-gray-600">ICCID:</span>
                    <span class="font-mono text-xs">{{ asset.iccid }}</span>
                  </div>
                  <div class="flex items-center gap-2" v-if="asset.imei">
                    <span class="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span class="text-gray-600">IMEI:</span>
                    <span class="font-mono text-xs">{{ asset.imei }}</span>
                  </div>
                  <div class="flex items-center gap-2" v-if="asset.imsi">
                    <span class="w-2 h-2 bg-purple-500 rounded-full"></span>
                    <span class="text-gray-600">IMSI:</span>
                    <span class="font-mono text-xs">{{ asset.imsi }}</span>
                  </div>
                  <div class="flex items-center gap-2" v-if="asset.sim">
                    <span class="w-2 h-2 bg-yellow-500 rounded-full"></span>
                    <span class="text-gray-600">SIM ID:</span>
                    <span class="font-mono text-xs">{{ asset.sim }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Account & Billing Section -->
            <div v-if="asset.ban || asset.subscriber_name || asset.group_name || asset.monthly_cost" class="mb-6">
              <h6 class="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <i class="pi pi-dollar text-green-600"></i>
                Account & Billing:
              </h6>
              <div class="bg-gray-50 rounded-lg p-4">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div class="flex items-center gap-2" v-if="asset.subscriber_name">
                    <span class="w-2 h-2 bg-blue-500 rounded-full"></span>
                    <span class="text-gray-600">Subscriber:</span>
                    <span class="font-medium">{{ asset.subscriber_name }}</span>
                  </div>
                  <div class="flex items-center gap-2" v-if="asset.ban">
                    <span class="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span class="text-gray-600">BAN:</span>
                    <span class="font-mono">{{ asset.ban }}</span>
                  </div>
                  <div class="flex items-center gap-2" v-if="asset.group_name">
                    <span class="w-2 h-2 bg-purple-500 rounded-full"></span>
                    <span class="text-gray-600">Group:</span>
                    <span class="font-medium">{{ asset.group_name }}</span>
                  </div>
                  <div class="flex items-center gap-2" v-if="asset.monthly_cost">
                    <span class="w-2 h-2 bg-red-500 rounded-full"></span>
                    <span class="text-gray-600">Monthly Cost:</span>
                    <span class="font-bold text-green-600">${{ formatCurrency(asset.monthly_cost) }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Activation & Status Info -->
            <div class="border-t pt-4">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div v-if="asset.date_activated">
                  <div class="text-gray-600 mb-1">Date Activated:</div>
                  <div class="font-medium">{{ formatDate(asset.date_activated) }}</div>
                </div>
                <div v-if="asset.updated_at">
                  <div class="text-gray-600 mb-1">Last Updated:</div>
                  <div class="font-medium">{{ formatDate(asset.updated_at) }}</div>
                </div>
              </div>
            </div>

            <!-- Plan Details (if available) -->
            <div v-if="asset.plans" class="mt-4 pt-4 border-t">
              <h6 class="font-semibold text-gray-700 mb-2">Plan Details:</h6>
              <div class="text-sm bg-blue-50 p-3 rounded-lg">
                {{ asset.plans }}
              </div>
            </div>
          </div>
        </div>

        <!-- Meraki Uplinks -->
        <div v-else-if="assetType === 'MU'" class="space-y-4">
          <div 
            v-for="(asset, index) in assetData.assets" 
            :key="index"
            class="border rounded-lg p-6 bg-white shadow-sm hover:shadow-md transition-shadow"
          >
            <!-- Uplink Header -->
            <div class="border-b pb-4 mb-4">
              <h5 class="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <i class="pi pi-arrow-up-right text-cyan-600"></i>
                Meraki Uplink – {{ asset.interface || 'Unknown Interface' }}
              </h5>
              <div class="flex flex-wrap items-center gap-4 mt-2 text-sm">
                <span class="px-2 py-1 bg-cyan-100 text-cyan-800 rounded-full font-medium">
                  {{ asset.status || 'Unknown Status' }}
                </span>
                <span class="text-gray-600">Device: {{ asset.device_id || 'N/A' }}</span>
                <span v-if="asset.disabled" class="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
                  Disabled
                </span>
              </div>
            </div>

            <!-- Status & Connection Info Row -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div>
                <div class="flex items-center gap-2 mb-2">
                  <span class="text-2xl">{{ getMerakiUplinkStatus(asset.status, asset.disabled) }}</span>
                  <span class="font-medium">
                    {{ asset.status || 'Unknown' }}
                    <span v-if="asset.disabled" class="text-sm text-red-600">(Disabled)</span>
                  </span>
                </div>
              </div>
              <div>
                <div class="text-sm text-gray-600">Interface:</div>
                <div class="font-medium">{{ asset.interface || 'N/A' }}</div>
              </div>
              <div>
                <div class="text-sm text-gray-600">Last Online:</div>
                <div class="font-medium">{{ formatDate(asset.last_online) }}</div>
              </div>
            </div>

            <!-- Network Configuration Section -->
            <div class="mb-6">
              <h6 class="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <i class="pi pi-globe text-blue-600"></i>
                Network Configuration:
              </h6>
              <div class="bg-gray-50 rounded-lg p-4">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div class="flex items-center gap-2" v-if="asset.network?.ip">
                    <span class="w-2 h-2 bg-blue-500 rounded-full"></span>
                    <span class="text-gray-600">Private IP:</span>
                    <span class="font-mono">{{ asset.network.ip }}</span>
                  </div>
                  <div class="flex items-center gap-2" v-if="asset.network?.public_ip">
                    <span class="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span class="text-gray-600">Public IP:</span>
                    <span class="font-mono">{{ asset.network.public_ip }}</span>
                  </div>
                  <div class="flex items-center gap-2" v-if="asset.network?.gateway">
                    <span class="w-2 h-2 bg-purple-500 rounded-full"></span>
                    <span class="text-gray-600">Gateway:</span>
                    <span class="font-mono">{{ asset.network.gateway }}</span>
                  </div>
                  <div class="flex items-center gap-2" v-if="asset.network?.dns">
                    <span class="w-2 h-2 bg-yellow-500 rounded-full"></span>
                    <span class="text-gray-600">DNS:</span>
                    <span class="font-mono">{{ asset.network.dns }}</span>
                  </div>
                  <div class="flex items-center gap-2" v-if="asset.network?.ip_assigned_by">
                    <span class="w-2 h-2 bg-orange-500 rounded-full"></span>
                    <span class="text-gray-600">IP Assignment:</span>
                    <span class="font-medium uppercase">{{ asset.network.ip_assigned_by }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Cellular Information (if available) -->
            <div v-if="asset.cellular && (asset.cellular.iccid || asset.cellular.rsrp || asset.cellular.rsrq)" class="mb-6">
              <h6 class="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <i class="pi pi-phone text-green-600"></i>
                Cellular Information:
              </h6>
              <div class="bg-gray-50 rounded-lg p-4">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div class="flex items-center gap-2" v-if="asset.cellular.iccid">
                    <span class="w-2 h-2 bg-blue-500 rounded-full"></span>
                    <span class="text-gray-600">ICCID:</span>
                    <span class="font-mono text-xs">{{ asset.cellular.iccid }}</span>
                  </div>
                  <div class="flex items-center gap-2" v-if="asset.cellular.rsrp !== null && asset.cellular.rsrp !== 0">
                    <span class="w-2 h-2 bg-red-500 rounded-full"></span>
                    <span class="text-gray-600">RSRP:</span>
                    <span class="font-medium">{{ asset.cellular.rsrp }} dBm</span>
                  </div>
                  <div class="flex items-center gap-2" v-if="asset.cellular.rsrq !== null && asset.cellular.rsrq !== 0">
                    <span class="w-2 h-2 bg-orange-500 rounded-full"></span>
                    <span class="text-gray-600">RSRQ:</span>
                    <span class="font-medium">{{ asset.cellular.rsrq }} dB</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Last Updated -->
            <div class="border-t pt-4">
              <div class="text-sm">
                <div class="text-gray-600 mb-1">Last Updated:</div>
                <div class="font-medium">{{ formatDate(asset.last_updated) }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Generic Asset Display -->
        <div v-else class="space-y-4">
          <div 
            v-for="(asset, index) in assetData.assets" 
            :key="index"
            class="border rounded-lg p-4"
          >
            <h6 class="font-medium mb-2">{{ getAssetTypeName(assetType) }} #{{ index + 1 }}</h6>
            <div class="text-sm">
              <pre class="bg-gray-100 p-2 rounded text-xs overflow-auto">{{ JSON.stringify(asset, null, 2) }}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="flex-1 flex items-center justify-center p-4 text-gray-500">
      <i class="pi pi-info-circle text-4xl mb-4"></i>
      <p>No asset details available</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import axios from 'axios';

// Helper functions accessible to template - Updated
const getSIMStatusEmoji = (status, dateActivated) => {
  if (!status) {
    // If no status but has activation date, assume active
    return dateActivated ? '🟢' : '🟡';
  }
  
  const statusMap = {
    'active': '🟢',
    'activated': '🟢',
    'suspended': '🟡',
    'deactivated': '🔴',
    'inactive': '🔴',
    'canceled': '🔴',
    'cancelled': '🔴'
  };
  
  return statusMap[status.toLowerCase()] || '🟡';
};

const getSIMDatasource = (asset) => {
  // Determine datasource from available fields
  if (asset.subscriber_name || asset.ban || asset.group_name) {
    return 'ChoiceIOT';
  }
  if (asset.mdn && asset.imei && asset.imsi) {
    return 'Cradlepoint';
  }
  if (asset.phone && !asset.mdn) {
    return 'Device Location';
  }
  return 'Unknown';
};

const getMerakiUplinkStatus = (status, disabled) => {
  if (disabled) {
    return '🔴'; // Red for disabled
  }
  
  const statusMap = {
    'active': '🟢',
    'ready': '🟡',
    'connecting': '🟡',
    'failed': '🔴',
    'down': '🔴'
  };
  
  return statusMap[status?.toLowerCase()] || '🟡';
};

const props = defineProps({
  locationId: [String, Number],
  assetType: String,
  customerId: Number
});

const loading = ref(false);
const error = ref(null);
const assetData = ref(null);

const fetchAssetDetails = async () => {
  if (!props.locationId || !props.assetType) return;
  
  loading.value = true;
  error.value = null;
  
  try {
    const response = await axios.get(`http://localhost:8000/api/assets/details/${props.locationId}/${props.assetType}`);
    assetData.value = response.data;
  } catch (err) {
    error.value = err.response?.data?.message || err.message || 'Failed to fetch asset details';
    console.error('Asset details fetch error:', err);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchAssetDetails();
});

const getAssetTypeName = (type) => {
  const names = {
    'CP': 'Cradlepoint Devices',
    'MD': 'Meraki Devices',
    'MN': 'Meraki Networks',
    'MU': 'Meraki Uplinks',
    'OR': 'Orion Nodes',
    'NPM': 'Orion Nodes',
    'SIM_BELL1GB': 'Bell SIM Cards',
    'SIM_TEL1GB': 'Telus SIM Cards',
    'SIM_ATT5GB': 'AT&T SIM Cards',
    'TEM': 'TEM Accounts',
    'VZ': 'Verizon Devices',
    'ALL_SIMS': 'All SIM Cards',
    'CHOICE': 'ChoiceIOT SIMs'
  };
  return names[type] || type;
};

const getStatusStyle = (status) => {
  const styles = {
    'active': 'bg-green-100 text-green-800',
    'connected': 'bg-green-100 text-green-800',
    'online': 'bg-green-100 text-green-800',
    'inactive': 'bg-red-100 text-red-800',
    'disconnected': 'bg-red-100 text-red-800',
    'offline': 'bg-red-100 text-red-800',
    'unknown': 'bg-gray-100 text-gray-800'
  };
  return styles[status?.toLowerCase()] || 'bg-gray-100 text-gray-800';
};

const formatCurrency = (value) => {
  if (!value && value !== 0) return 'N/A';
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

const formatUptime = (uptime) => {
  if (!uptime) return 'N/A';
  const seconds = parseFloat(uptime);
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  return `${days}d ${hours}h`;
};

const getStatusEmoji = (status) => {
  const statusMap = {
    'online': '🟢',
    'offline': '🔴',
    'active': '🟢',
    'inactive': '🔴',
    'connected': '🟢',
    'disconnected': '🔴',
    'unknown': '🟡'
  };
  return statusMap[status?.toLowerCase()] || '🟡';
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  } catch (error) {
    return dateString;
  }
};

const openMerakiDashboard = (url) => {
  if (url) {
    window.open(url, '_blank');
  }
};

const getOrionNodeType = (caption) => {
  if (!caption) return 'Node';
  
  const typeMap = {
    'WAN': 'WAN Connection',
    'CELL': 'Cellular Connection', 
    'IBT': 'IBT Connection',
    'SW1': 'Switch 1',
    'SW2': 'Switch 2',
    'AP1': 'Access Point 1',
    'AP2': 'Access Point 2'
  };
  
  // Extract the type from the caption (e.g., CTR_3026_Milton_ON_WAN -> WAN)
  const parts = caption.split('_');
  const typeKey = parts[parts.length - 1];
  
  return typeMap[typeKey] || 'Network Node';
};

const getOrionNodeStatus = (isRemoved, alertStatus) => {
  if (isRemoved) {
    return '🔴'; // Red for removed
  }
  
  if (alertStatus && alertStatus !== 'False') {
    return '🟡'; // Yellow for alerts
  }
  
  return '🟢'; // Green for active/normal
};

const getCradlepointConnectionStatus = (connectionState) => {
  // Focus only on actual device connectivity
  const connectionMap = {
    'connected': '🟢',
    'disconnected': '🔴',
    'connecting': '🟡'
  };
  return connectionMap[connectionState?.toLowerCase()] || '🟡';
};

const getCradlepointStatusEmoji = (status, connectionState) => {
  // Handle the case where device is disabled but connected
  if (status === 'disabled' && connectionState === 'connected') {
    return '🔴'; // Red for disabled
  }
  
  // Handle connection state first
  if (connectionState) {
    const connectionMap = {
      'connected': '🟢',
      'disconnected': '🔴',
      'connecting': '🟡'
    };
    if (connectionMap[connectionState.toLowerCase()]) {
      return connectionMap[connectionState.toLowerCase()];
    }
  }
  
  // Fall back to status
  const statusMap = {
    'enabled': '🟢',
    'disabled': '🔴',
    'active': '🟢',
    'inactive': '🔴',
    'unknown': '🟡'
  };
  return statusMap[status?.toLowerCase()] || '🟡';
};

const formatUptimeDetailed = (uptime) => {
  if (!uptime) return 'N/A';
  
  try {
    const seconds = parseFloat(uptime);
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    
    if (days > 0) {
      return `~${days} days`;
    } else if (hours > 0) {
      return `~${hours} hours`;
    } else {
      return `< 1 hour`;
    }
  } catch (error) {
    return 'N/A';
  }
};
</script>

<style scoped>
.asset-content {
  height: 100%;
  overflow-y: auto;
}

.asset-details-panel {
  margin: 1rem;
  margin-top: 0;
  margin-bottom: 1rem;
  height: calc(100vh - 120px); /* Account for header and margins */
}
</style>
