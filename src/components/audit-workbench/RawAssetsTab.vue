<template>
  <div class="raw-assets-tab">
    <div v-if="loading" class="flex justify-content-center align-items-center h-10rem">
      <ProgressSpinner />
    </div>
    
    <div v-else-if="!raw || !raw.raw_assets || Object.keys(raw.raw_assets).length === 0" class="text-center p-8">
      <div class="mb-6">
        <i class="pi pi-box text-6xl text-orange-400 mb-4 block"></i>
        <h3 class="text-2xl font-semibold text-surface-800 dark:text-surface-200 mb-2">No Assets Discovered</h3>
        <p class="text-lg text-surface-600 dark:text-surface-400 mb-4">This location hasn't been scanned yet or no network assets were found during the audit process.</p>
      </div>
      
      <Card class="max-w-md mx-auto">
        <template #content>
          <div class="text-center">
            <h4 class="text-lg font-medium mb-3">Possible Actions</h4>
            <div class="space-y-3">
              <Button 
                label="Audit Location" 
                icon="pi pi-search" 
                @click="emit('rescan')" 
                class="w-full"
                severity="primary"
              />
              <p class="text-sm text-surface-500">
                This will perform a fresh audit scan to discover network devices and infrastructure at this location.
              </p>
            </div>
          </div>
        </template>
      </Card>
    </div>
    
    <div v-else>
      <!-- Header strip with signatures -->
      <div class="mb-4 p-6 bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-900/20 dark:to-slate-900/20 rounded-lg border border-gray-200 dark:border-gray-800">
        <div class="grid gap-6 md:grid-cols-2">
          <div>
            <div class="text-base font-medium text-surface-600 dark:text-surface-400 mb-2 flex items-center gap-2">
              <i class="pi pi-server text-green-600"></i>
              Asset Signature
            </div>
            <div class="text-2xl font-bold flex items-center gap-2">
              <span v-if="audit.asset_signature === 'NO_ASSETS'" class="text-orange-600">No Assets Found</span>
              <span v-else class="text-surface-900 dark:text-surface-0">{{ audit.asset_signature || 'N/A' }}</span>
              <Tag v-if="audit.asset_signature === 'NO_ASSETS'" severity="warning" value="Empty" />
            </div>
          </div>
          <div>
            <div class="text-base font-medium text-surface-600 dark:text-surface-400 mb-2 flex items-center gap-2">
              <i class="pi pi-dollar text-orange-600"></i>
              Charge Signature
            </div>
            <div class="text-2xl font-bold flex items-center gap-2">
              <span v-if="audit.charge_signature === 'NO_SHIPTO'" class="text-orange-600">No Ship-To Found</span>
              <span v-else class="text-surface-900 dark:text-surface-0">{{ audit.charge_signature || 'N/A' }}</span>
              <Tag v-if="audit.charge_signature === 'NO_SHIPTO'" severity="warning" value="Missing" />
            </div>
          </div>
        </div>
      </div>

      <!-- Enhanced DataTables with search, sort, and expand -->
      <div class="space-y-6">
        <!-- Meraki Devices Table -->
        <div v-if="md.length" class="asset-table-container">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-2xl font-semibold flex items-center gap-2">
              <i class="pi pi-wifi text-green-600"></i>
              Meraki Devices ({{ md.length }})
            </h3>
            <IconField>
              <InputIcon><i class="pi pi-search" /></InputIcon>
              <InputText v-model="mdGlobalFilter" placeholder="Search devices..." />
            </IconField>
          </div>
          
          <DataTable 
            v-model:expandedRows="mdExpandedRows"
            :value="md" 
            :globalFilter="mdGlobalFilter"
            paginator 
            :rows="10" 
            :rowsPerPageOptions="[5, 10, 25]"
            stripedRows 
            showGridlines
            sortMode="multiple"
            removableSort
            dataKey="serial"
            responsiveLayout="scroll"
            class="premium-table"
            :pt="{
              header: { class: 'bg-gray-50 dark:bg-gray-900/20' },
              headerRow: { class: 'border-b-2 border-gray-200 dark:border-gray-700' }
            }"
          >
            <template #header>
              <div class="flex justify-between items-center">
                <span class="text-base font-medium text-gray-700 dark:text-gray-300">Network Infrastructure Devices</span>
                <div class="flex gap-2">
                  <Button text icon="pi pi-plus" label="Expand All" @click="expandAllMD" />
                  <Button text icon="pi pi-minus" label="Collapse All" @click="collapseAllMD" />
                </div>
              </div>
            </template>

            <Column expander style="width: 3rem" />
            
            <Column field="serial" header="Serial" sortable style="min-width: 140px">
              <template #body="{data}">
                <div class="flex items-center gap-2">
                  <code class="text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">{{ data.serial }}</code>
                  <Button icon="pi pi-copy" text size="small" @click="copy(data.serial)" 
                          v-tooltip.top="'Copy Serial'" class="opacity-60 hover:opacity-100" />
                </div>
              </template>
            </Column>

            <Column field="hostname" header="Hostname" sortable style="min-width: 150px">
              <template #body="{data}">
                <div class="font-medium">{{ data.hostname }}</div>
              </template>
            </Column>

            <Column field="model" header="Model" sortable style="min-width: 120px">
              <template #body="{data}">
                <Chip :label="data.model" class="text-xs" />
              </template>
            </Column>

            <Column field="device_type" header="Type" sortable style="min-width: 100px">
              <template #body="{data}">
                <Tag :value="data.device_type" :severity="getDeviceTypeSeverity(data.device_type)" />
              </template>
            </Column>

            <Column field="status" header="Status" sortable style="min-width: 100px">
              <template #body="{data}">
                <Tag :value="data.status" :severity="data.status === 'online' ? 'success' : 'danger'" 
                     :icon="data.status === 'online' ? 'pi pi-check-circle' : 'pi pi-times-circle'" />
              </template>
            </Column>

            <Column field="lan_ip" header="LAN IP" sortable style="min-width: 120px">
              <template #body="{data}">
                <code v-if="data.lan_ip" class="text-sm">{{ data.lan_ip }}</code>
                <span v-else class="text-gray-400">No IP</span>
              </template>
            </Column>

            <template #expansion="slotProps">
              <div class="p-4 bg-gray-50 dark:bg-gray-900 border-l-4 border-blue-500">
                <h5 class="mb-3 text-blue-700 dark:text-blue-300 flex items-center gap-2">
                  <i class="pi pi-info-circle"></i>
                  Technical Details: {{ slotProps.data.hostname }}
                </h5>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div class="detail-card">
                    <h6 class="font-semibold text-gray-700 dark:text-gray-300 mb-2">Network</h6>
                    <div class="space-y-1 text-base">
                      <div><strong>MAC:</strong> {{ slotProps.data.mac || 'N/A' }}</div>
                      <div><strong>Network ID:</strong> {{ slotProps.data.network_id || 'N/A' }}</div>
                      <div><strong>Firmware:</strong> {{ slotProps.data.firmware || 'N/A' }}</div>
                    </div>
                  </div>
                  <div class="detail-card" v-if="slotProps.data.raw?.location">
                    <h6 class="font-semibold text-gray-700 dark:text-gray-300 mb-2">Location</h6>
                    <div class="space-y-1 text-base">
                      <div><strong>Address:</strong> {{ slotProps.data.raw.location.address || 'N/A' }}</div>
                      <div><strong>Coordinates:</strong> 
                        {{ slotProps.data.raw.location.latitude }}, {{ slotProps.data.raw.location.longitude }}
                      </div>
                    </div>
                  </div>
                  <div class="detail-card">
                    <h6 class="font-semibold text-gray-700 dark:text-gray-300 mb-2">Management</h6>
                    <div class="space-y-1 text-base">
                      <div><strong>Last Updated:</strong> {{ formatDateTime(slotProps.data.raw?.last_updated) }}</div>
                      <div><strong>Notes:</strong> {{ slotProps.data.raw?.notes || 'None' }}</div>
                      <div v-if="slotProps.data.url">
                        <Button label="Open in Meraki" icon="pi pi-external-link" size="small" 
                                @click="window.open(slotProps.data.url, '_blank')" text />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </DataTable>
        </div>

        <!-- Cradlepoint Devices Table -->
        <div v-if="cp.length" class="asset-table-container">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-2xl font-semibold flex items-center gap-2">
              <i class="pi pi-mobile text-orange-500"></i>
              Cradlepoint Devices ({{ cp.length }})
            </h3>
            <IconField>
              <InputIcon><i class="pi pi-search" /></InputIcon>
              <InputText v-model="cpGlobalFilter" placeholder="Search devices..." />
            </IconField>
          </div>

          <DataTable 
            v-model:expandedRows="cpExpandedRows"
            :value="cp" 
            :globalFilter="cpGlobalFilter"
            paginator 
            :rows="10" 
            :rowsPerPageOptions="[5, 10, 25]"
            stripedRows 
            showGridlines
            sortMode="multiple"
            removableSort
            dataKey="device_id"
            responsiveLayout="scroll"
            class="premium-table"
            :pt="{
              header: { class: 'bg-orange-50 dark:bg-orange-900/20' },
              headerRow: { class: 'border-b-2 border-orange-200 dark:border-orange-700' }
            }"
          >
            <template #header>
              <div class="flex justify-between items-center">
                <span class="text-base font-medium text-orange-700 dark:text-orange-300">Cellular Gateway Devices</span>
                <div class="flex gap-2">
                  <Button text icon="pi pi-plus" label="Expand All" @click="expandAllCP" />
                  <Button text icon="pi pi-minus" label="Collapse All" @click="collapseAllCP" />
                </div>
              </div>
            </template>

            <Column expander style="width: 3rem" />

            <Column field="device_id" header="Device ID" sortable style="min-width: 120px">
              <template #body="{data}">
                <div class="flex items-center gap-2">
                  <code class="text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">{{ data.device_id }}</code>
                  <Button icon="pi pi-copy" text size="small" @click="copy(data.device_id)" 
                          v-tooltip.top="'Copy Device ID'" class="opacity-60 hover:opacity-100" />
                </div>
              </template>
            </Column>

            <Column field="hostname" header="Hostname" sortable style="min-width: 200px">
              <template #body="{data}">
                <div class="font-medium">{{ data.hostname }}</div>
              </template>
            </Column>

            <Column field="model" header="Model" sortable style="min-width: 140px">
              <template #body="{data}">
                <Chip :label="data.model" class="text-xs bg-orange-100 text-orange-800" />
              </template>
            </Column>

            <Column field="serial" header="Serial" sortable style="min-width: 160px">
              <template #body="{data}">
                <code class="text-sm">{{ data.serial }}</code>
              </template>
            </Column>

            <Column header="Status" sortable style="min-width: 120px">
              <template #body="{data}">
                <div class="flex flex-col gap-1">
                  <Tag :value="data.status" :severity="data.status === 'disabled' ? 'warning' : 'success'" 
                       class="text-sm" />
                  <Tag :value="data.connection_state" severity="success" class="text-sm" />
                </div>
              </template>
            </Column>

            <template #expansion="slotProps">
              <div class="p-4 bg-gray-50 dark:bg-gray-900 border-l-4 border-orange-500">
                <h5 class="mb-3 text-orange-700 dark:text-orange-300 flex items-center gap-2">
                  <i class="pi pi-info-circle"></i>
                  Cellular Details: {{ slotProps.data.hostname }}
                </h5>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div class="detail-card">
                    <h6 class="font-semibold text-gray-700 dark:text-gray-300 mb-2">Network</h6>
                    <div class="space-y-1 text-base">
                      <div><strong>IP Address:</strong> {{ slotProps.data.network?.ipv4_address || 'N/A' }}</div>
                      <div><strong>Gateway:</strong> {{ slotProps.data.network?.gateway || 'N/A' }}</div>
                      <div><strong>MAC:</strong> {{ slotProps.data.network?.mac || 'N/A' }}</div>
                      <div><strong>DNS:</strong> {{ slotProps.data.network?.dns?.primary || 'N/A' }}</div>
                    </div>
                  </div>
                  <div class="detail-card">
                    <h6 class="font-semibold text-gray-700 dark:text-gray-300 mb-2">Cellular</h6>
                    <div class="space-y-1 text-base">
                      <div><strong>Carrier:</strong> {{ slotProps.data.cellular?.carrier || 'N/A' }}</div>
                      <div><strong>ICCID:</strong> {{ slotProps.data.cellular?.iccid || 'N/A' }}</div>
                      <div><strong>IMEI:</strong> {{ slotProps.data.cellular?.imei || 'N/A' }}</div>
                      <div><strong>MDN:</strong> {{ slotProps.data.cellular?.mdn || 'N/A' }}</div>
                      <div><strong>Plan:</strong> {{ slotProps.data.cellular?.sim_details?.plan_label || 'N/A' }}</div>
                    </div>
                  </div>
                  <div class="detail-card">
                    <h6 class="font-semibold text-gray-700 dark:text-gray-300 mb-2">System</h6>
                    <div class="space-y-1 text-base">
                      <div><strong>Firmware:</strong> {{ slotProps.data.firmware?.group || 'N/A' }}</div>
                      <div><strong>Uptime:</strong> {{ formatUptime(slotProps.data.uptime) }}</div>
                      <div><strong>Last Updated:</strong> {{ formatDateTime(slotProps.data.raw?.last_updated) }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </DataTable>
        </div>

        <!-- Orion Nodes Table -->
        <div v-if="or.length" class="asset-table-container">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-2xl font-semibold flex items-center gap-2">
              <i class="pi pi-server text-red-500"></i>
              Orion Monitoring Nodes ({{ or.length }})
            </h3>
            <IconField>
              <InputIcon><i class="pi pi-search" /></InputIcon>
              <InputText v-model="orGlobalFilter" placeholder="Search nodes..." />
            </IconField>
          </div>

          <DataTable 
            v-model:expandedRows="orExpandedRows"
            :value="or" 
            :globalFilter="orGlobalFilter"
            paginator 
            :rows="10" 
            :rowsPerPageOptions="[5, 10, 25]"
            stripedRows 
            showGridlines
            sortMode="multiple"
            removableSort
            dataKey="node_id"
            responsiveLayout="scroll"
            class="premium-table"
            :pt="{
              header: { class: 'bg-red-50 dark:bg-red-900/20' },
              headerRow: { class: 'border-b-2 border-red-200 dark:border-red-700' }
            }"
          >
            <template #header>
              <div class="flex justify-between items-center">
                <span class="text-base font-medium text-red-700 dark:text-red-300">Network Monitoring Infrastructure</span>
                <div class="flex gap-2">
                  <Button text icon="pi pi-plus" label="Expand All" @click="expandAllOR" />
                  <Button text icon="pi pi-minus" label="Collapse All" @click="collapseAllOR" />
                </div>
              </div>
            </template>

            <Column expander style="width: 3rem" />

            <Column field="node_id" header="Node ID" sortable style="min-width: 100px">
              <template #body="{data}">
                <div class="flex items-center gap-2">
                  <code class="text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">{{ data.node_id }}</code>
                  <Button icon="pi pi-copy" text size="small" @click="copy(data.node_id)" 
                          v-tooltip.top="'Copy Node ID'" class="opacity-60 hover:opacity-100" />
                </div>
              </template>
            </Column>

            <Column field="hostname" header="Hostname" sortable style="min-width: 200px">
              <template #body="{data}">
                <div class="font-medium">{{ data.hostname }}</div>
              </template>
            </Column>

            <Column field="ip" header="IP Address" sortable style="min-width: 140px">
              <template #body="{data}">
                <code class="text-sm">{{ data.ip }}</code>
              </template>
            </Column>

            <Column header="Carrier" sortable style="min-width: 140px">
              <template #body="{data}">
                <span class="text-sm">{{ data.raw?.monitoring?.primary_carrier || 'N/A' }}</span>
              </template>
            </Column>

            <Column header="Account" sortable style="min-width: 160px">
              <template #body="{data}">
                <span class="text-sm">{{ data.raw?.monitoring?.account_number || 'N/A' }}</span>
              </template>
            </Column>

            <template #expansion="slotProps">
              <div class="p-4 bg-gray-50 dark:bg-gray-900 border-l-4 border-red-500">
                <h5 class="mb-3 text-red-700 dark:text-red-300 flex items-center gap-2">
                  <i class="pi pi-info-circle"></i>
                  Monitoring Details: {{ slotProps.data.hostname }}
                </h5>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div class="detail-card">
                    <h6 class="font-semibold text-gray-700 dark:text-gray-300 mb-2">Location</h6>
                    <div class="space-y-1 text-base">
                      <div><strong>Address:</strong> {{ slotProps.data.location?.address || 'N/A' }}</div>
                      <div><strong>City:</strong> {{ slotProps.data.location?.city || 'N/A' }}</div>
                      <div><strong>State:</strong> {{ slotProps.data.location?.state || 'N/A' }}</div>
                      <div><strong>Phone:</strong> {{ slotProps.data.location?.telephone || 'N/A' }}</div>
                    </div>
                  </div>
                  <div class="detail-card">
                    <h6 class="font-semibold text-gray-700 dark:text-gray-300 mb-2">Monitoring</h6>
                    <div class="space-y-1 text-base">
                      <div><strong>Carrier:</strong> {{ slotProps.data.raw?.monitoring?.primary_carrier || 'N/A' }}</div>
                      <div><strong>Account:</strong> {{ slotProps.data.raw?.monitoring?.account_number || 'N/A' }}</div>
                      <div><strong>Alert Status:</strong> {{ slotProps.data.raw?.monitoring?.alert || 'N/A' }}</div>
                      <div><strong>Email:</strong> {{ slotProps.data.raw?.monitoring?.email_notifications || 'None' }}</div>
                    </div>
                  </div>
                  <div class="detail-card">
                    <h6 class="font-semibold text-gray-700 dark:text-gray-300 mb-2">System</h6>
                    <div class="space-y-1 text-base">
                      <div><strong>Site Number:</strong> {{ slotProps.data.raw?.site_number || 'N/A' }}</div>
                      <div><strong>Customer:</strong> {{ slotProps.data.raw?.customer_name || 'N/A' }}</div>
                      <div><strong>Last Updated:</strong> {{ formatDateTime(slotProps.data.raw?.last_updated) }}</div>
                      <div><strong>Removed:</strong> 
                        <Tag :value="slotProps.data.status?.removed ? 'Yes' : 'No'" 
                             :severity="slotProps.data.status?.removed ? 'danger' : 'success'" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </DataTable>
        </div>

        <!-- SIM Cards Table -->
        <div v-if="sim.length" class="asset-table-container">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-2xl font-semibold flex items-center gap-2">
              <i class="pi pi-id-card text-teal-600"></i>
              SIM Cards ({{ sim.length }})
            </h3>
            <IconField>
              <InputIcon><i class="pi pi-search" /></InputIcon>
              <InputText v-model="simGlobalFilter" placeholder="Search SIMs..." />
            </IconField>
          </div>

          <DataTable 
            v-model:expandedRows="simExpandedRows"
            :value="sim" 
            :globalFilter="simGlobalFilter"
            paginator 
            :rows="10" 
            :rowsPerPageOptions="[5, 10, 25]"
            stripedRows 
            showGridlines
            sortMode="multiple"
            removableSort
            dataKey="iccid"
            responsiveLayout="scroll"
            class="premium-table"
            :pt="{
              header: { class: 'bg-teal-50 dark:bg-teal-900/20' },
              headerRow: { class: 'border-b-2 border-teal-200 dark:border-teal-700' }
            }"
          >
            <template #header>
              <div class="flex justify-between items-center">
                <span class="text-base font-medium text-teal-700 dark:text-teal-300">Cellular SIM Cards</span>
                <div class="flex gap-2">
                  <Button text icon="pi pi-plus" label="Expand All" @click="expandAllSIM" />
                  <Button text icon="pi pi-minus" label="Collapse All" @click="collapseAllSIM" />
                </div>
              </div>
            </template>

            <Column expander style="width: 3rem" />

            <Column field="iccid" header="ICCID" sortable style="min-width: 200px">
              <template #body="{data}">
                <div class="flex items-center gap-2">
                  <code class="text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">{{ data.iccid }}</code>
                  <Button icon="pi pi-copy" text size="small" @click="copy(data.iccid)" 
                          v-tooltip.top="'Copy ICCID'" class="opacity-60 hover:opacity-100" />
                </div>
              </template>
            </Column>

            <Column field="carrier" header="Carrier" sortable style="min-width: 120px">
              <template #body="{data}">
                <Chip :label="data.carrier" class="text-xs bg-cyan-100 text-cyan-800" />
              </template>
            </Column>

            <Column field="plan" header="Plan" sortable style="min-width: 100px">
              <template #body="{data}">
                <Tag :value="data.plan" severity="success" />
              </template>
            </Column>

            <Column field="phone" header="Phone Number" sortable style="min-width: 140px">
              <template #body="{data}">
                <code class="text-sm">{{ data.phone || 'N/A' }}</code>
              </template>
            </Column>

            <Column field="imei" header="IMEI" sortable style="min-width: 160px">
              <template #body="{data}">
                <code class="text-sm">{{ data.imei || 'N/A' }}</code>
              </template>
            </Column>

            <template #expansion="slotProps">
              <div class="p-4 bg-gray-50 dark:bg-gray-900 border-l-4 border-cyan-500">
                <h5 class="mb-3 text-cyan-700 dark:text-cyan-300 flex items-center gap-2">
                  <i class="pi pi-info-circle"></i>
                  SIM Details: {{ slotProps.data.iccid }}
                </h5>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div class="detail-card">
                    <h6 class="font-semibold text-gray-700 dark:text-gray-300 mb-2">Device Association</h6>
                    <div class="space-y-1 text-base">
                      <div><strong>Source:</strong> {{ slotProps.data.source || 'N/A' }}</div>
                      <div><strong>Device ID:</strong> {{ slotProps.data.device_id || 'N/A' }}</div>
                      <div><strong>Hostname:</strong> {{ slotProps.data.raw?.hostname || 'N/A' }}</div>
                    </div>
                  </div>
                  <div class="detail-card">
                    <h6 class="font-semibold text-gray-700 dark:text-gray-300 mb-2">Plan Details</h6>
                    <div class="space-y-1 text-base">
                      <div><strong>Plan Label:</strong> {{ slotProps.data.raw?.sim_details?.plan_label || 'N/A' }}</div>
                      <div><strong>CIS Plan:</strong> {{ slotProps.data.raw?.sim_details?.cis_plan_label || 'N/A' }}</div>
                      <div><strong>Data Source:</strong> {{ slotProps.data.raw?.sim_details?.datasource || 'N/A' }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </DataTable>
        </div>

        <!-- Meraki Networks Table -->
        <div v-if="mn.length" class="asset-table-container">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-2xl font-semibold flex items-center gap-2">
              <i class="pi pi-sitemap text-green-500"></i>
              Meraki Networks ({{ mn.length }})
            </h3>
            <IconField>
              <InputIcon><i class="pi pi-search" /></InputIcon>
              <InputText v-model="mnGlobalFilter" placeholder="Search networks..." />
            </IconField>
          </div>

          <DataTable 
            v-model:expandedRows="mnExpandedRows"
            :value="mn" 
            :globalFilter="mnGlobalFilter"
            paginator 
            :rows="10" 
            :rowsPerPageOptions="[5, 10, 25]"
            stripedRows 
            showGridlines
            sortMode="multiple"
            removableSort
            dataKey="network_id"
            responsiveLayout="scroll"
            class="premium-table"
            :pt="{
              header: { class: 'bg-green-50 dark:bg-green-900/20' },
              headerRow: { class: 'border-b-2 border-green-200 dark:border-green-700' }
            }"
          >
            <template #header>
              <div class="flex justify-between items-center">
                <span class="text-base font-medium text-green-700 dark:text-green-300">Network Configurations</span>
                <div class="flex gap-2">
                  <Button text icon="pi pi-plus" label="Expand All" @click="expandAllMN" />
                  <Button text icon="pi pi-minus" label="Collapse All" @click="collapseAllMN" />
                </div>
              </div>
            </template>

            <Column expander style="width: 3rem" />

            <Column field="network_id" header="Network ID" sortable style="min-width: 180px">
              <template #body="{data}">
                <div class="flex items-center gap-2">
                  <code class="text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">{{ data.network_id }}</code>
                  <Button icon="pi pi-copy" text size="small" @click="copy(data.network_id)" 
                          v-tooltip.top="'Copy Network ID'" class="opacity-60 hover:opacity-100" />
                </div>
              </template>
            </Column>

            <Column field="name" header="Name" sortable style="min-width: 200px">
              <template #body="{data}">
                <div class="font-medium">{{ data.name }}</div>
              </template>
            </Column>

            <Column field="org_id" header="Organization ID" sortable style="min-width: 180px">
              <template #body="{data}">
                <code class="text-sm">{{ data.org_id }}</code>
              </template>
            </Column>

            <Column field="timezone" header="Timezone" sortable style="min-width: 180px">
              <template #body="{data}">
                <span class="text-sm">{{ data.timezone }}</span>
              </template>
            </Column>

            <Column header="Tags" style="min-width: 200px">
              <template #body="{data}">
                <div class="flex flex-wrap gap-1">
                  <Chip v-for="tag in data.tags" :key="tag" :label="tag" class="text-xs" />
                </div>
              </template>
            </Column>

            <template #expansion="slotProps">
              <div class="p-4 bg-gray-50 dark:bg-gray-900 border-l-4 border-green-500">
                <h5 class="mb-3 text-green-700 dark:text-green-300 flex items-center gap-2">
                  <i class="pi pi-info-circle"></i>
                  Network Configuration: {{ slotProps.data.name }}
                </h5>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div class="detail-card">
                    <h6 class="font-semibold text-gray-700 dark:text-gray-300 mb-2">Configuration</h6>
                    <div class="space-y-1 text-base">
                      <div><strong>Type:</strong> {{ slotProps.data.raw?.type || 'N/A' }}</div>
                      <div><strong>Template ID:</strong> {{ slotProps.data.raw?.config_template_id || 'N/A' }}</div>
                      <div><strong>Organization:</strong> {{ slotProps.data.raw?.organization_id || 'N/A' }}</div>
                      <div><strong>Last Updated:</strong> {{ formatDateTime(slotProps.data.raw?.last_updated) }}</div>
                    </div>
                  </div>
                  <div class="detail-card">
                    <h6 class="font-semibold text-gray-700 dark:text-gray-300 mb-2">Management</h6>
                    <div class="space-y-1 text-base">
                      <div v-if="slotProps.data.raw?.network_url">
                        <Button label="Open Network Console" icon="pi pi-external-link" size="small" 
                                @click="window.open(slotProps.data.raw.network_url, '_blank')" text />
                      </div>
                      <div><strong>Tags:</strong></div>
                      <div class="flex flex-wrap gap-1 mt-1">
                        <Tag v-for="tag in slotProps.data.tags" :key="tag" :value="tag" severity="success" class="text-sm" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </DataTable>
        </div>

        <!-- Meraki Uplinks Table -->
        <div v-if="mu.length" class="asset-table-container">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-2xl font-semibold flex items-center gap-2">
              <i class="pi pi-link text-purple-500"></i>
              Meraki Uplinks ({{ mu.length }})
            </h3>
            <IconField>
              <InputIcon><i class="pi pi-search" /></InputIcon>
              <InputText v-model="muGlobalFilter" placeholder="Search uplinks..." />
            </IconField>
          </div>

          <DataTable 
            v-model:expandedRows="muExpandedRows"
            :value="mu" 
            :globalFilter="muGlobalFilter"
            paginator 
            :rows="10" 
            :rowsPerPageOptions="[5, 10, 25]"
            stripedRows 
            showGridlines
            sortMode="multiple"
            removableSort
            dataKey="id"
            responsiveLayout="scroll"
            class="premium-table"
            :pt="{
              header: { class: 'bg-purple-50 dark:bg-purple-900/20' },
              headerRow: { class: 'border-b-2 border-purple-200 dark:border-purple-700' }
            }"
          >
            <template #header>
              <div class="flex justify-between items-center">
                <span class="text-base font-medium text-purple-700 dark:text-purple-300">WAN Connectivity Links</span>
                <div class="flex gap-2">
                  <Button text icon="pi pi-plus" label="Expand All" @click="expandAllMU" />
                  <Button text icon="pi pi-minus" label="Collapse All" @click="collapseAllMU" />
                </div>
              </div>
            </template>

            <Column expander style="width: 3rem" />

            <Column field="id" header="Uplink ID" sortable style="min-width: 260px">
              <template #body="{data}">
                <div class="flex items-center gap-2">
                  <code class="text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">{{ data.id }}</code>
                  <Button icon="pi pi-copy" text size="small" @click="copy(data.id)" 
                          v-tooltip.top="'Copy Uplink ID'" class="opacity-60 hover:opacity-100" />
                </div>
              </template>
            </Column>

            <Column field="parent_device" header="Parent Device" sortable style="min-width: 180px">
              <template #body="{data}">
                <code class="text-sm">{{ data.parent_device }}</code>
              </template>
            </Column>

            <Column field="interface" header="Interface" sortable style="min-width: 100px">
              <template #body="{data}">
                <Chip :label="data.interface" class="text-xs" />
              </template>
            </Column>

            <Column field="status" header="Status" sortable style="min-width: 100px">
              <template #body="{data}">
                <Tag :value="data.status" 
                     :severity="data.status === 'Active' ? 'success' : 'warning'" 
                     :icon="data.status === 'Active' ? 'pi pi-check-circle' : 'pi pi-clock'" />
              </template>
            </Column>

            <template #expansion="slotProps">
              <div class="p-4 bg-gray-50 dark:bg-gray-900 border-l-4 border-purple-500">
                <h5 class="mb-3 text-purple-700 dark:text-purple-300 flex items-center gap-2">
                  <i class="pi pi-info-circle"></i>
                  Uplink Details: {{ slotProps.data.interface }}
                </h5>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div class="detail-card">
                    <h6 class="font-semibold text-gray-700 dark:text-gray-300 mb-2">Network Configuration</h6>
                    <div class="space-y-1 text-base">
                      <div><strong>IP Address:</strong> {{ slotProps.data.raw?.network?.ip || 'N/A' }}</div>
                      <div><strong>Gateway:</strong> {{ slotProps.data.raw?.network?.gateway || 'N/A' }}</div>
                      <div><strong>Public IP:</strong> {{ slotProps.data.raw?.network?.public_ip || 'N/A' }}</div>
                      <div><strong>DNS:</strong> {{ slotProps.data.raw?.network?.dns || 'N/A' }}</div>
                      <div><strong>IP Assignment:</strong> {{ slotProps.data.raw?.network?.ip_assigned_by || 'N/A' }}</div>
                    </div>
                  </div>
                  <div class="detail-card">
                    <h6 class="font-semibold text-gray-700 dark:text-gray-300 mb-2">Status & History</h6>
                    <div class="space-y-1 text-base">
                      <div><strong>Status:</strong> 
                        <Tag :value="slotProps.data.status" 
                             :severity="slotProps.data.status === 'Active' ? 'success' : 'warning'" />
                      </div>
                      <div><strong>Disabled:</strong> {{ slotProps.data.raw?.disabled ? 'Yes' : 'No' }}</div>
                      <div><strong>Last Online:</strong> {{ formatDateTime(slotProps.data.raw?.last_online) }}</div>
                      <div><strong>Last Updated:</strong> {{ formatDateTime(slotProps.data.raw?.last_updated) }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </DataTable>
        </div>

        <!-- TEM Accounts Table -->
        <div v-if="tem.length" class="asset-table-container">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-2xl font-semibold flex items-center gap-2">
              <i class="pi pi-phone text-indigo-500"></i>
              TEM Accounts ({{ tem.length }})
            </h3>
            <IconField>
              <InputIcon><i class="pi pi-search" /></InputIcon>
              <InputText v-model="temGlobalFilter" placeholder="Search accounts..." />
            </IconField>
          </div>

          <DataTable 
            :value="tem" 
            :globalFilter="temGlobalFilter"
            paginator 
            :rows="10" 
            :rowsPerPageOptions="[5, 10, 25]"
            stripedRows 
            showGridlines
            sortMode="multiple"
            removableSort
            dataKey="id"
            responsiveLayout="scroll"
            class="premium-table"
            :pt="{
              header: { class: 'bg-indigo-50 dark:bg-indigo-900/20' },
              headerRow: { class: 'border-b-2 border-indigo-200 dark:border-indigo-700' }
            }"
          >
            <template #header>
              <span class="text-base font-medium text-indigo-700 dark:text-indigo-300">Telecom Expense Management Accounts</span>
            </template>

            <Column field="id" header="Account ID" sortable style="min-width: 120px">
              <template #body="{data}">
                <div class="flex items-center gap-2">
                  <code class="text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">{{ data.id }}</code>
                  <Button icon="pi pi-copy" text size="small" @click="copy(data.id)" 
                          v-tooltip.top="'Copy Account ID'" class="opacity-60 hover:opacity-100" />
                </div>
              </template>
            </Column>

            <Column field="phone_number" header="Phone Number" sortable style="min-width: 140px">
              <template #body="{data}">
                <code class="text-sm">{{ data.phone_number || 'N/A' }}</code>
              </template>
            </Column>

            <Column field="carrier" header="Carrier" sortable style="min-width: 120px">
              <template #body="{data}">
                <Chip :label="data.carrier || 'N/A'" class="text-xs bg-indigo-100 text-indigo-800" />
              </template>
            </Column>

            <Column field="plan" header="Plan" sortable style="min-width: 120px">
              <template #body="{data}">
                <Tag :value="data.plan || 'N/A'" severity="success" />
              </template>
            </Column>
          </DataTable>
        </div>
      </div>

      <!-- Footer controls -->
      <div class="mt-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border">
        <div class="flex items-center justify-between">
          <div class="text-base text-gray-600 dark:text-gray-400 flex items-center gap-2">
            <i class="pi pi-info-circle"></i>
            {{ auditRunId ? `Viewing historical audit run #${auditRunId} (read-only)` : 'Viewing latest scan results' }}
          </div>
          <div class="flex items-center gap-3">
            <div class="text-base text-gray-600 dark:text-gray-400">
              Review Status:
            </div>
            <ToggleButton 
              v-model="reviewed" 
              onLabel="Reviewed ✓" 
              offLabel="Mark as Reviewed" 
              @change="toggleReviewed" 
              :disabled="!!auditRunId"
              severity="success"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, watch } from 'vue';
import { useWorkbenchStore } from '@/stores/workbenchStore';
import { useToast } from 'primevue/usetoast';

// Props
const props = defineProps({
  locationId: {
    type: [String, Number],
    required: true
  },
  auditRunId: {
    type: [String, Number],
    default: null
  }
});

// Emits
const emit = defineEmits(['reviewed-changed', 'rescan']);

// Composables
const toast = useToast();
const workbenchStore = useWorkbenchStore();

// Reactive state
const reviewed = computed({
  get: () => workbenchStore.rawAssetsReviewed,
  set: v => workbenchStore.setRawAssetsReviewed(v)
});

// Global filters for each table
const mdGlobalFilter = ref('');
const cpGlobalFilter = ref('');
const orGlobalFilter = ref('');
const simGlobalFilter = ref('');
const mnGlobalFilter = ref('');
const muGlobalFilter = ref('');
const temGlobalFilter = ref('');

// Expanded rows state for each table
const mdExpandedRows = ref({});
const cpExpandedRows = ref({});
const orExpandedRows = ref({});
const simExpandedRows = ref({});
const mnExpandedRows = ref({});
const muExpandedRows = ref({});

// Raw assets data
const raw = computed(() => workbenchStore.rawAssets || {});
const audit = computed(() => raw.value.audit || {});
const mappedCounts = computed(() => raw.value.mapped_counts || {});
const discrepancies = computed(() => raw.value.discrepancies || null);
const hasDiscrepancies = computed(() => !!discrepancies.value);
const loading = computed(() => workbenchStore.loading.rawAssets);

// Asset groups
const md = computed(() => raw.value.raw_assets?.meraki_devices || []);
const mn = computed(() => raw.value.raw_assets?.meraki_networks || []);
const mu = computed(() => raw.value.raw_assets?.meraki_uplinks || []);
const cp = computed(() => raw.value.raw_assets?.cradlepoint_devices || []);
const or = computed(() => raw.value.raw_assets?.orion_nodes || []);
const sim = computed(() => raw.value.raw_assets?.sims || []);
const tem = computed(() => raw.value.raw_assets?.tem_accounts || []);

// Helper methods
const getAssetTypeClass = (code) => {
  const classes = {
    MD: 'bg-blue-100 text-blue-800',
    MN: 'bg-green-100 text-green-800', 
    MU: 'bg-purple-100 text-purple-800',
    CP: 'bg-orange-100 text-orange-800',
    OR: 'bg-red-100 text-red-800',
    SIM: 'bg-cyan-100 text-cyan-800',
    SIM_BELL1GB: 'bg-cyan-100 text-cyan-800',
    TEM: 'bg-indigo-100 text-indigo-800'
  };
  return classes[code] || 'bg-gray-100 text-gray-800';
};

const getDeviceTypeSeverity = (deviceType) => {
  const severities = {
    'Switch': 'info',
    'Router': 'success', 
    'AP': 'warning',
    'Appliance': 'secondary'
  };
  return severities[deviceType] || 'secondary';
};

const formatDateTime = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleString();
  } catch {
    return dateString;
  }
};

const formatUptime = (uptimeSeconds) => {
  if (!uptimeSeconds) return 'N/A';
  const days = Math.floor(uptimeSeconds / 86400);
  const hours = Math.floor((uptimeSeconds % 86400) / 3600);
  const minutes = Math.floor((uptimeSeconds % 3600) / 60);
  return `${days}d ${hours}h ${minutes}m`;
};

// Expand/Collapse methods for each table
const expandAllMD = () => {
  const expanded = {};
  md.value.forEach(device => expanded[device.serial] = true);
  mdExpandedRows.value = expanded;
};

const collapseAllMD = () => {
  mdExpandedRows.value = {};
};

const expandAllCP = () => {
  const expanded = {};
  cp.value.forEach(device => expanded[device.device_id] = true);
  cpExpandedRows.value = expanded;
};

const collapseAllCP = () => {
  cpExpandedRows.value = {};
};

const expandAllOR = () => {
  const expanded = {};
  or.value.forEach(node => expanded[node.node_id] = true);
  orExpandedRows.value = expanded;
};

const collapseAllOR = () => {
  orExpandedRows.value = {};
};

const expandAllSIM = () => {
  const expanded = {};
  sim.value.forEach(simCard => expanded[simCard.iccid] = true);
  simExpandedRows.value = expanded;
};

const collapseAllSIM = () => {
  simExpandedRows.value = {};
};

const expandAllMN = () => {
  const expanded = {};
  mn.value.forEach(network => expanded[network.network_id] = true);
  mnExpandedRows.value = expanded;
};

const collapseAllMN = () => {
  mnExpandedRows.value = {};
};

const expandAllMU = () => {
  const expanded = {};
  mu.value.forEach(uplink => expanded[uplink.id] = true);
  muExpandedRows.value = expanded;
};

const collapseAllMU = () => {
  muExpandedRows.value = {};
};

// Core methods
const copy = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    toast.add({
      severity: 'info',
      summary: 'Copied',
      detail: `Copied "${text}" to clipboard`,
      life: 2000
    });
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    toast.add({
      severity: 'warn',
      summary: 'Copy Failed',
      detail: 'Could not copy to clipboard',
      life: 2000
    });
  }
};

const toggleReviewed = () => {
  emit('reviewed-changed', reviewed.value);
};

const load = async () => {
  try {
    await workbenchStore.loadRawAssets(props.locationId, props.auditRunId || null);
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Load Failed',
      detail: 'Could not load raw assets',
      life: 3000
    });
  }
};

// Watchers
watch(() => props.auditRunId, load);

// Lifecycle
onMounted(load);
</script>

<style scoped>
.raw-assets-tab {
  min-height: 400px;
}

/* Asset table containers */
.asset-table-container {
  @apply bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm;
  padding: 1.5rem;
}

/* Premium table styling */
.raw-assets-tab :deep(.premium-table) {
  border: none;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.raw-assets-tab :deep(.premium-table .p-datatable-header) {
  border: none;
  padding: 1rem 1.5rem;
  font-weight: 600;
  border-radius: 8px 8px 0 0;
}

.raw-assets-tab :deep(.premium-table .p-datatable-thead > tr > th) {
  font-weight: 600;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 1rem 1.25rem;
  border-bottom: 2px solid var(--surface-border);
  background: var(--surface-50);
}

.raw-assets-tab :deep(.premium-table .p-datatable-tbody > tr > td) {
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--surface-border);
  vertical-align: middle;
}

.raw-assets-tab :deep(.premium-table .p-datatable-tbody > tr:hover) {
  background: var(--surface-50);
  transition: background 0.2s ease;
}

.raw-assets-tab :deep(.premium-table .p-datatable-tbody > tr.p-rowgroup-header) {
  background: var(--primary-50);
}

.raw-assets-tab :deep(.premium-table .p-datatable-tbody > tr.p-row-expansion) {
  background: var(--surface-25);
}

/* Expander column styling */
.raw-assets-tab :deep(.premium-table .p-row-toggler) {
  color: var(--primary-color);
  border: none;
  background: none;
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.raw-assets-tab :deep(.premium-table .p-row-toggler:hover) {
  background: var(--primary-50);
  transform: scale(1.1);
}

/* Paginator styling */
.raw-assets-tab :deep(.premium-table .p-paginator) {
  border: none;
  border-top: 1px solid var(--surface-border);
  padding: 1rem 1.5rem;
  background: var(--surface-25);
}

/* Detail card styling */
.detail-card {
  @apply bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* Status and tag enhancements */
.raw-assets-tab :deep(.p-tag) {
  font-weight: 500;
  font-size: 0.75rem;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
}

.raw-assets-tab :deep(.p-chip) {
  font-weight: 500;
  font-size: 0.75rem;
  border-radius: 9999px;
}

/* Search input styling */
.raw-assets-tab :deep(.p-inputtext) {
  border-radius: 6px;
  border: 1px solid var(--surface-border);
  transition: all 0.2s ease;
}

.raw-assets-tab :deep(.p-inputtext:focus) {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px var(--primary-50);
}

/* Copy button enhancements */
.raw-assets-tab :deep(.p-button-text) {
  transition: opacity 0.2s ease;
}

/* Hover effects for interactive elements */
.raw-assets-tab :deep(.p-button:hover) {
  transform: translateY(-1px);
  transition: transform 0.2s ease;
}

/* Enhanced scrollbar for responsive tables */
.raw-assets-tab :deep(.p-datatable-wrapper::-webkit-scrollbar) {
  height: 8px;
}

.raw-assets-tab :deep(.p-datatable-wrapper::-webkit-scrollbar-track) {
  background: var(--surface-100);
  border-radius: 4px;
}

.raw-assets-tab :deep(.p-datatable-wrapper::-webkit-scrollbar-thumb) {
  background: var(--surface-300);
  border-radius: 4px;
}

.raw-assets-tab :deep(.p-datatable-wrapper::-webkit-scrollbar-thumb:hover) {
  background: var(--surface-400);
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .asset-table-container {
    padding: 1rem;
  }
  
  .raw-assets-tab :deep(.premium-table .p-datatable-thead > tr > th),
  .raw-assets-tab :deep(.premium-table .p-datatable-tbody > tr > td) {
    padding: 0.75rem 1rem;
  }
}

/* Animation for expand/collapse */
.raw-assets-tab :deep(.p-datatable-tbody > tr.p-row-expansion > td) {
  animation: expandRow 0.3s ease-out;
}

@keyframes expandRow {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Toggle button styling */
.raw-assets-tab :deep(.p-togglebutton) {
  min-width: 140px;
  border-radius: 6px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.raw-assets-tab :deep(.p-togglebutton:hover) {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}
</style>