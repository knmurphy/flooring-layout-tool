import { createRouter, createWebHistory } from 'vue-router';
import Home from '../views/Home.vue';
import DrawingWorkspace from '../views/DrawingWorkspace.vue';

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
  },
  {
    path: '/workspace',
    name: 'DrawingWorkspace',
    component: DrawingWorkspace,
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

export default router;
