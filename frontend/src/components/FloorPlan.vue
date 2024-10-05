<template>
  <v-container fluid class="floor-plan-container pa-0">
    <v-row no-gutters>
      <v-col cols="12">
        <v-app-bar dense>
          <v-app-bar-title>Floor Plan</v-app-bar-title>
          <v-spacer></v-spacer>
          <v-switch v-model="isDarkMode" label="Dark Mode" @change="toggleUIDarkMode"></v-switch>
          <v-switch v-model="isCanvasDarkMode" label="Canvas Dark Mode" @change="toggleCanvasDarkMode"></v-switch>
          <v-btn @click="openFileInput">Load PDF</v-btn>
          <v-btn @click="exportAsPNG">Export as PNG</v-btn>
        </v-app-bar>
      </v-col>
    </v-row>
    <v-row no-gutters>
      <v-col cols="12">
        <div class="canvas-container">
          <v-stage
            ref="stage"
            :config="stageConfig"
            @mousedown="handleMouseDown"
            @mousemove="handleMouseMove"
            @mouseup="handleMouseUp"
            @wheel="handleWheel"
          >
            <v-layer ref="mainLayer">
              <v-group ref="backgroundGroup"></v-group>
              <v-group ref="shapeGroup"></v-group>
              <v-group ref="annotationGroup"></v-group>
            </v-layer>
          </v-stage>
        </div>
      </v-col>
    </v-row>
    <v-row no-gutters>
      <v-col cols="12">
        <v-bottom-navigation>
          <v-btn v-for="pattern in availablePatterns" :key="pattern.name" @click="selectPattern(pattern)">
            {{ pattern.name }}
          </v-btn>
        </v-bottom-navigation>
      </v-col>
    </v-row>
    <input 
      type="file" 
      ref="fileInput" 
      @change="handleFileSelect" 
      accept="application/pdf" 
      style="display: none;"
    >
  </v-container>
</template>

<script>
import { ref, onMounted, watch } from 'vue'
import Konva from 'konva'
import { convertPDFToImage } from '../utils/pdfUtils'
import { useRoute } from 'vue-router'

export default {
  name: 'FloorPlan',
  setup() {
    const route = useRoute()
    const stage = ref(null)
    const mainLayer = ref(null)
    const backgroundGroup = ref(null)
    const shapeGroup = ref(null)
    const annotationGroup = ref(null)
    const isDarkMode = ref(true) // Set dark mode as default
    const isCanvasDarkMode = ref(true) // Set canvas dark mode as default
    const invertColors = ref(false)
    const fileInput = ref(null)

    const stageConfig = ref({
      width: window.innerWidth,
      height: window.innerHeight,
      draggable: true, // Enable stage dragging
    })

    const availablePatterns = ref([
      { name: 'Hardwood', fill: '#8B4513', width: 50, height: 50 },
      { name: 'Tile', fill: '#D3D3D3', width: 40, height: 40 },
      { name: 'Carpet', fill: '#DEB887', width: 60, height: 60 },
      { name: 'Laminate', fill: '#A0522D', width: 45, height: 45 },
      { name: 'Vinyl', fill: '#708090', width: 55, height: 55 },
    ])

    const selectedPattern = ref(null)
    const previewShape = ref(null)

    const updateStageBackground = () => {
      if (stage.value) {
        const konvaStage = stage.value.getNode()
        konvaStage.container().style.backgroundColor = isDarkMode.value || isCanvasDarkMode.value ? '#2c2c2c' : '#ffffff'
      }
      if (mainLayer.value) {
        mainLayer.value.getNode().batchDraw()
      }
    }

    const toggleUIDarkMode = () => {
      isDarkMode.value = !isDarkMode.value
      // Update Vuetify theme here if necessary
    }

    const toggleCanvasDarkMode = () => {
      isCanvasDarkMode.value = !isCanvasDarkMode.value
      updateStageBackground()
    }

    const toggleInvertColors = () => {
      invertColors.value = !invertColors.value
      applyInvertColors()
    }

    const applyInvertColors = () => {
      if (backgroundGroup.value && mainLayer.value) {
        const imageNode = backgroundGroup.value.getNode().findOne('Image')
        if (imageNode) {
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')
          canvas.width = imageNode.width()
          canvas.height = imageNode.height()
          ctx.drawImage(imageNode.image(), 0, 0)
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
          const data = imageData.data
          for (let i = 0; i < data.length; i += 4) {
            data[i] = invertColors.value ? 255 - data[i] : data[i]         // red
            data[i + 1] = invertColors.value ? 255 - data[i + 1] : data[i + 1] // green
            data[i + 2] = invertColors.value ? 255 - data[i + 2] : data[i + 2] // blue
          }
          ctx.putImageData(imageData, 0, 0)
          imageNode.image(canvas)
          mainLayer.value.getNode().batchDraw()
        }
      }
    }

    const openFileInput = () => {
      fileInput.value.click()
    }

    const handleFileSelect = async (event) => {
      const file = event.target.files[0]
      if (file && file.type === 'application/pdf') {
        try {
          const { dataUrl, width, height } = await convertPDFToImage(file)
          setPDFBackground(dataUrl, width, height)
        } catch (error) {
          console.error('Error converting PDF:', error)
        }
      } else {
        alert('Please select a valid PDF file.')
      }
    }

    const setPDFBackground = (dataUrl, width, height) => {
      const backgroundImage = new Image()
      backgroundImage.src = dataUrl
      backgroundImage.onload = () => {
        if (stage.value && backgroundGroup.value && mainLayer.value) {
          const konvaStage = stage.value.getNode()
          const stageWidth = konvaStage.width()
          const stageHeight = konvaStage.height()
          const scale = Math.min(stageWidth / width, stageHeight / height)
          const x = (stageWidth - width * scale) / 2
          const y = (stageHeight - height * scale) / 2

          backgroundGroup.value.getNode().destroyChildren()
          const imageNode = new Konva.Image({
            x: x,
            y: y,
            image: backgroundImage,
            width: width * scale,
            height: height * scale,
          })
          backgroundGroup.value.getNode().add(imageNode)
          mainLayer.value.getNode().batchDraw()
          applyInvertColors()
        }
      }
    }

    const handleMouseDown = (e) => {
      const pos = e.target.getStage().getPointerPosition();
      if (selectedPattern.value) {
        if (previewShape.value) {
          // Convert the preview shape into a placed pattern
          previewShape.value.opacity(1);
          previewShape.value.draggable(true);
          previewShape.value = null;
        } else {
          placePattern(pos);
        }
        mainLayer.value.getNode().batchDraw();
      } else {
        // Handle other mouse down actions
      }
    }

    const handleMouseMove = (e) => {
      if (selectedPattern.value && e.target.getStage().getPointerPosition()) {
        const pos = e.target.getStage().getPointerPosition();
        // Show a preview of the pattern at the current mouse position
        if (!previewShape.value) {
          previewShape.value = new Konva.Rect({
            x: pos.x,
            y: pos.y,
            width: selectedPattern.value.width,
            height: selectedPattern.value.height,
            fill: selectedPattern.value.fill,
            opacity: 0.5,
          });
          shapeGroup.value.getNode().add(previewShape.value);
        } else {
          previewShape.value.position({ x: pos.x, y: pos.y });
        }
        mainLayer.value.getNode().batchDraw();
      } else if (previewShape.value) {
        // Remove the preview shape if no pattern is selected
        previewShape.value.destroy();
        previewShape.value = null;
        mainLayer.value.getNode().batchDraw();
      }
    }

    const handleMouseUp = () => {
      // Handle mouse up actions
    }

    const handleWheel = (e) => {
      e.evt.preventDefault()
      const scaleBy = 1.1
      const stage = e.target.getStage()
      const oldScale = stage.scaleX()
      const mousePointTo = {
        x: stage.getPointerPosition().x / oldScale - stage.x() / oldScale,
        y: stage.getPointerPosition().y / oldScale - stage.y() / oldScale,
      }

      const newScale = e.evt.deltaY > 0 ? oldScale * scaleBy : oldScale / scaleBy

      stage.scale({ x: newScale, y: newScale })

      const newPos = {
        x: -(mousePointTo.x - stage.getPointerPosition().x / newScale) * newScale,
        y: -(mousePointTo.y - stage.getPointerPosition().y / newScale) * newScale,
      }
      stage.position(newPos)
      stage.batchDraw()
    }

    const selectPattern = (pattern) => {
      selectedPattern.value = pattern
    }

    const placePattern = (pos) => {
      if (selectedPattern.value && shapeGroup.value) {
        const newPattern = new Konva.Rect({
          x: pos.x,
          y: pos.y,
          width: selectedPattern.value.width,
          height: selectedPattern.value.height,
          fill: selectedPattern.value.fill,
          draggable: true,
        })
        shapeGroup.value.getNode().add(newPattern)
        mainLayer.value.getNode().batchDraw()
      }
    }

    const exportAsPNG = () => {
      if (stage.value) {
        const dataURL = stage.value.getNode().toDataURL()
        const link = document.createElement('a')
        link.download = 'floor-plan.png'
        link.href = dataURL
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
    }

    const loadPDFFromStorage = async () => {
      const fileId = route.params.fileId
      if (fileId) {
        const pdfBase64 = localStorage.getItem(`pdf_${fileId}`)
        if (pdfBase64) {
          try {
            const { dataUrl, width, height } = await convertPDFToImage(dataURItoBlob(pdfBase64))
            setPDFBackground(dataUrl, width, height)
          } catch (error) {
            console.error('Error converting PDF:', error)
          }
        }
      }
    }

    const dataURItoBlob = (dataURI) => {
      const byteString = atob(dataURI.split(',')[1])
      const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0]
      const ab = new ArrayBuffer(byteString.length)
      const ia = new Uint8Array(ab)
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i)
      }
      return new Blob([ab], { type: mimeString })
    }

    watch([isDarkMode, isCanvasDarkMode], () => {
      updateStageBackground()
    })

    onMounted(() => {
      window.addEventListener('resize', () => {
        stageConfig.value.width = window.innerWidth
        stageConfig.value.height = window.innerHeight
      })
      updateStageBackground() // Apply initial background color
      loadPDFFromStorage()
    })

    return {
      stage,
      mainLayer,
      backgroundGroup,
      shapeGroup,
      annotationGroup,
      stageConfig,
      isDarkMode,
      isCanvasDarkMode,
      invertColors,
      fileInput,
      availablePatterns,
      selectedPattern,
      toggleUIDarkMode,
      toggleCanvasDarkMode,
      toggleInvertColors,
      openFileInput,
      handleFileSelect,
      handleMouseDown,
      handleMouseMove,
      handleMouseUp,
      handleWheel,
      selectPattern,
      exportAsPNG,
      previewShape,
      loadPDFFromStorage,
    }
  }
}
</script>

<style scoped>
.floor-plan-container {
  width: 100%;
  height: 100vh;
}
.canvas-container {
  width: 100%;
  height: calc(100vh - 64px - 56px); /* Adjust for app bar and bottom navigation */
}
</style>