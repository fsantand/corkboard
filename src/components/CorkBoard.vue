<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useCorkboardStore } from '@/stores/corkboard'
import BoardItem from './BoardItem.vue'
import StringLayer from './StringLayer.vue'
import BoardToolbar from './BoardToolbar.vue'
import ItemAside from './ItemAside.vue'

const store = useCorkboardStore()

const boardRef = ref(null)
const pointerPos = ref({ x: 0, y: 0 })
const hoveredItemId = ref(null)
const selectedItemId = ref(null)

// Viewport transform
const panX = ref(0)
const panY = ref(0)
const zoom = ref(1)
const isPanning = ref(false)
const panStart = ref({ x: 0, y: 0, panX: 0, panY: 0 })
const ZOOM_MIN = 0.2
const ZOOM_MAX = 3
const ZOOM_STEP = 0.1

const activeItem = computed(() => {
  const id = selectedItemId.value ?? hoveredItemId.value
  return id ? (store.items.find((i) => i.id === id) ?? null) : null
})

const dimmedIds = computed(() => {
  if (!hoveredItemId.value) return new Set()
  const lit = new Set([hoveredItemId.value])
  for (const c of store.connections) {
    if (c.fromId === hoveredItemId.value) lit.add(c.toId)
    if (c.toId === hoveredItemId.value) lit.add(c.fromId)
  }
  return new Set(store.items.map((i) => i.id).filter((id) => !lit.has(id)))
})

function onPointerMove(e) {
  if (!boardRef.value) return
  const rect = boardRef.value.getBoundingClientRect()
  pointerPos.value = {
    x: (e.clientX - rect.left - panX.value) / zoom.value,
    y: (e.clientY - rect.top - panY.value) / zoom.value,
  }
  onPanMove(e)
}

function onDrag(id, x, y) {
  store.moveItem(id, x, y)
}

function onPinClick(id) {
  if (!store.connectMode) {
    store.startConnect(id)
  } else {
    store.finishConnect(id)
  }
}

function onItemHover(id) {
  hoveredItemId.value = id
}

function onItemSelect(id) {
  selectedItemId.value = selectedItemId.value === id ? null : id
}

function onDelete(id) {
  if (hoveredItemId.value === id) hoveredItemId.value = null
  if (selectedItemId.value === id) selectedItemId.value = null
  store.deleteItem(id)
}

function onKeydown(e) {
  if (e.key === 'Escape') store.cancelConnect()
}

function onMouseDown(e) {
  if (e.button === 1) {
    e.preventDefault()
    isPanning.value = true
    panStart.value = { x: e.clientX, y: e.clientY, panX: panX.value, panY: panY.value }
  }
}

function onPanMove(e) {
  if (!isPanning.value) return
  panX.value = panStart.value.panX + (e.clientX - panStart.value.x)
  panY.value = panStart.value.panY + (e.clientY - panStart.value.y)
}

function onMouseUp(e) {
  if (e.button === 1) isPanning.value = false
}

function onWheel(e) {
  e.preventDefault()
  const rect = boardRef.value.getBoundingClientRect()
  const mouseX = e.clientX - rect.left
  const mouseY = e.clientY - rect.top
  const factor = e.deltaY > 0 ? 1 - ZOOM_STEP : 1 + ZOOM_STEP
  const newZoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, zoom.value * factor))
  panX.value = mouseX - (mouseX - panX.value) * (newZoom / zoom.value)
  panY.value = mouseY - (mouseY - panY.value) * (newZoom / zoom.value)
  zoom.value = newZoom
}

onMounted(() => {
  document.addEventListener('keydown', onKeydown)
  boardRef.value.addEventListener('mousedown', onMouseDown)
  boardRef.value.addEventListener('wheel', onWheel, { passive: false })
  document.addEventListener('mousemove', onPanMove)
  document.addEventListener('mouseup', onMouseUp)
})

onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown)
  boardRef.value?.removeEventListener('mousedown', onMouseDown)
  boardRef.value?.removeEventListener('wheel', onWheel)
  document.removeEventListener('mousemove', onPanMove)
  document.removeEventListener('mouseup', onMouseUp)
})
</script>

<template>
  <div
    ref="boardRef"
    class="cork-board"
    :class="{ 'connect-mode': store.connectMode, panning: isPanning }"
    :style="{ backgroundPosition: `${panX}px ${panY}px` }"
    @pointermove="onPointerMove"
  >
    <div
      class="canvas"
      :style="{ transform: `translate(${panX}px, ${panY}px) scale(${zoom})` }"
    >
      <StringLayer
        :items="store.items"
        :connections="store.connections"
        :connect-mode="store.connectMode"
        :connect-from="store.connectFrom"
        :pointer-pos="pointerPos"
        :hovered-item-id="hoveredItemId"
        @remove-connection="store.removeConnection"
      />

      <BoardItem
        v-for="item in store.items"
        :key="item.id"
        :item="item"
        :zoom="zoom"
        :connect-mode="store.connectMode"
        :dimmed="dimmedIds.has(item.id)"
        @drag="onDrag"
        @pin-click="onPinClick"
        @delete="onDelete"
        @hover="onItemHover"
        @select="onItemSelect"
      />
    </div>

    <BoardToolbar
      :connect-mode="store.connectMode"
      @add-card="store.addItem"
      @cancel-connect="store.cancelConnect"
    />

    <!-- Connect mode hint -->
    <div v-if="store.connectMode" class="connect-hint">
      Click another pin to connect, or press Esc to cancel
    </div>

    <ItemAside :item="activeItem" />
  </div>
</template>

<style scoped>
.cork-board {
  position: fixed;
  inset: 0;
  overflow: hidden;

  background-image: url('@/assets/background.png');
  background-repeat: repeat;
  background-size: auto;
}

.cork-board::before {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.50);
  pointer-events: none;
  z-index: 0;
}

.cork-board.connect-mode {
  cursor: crosshair;
}

.cork-board.panning {
  cursor: grabbing !important;
}

.canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  transform-origin: 0 0;
  z-index: 1;
}

.connect-hint {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.75);
  color: #fff;
  padding: 8px 18px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
  pointer-events: none;
  z-index: 9000;
  letter-spacing: 0.02em;
}
</style>
