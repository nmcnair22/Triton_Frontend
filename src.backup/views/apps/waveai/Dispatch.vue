<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const comments = ref([
    {
        image: '/demo/images/avatar/circle/avatar-f-3@2x.png',
        name: 'Jordan Williams',
        date: '18 May 2023',
        description: 'The automated dispatch system has cut our response times in half.'
    },
    {
        image: '/demo/images/avatar/circle/avatar-f-1@2x.png',
        name: 'Raj Patel',
        date: '17 May 2023',
        description: 'How does the system handle resource allocation during peak demand periods?'
    },
    {
        image: '/demo/images/avatar/circle/avatar-f-4@2x.png',
        name: 'Leila Chen',
        date: '16 May 2023',
        description: 'The integration with our existing ticketing system was seamless.'
    },
    {
        image: '/demo/images/avatar/circle/avatar-f-5@2x.png',
        name: 'Michael Stone',
        date: '15 May 2023',
        description: 'Our field technicians love the mobile app for real-time updates and navigation.'
    }
]);
</script>

<template>
    <div class="card">
        <div class="flex justify-between flex-col-reverse md:flex-row items-center">
            <div>
                <div class="text-xl text-surface-900 dark:text-surface-0 mb-6 mt-6 md:mt-0 text-center md:text-left font-semibold md:pr-6">AI-Powered Service Dispatch System</div>
                <div class="flex flex-wrap justify-center md:justify-start gap-4">
                    <span class="inline-flex items-center py-2 px-4 font-medium border border-surface-200 dark:border-surface-700 rounded">
                        <i class="pi pi-clock text-primary mr-2" />
                        <span class="text-surface-900 dark:text-surface-0">Updated 2d ago</span>
                    </span>
                    <span class="inline-flex items-center py-2 px-4 font-medium border border-surface-200 dark:border-surface-700 rounded">
                        <i class="pi pi-comments text-primary mr-2" />
                        <span class="text-surface-900 dark:text-surface-0">36</span>
                    </span>
                    <span class="inline-flex items-center py-2 px-4 font-medium border border-surface-200 dark:border-surface-700 rounded">
                        <i class="pi pi-eye text-primary mr-2" />
                        <span class="text-surface-900 dark:text-surface-0">248</span>
                    </span>
                </div>
            </div>
            <div class="flex flex-col items-center justify-center">
                <img class="w-16 h-16" src="/demo/images/avatar/circle/avatar-m-1.png" alt="Avatar" />
                <span class="mt-4 font-bold text-surface-900 dark:text-surface-0 text-center whitespace-nowrap">Daniel Rivera</span>
            </div>
        </div>
        <div class="text-center my-12">
            <img src="/demo/images/blog/blogdetail.png" alt="Dispatch System" class="w-full" />
        </div>
        <div class="text-2xl text-surface-900 dark:text-surface-0 mb-6 font-semibold">Revolutionizing Field Service Operations with Smart Dispatch</div>
        <p class="leading-normal text-lg mb-6">
            Our AI-powered Dispatch System transforms how organizations manage field service operations. By intelligently analyzing service requests, technician skills, location data, and real-time traffic conditions, the system optimizes resource allocation to maximize efficiency and customer satisfaction.
        </p>
        <p class="leading-normal text-lg mb-6">The platform's machine learning algorithms continuously improve dispatch decisions based on historical performance data, adapting to changing conditions and organizational needs.</p>
        <p class="leading-normal text-lg mb-6">
            Field technicians receive optimized route planning, comprehensive customer history, and technical documentation directly on their mobile devices, empowering them to resolve issues more effectively on the first visit.
        </p>
        <p class="leading-normal text-lg mb-6">
            Customers benefit from accurate arrival time predictions, real-time technician tracking, and automated communications that keep them informed throughout the service process.
        </p>
        <div class="text-2xl text-surface-900 dark:text-surface-0 mb-6 font-semibold">Key Features of the Smart Dispatch System</div>
        <ul class="text-xl p-0 my-0 ml-8">
            <li class="mb-4 leading-normal">Intelligent resource matching based on skills, proximity, and availability</li>
            <li class="mb-4 leading-normal">Dynamic route optimization that adapts to changing traffic and weather conditions</li>
            <li class="mb-4 leading-normal">Predictive analytics for proactive maintenance scheduling</li>
            <li class="leading-normal">Real-time performance dashboards with actionable insights</li>
        </ul>
        <div class="flex flex-col sm:flex-row my-20 w-full gap-4">
            <Button icon="pi pi-twitter" severity="secondary" label="Twitter" />
            <Button icon="pi pi-facebook" severity="secondary" label="Facebook" />
            <Button icon="pi pi-linkedin" severity="secondary" label="LinkedIn" class="sm:ml-auto" />
        </div>
        <div class="flex items-center mb-6 font-bold">
            <span class="text-xl text-surface-900 dark:text-surface-0 mr-6">Comments</span>
            <span class="inline-flex items-center justify-center w-8 h-8 border border-surface-200 dark:border-surface-700 rounded">{{ comments.length }}</span>
        </div>
        <ul class="list-none p-0 m-0">
            <li v-for="(comment, i) in comments" :key="{ i }" class="flex p-4 mb-4 border border-surface-200 dark:border-surface-700 rounded">
                <img :src="comment.image" class="w-12 h-12 mr-4 flex-shrink-0" :alt="'Image' + i" />
                <div>
                    <span class="font-semibold text-surface-900 dark:text-surface-0">{{ comment.name }}</span>
                    <p class="font-semibold text-surface-600 dark:text-surface-200 m-0 text-sm">{{ comment.date }}</p>
                    <p class="leading-normal mb-0 my-4">{{ comment.description }}</p>
                </div>
            </li>
        </ul>
        <div class="text-xl text-surface-900 dark:text-surface-0 mb-6 font-bold mt-20">Post a Comment</div>

        <Fluid class="mb-4">
            <IconField>
                <InputIcon class="pi pi-user" />
                <InputText type="text" placeholder="Name" />
            </IconField>
        </Fluid>
        <Fluid class="mb-4">
            <IconField>
                <InputIcon class="pi pi-envelope" />
                <InputText type="text" placeholder="Email" />
            </IconField>
        </Fluid>
        <Fluid class="mb-4">
            <Textarea :rows="6" placeholder="Your comment" />
        </Fluid>
        <div class="flex justify-end">
            <Button label="Post Comment" />
        </div>
    </div>
</template> 