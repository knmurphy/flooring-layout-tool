import { createRouter, createWebHistory } from 'vue-router';
import Home from '../views/Home.vue';
import DrawingWorkspace from '../views/DrawingWorkspace.vue';

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/drawing-workspace/:fileId',
    name: 'DrawingWorkspace',
    component: DrawingWorkspace,
    props: true
  }
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
});

export default router;
