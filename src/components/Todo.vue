<script setup>
import { ref, onMounted } from 'vue';
import Button from 'primevue/button';
import Checkbox from 'primevue/checkbox';
import InputText from 'primevue/inputtext';
import Card from 'primevue/card';
import Message from 'primevue/message';

const tasks = ref([]);
const newTask = ref('');
const error = ref('');

// Load tasks from localStorage
onMounted(() => {
  const savedTasks = localStorage.getItem('tasks');
  if (savedTasks) {
    tasks.value = JSON.parse(savedTasks);
  }
});

// Save tasks to localStorage
const saveTasks = () => {
  localStorage.setItem('tasks', JSON.stringify(tasks.value));
};

// Add a new task
const addTask = () => {
  if (!newTask.value.trim()) {
    error.value = 'Task cannot be empty';
    return;
  }
  
  error.value = '';
  tasks.value.push({
    id: Date.now(),
    text: newTask.value,
    completed: false,
    createdAt: new Date().toISOString()
  });
  newTask.value = '';
  saveTasks();
};

// Mark task as complete/incomplete
const toggleComplete = (task) => {
  task.completed = !task.completed;
  saveTasks();
};

// Delete a task
const deleteTask = (taskId) => {
  tasks.value = tasks.value.filter(task => task.id !== taskId);
  saveTasks();
};

// Handle key press (Enter to add)
const handleKeyPress = (event) => {
  if (event.key === 'Enter') {
    addTask();
  }
};
</script>

<template>
  <Card class="w-full max-w-3xl mx-auto">
    <template #title>
      <div class="flex items-center">
        <i class="pi pi-check-square text-primary-500 mr-2"></i>
        <span class="text-xl font-semibold">Todo List</span>
      </div>
    </template>
    
    <template #content>
      <div class="flex flex-col gap-4">
        <!-- Add new task form -->
        <div class="flex gap-2">
          <InputText 
            v-model="newTask" 
            placeholder="Add a new task..." 
            class="flex-1"
            @keypress="handleKeyPress" />
          <Button 
            icon="pi pi-plus" 
            severity="primary" 
            @click="addTask" />
        </div>
        
        <!-- Error message -->
        <Message v-if="error" severity="error" :closable="false" class="w-full">{{ error }}</Message>
        
        <!-- Task list -->
        <div class="flex flex-col gap-2">
          <div 
            v-for="task in tasks" 
            :key="task.id"
            class="flex items-center gap-3 p-3 border border-surface-200 dark:border-surface-700 rounded bg-surface-50 dark:bg-surface-800 hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
            :class="{'opacity-75': task.completed}"
          >
            <Checkbox 
              v-model="task.completed" 
              :binary="true"
              @change="() => toggleComplete(task)" />
            
            <span 
              class="flex-1"
              :class="{'line-through text-surface-400 dark:text-surface-500': task.completed}"
            >
              {{ task.text }}
            </span>
            
            <Button 
              icon="pi pi-trash" 
              text
              severity="danger"
              @click="() => deleteTask(task.id)" />
          </div>
          
          <!-- Empty state -->
          <div 
            v-if="tasks.length === 0" 
            class="flex flex-col items-center justify-center py-8 text-surface-500 dark:text-surface-400"
          >
            <i class="pi pi-inbox text-4xl mb-2"></i>
            <p>Your todo list is empty</p>
            <p class="text-sm">Add a task to get started</p>
          </div>
        </div>
      </div>
    </template>
  </Card>
</template> 