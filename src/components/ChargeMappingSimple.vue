<template>
  <div>
    <div class="grid grid-cols-2 gap-6">
      <!-- Left: Charge Types -->
      <Card>
        <template #title>Charge Types</template>
        <template #content>
          <div class="space-y-4">
            <div v-for="charge in chargeTypes" :key="charge.code" 
                 class="p-3 border rounded cursor-pointer hover:bg-gray-50"
                 :class="{'bg-blue-50 border-blue-500': selectedCharge?.code === charge.code}"
                 @click="selectedCharge = charge">
              <div class="font-bold">{{ charge.name }}</div>
              <div class="text-sm text-gray-600">{{ charge.code }}</div>
            </div>
          </div>
        </template>
      </Card>

      <!-- Right: What it covers -->
      <Card v-if="selectedCharge">
        <template #title>{{ selectedCharge.name }} Coverage</template>
        <template #content>
          <div class="space-y-4">
            <!-- Monitored Assets -->
            <div>
              <h4 class="font-bold mb-2">Monitored Assets:</h4>
              <div class="space-y-2">
                <Checkbox v-model="selectedCharge.covers.merakiMX" label="Meraki MX" />
                <Checkbox v-model="selectedCharge.covers.merakiMS" label="Meraki MS" />
                <Checkbox v-model="selectedCharge.covers.merakiMR" label="Meraki MR" />
                <Checkbox v-model="selectedCharge.covers.cradlepoint" label="Cradlepoint" />
              </div>
            </div>

            <!-- Unmonitored -->
            <div>
              <h4 class="font-bold mb-2">Unmonitored Elements:</h4>
              <div class="space-y-2">
                <Checkbox v-model="selectedCharge.covers.wiredCircuit" label="Wired Circuit" />
                <Checkbox v-model="selectedCharge.covers.cellularCircuit" label="Cellular Circuit" />
              </div>
            </div>

            <Button label="Save Mapping" @click="saveMapping" />
          </div>
        </template>
      </Card>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const selectedCharge = ref(null);

const chargeTypes = ref([
  { 
    code: 'TP', 
    name: 'TRANSPORT PRIMARY',
    covers: {
      merakiMX: true,
      merakiMS: false,
      merakiMR: false,
      cradlepoint: false,
      wiredCircuit: true,
      cellularCircuit: false
    }
  },
  { 
    code: 'TA', 
    name: 'TRANSPORT ADDITIONAL',
    covers: {
      merakiMX: false,
      merakiMS: false,
      merakiMR: false,
      cradlepoint: true,
      wiredCircuit: false,
      cellularCircuit: true
    }
  },
  { 
    code: 'LD', 
    name: 'LAN DEVICE',
    covers: {
      merakiMX: false,
      merakiMS: true,
      merakiMR: true,
      cradlepoint: false,
      wiredCircuit: false,
      cellularCircuit: false
    }
  }
]);

const saveMapping = () => {
  // Save to backend
  console.log('Saving:', selectedCharge.value);
};
</script>
