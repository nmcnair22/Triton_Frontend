<template>
  <div class="call-operations-testing">
    <Message v-if="error" severity="error" :closable="false">
      {{ error }}
    </Message>

    <Card class="shadow-sm">
      <template #content>
        <div class="call-operations-testing__form-header">
          <div class="space-y-2">
            <div class="text-xs uppercase tracking-[0.24em] text-surface-500">Sandbox Builder</div>
            <div class="flex flex-wrap items-center gap-3">
              <h3 class="text-2xl font-semibold text-surface-900 dark:text-surface-0">Create or update a test call</h3>
              <Tag v-if="isEditingExisting" :value="form.client_system_id || `Test #${form.id}`" severity="contrast" />
            </div>
            <p class="text-sm text-surface-600 dark:text-surface-400">
              Build a fake dispatch call, schedule it a few minutes out, and test the DPROMPT send and status loop without touching live visit data.
            </p>
          </div>

          <div class="call-operations-testing__form-actions">
            <div class="call-operations-testing__force-toggle">
              <Checkbox v-model="forceSend" inputId="test-force-send" binary />
              <label for="test-force-send">Force send</label>
            </div>

            <Button
              icon="pi pi-plus"
              label="New Test Call"
              outlined
              :disabled="actionLoading"
              @click="resetForm(true)"
            />
            <Button
              icon="pi pi-save"
              :label="isEditingExisting ? 'Save Changes' : 'Save Draft'"
              :loading="actionLoading"
              @click="submitForm(false)"
            />
            <Button
              icon="pi pi-send"
              :label="isEditingExisting ? 'Save + Send' : 'Create + Send'"
              :loading="actionLoading"
              @click="submitForm(true)"
            />
          </div>
        </div>

        <div class="call-operations-testing__form-grid">
          <div class="call-operations-testing__field">
            <label class="call-operations-testing__label" for="test-scenario">Scenario</label>
            <Select
              id="test-scenario"
              v-model="form.scenario_preset"
              :options="scenarioOptions"
              optionLabel="label"
              optionValue="value"
              @update:modelValue="handleScenarioChange"
            />
          </div>

          <div class="call-operations-testing__field">
            <label class="call-operations-testing__label" for="test-in-offset">IN</label>
            <Select
              id="test-in-offset"
              v-model="selectedOffsetMinutes"
              :options="offsetOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Choose offset"
              showClear
              @update:modelValue="handleOffsetChange"
            />
          </div>

          <div class="call-operations-testing__field">
            <label class="call-operations-testing__label" for="test-visit-day">Visit Day</label>
            <Select
              id="test-visit-day"
              v-model="form.visit_day_preset"
              :options="visitDayOptions"
              optionLabel="label"
              optionValue="value"
              @update:modelValue="handleVisitDayChange"
            />
          </div>

          <div class="call-operations-testing__field">
            <label class="call-operations-testing__label" for="test-visit-time">Visit Time</label>
            <InputText
              id="test-visit-time"
              v-model.trim="form.visit_time"
              placeholder="11:45 PM"
              @blur="normalizeTimeField"
            />
          </div>

          <div class="call-operations-testing__field">
            <label class="call-operations-testing__label" for="test-timezone">Timezone</label>
            <Select
              id="test-timezone"
              v-model="form.timezone"
              :options="timezoneOptions"
              optionLabel="label"
              optionValue="value"
              @update:modelValue="handleTimezoneChange"
            />
          </div>

          <div class="call-operations-testing__field">
            <label class="call-operations-testing__label" for="test-company-preset">Company</label>
            <Select
              id="test-company-preset"
              v-model="form.company_preset"
              :options="companyPresetOptions"
              optionLabel="label"
              optionValue="value"
              @update:modelValue="handleCompanyChange"
            />
          </div>

          <div class="call-operations-testing__field">
            <label class="call-operations-testing__label" for="test-tech-preset">Technician</label>
            <Select
              id="test-tech-preset"
              v-model="form.technician_preset"
              :options="technicianPresetOptions"
              optionLabel="label"
              optionValue="value"
              @update:modelValue="handleTechnicianChange"
            />
          </div>

          <div class="call-operations-testing__field">
            <label class="call-operations-testing__label" for="test-tech-phone">Technician Phone</label>
            <InputText id="test-tech-phone" v-model.trim="form.tech_phone" placeholder="+19495551212" />
          </div>

          <div class="call-operations-testing__field">
            <label class="call-operations-testing__label" for="test-location-preset">Location</label>
            <Select
              id="test-location-preset"
              v-model="form.location_preset"
              :options="locationPresetOptions"
              optionLabel="label"
              optionValue="value"
              @update:modelValue="handleLocationChange"
            />
          </div>

          <div class="call-operations-testing__field">
            <label class="call-operations-testing__label" for="test-work-order-preset">Work Order</label>
            <Select
              id="test-work-order-preset"
              v-model="form.work_order_preset"
              :options="workOrderPresetOptions"
              optionLabel="label"
              optionValue="value"
              @update:modelValue="handleWorkOrderPresetChange"
            />
          </div>

          <div class="call-operations-testing__field">
            <label class="call-operations-testing__label" for="test-client-id-preset">Client System ID</label>
            <Select
              id="test-client-id-preset"
              v-model="form.client_id_preset"
              :options="clientIdPresetOptions"
              optionLabel="label"
              optionValue="value"
              :disabled="isEditingExisting"
              @update:modelValue="handleClientIdPresetChange"
            />
          </div>

          <div class="call-operations-testing__field call-operations-testing__field--wide">
            <label class="call-operations-testing__label" for="test-tools">Tools Required</label>
            <Textarea
              id="test-tools"
              v-model="form.tools_required"
              autoResize
              rows="3"
              placeholder="Laptop, console cable, cable tester"
            />
          </div>

          <div class="call-operations-testing__field call-operations-testing__field--wide">
            <label class="call-operations-testing__label" for="test-notes">Notes</label>
            <Textarea
              id="test-notes"
              v-model="form.notes"
              autoResize
              rows="3"
              placeholder="Optional debug notes"
            />
          </div>
        </div>

        <div class="call-operations-testing__preset-preview">
          <div>
            <div class="call-operations-testing__preview-label">Label</div>
            <div class="call-operations-testing__preview-value">{{ form.label || 'No label selected' }}</div>
          </div>
          <div>
            <div class="call-operations-testing__preview-label">Visit Date</div>
            <div class="call-operations-testing__preview-value">{{ form.visit_date || 'No date set' }}</div>
          </div>
          <div>
            <div class="call-operations-testing__preview-label">Company</div>
            <div class="call-operations-testing__preview-value">{{ form.company || 'No company selected' }}</div>
          </div>
          <div>
            <div class="call-operations-testing__preview-label">Technician</div>
            <div class="call-operations-testing__preview-value">{{ form.tech_name || 'No technician selected' }}</div>
          </div>
          <div>
            <div class="call-operations-testing__preview-label">Location</div>
            <div class="call-operations-testing__preview-value">{{ form.location_name || 'No location selected' }}</div>
          </div>
          <div>
            <div class="call-operations-testing__preview-label">Address</div>
            <div class="call-operations-testing__preview-value">{{ form.address || 'No address selected' }}</div>
          </div>
          <div>
            <div class="call-operations-testing__preview-label">Work Order</div>
            <div class="call-operations-testing__preview-value">{{ resolvedWorkOrderPreview }}</div>
          </div>
          <div>
            <div class="call-operations-testing__preview-label">Client System ID</div>
            <div class="call-operations-testing__preview-value">{{ resolvedClientSystemIdPreview }}</div>
          </div>
        </div>

        <div class="call-operations-testing__manual-toggle">
          <Checkbox v-model="form.manual_overrides" inputId="test-manual-overrides" binary />
          <label for="test-manual-overrides">Edit preset values manually</label>
        </div>

        <div v-if="form.manual_overrides" class="call-operations-testing__manual-grid">
          <div class="call-operations-testing__field call-operations-testing__field--wide">
            <label class="call-operations-testing__label" for="test-label">Label</label>
            <InputText id="test-label" v-model.trim="form.label" placeholder="Sandbox smoke test" />
          </div>

          <div class="call-operations-testing__field">
            <label class="call-operations-testing__label" for="test-visit-date">Visit Date</label>
            <InputText id="test-visit-date" v-model.trim="form.visit_date" placeholder="YYYY-MM-DD" />
          </div>

          <div class="call-operations-testing__field">
            <label class="call-operations-testing__label" for="test-company">Company</label>
            <InputText id="test-company" v-model.trim="form.company" placeholder="CIS" />
          </div>

          <div class="call-operations-testing__field">
            <label class="call-operations-testing__label" for="test-tech-name">Technician Name</label>
            <InputText id="test-tech-name" v-model.trim="form.tech_name" placeholder="Test Technician" />
          </div>

          <div class="call-operations-testing__field call-operations-testing__field--wide">
            <label class="call-operations-testing__label" for="test-location-name">Location Name</label>
            <InputText id="test-location-name" v-model.trim="form.location_name" placeholder="Fake Store 001" />
          </div>

          <div class="call-operations-testing__field call-operations-testing__field--wide">
            <label class="call-operations-testing__label" for="test-address">Address</label>
            <InputText id="test-address" v-model.trim="form.address" placeholder="123 Test Ave, Los Angeles, CA 90001" />
          </div>

          <div class="call-operations-testing__field">
            <label class="call-operations-testing__label" for="test-work-order">Work Order</label>
            <InputText id="test-work-order" v-model.trim="form.work_order" placeholder="Optional" />
          </div>

          <div class="call-operations-testing__field">
            <label class="call-operations-testing__label" for="test-client-system-id">Client System ID</label>
            <InputText
              id="test-client-system-id"
              v-model.trim="form.client_system_id"
              :disabled="isEditingExisting"
              placeholder="Auto-generated TEST-..."
            />
          </div>
        </div>
      </template>
    </Card>

    <Card class="shadow-sm">
      <template #content>
        <div class="call-operations-testing__grid-header">
          <div class="space-y-1">
            <div class="text-xs uppercase tracking-[0.24em] text-surface-500">Sandbox Grid</div>
            <div class="flex flex-wrap items-center gap-3">
              <h3 class="text-2xl font-semibold text-surface-900 dark:text-surface-0">Test calls</h3>
              <Tag :value="`${meta.total} rows`" severity="secondary" />
            </div>
            <p class="text-sm text-surface-600 dark:text-surface-400">
              Click a row to load it into the form and update the inline detail panel below the grid.
            </p>
          </div>

          <div class="call-operations-testing__grid-actions">
            <InputText
              v-model.trim="filterDraft.search"
              placeholder="Search test calls"
              class="w-full sm:w-64"
              @keyup.enter="applyFilters"
            />
            <Select
              v-model="filterDraft.readyToPush"
              :options="readinessOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Any readiness"
              showClear
              class="w-full sm:w-48"
            />
            <MultiSelect
              v-model="filterDraft.syncStatuses"
              :options="syncStatusOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Sync status"
              display="chip"
              class="w-full sm:w-56"
            />
            <MultiSelect
              v-model="filterDraft.callStatuses"
              :options="callStatusOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Call status"
              display="chip"
              class="w-full sm:w-56"
            />
            <Button icon="pi pi-check" label="Apply" outlined @click="applyFilters" />
            <Button icon="pi pi-filter-slash" label="Clear" text @click="clearFilters" />
            <Button icon="pi pi-refresh" label="Refresh" outlined :loading="loadingRows" @click="refreshRows" />
            <Button icon="pi pi-sync" label="Refresh Status" :loading="actionLoading" @click="refreshStatuses" />
          </div>
        </div>

        <DataTable
          :value="rows"
          dataKey="id"
          lazy
          paginator
          :rows="tableState.perPage"
          :first="(tableState.page - 1) * tableState.perPage"
          :totalRecords="meta.total"
          :rowsPerPageOptions="[10, 25, 50]"
          :loading="loadingRows"
          scrollable
          scrollHeight="34rem"
          stripedRows
          showGridlines
          rowHover
          responsiveLayout="scroll"
          size="small"
          class="call-operations-testing__grid"
          :rowClass="rowClass"
          @page="handlePage"
          @row-click="handleRowClick"
        >
          <template #empty>
            <div class="py-12 text-center">
              <i class="pi pi-flask text-5xl text-surface-300 mb-4"></i>
              <div class="text-lg font-medium text-surface-700 dark:text-surface-300">No test calls found</div>
              <div class="text-sm text-surface-500 dark:text-surface-400 mt-2">
                Create a sandbox record above or clear the current filters.
              </div>
            </div>
          </template>

          <Column field="client_system_id" header="Test Call" :style="{ minWidth: '16rem' }">
            <template #body="{ data }">
              <div class="space-y-1">
                <div class="font-semibold text-primary-600">{{ data.client_system_id || `Test #${data.id}` }}</div>
                <div class="text-sm text-surface-900 dark:text-surface-0">{{ data.label || 'Untitled test call' }}</div>
                <div class="text-xs text-surface-500 dark:text-surface-400">{{ data.work_order || 'Auto work order' }}</div>
              </div>
            </template>
          </Column>

          <Column field="appointment.visit_date" header="Schedule" :style="{ minWidth: '13rem' }">
            <template #body="{ data }">
              <div class="space-y-1">
                <div class="font-medium text-surface-900 dark:text-surface-0">{{ data.appointment?.visit_date || 'No date' }}</div>
                <div class="text-sm text-surface-600 dark:text-surface-400">{{ data.appointment?.visit_time || 'No time' }}</div>
                <div class="text-xs text-surface-500 dark:text-surface-400">{{ data.appointment?.timezone || 'No timezone' }}</div>
              </div>
            </template>
          </Column>

          <Column field="technician.name" header="Technician" :style="{ minWidth: '13rem' }">
            <template #body="{ data }">
              <div class="space-y-1">
                <div class="font-medium text-surface-900 dark:text-surface-0">{{ data.technician?.name || 'Missing tech' }}</div>
                <div class="text-sm text-surface-500 dark:text-surface-400">{{ data.technician?.phone || 'Missing phone' }}</div>
              </div>
            </template>
          </Column>

          <Column field="location.name" header="Location" :style="{ minWidth: '16rem' }">
            <template #body="{ data }">
              <div class="space-y-1">
                <div class="font-medium text-surface-900 dark:text-surface-0">{{ data.location?.name || 'Missing location' }}</div>
                <div class="text-sm text-surface-500 dark:text-surface-400">{{ data.location?.address || 'Missing address' }}</div>
              </div>
            </template>
          </Column>

          <Column field="sync.sync_status" header="Sync" :style="{ minWidth: '11rem' }">
            <template #body="{ data }">
              <div class="space-y-2">
                <Tag :value="formatStatus(data.sync?.sync_status)" :severity="syncSeverity(data.sync?.sync_status)" />
                <div class="text-xs text-surface-500 dark:text-surface-400">
                  Pushes: {{ data.sync?.push_count ?? 0 }}
                </div>
              </div>
            </template>
          </Column>

          <Column field="call.call_status" header="Call" :style="{ minWidth: '11rem' }">
            <template #body="{ data }">
              <div class="space-y-2">
                <Tag :value="formatStatus(data.call?.call_status)" :severity="callSeverity(data.call?.call_status)" />
                <div class="text-xs text-surface-500 dark:text-surface-400">
                  {{ data.call?.retell_call_id || data.call?.last_outcome || 'No result yet' }}
                </div>
              </div>
            </template>
          </Column>

          <Column field="readiness.ready_to_push" header="Readiness" :style="{ minWidth: '12rem' }">
            <template #body="{ data }">
              <div class="space-y-2">
                <Tag :value="data.readiness?.ready_to_push ? 'Ready' : 'Blocked'" :severity="data.readiness?.ready_to_push ? 'success' : 'warning'" />
                <div class="text-xs text-surface-500 dark:text-surface-400">
                  {{ formatInlineReasons(data) }}
                </div>
              </div>
            </template>
          </Column>

          <Column header="Actions" frozen alignFrozen="right" :style="{ width: '5rem', minWidth: '5rem' }">
            <template #body="{ data }">
              <Button
                icon="pi pi-ellipsis-h"
                text
                rounded
                aria-label="Test call actions"
                @click="toggleActionMenu($event, data)"
              />
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>

    <Card class="shadow-sm">
      <template #content>
        <div class="call-operations-testing__detail-header">
          <div class="space-y-1">
            <div class="text-xs uppercase tracking-[0.24em] text-surface-500">Selected Test Call</div>
            <div class="flex flex-wrap items-center gap-3">
              <h3 class="text-2xl font-semibold text-surface-900 dark:text-surface-0">
                {{ detailTitle }}
              </h3>
              <template v-if="selectedCall">
                <Tag :value="formatStatus(selectedCall.sync?.sync_status)" :severity="syncSeverity(selectedCall.sync?.sync_status)" />
                <Tag :value="formatStatus(selectedCall.call?.call_status)" :severity="callSeverity(selectedCall.call?.call_status)" />
                <Tag :value="selectedCall.readiness?.ready_to_push ? 'Ready' : 'Blocked'" :severity="selectedCall.readiness?.ready_to_push ? 'success' : 'warning'" />
              </template>
            </div>
            <p class="text-sm text-surface-600 dark:text-surface-400">
              {{ detailSubtitle }}
            </p>
          </div>

          <div v-if="selectedCall" class="call-operations-testing__detail-actions">
            <Button
              icon="pi pi-send"
              label="Send / Update"
              :disabled="!selectedCall.allowed_actions?.includes('send_update') || actionLoading"
              :loading="actionLoading"
              @click="sendSelectedCall"
            />
            <Button
              icon="pi pi-sync"
              label="Refresh Status"
              outlined
              :disabled="!selectedCall.allowed_actions?.includes('refresh_status') || actionLoading"
              @click="refreshSelectedStatus"
            />
            <Button
              v-if="selectedCall.allowed_actions?.includes('view_recording')"
              icon="pi pi-play-circle"
              label="Recording"
              outlined
              @click="openExternal(selectedCall.call?.recording_direct || selectedCall.call?.recording_url)"
            />
            <Button
              v-if="selectedCall.allowed_actions?.includes('view_transcript')"
              icon="pi pi-file"
              label="Transcript"
              outlined
              @click="openExternal(selectedCall.call?.transcript_url)"
            />
            <Button
              icon="pi pi-trash"
              label="Delete"
              text
              severity="danger"
              :loading="actionLoading"
              @click="confirmDelete(selectedCall)"
            />
          </div>
        </div>

        <div v-if="loadingDetail && !selectedCall" class="space-y-4">
          <Skeleton height="10rem" />
          <Skeleton height="16rem" />
        </div>

        <div v-else-if="!selectedCall" class="call-operations-testing__detail-empty">
          <i class="pi pi-arrow-up-right text-4xl text-surface-300 mb-3"></i>
          <div class="text-lg font-medium text-surface-700 dark:text-surface-300">Select a sandbox row</div>
          <div class="text-sm text-surface-500 dark:text-surface-400">
            Clicking a row loads it into the form above and shows the current payload, readiness, and call state here.
          </div>
        </div>

        <template v-else>
          <div class="call-operations-testing__detail-grid">
            <Card class="shadow-sm">
              <template #content>
                <div class="text-xs uppercase tracking-[0.2em] text-surface-500 mb-2">Schedule</div>
                <div class="font-semibold text-surface-900 dark:text-surface-0">{{ selectedCall.appointment?.visit_date || 'No date' }}</div>
                <div class="text-sm text-surface-600 dark:text-surface-400">{{ selectedCall.appointment?.visit_time || 'No time' }}</div>
                <div class="text-sm text-surface-500 mt-2">{{ selectedCall.appointment?.timezone || 'No timezone' }}</div>
              </template>
            </Card>

            <Card class="shadow-sm">
              <template #content>
                <div class="text-xs uppercase tracking-[0.2em] text-surface-500 mb-2">Work Order</div>
                <div class="font-semibold text-surface-900 dark:text-surface-0">{{ selectedCall.work_order || 'Auto-generated' }}</div>
                <div class="text-sm text-surface-600 dark:text-surface-400">{{ selectedCall.company || 'CIS' }}</div>
                <div class="text-sm text-surface-500 mt-2">Updated {{ formatTimestamp(selectedCall.updated_at) }}</div>
              </template>
            </Card>

            <Card class="shadow-sm">
              <template #content>
                <div class="text-xs uppercase tracking-[0.2em] text-surface-500 mb-2">Technician</div>
                <div class="font-semibold text-surface-900 dark:text-surface-0">{{ selectedCall.technician?.name || 'Missing technician' }}</div>
                <div class="text-sm text-surface-600 dark:text-surface-400">{{ selectedCall.technician?.phone || 'Missing phone' }}</div>
              </template>
            </Card>

            <Card class="shadow-sm">
              <template #content>
                <div class="text-xs uppercase tracking-[0.2em] text-surface-500 mb-2">Location</div>
                <div class="font-semibold text-surface-900 dark:text-surface-0">{{ selectedCall.location?.name || 'Missing location' }}</div>
                <div class="text-sm text-surface-600 dark:text-surface-400">{{ selectedCall.location?.address || 'Missing address' }}</div>
              </template>
            </Card>

            <Card class="shadow-sm call-operations-testing__detail-span-2">
              <template #content>
                <div class="flex items-start justify-between gap-4">
                  <div class="space-y-2">
                    <div class="text-xs uppercase tracking-[0.2em] text-surface-500">Tools Required</div>
                    <div class="font-semibold text-surface-900 dark:text-surface-0">{{ formatToolsText(selectedCall.tools?.resolved) || 'Missing tools' }}</div>
                    <div class="text-sm text-surface-500">
                      Source: <span class="font-medium">{{ selectedCall.tools?.source || 'missing' }}</span>
                      <span v-if="selectedCall.tools?.override"> • Override: {{ formatToolsText(selectedCall.tools.override) }}</span>
                    </div>
                  </div>
                  <Tag :value="selectedCall.sync?.needs_repush ? 'Needs Re-push' : 'In Sync'" :severity="selectedCall.sync?.needs_repush ? 'warning' : 'success'" />
                </div>
              </template>
            </Card>

            <Card class="shadow-sm call-operations-testing__detail-span-2">
              <template #content>
                <div class="text-xs uppercase tracking-[0.2em] text-surface-500 mb-3">Readiness</div>
                <Message v-if="selectedCall.readiness?.ready_to_push" severity="success" :closable="false">
                  Sandbox test call is ready to send.
                </Message>
                <Message v-else-if="formattedReasons.length" severity="warn" :closable="false">
                  {{ formattedReasons.join(', ') }}
                </Message>
                <Message v-else severity="warn" :closable="false">
                  Missing required fields for DPROMPT.
                </Message>
              </template>
            </Card>

            <Card class="shadow-sm call-operations-testing__detail-span-2" v-if="selectedCall.notes">
              <template #content>
                <div class="text-xs uppercase tracking-[0.2em] text-surface-500 mb-3">Notes</div>
                <div class="text-sm text-surface-700 dark:text-surface-300 whitespace-pre-wrap">{{ selectedCall.notes }}</div>
              </template>
            </Card>

            <Card class="shadow-sm call-operations-testing__detail-span-2">
              <template #content>
                <div class="text-xs uppercase tracking-[0.2em] text-surface-500 mb-3">Payload Preview</div>
                <pre class="call-operations-testing__payload-preview">{{ formattedPayload }}</pre>
              </template>
            </Card>

            <Card class="shadow-sm call-operations-testing__detail-span-2" v-if="hasCallAssets || selectedCall.sync?.last_error">
              <template #content>
                <div class="text-xs uppercase tracking-[0.2em] text-surface-500 mb-3">Call Assets</div>
                <div class="flex flex-wrap gap-2 mb-3" v-if="hasCallAssets">
                  <Button
                    v-if="selectedCall.allowed_actions?.includes('view_recording')"
                    label="Recording"
                    icon="pi pi-play-circle"
                    outlined
                    @click="openExternal(selectedCall.call?.recording_direct || selectedCall.call?.recording_url)"
                  />
                  <Button
                    v-if="selectedCall.allowed_actions?.includes('view_transcript')"
                    label="Transcript"
                    icon="pi pi-file"
                    outlined
                    @click="openExternal(selectedCall.call?.transcript_url)"
                  />
                </div>

                <Message v-if="selectedCall.sync?.last_error" severity="error" :closable="false">
                  {{ selectedCall.sync.last_error }}
                </Message>
              </template>
            </Card>

            <Card class="shadow-sm call-operations-testing__detail-span-2" v-if="hasVendorDebug">
              <template #content>
                <div class="text-xs uppercase tracking-[0.2em] text-surface-500 mb-3">Vendor Debug</div>
                <div class="space-y-3">
                  <div v-if="selectedCall.vendor_debug?.last_api_response">
                    <div class="text-xs uppercase tracking-[0.18em] text-surface-500 mb-2">Last API Response</div>
                    <pre class="call-operations-testing__payload-preview">{{ formatJson(selectedCall.vendor_debug.last_api_response) }}</pre>
                  </div>
                  <div v-if="selectedCall.vendor_debug?.last_vendor_row_raw">
                    <div class="text-xs uppercase tracking-[0.18em] text-surface-500 mb-2">Last Vendor Row</div>
                    <pre class="call-operations-testing__payload-preview">{{ formatJson(selectedCall.vendor_debug.last_vendor_row_raw) }}</pre>
                  </div>
                </div>
              </template>
            </Card>
          </div>
        </template>
      </template>
    </Card>

    <Menu ref="actionMenu" :model="actionMenuItems" popup />

    <CallOperationsTestDetailDrawer
      v-model:visible="timelineVisible"
      :testCall="selectedCall"
      :events="selectedTestCallActivity"
      :loading="loadingTimeline"
      @refresh="refreshTimeline"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useToast } from 'primevue/usetoast';
import CallOperationsTestDetailDrawer from '@/components/field-services/call-operations/CallOperationsTestDetailDrawer.vue';
import { useCallOperationsTestStore } from '@/stores/callOperationsTestStore';
import { formatReadinessReasons, formatToolsText } from '@/utils/callOperations';

const DEFAULT_TIMEZONE = Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Los_Angeles';
const DEFAULT_COMPANY = 'CIS';
const DEFAULT_TOOLS = 'Laptop, console cable, cable tester';

const scenarioOptions = [
  {
    label: 'Smoke Test',
    value: 'smoke',
    resolvedLabel: 'Sandbox Smoke Test',
    tools: 'Laptop, console cable, cable tester',
    notes: 'Baseline DPROMPT smoke test for send and status tracking.'
  },
  {
    label: 'Arrival Reminder',
    value: 'arrival',
    resolvedLabel: 'Arrival Reminder Test',
    tools: 'Laptop, charger, patch cable',
    notes: 'Use this to validate pre-arrival reminder messaging.'
  },
  {
    label: 'Tools Confirmation',
    value: 'tools',
    resolvedLabel: 'Tools Confirmation Test',
    tools: 'Ladder, cable tester, console cable',
    notes: 'Focused on verifying the tools-required branch of the call.'
  },
  {
    label: 'Status Loop',
    value: 'status',
    resolvedLabel: 'Status Loop Verification',
    tools: 'Laptop, hotspot, label maker',
    notes: 'Used to validate the refresh and reconciliation loop.'
  },
  {
    label: 'Transfer Flow',
    value: 'transfer',
    resolvedLabel: 'Transfer Flow Test',
    tools: 'Laptop, console cable, cell phone',
    notes: 'Use this when testing transfer behavior and follow-up updates.'
  },
  {
    label: 'Custom / Current',
    value: 'custom'
  }
];

const visitDayOptions = [
  { label: 'Today', value: 'today', offsetDays: 0 },
  { label: 'Tomorrow', value: 'tomorrow', offsetDays: 1 },
  { label: 'In 2 days', value: 'plus2', offsetDays: 2 },
  { label: 'In 3 days', value: 'plus3', offsetDays: 3 },
  { label: 'In 7 days', value: 'plus7', offsetDays: 7 },
  { label: 'Custom / Current', value: 'custom' }
];

const timezoneOptions = [
  { label: 'Pacific · America/Los_Angeles', value: 'America/Los_Angeles' },
  { label: 'Arizona · America/Phoenix', value: 'America/Phoenix' },
  { label: 'Central · America/Chicago', value: 'America/Chicago' },
  { label: 'Mountain · America/Denver', value: 'America/Denver' },
  { label: 'Eastern · America/New_York', value: 'America/New_York' }
];

const companyPresetOptions = [
  { label: 'CIS', value: 'cis', resolvedValue: 'CIS' },
  { label: 'Dispatch Lab', value: 'dispatch_lab', resolvedValue: 'Dispatch Lab' },
  { label: 'West Coast QA', value: 'west_qa', resolvedValue: 'West Coast QA' },
  { label: 'Central QA', value: 'central_qa', resolvedValue: 'Central QA' },
  { label: 'East Coast QA', value: 'east_qa', resolvedValue: 'East Coast QA' },
  { label: 'Custom / Current', value: 'custom' }
];

const technicianPresetOptions = [
  { label: 'Nate McNair', value: 'nate', resolvedValue: 'Nate McNair' },
  { label: 'Dispatch QA Alpha', value: 'qa_alpha', resolvedValue: 'Dispatch QA Alpha' },
  { label: 'Dispatch QA Bravo', value: 'qa_bravo', resolvedValue: 'Dispatch QA Bravo' },
  { label: 'Dispatch QA Charlie', value: 'qa_charlie', resolvedValue: 'Dispatch QA Charlie' },
  { label: 'Dispatch QA Delta', value: 'qa_delta', resolvedValue: 'Dispatch QA Delta' },
  { label: 'Custom / Current', value: 'custom' }
];

const locationPresetOptions = [
  {
    label: 'Los Angeles Lab',
    value: 'la_lab',
    resolvedName: 'Fake Store LA 001',
    resolvedAddress: '123 Test Ave, Los Angeles, CA 90001',
    timezone: 'America/Los_Angeles'
  },
  {
    label: 'Phoenix Sandbox',
    value: 'phx_sandbox',
    resolvedName: 'Fake Store PHX 014',
    resolvedAddress: '456 Desert Loop, Phoenix, AZ 85004',
    timezone: 'America/Phoenix'
  },
  {
    label: 'Dallas Staging',
    value: 'dallas_staging',
    resolvedName: 'Fake Store DAL 021',
    resolvedAddress: '789 Switchyard Rd, Dallas, TX 75201',
    timezone: 'America/Chicago'
  },
  {
    label: 'Chicago Loop',
    value: 'chicago_loop',
    resolvedName: 'Fake Store CHI 008',
    resolvedAddress: '101 Grid Ave, Chicago, IL 60601',
    timezone: 'America/Chicago'
  },
  {
    label: 'New York Midtown',
    value: 'ny_midtown',
    resolvedName: 'Fake Store NYC 003',
    resolvedAddress: '202 Signal St, New York, NY 10018',
    timezone: 'America/New_York'
  },
  { label: 'Custom / Current', value: 'custom' }
];

const workOrderPresetOptions = [
  { label: 'Mirror client system id', value: 'mirror', mode: 'mirror' },
  { label: 'WO-SMOKE', value: 'wo_smoke', mode: 'prefix', prefix: 'WO-SMOKE' },
  { label: 'WO-ARRIVAL', value: 'wo_arrival', mode: 'prefix', prefix: 'WO-ARRIVAL' },
  { label: 'WO-TOOLS', value: 'wo_tools', mode: 'prefix', prefix: 'WO-TOOLS' },
  { label: 'WO-STATUS', value: 'wo_status', mode: 'prefix', prefix: 'WO-STATUS' },
  { label: 'Custom / Current', value: 'custom', mode: 'custom' }
];

const clientIdPresetOptions = [
  { label: 'Auto-generated by backend', value: 'auto', mode: 'auto' },
  { label: 'TEST-SMOKE', value: 'test_smoke', mode: 'prefix', prefix: 'TEST-SMOKE' },
  { label: 'TEST-ARRIVAL', value: 'test_arrival', mode: 'prefix', prefix: 'TEST-ARRIVAL' },
  { label: 'TEST-TOOLS', value: 'test_tools', mode: 'prefix', prefix: 'TEST-TOOLS' },
  { label: 'TEST-STATUS', value: 'test_status', mode: 'prefix', prefix: 'TEST-STATUS' },
  { label: 'Custom / Current', value: 'custom', mode: 'custom' }
];

const offsetOptions = [
  { label: 'In 3 minutes', value: 3 },
  { label: 'In 5 minutes', value: 5 },
  { label: 'In 10 minutes', value: 10 },
  { label: 'In 15 minutes', value: 15 },
  { label: 'In 30 minutes', value: 30 }
];

const readinessOptions = [
  { label: 'Ready only', value: true },
  { label: 'Blocked only', value: false }
];

const syncStatusOptions = [
  { label: 'Not Ready', value: 'not_ready' },
  { label: 'Ready', value: 'ready' },
  { label: 'Sent', value: 'sent' },
  { label: 'Needs Update', value: 'needs_update' },
  { label: 'Push Failed', value: 'push_failed' }
];

const callStatusOptions = [
  { label: 'Awaiting Call', value: 'awaiting_call' },
  { label: 'Completed', value: 'completed' },
  { label: 'Transferred', value: 'transferred' },
  { label: 'Failed', value: 'failed' },
  { label: 'Unknown', value: 'unknown' }
];

const toast = useToast();
const store = useCallOperationsTestStore();

const actionMenu = ref(null);
const currentActionCall = ref(null);
const timelineVisible = ref(false);
const selectedOffsetMinutes = ref(5);
const forceSend = ref(false);

const form = ref(createDefaultForm());
const filterDraft = ref(createFilterDraft());

const rows = computed(() => store.rows);
const meta = computed(() => store.meta);
const error = computed(() => store.error);
const loadingRows = computed(() => store.loadingRows);
const loadingDetail = computed(() => store.loadingDetail);
const loadingActivity = computed(() => store.loadingActivity);
const actionLoading = computed(() => store.actionLoading);
const tableState = computed(() => store.tableState);
const selectedCall = computed(() => store.selectedTestCall);
const selectedTestCallActivity = computed(() => store.selectedTestCallActivity);
const isEditingExisting = computed(() => Boolean(form.value.id));
const loadingTimeline = computed(() => loadingActivity.value || (timelineVisible.value && loadingDetail.value));
const formattedReasons = computed(() => formatReadinessReasons(selectedCall.value));
const formattedPayload = computed(() => JSON.stringify(selectedCall.value?.payload_preview || {}, null, 2));
const resolvedClientSystemIdPreview = computed(() => {
  if (isEditingExisting.value) {
    return form.value.client_system_id || 'Saved on record';
  }

  if (form.value.client_id_preset === 'auto' && !form.value.client_system_id) {
    return 'Generated by backend on create';
  }

  return form.value.client_system_id || 'Generated by backend on create';
});

const resolvedWorkOrderPreview = computed(() => {
  if (form.value.work_order_preset === 'mirror') {
    return form.value.client_system_id || (form.value.client_id_preset === 'auto' ? 'Will mirror generated test ID' : 'Will mirror client system id');
  }

  return form.value.work_order || 'Defaulted by backend';
});
const hasCallAssets = computed(() => Boolean(
  selectedCall.value?.call?.recording_url ||
    selectedCall.value?.call?.recording_direct ||
    selectedCall.value?.call?.transcript_url
));
const hasVendorDebug = computed(() => Boolean(
  selectedCall.value?.vendor_debug?.last_api_response ||
    selectedCall.value?.vendor_debug?.last_vendor_row_raw
));

const detailTitle = computed(() => {
  if (!selectedCall.value) {
    return 'No test call selected';
  }

  return `${selectedCall.value.client_system_id || `Test #${selectedCall.value.id}`} · ${selectedCall.value.label || 'Untitled test call'}`;
});

const detailSubtitle = computed(() => {
  if (!selectedCall.value) {
    return 'The inline detail panel mirrors the row you clicked. Use the row action menu for Timeline.';
  }

  return 'Row clicks update this panel and the form above. Timeline opens only from the row action menu.';
});

const actionMenuItems = computed(() => {
  const call = currentActionCall.value;

  if (!call) {
    return [];
  }

  const items = [
    {
      label: 'Load Into Form',
      icon: 'pi pi-pencil',
      command: () => loadCallIntoForm(call, true)
    },
    {
      label: 'Timeline',
      icon: 'pi pi-history',
      command: () => openTimeline(call)
    }
  ];

  if (call.allowed_actions?.includes('send_update')) {
    items.push({
      label: 'Send / Update',
      icon: 'pi pi-send',
      command: () => sendCall(call)
    });
  }

  if (call.allowed_actions?.includes('refresh_status')) {
    items.push({
      label: 'Refresh Status',
      icon: 'pi pi-sync',
      command: () => refreshStatuses([call.id])
    });
  }

  if (call.allowed_actions?.includes('view_recording')) {
    items.push({
      label: 'Recording',
      icon: 'pi pi-play-circle',
      command: () => openExternal(call.call?.recording_direct || call.call?.recording_url)
    });
  }

  if (call.allowed_actions?.includes('view_transcript')) {
    items.push({
      label: 'Transcript',
      icon: 'pi pi-file',
      command: () => openExternal(call.call?.transcript_url)
    });
  }

  items.push({
    separator: true
  });

  items.push({
    label: 'Delete Test Call',
    icon: 'pi pi-trash',
    command: () => confirmDelete(call)
  });

  return items;
});

onMounted(async () => {
  syncFilterDraft();

  try {
    await store.loadRows();

    if (store.selectedTestCallId) {
      await store.loadDetail(store.selectedTestCallId);
      populateForm(store.selectedTestCall || null);
    }
  } catch (loadError) {
    showToast('error', 'Sandbox load failed', loadError.message || 'Unable to load DPROMPT sandbox test calls.');
  }
});

function createFilterDraft() {
  return {
    search: '',
    syncStatuses: [],
    callStatuses: [],
    readyToPush: null
  };
}

function findPreset(options, value) {
  return options.find((option) => option.value === value) || null;
}

function generatePrefixedIdentifier(prefix) {
  const seed = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`.slice(-10).toUpperCase();
  return `${prefix}-${seed}`;
}

function createDefaultForm() {
  const scheduledAt = addMinutes(new Date(), 5);

  const nextForm = {
    id: null,
    scenario_preset: 'smoke',
    visit_day_preset: 'today',
    company_preset: 'cis',
    technician_preset: 'nate',
    location_preset: 'la_lab',
    work_order_preset: 'mirror',
    client_id_preset: 'auto',
    manual_overrides: false,
    label: '',
    notes: '',
    tech_name: '',
    tech_phone: '',
    visit_date: formatDateInput(scheduledAt, DEFAULT_TIMEZONE),
    visit_time: formatTimeInput(scheduledAt, DEFAULT_TIMEZONE),
    timezone: DEFAULT_TIMEZONE,
    location_name: '',
    address: '',
    company: DEFAULT_COMPANY,
    work_order: '',
    tools_required: DEFAULT_TOOLS,
    client_system_id: ''
  };

  applyScenarioPreset(nextForm.scenario_preset, nextForm);
  applyCompanyPreset(nextForm.company_preset, nextForm);
  applyTechnicianPreset(nextForm.technician_preset, nextForm);
  applyLocationPreset(nextForm.location_preset, nextForm);
  applyScheduledFields(nextForm, selectedOffsetMinutes.value ?? 5);
  applyClientIdPreset(nextForm.client_id_preset, nextForm);
  applyWorkOrderPreset(nextForm.work_order_preset, nextForm);

  return nextForm;
}

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

function addDays(date, days) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function formatDateInput(date, timeZone) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date);
}

function formatTimeInput(date, timeZone) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }).format(date);
}

function normalizeTime(value) {
  const rawValue = String(value || '').trim();

  if (!rawValue) {
    return '';
  }

  const meridiemMatch = rawValue.match(/^(\d{1,2}):(\d{2})\s*([ap]m)$/i);

  if (meridiemMatch) {
    let hour = Number(meridiemMatch[1]);
    const minute = meridiemMatch[2];
    const meridiem = meridiemMatch[3].toUpperCase();

    if (hour === 0) {
      hour = 12;
    } else if (hour > 12) {
      hour = ((hour - 1) % 12) + 1;
    }

    return `${hour}:${minute} ${meridiem}`;
  }

  const twentyFourHourMatch = rawValue.match(/^(\d{1,2}):(\d{2})$/);

  if (twentyFourHourMatch) {
    let hour = Number(twentyFourHourMatch[1]);
    const minute = twentyFourHourMatch[2];
    const meridiem = hour >= 12 ? 'PM' : 'AM';
    hour %= 12;
    hour = hour || 12;
    return `${hour}:${minute} ${meridiem}`;
  }

  return rawValue;
}

function normalizeTimeField() {
  form.value.visit_time = normalizeTime(form.value.visit_time);
}

function applyScheduledFields(targetForm, offsetMinutes = selectedOffsetMinutes.value) {
  const dayPreset = findPreset(visitDayOptions, targetForm.visit_day_preset);

  if (!dayPreset || dayPreset.value === 'custom') {
    return;
  }

  const baseDate = addMinutes(new Date(), Number(offsetMinutes || 0));
  const scheduledAt = addDays(baseDate, dayPreset.offsetDays);
  targetForm.visit_date = formatDateInput(scheduledAt, targetForm.timezone || DEFAULT_TIMEZONE);

  if (offsetMinutes !== null && offsetMinutes !== undefined) {
    targetForm.visit_time = formatTimeInput(scheduledAt, targetForm.timezone || DEFAULT_TIMEZONE);
  }
}

function applyScenarioPreset(presetValue, targetForm = form.value) {
  const preset = findPreset(scenarioOptions, presetValue);

  if (!preset || preset.value === 'custom') {
    return;
  }

  targetForm.label = preset.resolvedLabel;
  targetForm.tools_required = preset.tools;
  targetForm.notes = preset.notes;
}

function applyCompanyPreset(presetValue, targetForm = form.value) {
  const preset = findPreset(companyPresetOptions, presetValue);

  if (!preset || preset.value === 'custom') {
    return;
  }

  targetForm.company = preset.resolvedValue;
}

function applyTechnicianPreset(presetValue, targetForm = form.value) {
  const preset = findPreset(technicianPresetOptions, presetValue);

  if (!preset || preset.value === 'custom') {
    return;
  }

  targetForm.tech_name = preset.resolvedValue;
}

function applyLocationPreset(presetValue, targetForm = form.value) {
  const preset = findPreset(locationPresetOptions, presetValue);

  if (!preset || preset.value === 'custom') {
    return;
  }

  targetForm.location_name = preset.resolvedName;
  targetForm.address = preset.resolvedAddress;
  targetForm.timezone = preset.timezone;
}

function applyClientIdPreset(presetValue, targetForm = form.value) {
  const preset = findPreset(clientIdPresetOptions, presetValue);

  if (!preset || preset.mode === 'custom') {
    return;
  }

  if (preset.mode === 'auto') {
    targetForm.client_system_id = '';
    return;
  }

  targetForm.client_system_id = generatePrefixedIdentifier(preset.prefix);
}

function applyWorkOrderPreset(presetValue, targetForm = form.value) {
  const preset = findPreset(workOrderPresetOptions, presetValue);

  if (!preset || preset.mode === 'custom') {
    return;
  }

  if (preset.mode === 'mirror') {
    targetForm.work_order = targetForm.client_system_id || '';
    return;
  }

  targetForm.work_order = generatePrefixedIdentifier(preset.prefix);
}

function buildPayload(sendNow) {
  const workOrderValue =
    form.value.work_order_preset === 'mirror'
      ? form.value.client_system_id || null
      : form.value.work_order || null;

  const payload = {
    label: form.value.label || null,
    notes: form.value.notes || null,
    tech_name: form.value.tech_name || null,
    tech_phone: form.value.tech_phone || null,
    visit_date: form.value.visit_date || null,
    visit_time: normalizeTime(form.value.visit_time) || null,
    timezone: form.value.timezone || null,
    location_name: form.value.location_name || null,
    address: form.value.address || null,
    company: form.value.company || DEFAULT_COMPANY,
    work_order: workOrderValue,
    tools_required: form.value.tools_required || null,
    send_now: sendNow
  };

  if (!form.value.id) {
    payload.client_system_id = form.value.client_id_preset === 'auto' ? null : form.value.client_system_id || null;
  }

  return payload;
}

function populateForm(testCall) {
  if (!testCall) {
    return;
  }

  form.value = {
    id: testCall.id || null,
    scenario_preset: inferScenarioPreset(testCall.label),
    visit_day_preset: inferVisitDayPreset(testCall.appointment?.visit_date),
    company_preset: inferCompanyPreset(testCall.company),
    technician_preset: inferTechnicianPreset(testCall.technician?.name),
    location_preset: inferLocationPreset(testCall.location?.name, testCall.location?.address),
    work_order_preset: inferWorkOrderPreset(testCall.work_order, testCall.client_system_id),
    client_id_preset: inferClientIdPreset(testCall.client_system_id),
    manual_overrides: false,
    label: testCall.label || '',
    notes: testCall.notes || '',
    tech_name: testCall.technician?.name || '',
    tech_phone: testCall.technician?.phone || '',
    visit_date: testCall.appointment?.visit_date || '',
    visit_time: normalizeTime(testCall.appointment?.visit_time || ''),
    timezone: testCall.appointment?.timezone || DEFAULT_TIMEZONE,
    location_name: testCall.location?.name || '',
    address: testCall.location?.address || '',
    company: testCall.company || DEFAULT_COMPANY,
    work_order: testCall.work_order || '',
    tools_required: formatToolsText(testCall.tools?.resolved || '') || '',
    client_system_id: testCall.client_system_id || ''
  };

  form.value.manual_overrides = hasCustomSelections(form.value);
  selectedOffsetMinutes.value = null;
}

function inferScenarioPreset(label) {
  const match = scenarioOptions.find((option) => option.resolvedLabel === label);
  return match?.value || 'custom';
}

function inferVisitDayPreset(visitDate) {
  if (!visitDate) {
    return 'custom';
  }

  const today = new Date();

  for (const option of visitDayOptions) {
    if (option.value === 'custom') {
      continue;
    }

    const candidate = addDays(today, option.offsetDays);

    if (formatDateInput(candidate, DEFAULT_TIMEZONE) === visitDate) {
      return option.value;
    }
  }

  return 'custom';
}

function inferCompanyPreset(company) {
  const match = companyPresetOptions.find((option) => option.resolvedValue === company);
  return match?.value || 'custom';
}

function inferTechnicianPreset(name) {
  const match = technicianPresetOptions.find((option) => option.resolvedValue === name);
  return match?.value || 'custom';
}

function inferLocationPreset(name, address) {
  const match = locationPresetOptions.find((option) => option.resolvedName === name && option.resolvedAddress === address);
  return match?.value || 'custom';
}

function inferWorkOrderPreset(workOrder, clientSystemId) {
  if (!workOrder) {
    return 'mirror';
  }

  if (clientSystemId && workOrder === clientSystemId) {
    return 'mirror';
  }

  const prefixMatch = workOrderPresetOptions.find((option) => option.prefix && workOrder.startsWith(option.prefix));
  return prefixMatch?.value || 'custom';
}

function inferClientIdPreset(clientSystemId) {
  if (!clientSystemId) {
    return 'auto';
  }

  const prefixMatch = clientIdPresetOptions.find((option) => option.prefix && clientSystemId.startsWith(option.prefix));
  return prefixMatch?.value || 'custom';
}

function hasCustomSelections(targetForm) {
  return [
    targetForm.scenario_preset,
    targetForm.visit_day_preset,
    targetForm.company_preset,
    targetForm.technician_preset,
    targetForm.location_preset,
    targetForm.work_order_preset,
    targetForm.client_id_preset
  ].includes('custom');
}

function syncFilterDraft() {
  filterDraft.value = {
    search: store.filters.search,
    syncStatuses: [...store.filters.syncStatuses],
    callStatuses: [...store.filters.callStatuses],
    readyToPush: store.filters.readyToPush
  };
}

function showToast(severity, summary, detail, life = 4000) {
  toast.add({
    severity,
    summary,
    detail,
    life
  });
}

function formatStatus(value) {
  return String(value || 'unknown')
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(' ');
}

function formatInlineReasons(call) {
  const reasons = formatReadinessReasons(call);
  return reasons.join(', ') || 'No blockers';
}

function formatTimestamp(value) {
  if (!value) {
    return 'Never';
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  }).format(new Date(value));
}

function formatJson(value) {
  return JSON.stringify(value || {}, null, 2);
}

function syncSeverity(status) {
  const severityMap = {
    not_ready: 'danger',
    ready: 'success',
    sent: 'info',
    needs_update: 'warning',
    push_failed: 'danger'
  };

  return severityMap[status] || 'secondary';
}

function callSeverity(status) {
  const severityMap = {
    awaiting_call: 'warning',
    completed: 'success',
    transferred: 'info',
    failed: 'danger',
    unknown: 'secondary'
  };

  return severityMap[status] || 'secondary';
}

async function refreshRows() {
  try {
    await store.loadRows();
  } catch (refreshError) {
    showToast('error', 'Refresh failed', refreshError.message || 'Unable to refresh sandbox test calls.');
  }
}

async function applyFilters() {
  try {
    store.updateFilters({
      search: filterDraft.value.search,
      syncStatuses: [...filterDraft.value.syncStatuses],
      callStatuses: [...filterDraft.value.callStatuses],
      readyToPush: filterDraft.value.readyToPush
    });
    await store.loadRows();
  } catch (filterError) {
    showToast('error', 'Filters failed', filterError.message || 'Unable to apply sandbox filters.');
  }
}

async function clearFilters() {
  try {
    store.clearFilters();
    syncFilterDraft();
    await store.loadRows();
  } catch (clearError) {
    showToast('error', 'Clear failed', clearError.message || 'Unable to clear sandbox filters.');
  }
}

async function handlePage(event) {
  try {
    store.updatePagination({
      page: event.page + 1,
      perPage: event.rows
    });
    await store.loadRows();
  } catch (pageError) {
    showToast('error', 'Pagination failed', pageError.message || 'Unable to load the requested test-call page.');
  }
}

async function handleRowClick(event) {
  const target = event.originalEvent?.target;

  if (target?.closest('button') || target?.closest('a') || target?.closest('.p-menu')) {
    return;
  }

  await loadCallIntoForm(event.data, false);
}

async function loadCallIntoForm(call, scrollToTop) {
  try {
    populateForm(call);
    await store.loadDetail(call.id);
    populateForm(store.selectedTestCall || call);

    if (scrollToTop) {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  } catch (detailError) {
    showToast('error', 'Detail failed', detailError.message || 'Unable to load the selected test call.');
  }
}

async function submitForm(sendNow) {
  try {
    normalizeTimeField();

    const payload = buildPayload(sendNow);
    let response;

    if (form.value.id) {
      response = await store.updateTestCall(form.value.id, payload);
    } else {
      response = await store.createTestCall(payload);
    }

    populateForm(store.selectedTestCall || null);
    showToast(
      'success',
      sendNow ? 'Sandbox send submitted' : isEditingExisting.value ? 'Test call updated' : 'Test call created',
      response.message || (sendNow ? 'Test call was created and sent to DPROMPT.' : 'Sandbox test call was saved.'),
      3500
    );
  } catch (submitError) {
    showToast('error', 'Save failed', submitError.message || 'Unable to save the sandbox test call.', 4500);
  }
}

function resetForm(clearSelection) {
  form.value = createDefaultForm();
  selectedOffsetMinutes.value = 5;
  forceSend.value = false;

  if (clearSelection) {
    store.selectedTestCallId = null;
    store.selectedTestCallDetail = null;
    store.selectedTestCallActivity = [];
    timelineVisible.value = false;
  }
}

function handleOffsetChange(offset) {
  if (!offset) {
    return;
  }

  applyScheduledFields(form.value, offset);
}

function handleScenarioChange(value) {
  applyScenarioPreset(value);
}

function handleVisitDayChange() {
  applyScheduledFields(form.value, selectedOffsetMinutes.value);
}

function handleTimezoneChange() {
  if (form.value.visit_day_preset !== 'custom') {
    applyScheduledFields(form.value, selectedOffsetMinutes.value);
  }
}

function handleCompanyChange(value) {
  applyCompanyPreset(value);
}

function handleTechnicianChange(value) {
  applyTechnicianPreset(value);
}

function handleLocationChange(value) {
  applyLocationPreset(value);
  if (form.value.visit_day_preset !== 'custom') {
    applyScheduledFields(form.value, selectedOffsetMinutes.value);
  }
}

function handleClientIdPresetChange(value) {
  if (isEditingExisting.value) {
    return;
  }

  applyClientIdPreset(value);

  if (form.value.work_order_preset === 'mirror') {
    applyWorkOrderPreset(form.value.work_order_preset);
  }
}

function handleWorkOrderPresetChange(value) {
  applyWorkOrderPreset(value);
}

async function sendCall(call) {
  try {
    await store.sendTestCall(call.id, forceSend.value);
    showToast('success', 'Sandbox send submitted', 'The test call was sent to DPROMPT.', 3000);
  } catch (sendError) {
    showToast('error', 'Send failed', sendError.message || 'Unable to send the selected test call.', 4500);
  }
}

async function sendSelectedCall() {
  if (!selectedCall.value) {
    return;
  }

  await sendCall(selectedCall.value);
}

async function refreshStatuses(testCallIds = null) {
  try {
    const response = await store.refreshStatuses(testCallIds);
    showToast(
      'success',
      'Status refresh complete',
      response.message || 'Sandbox call statuses were refreshed.',
      3000
    );
  } catch (refreshError) {
    showToast('error', 'Status refresh failed', refreshError.message || 'Unable to refresh sandbox call statuses.', 4500);
  }
}

async function refreshSelectedStatus() {
  if (!selectedCall.value) {
    return;
  }

  await refreshStatuses([selectedCall.value.id]);
}

async function openTimeline(call) {
  try {
    populateForm(call);
    await Promise.all([store.loadDetail(call.id), store.loadActivity(call.id)]);
    populateForm(store.selectedTestCall || call);
    timelineVisible.value = true;
  } catch (timelineError) {
    showToast('error', 'Timeline failed', timelineError.message || 'Unable to load sandbox activity.', 4500);
  }
}

async function refreshTimeline() {
  if (!selectedCall.value) {
    return;
  }

  try {
    await store.loadActivity(selectedCall.value.id);
  } catch (timelineError) {
    showToast('error', 'Timeline refresh failed', timelineError.message || 'Unable to refresh sandbox activity.', 4500);
  }
}

function toggleActionMenu(event, call) {
  currentActionCall.value = call;
  actionMenu.value?.toggle(event);
}

function openExternal(url) {
  if (!url) {
    return;
  }

  window.open(url, '_blank', 'noopener,noreferrer');
}

async function confirmDelete(call) {
  if (!call) {
    return;
  }

  const confirmed = window.confirm(`Delete sandbox test call ${call.client_system_id || call.id}?`);

  if (!confirmed) {
    return;
  }

  try {
    await store.deleteTestCall(call.id);

    if (String(form.value.id) === String(call.id)) {
      resetForm(true);
    }

    showToast('success', 'Test call deleted', 'The sandbox test call and its activity were removed.', 3000);
  } catch (deleteError) {
    showToast('error', 'Delete failed', deleteError.message || 'Unable to delete the sandbox test call.', 4500);
  }
}

function rowClass(data) {
  return String(data.id) === String(store.selectedTestCallId || '') ? 'call-operations-testing__row-selected' : '';
}
</script>

<style scoped>
.call-operations-testing {
  @apply space-y-6;
}

.call-operations-testing__form-header,
.call-operations-testing__grid-header,
.call-operations-testing__detail-header {
  @apply flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between mb-6;
}

.call-operations-testing__form-actions,
.call-operations-testing__grid-actions,
.call-operations-testing__detail-actions {
  @apply flex flex-wrap items-center gap-3;
}

.call-operations-testing__force-toggle {
  @apply inline-flex items-center gap-2 rounded-full border border-surface-200 px-4 py-2 text-sm text-surface-700 dark:border-surface-700 dark:text-surface-200;
}

.call-operations-testing__form-grid {
  @apply grid gap-4 md:grid-cols-2 xl:grid-cols-4;
}

.call-operations-testing__preset-preview {
  @apply mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4;
}

.call-operations-testing__preview-label {
  @apply text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-surface-500;
}

.call-operations-testing__preview-value {
  @apply mt-1 rounded-2xl border border-surface-200 bg-surface-50 px-4 py-3 text-sm font-medium text-surface-800 dark:border-surface-700 dark:bg-surface-900 dark:text-surface-100;
}

.call-operations-testing__manual-toggle {
  @apply mt-6 inline-flex items-center gap-2 rounded-full border border-surface-200 px-4 py-2 text-sm text-surface-700 dark:border-surface-700 dark:text-surface-200;
}

.call-operations-testing__manual-grid {
  @apply mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4;
}

.call-operations-testing__field {
  @apply flex flex-col gap-2;
}

.call-operations-testing__field--wide {
  @apply md:col-span-2;
}

.call-operations-testing__label {
  @apply text-xs font-semibold uppercase tracking-[0.18em] text-surface-500;
}

.call-operations-testing__detail-grid {
  @apply grid gap-4 md:grid-cols-2;
}

.call-operations-testing__detail-span-2 {
  @apply md:col-span-2;
}

.call-operations-testing__detail-empty {
  @apply flex flex-col items-center justify-center rounded-2xl border border-dashed border-surface-300 py-14 text-center dark:border-surface-700;
}

.call-operations-testing__payload-preview {
  @apply overflow-x-auto rounded-2xl bg-surface-950/95 p-4 text-xs leading-6 text-surface-0;
}

:deep(.call-operations-testing__grid .p-datatable-tbody > tr.call-operations-testing__row-selected > td) {
  @apply bg-primary-50 dark:bg-primary-950/30;
}

:deep(.call-operations-testing__grid .p-datatable-thead > tr > th:last-child),
:deep(.call-operations-testing__grid .p-datatable-tbody > tr > td:last-child) {
  @apply bg-surface-0 dark:bg-surface-900;
}
</style>
