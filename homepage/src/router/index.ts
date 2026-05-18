import { createRouter, createWebHashHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';

const router = createRouter({
    history: createWebHashHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            name: 'home',
            component: HomeView,
        },
        {
            path: '/demos',
            name: 'demos',
            children: [
                {
                    path: 'polygon-chaos',
                    name: 'polygon_chaos',
                    component: () => import('../views/examples/2d/PolygonChaos.vue'),
                },
                {
                    path: 'cloth-trellis',
                    name: 'cloth_tellis',
                    component: () => import('../views/examples/2d/ClothAndTrellis.vue'),
                },
            ],
        },
    ],
});

export default router;
