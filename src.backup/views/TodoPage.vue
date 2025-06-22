<script setup>
import Todo from '@/components/Todo.vue';
import { useMeta } from '@/composables/useMeta';

useMeta('Todo List');
</script>

<template>
    <div class="grid">
        <div class="col-12">
            <div class="card">
                <h5>Todo List</h5>
                <p>Manage your tasks and stay organized.</p>
                <Todo />
            </div>
        </div>
    </div>
</template> 