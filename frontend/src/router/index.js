import { createRouter, createWebHistory } from 'vue-router';
import HomePage from '../views/Home.vue';  // Updated import name
import DrawingWorkspace from '../views/DrawingWorkspace.vue';

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomePage,  // Updated component reference
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
