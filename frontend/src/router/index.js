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
    path: '/drawing-workspace',
    name: 'DrawingWorkspace',
    component: DrawingWorkspace
  },
  {
    path: '/drawing-workspace/:fileId',
    name: 'DrawingWorkspaceWithFile',
    component: DrawingWorkspace
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;
