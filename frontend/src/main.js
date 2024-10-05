import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

const app = createApp(App)

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(router)
   .use(ElementPlus)
   .mount('#app')

app.directive('draggable', {
  mounted(el) {
    el.style.position = 'absolute';
    let isDragging = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;
    let xOffset = 0;
    let yOffset = 0;

    el.addEventListener('mousedown', dragStart);
    el.addEventListener('mouseup', dragEnd);
    el.addEventListener('mousemove', drag);

    function dragStart(e) {
      initialX = e.clientX - xOffset;
      initialY = e.clientY - yOffset;
      isDragging = true;
    }

    function dragEnd(e) {
      initialX = e.clientX - xOffset;  // Use e.clientX instead of currentX
      initialY = e.clientY - yOffset;  // Use e.clientY instead of currentY
      isDragging = false;
    }

    function drag(e) {
      if (isDragging) {
        e.preventDefault();
        currentX = e.clientX - initialX;
        currentY = e.clientY - initialY;
        xOffset = currentX;
        yOffset = currentY;
        el.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
      }
    }
  }
});