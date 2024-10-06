export const draggable = {
  mounted(el) {
    el.style.position = 'absolute';
    let isDragging = false;
    let startX, startY;

    el.addEventListener('mousedown', startDrag);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', stopDrag);

    function startDrag(e) {
      isDragging = true;
      startX = e.clientX - el.offsetLeft;
      startY = e.clientY - el.offsetTop;
    }

    function drag(e) {
      if (isDragging) {
        el.style.left = `${e.clientX - startX}px`;
        el.style.top = `${e.clientY - startY}px`;
      }
    }

    function stopDrag() {
      isDragging = false;
    }
  }
};
