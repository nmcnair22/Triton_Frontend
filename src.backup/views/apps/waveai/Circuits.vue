<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const comments = ref([
    {
        image: '/demo/images/avatar/circle/avatar-f-3@2x.png',
        name: 'Lisa Johnson',
        date: '20 May 2023',
        description: 'The neural circuit visualization tool has transformed our research capabilities.'
    },
    {
        image: '/demo/images/avatar/circle/avatar-f-1@2x.png',
        name: 'David Chen',
        date: '19 May 2023',
        description: 'How scalable is the circuit design methodology for large-scale distributed systems?'
    },
    {
        image: '/demo/images/avatar/circle/avatar-f-4@2x.png',
        name: 'Sarah Williams',
        date: '18 May 2023',
        description: 'The integrated simulation environment accurately predicted our real-world performance metrics.'
    },
    {
        image: '/demo/images/avatar/circle/avatar-f-5@2x.png',
        name: 'Robert Garcia',
        date: '17 May 2023',
        description: 'We have reduced power consumption by 40% by implementing the optimized circuit designs.'
    }
]);
</script>

<template>
    <div class="card">
        <div class="flex justify-between flex-col-reverse md:flex-row items-center">
            <div>
                <div class="text-xl text-surface-900 dark:text-surface-0 mb-6 mt-6 md:mt-0 text-center md:text-left font-semibold md:pr-6">Neural Circuit Design and Optimization Platform</div>
                <div class="flex flex-wrap justify-center md:justify-start gap-4">
                    <span class="inline-flex items-center py-2 px-4 font-medium border border-surface-200 dark:border-surface-700 rounded">
                        <i class="pi pi-clock text-primary mr-2" />
                        <span class="text-surface-900 dark:text-surface-0">Updated 1d ago</span>
                    </span>
                    <span class="inline-flex items-center py-2 px-4 font-medium border border-surface-200 dark:border-surface-700 rounded">
                        <i class="pi pi-comments text-primary mr-2" />
                        <span class="text-surface-900 dark:text-surface-0">29</span>
                    </span>
                    <span class="inline-flex items-center py-2 px-4 font-medium border border-surface-200 dark:border-surface-700 rounded">
                        <i class="pi pi-eye text-primary mr-2" />
                        <span class="text-surface-900 dark:text-surface-0">185</span>
                    </span>
                </div>
            </div>
            <div class="flex flex-col items-center justify-center">
                <img class="w-16 h-16" src="/demo/images/avatar/circle/avatar-m-3.png" alt="Avatar" />
                <span class="mt-4 font-bold text-surface-900 dark:text-surface-0 text-center whitespace-nowrap">Emily Zhang</span>
            </div>
        </div>
        <div class="text-center my-12">
            <img src="/demo/images/blog/blogdetail.png" alt="Neural Circuits" class="w-full" />
        </div>
        <div class="text-2xl text-surface-900 dark:text-surface-0 mb-6 font-semibold">Advanced Neural Circuit Design for Next-Generation AI Systems</div>
        <p class="leading-normal text-lg mb-6">
            Our Neural Circuit Design Platform enables researchers and engineers to create, simulate, and optimize specialized AI processing architectures. By leveraging principles from neuroscience and electrical engineering, the platform facilitates the development of energy-efficient, high-performance neural computing systems.
        </p>
        <p class="leading-normal text-lg mb-6">The integrated simulation environment allows users to test designs under various operational conditions, providing insights into performance, power consumption, and thermal characteristics before physical implementation.</p>
        <p class="leading-normal text-lg mb-6">
            The platform's optimization engine automatically identifies bottlenecks and suggests architectural improvements, accelerating the design iteration process and enabling the development of increasingly sophisticated neural processing units.
        </p>
        <p class="leading-normal text-lg mb-6">
            Advanced visualization tools provide intuitive representations of complex neural circuits, making it easier to understand data flow, identify critical paths, and communicate designs across interdisciplinary teams.
        </p>
        <div class="text-2xl text-surface-900 dark:text-surface-0 mb-6 font-semibold">Key Applications in Advanced AI Development</div>
        <ul class="text-xl p-0 my-0 ml-8">
            <li class="mb-4 leading-normal">Edge AI systems with strict power and performance constraints</li>
            <li class="mb-4 leading-normal">Neuromorphic computing platforms that mimic biological neural architectures</li>
            <li class="mb-4 leading-normal">Specialized accelerators for machine learning inference and training</li>
            <li class="leading-normal">Research platforms for exploring novel neural computing paradigms</li>
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