<script setup>
import { FilterMatchMode } from '@primevue/core/api';
import { onBeforeUnmount, onMounted, onUpdated, ref } from 'vue';
import { useRouter } from 'vue-router';

const emit = defineEmits(['spam', 'archive', 'trash', 'change:mail:type', 'reply']);

defineProps({
    mails: {
        type: Array
    }
});

const router = useRouter();
const menuRef = ref(null);
const mailTable = ref(null);
const selectedMails = ref([]);
const menuItems = ref([
    { label: 'Archive', icon: 'pi pi-file', command: () => onSelectedMailsAction('archive') },
    { label: 'Spam', icon: 'pi pi-ban', command: () => onSelectedMailsAction('spam') },
    { label: 'Delete', icon: 'pi pi-trash', command: () => onSelectedMailsAction('trash') }
]);
const filterTable = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});

onMounted(() => {
    setEventListenersOnRow('addEventListener');
});

onUpdated(async () => {
    await setEventListenersOnRow('removeEventListener');
    await setEventListenersOnRow('addEventListener');
});

onBeforeUnmount(() => {
    setEventListenersOnRow('addEventListener');
});

function setEventListenersOnRow(type) {
    const mailRowsRefs = [...mailTable.value.$el.querySelectorAll('tbody > tr')];

    mailRowsRefs.forEach((mailRow) => {
        mailRow[type]('mouseenter', (event) => actionButtonToggle(event, mailRow));
        mailRow[type]('mouseleave', (event) => actionButtonToggle(event, mailRow));
    });
}

function actionButtonToggle(event, mailRow) {
    const actionButtonsRef = mailRow.querySelector('.action-buttons');
    const dateRef = mailRow.querySelector('.date-text');

    if (!actionButtonsRef || !dateRef) return;

    if (event.type === 'mouseenter') {
        actionButtonsRef.style.display = 'flex';
        dateRef.style.display = 'none';
    } else {
        actionButtonsRef.style.display = 'none';
        dateRef.style.display = 'flex';
    }
}

function onSelectedMailsAction(emitType) {
    if (selectedMails.value.length !== 0) {
        for (const mail of selectedMails.value) {
            clearMaileActions(mail);
        }

        emit(emitType, selectedMails.value);
        selectedMails.value = [];
    }
}

function onSingleMailAction(emitType, mail) {
    clearMaileActions(mail);

    emit(emitType, mail);

    selectedMails.value = [];
}

function changeMailType(mailType, mail) {
    emit('change:mail:type', mailType, mail, !mail[mailType]);
}

function onReplyMail(mail) {
    emit('reply', mail);
}

function onNavigateToDetailPage(id) {
    router.push({ name: 'mail-detail', params: { id } });
}

function clearMaileActions(mail) {
    Object.keys(mail).forEach((key) => {
        if (mail[key] === true) {
            mail[key] = false;
        }
    });
}
</script>

<template>
    <DataTable ref="mailTable" :value="mails" v-model:selection="selectedMails" v-model:filters="filterTable" :rows="10" paginator :rowsPerPageOptions="[10, 20, 30]" dataKey="id" rowHover :globalFilterFields="['from', 'to', 'title', 'message']">
        <Column selectionMode="multiple" style="width: 4rem" />
        <Column style="width: 8rem">
            <template #header>
                <div class="flex -ml-2">
                    <Button type="button" icon="pi pi-refresh" text plain rounded />
                    <Button type="button" icon="pi pi-ellipsis-v" class="ml-4" text plain rounded @click="menuRef.toggle($event)" />
                    <Menu ref="menuRef" popup :model="menuItems" class="w-32" />
                </div>
                <div />
            </template>
            <template #body="{ data }">
                <td class="w-16">
                    <span v-if="!data.trash && !data.spam" class="cursor-pointer" @click="changeMailType('starred', data)">
                        <i class="pi pi-fw text-xl" :class="{ 'pi-star-fill': data.starred, 'pi-star': !data.starred }" />
                    </span>
                    <span v-if="data.spam" class="cursor-pointer">
                        <i class="pi pi-fw pi-exclamation-triangle text-xl" />
                    </span>
                    <span v-if="data.trash" class="cursor-pointer">
                        <i class="pi pi-fw pi-trash text-xl" />
                    </span>
                </td>
                <td v-if="!data.trash && !data.spam" class="w-16">
                    <span class="cursor-pointer ml-4" @click="changeMailType('important', data)">
                        <i class="pi pi-fw text-xl" :class="{ 'pi-bookmark-fill': data.important, 'pi-bookmark': !data.important }" />
                    </span>
                </td>
            </template>
        </Column>
        <Column style="min-width: 4rem">
            <template #body="{ data }">
                <Avatar v-if="!data.image" icon="pi pi-user" shape="circle" />
                <Avatar v-else @click="onNavigateToDetailPage(data.id)" :id="data.id" :image="`/demo/images/avatar/${data.image ? data.image : '.png'}`" class="cursor-pointer" />
            </template>
        </Column>
        <Column style="min-width: 4rem">
            <template #body="{ data }">
                <div @click="onNavigateToDetailPage(data.id)" :style="{ minWidth: '12rem' }" class="text-surface-900 dark:text-surface-0 font-semibold cursor-pointer">{{ data.from || data.to }}</div>
            </template>
        </Column>
        <Column style="min-width: 30rem">
            <template #body="{ data }">
                <span @click="onNavigateToDetailPage(data.id)" class="font-medium whitespace-nowrap overflow-hidden text-ellipsis block cursor-pointer" style="max-width: 30rem">
                    {{ data.title }}
                </span>
            </template>
        </Column>
        <Column field="date">
            <template #header>
                <IconField class="w-full">
                    <InputIcon class="pi pi-search" />
                    <InputText type="text" placeholder="Search Mail" class="w-full sm:w-auto" v-model="filterTable.global.value" />
                </IconField>
            </template>
            <template #body="{ data }">
                <div :style="{ minWidth: '10rem' }">
                    <div class="flex justify-end w-full px-0">
                        <span ref="dateRef" class="date-text text-surface-700 dark:text-surface-100 font-semibold whitespace-nowrap">
                            {{ data.date }}
                        </span>
                        <div ref="actionRef" class="action-buttons" style="display: none">
                            <Button @click="onSingleMailAction('archive', data)" type="button" icon="pi pi-inbox" class="h-8 w-8 mr-2" v-tooltip.top="'Archive'" />
                            <Button @click="onReplyMail(data)" type="button" icon="pi pi-reply" class="h-8 w-8 mr-2" severity="secondary" v-tooltip.top="'Reply'" />
                            <Button @click="onSingleMailAction('trash', data)" type="button" v-tooltip.top="'Trash'" icon="pi pi-trash" class="h-8 w-8" severity="danger" />
                        </div>
                    </div>
                </div>
            </template>
        </Column>
    </DataTable>
</template>
