<script setup>
import { ref } from 'vue';

const sortOrder = ref(-1);
const sortOptions = [
    { label: 'Most Shared', value: 'share' },
    { label: 'Most Commented', value: 'comment' }
];
const totalBlogs = ref([
    {
        coverImage: '/demo/images/blog/blog-1.png',
        profile: '/demo/images/avatar/circle/avatar-f-1.png',
        title: 'Network News',
        description: 'Ornare egestas pellentesque facilisis in a ultrices erat diam metus integer sed',
        comment: 2,
        share: 7,
        day: '15',
        month: 'October'
    },
    {
        coverImage: '/demo/images/blog/blog-2.png',
        profile: '/demo/images/avatar/circle/avatar-f-2.png',
        title: 'WaveAI',
        description: 'Magna iaculis sagittis, amet faucibus scelerisque non ornare non in penatibus ',
        comment: 5,
        share: 1,
        day: '20',
        month: 'Nov'
    },
    {
        coverImage: '/demo/images/blog/blog-3.png',
        profile: '/demo/images/avatar/circle/avatar-m-1.png',
        title: 'Technology',
        description: 'Purus mattis mi, libero maecenas volutpat quis a morbi arcu pharetra, mollis',
        comment: 2,
        share: 6,
        day: '23',
        month: 'Oct'
    },
    {
        coverImage: '/demo/images/blog/blog-4.png',
        profile: '/demo/images/avatar/circle/avatar-m-1.png',
        title: 'Network News',
        description: 'Curabitur vitae sit justo facilisi nec, sodales proin aliquet libero volutpat nunc',
        comment: 5,
        share: 5,
        day: '14',
        month: 'Dec'
    },
    {
        coverImage: '/demo/images/blog/blog-5.png',
        profile: '/demo/images/avatar/circle/avatar-f-3.png',
        title: 'WaveAI',
        description: 'Id eget arcu suspendisse ullamcorper dolor lobortis dui et morbi penatibus quam',
        comment: 4,
        share: 1,
        day: '05',
        month: 'Apr'
    },
    {
        coverImage: '/demo/images/blog/blog-6.png',
        profile: '/demo/images/avatar/circle/avatar-m-3.png',
        title: 'Technology',
        description: 'Sagittis hendrerit laoreet dignissim sed auctor sit pellentesque vel diam iaculis et',
        comment: 1,
        share: 3,
        day: '12',
        month: 'Nov'
    }
]);
const sortField = ref(null);
const sortKey = ref(null);

function onSortChange(event) {
    const value = event.value.value;
    const sortValue = event.value;

    if (value.indexOf('!') === 0) {
        sortOrder.value = 1;
        sortField.value = value.substring(1, value.length);
        sortKey.value = sortValue;
    } else {
        sortOrder.value = -1;
        sortField.value = value;
        sortKey.value = sortValue;
    }
}
</script>

<template>
    <div class="card">
        <DataView :value="totalBlogs" paginator :rows="3" layout="grid" :sortOrder="sortOrder" :sortField="sortField">
            <template #header>
                <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <span class="text-xl text-surface-900 dark:text-surface-0 font-semibold">Front Page Stories</span>
                    <Select v-model="sortKey" :options="sortOptions" optionLabel="label" placeholder="Sort By" class="w-full md:w-60" @change="onSortChange($event)" />
                </div>
            </template>
            <template #grid="slotProps">
                <div class="grid grid-cols-12 gap-4 grid-nogutter">
                    <div v-for="(item, index) in slotProps.items" :key="index" class="col-span-12 md:col-span-4">
                        <div class="p-4">
                            <div class="bg-surface-100 dark:bg-surface-700 cursor-pointer z-index rounded">
                                <div class="relative">
                                    <img :src="item.coverImage" class="w-full" :alt="item.description.split(' ', 1)" />
                                    <img :src="item.profile" class="flex absolute w-16 h-16" :style="{ bottom: '-1.5rem', right: '1.5rem' }" :alt="item.description.split(' ', 1)" />
                                </div>
                                <div class="p-4">
                                    <div class="text-surface-900 dark:text-surface-0 font-semibold text-xl mb-4">{{ item.title }}</div>
                                    <p class="text-surface-700 dark:text-surface-100 text-lg mt-0 mb-8">{{ item.description }}</p>
                                    <div class="flex flex-wrap gap-2 items-center justify-between">
                                        <span class="flex items-center text-surface-900 dark:text-surface-0">
                                            <i class="pi pi-comment mr-2" />
                                            <span class="font-semibold">{{ item.comment }}</span>
                                        </span>
                                        <span class="flex items-center text-surface-900 dark:text-surface-0">
                                            <i class="pi pi-share-alt mr-2" />
                                            <span class="font-semibold">{{ item.share }}</span>
                                        </span>
                                        <span class="flex items-center text-surface-900 dark:text-surface-0">
                                            <i class="pi pi-clock mr-2" />
                                            <span class="font-semibold mr-1">{{ item.day }}</span>
                                            <span class="font-semibold">{{ item.month }}</span>
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </template>
        </DataView>
    </div>

    <div class="card">
        <div class="px-6 py-20 md:px-12 lg:px-20">
            <div class="font-bold text-5xl text-surface-900 dark:text-surface-0 mb-4">Featured News</div>
            <div class="text-surface-700 dark:text-surface-100 text-xl leading-normal mb-8">Stay informed with the latest updates and breaking stories from our network.</div>
            <div class="grid grid-cols-12 gap-4 nogutter">
                <div class="col-span-12 lg:col-span-4 p-6">
                    <div class="border-t-4 border-blue-600" />
                    <div class="text-blue-600 font-medium my-2">Technology</div>
                    <div class="text-surface-900 dark:text-surface-0 font-medium text-xl leading-normal mb-6">Breakthrough in quantum computing promises faster data processing</div>
                    <div class="font-sm text-surface-700 dark:text-surface-100 leading-normal">Scientists have demonstrated a new quantum processor that shows significant improvements in stability and processing power.</div>
                    <div class="flex mt-6">
                        <Avatar image="/demo/images/avatar/circle/avatar-f-1.png" shape="circle" />
                        <div class="ml-2">
                            <div class="text-xs font-bold text-surface-900 dark:text-surface-0 mb-1">Sarah Chen</div>
                            <div class="text-xs flex items-center text-surface-700 dark:text-surface-100">
                                <i class="pi pi-calendar mr-1 text-xs" />
                                <span>May 12, 2023</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-span-12 lg:col-span-4 p-6">
                    <div class="border-t-4 border-pink-600" />
                    <div class="text-pink-600 font-medium my-2">Innovation</div>
                    <div class="text-surface-900 dark:text-surface-0 font-medium text-xl leading-normal mb-6">New neural network models achieve human-like reasoning capabilities</div>
                    <div class="font-sm text-surface-700 dark:text-surface-100 leading-normal">Researchers have developed AI systems that can understand context and make logical inferences similarly to humans.</div>
                    <div class="flex mt-6">
                        <Avatar image="/demo/images/avatar/circle/avatar-f-2.png" shape="circle" />
                        <div class="ml-2">
                            <div class="text-xs font-bold text-surface-900 dark:text-surface-0 mb-1">Marcus Johnson</div>
                            <div class="text-xs flex items-center text-surface-700 dark:text-surface-100">
                                <i class="pi pi-calendar mr-1 text-xs" />
                                <span>May 14, 2023</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-span-12 lg:col-span-4 p-6">
                    <div class="border-t-4 border-orange-600" />
                    <div class="text-orange-600 font-medium my-2">Business</div>
                    <div class="text-surface-900 dark:text-surface-0 font-medium text-xl leading-normal mb-6">WaveAI secures major partnership with global tech leaders</div>
                    <div class="font-sm text-surface-700 dark:text-surface-100 leading-normal">Strategic alliances formed with industry giants to accelerate development of next-generation AI technologies.</div>
                    <div class="flex mt-6">
                        <Avatar image="/demo/images/avatar/circle/avatar-f-3.png" shape="circle" />
                        <div class="ml-2">
                            <div class="text-xs font-bold text-surface-900 dark:text-surface-0 mb-1">Elena Rodriguez</div>
                            <div class="text-xs flex items-center text-surface-700 dark:text-surface-100">
                                <i class="pi pi-calendar mr-1 text-xs" />
                                <span>May 15, 2023</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template> 