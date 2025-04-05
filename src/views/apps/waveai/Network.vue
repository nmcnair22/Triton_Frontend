<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const comments = ref([
    {
        image: '/demo/images/avatar/circle/avatar-f-3@2x.png',
        name: 'Samantha Powell',
        date: '15 May 2023',
        description: 'The network analytics dashboard provides excellent visibility into our systems.'
    },
    {
        image: '/demo/images/avatar/circle/avatar-f-1@2x.png',
        name: 'Thomas Wright',
        date: '14 May 2023',
        description: 'How does the new predictive maintenance feature work with existing infrastructure?'
    },
    {
        image: '/demo/images/avatar/circle/avatar-f-4@2x.png',
        name: 'Maria Chen',
        date: '13 May 2023',
        description: 'Implementation was seamless across our distributed network architecture.'
    },
    {
        image: '/demo/images/avatar/circle/avatar-f-5@2x.png',
        name: 'Kevin Patel',
        date: '12 May 2023',
        description: 'The edge computing capabilities have significantly reduced latency in our critical applications.'
    }
]);
</script>

<template>
    <div class="card">
        <div class="flex justify-between flex-col-reverse md:flex-row items-center">
            <div>
                <div class="text-xl text-surface-900 dark:text-surface-0 mb-6 mt-6 md:mt-0 text-center md:text-left font-semibold md:pr-6">Network Performance Analytics Dashboard</div>
                <div class="flex flex-wrap justify-center md:justify-start gap-4">
                    <span class="inline-flex items-center py-2 px-4 font-medium border border-surface-200 dark:border-surface-700 rounded">
                        <i class="pi pi-clock text-primary mr-2" />
                        <span class="text-surface-900 dark:text-surface-0">Updated 6h ago</span>
                    </span>
                    <span class="inline-flex items-center py-2 px-4 font-medium border border-surface-200 dark:border-surface-700 rounded">
                        <i class="pi pi-comments text-primary mr-2" />
                        <span class="text-surface-900 dark:text-surface-0">42</span>
                    </span>
                    <span class="inline-flex items-center py-2 px-4 font-medium border border-surface-200 dark:border-surface-700 rounded">
                        <i class="pi pi-eye text-primary mr-2" />
                        <span class="text-surface-900 dark:text-surface-0">357</span>
                    </span>
                </div>
            </div>
            <div class="flex flex-col items-center justify-center">
                <img class="w-16 h-16" src="/demo/images/avatar/circle/avatar-f-2.png" alt="Avatar" />
                <span class="mt-4 font-bold text-surface-900 dark:text-surface-0 text-center whitespace-nowrap">Alex Morgan</span>
            </div>
        </div>
        <div class="text-center my-12">
            <img src="/demo/images/blog/blogdetail.png" alt="Network Dashboard" class="w-full" />
        </div>
        <div class="text-2xl text-surface-900 dark:text-surface-0 mb-6 font-semibold">Optimizing Network Performance with AI-Powered Analytics</div>
        <p class="leading-normal text-lg mb-6">
            The latest release of our Network Analytics Dashboard introduces groundbreaking AI-driven features that revolutionize how organizations monitor and optimize their network infrastructure. By leveraging machine learning algorithms, the system can now predict potential bottlenecks before they impact performance, allowing for proactive resource allocation and maintenance.
        </p>
        <p class="leading-normal text-lg mb-6">The dashboard provides real-time visibility into network metrics, with customizable alerts and comprehensive reporting capabilities that make it easier than ever to maintain optimal network health and performance.</p>
        <p class="leading-normal text-lg mb-6">
            Key features of the new dashboard include anomaly detection, predictive analytics, and automated remediation suggestions that help network administrators address issues before they escalate into service-impacting problems.
        </p>
        <p class="leading-normal text-lg mb-6">
            The system integrates seamlessly with existing network infrastructure and management tools, providing a centralized view of network performance across distributed environments, cloud services, and on-premises systems.
        </p>
        <div class="text-2xl text-surface-900 dark:text-surface-0 mb-6 font-semibold">Key Benefits for Network Administrators</div>
        <ul class="text-xl p-0 my-0 ml-8">
            <li class="mb-4 leading-normal">Reduction in mean time to detect (MTTD) and mean time to resolve (MTTR) network issues by up to 75%</li>
            <li class="mb-4 leading-normal">Comprehensive visibility across hybrid and multi-cloud environments with unified monitoring</li>
            <li class="mb-4 leading-normal">AI-powered recommendations for network optimization and resource allocation</li>
            <li class="leading-normal">Enhanced security through automated threat detection and vulnerability assessment</li>
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