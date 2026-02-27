<script setup>
import { ref, computed } from 'vue'
import { useCorkboardStore } from '@/stores/corkboard'

const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
  connectMode: {
    type: Boolean,
    default: false,
  },
  dimmed: {
    type: Boolean,
    default: false,
  },
  zoom: {
    type: Number,
    default: 1,
  },
})

const emit = defineEmits(['drag', 'pin-click', 'delete', 'hover', 'select'])

const store = useCorkboardStore()

const activeCategory = computed(() => store.categories.find((c) => c.id === props.item.category))

const isDragging = ref(false)
const isHovered = ref(false)
const dragMoved = ref(false)
const dragStart = ref({ ptrX: 0, ptrY: 0, itemX: 0, itemY: 0 })

function onPointerDown(e) {
  // Don't initiate drag if target is the pushpin or delete button
  if (e.target.closest('.pushpin') || e.target.closest('.delete-btn')) return
  e.preventDefault()
  e.currentTarget.setPointerCapture(e.pointerId)
  isDragging.value = true
  dragMoved.value = false
  dragStart.value = {
    ptrX: e.clientX,
    ptrY: e.clientY,
    itemX: props.item.x,
    itemY: props.item.y,
  }
  // Bring to front immediately
  store.moveItem(props.item.id, props.item.x, props.item.y)
}

function onPointerMove(e) {
  if (!isDragging.value) return
  const dx = e.clientX - dragStart.value.ptrX
  const dy = e.clientY - dragStart.value.ptrY
  if (!dragMoved.value && (Math.abs(dx) > 4 || Math.abs(dy) > 4)) {
    dragMoved.value = true
  }
  emit('drag', props.item.id, dragStart.value.itemX + dx / props.zoom, dragStart.value.itemY + dy / props.zoom)
}

function onPointerUp(e) {
  if (!isDragging.value) return
  isDragging.value = false
  e.currentTarget.releasePointerCapture(e.pointerId)
  if (!dragMoved.value) {
    emit('select', props.item.id)
  }
}

function onPinClick(e) {
  e.stopPropagation()
  emit('pin-click', props.item.id)
}

function onPointerEnter() {
  isHovered.value = true
  emit('hover', props.item.id)
}

function onPointerLeave() {
  isHovered.value = false
  emit('hover', null)
}
</script>

<template>
  <div
    class="board-item"
    :class="{
      dragging: isDragging,
      'connect-source': connectMode && item.id === $props.item.id,
      dimmed: dimmed,
    }"
    :style="{
      left: item.x + 'px',
      top: item.y + 'px',
      transform: `rotate(${item.rotation}deg)`,
      zIndex: isDragging ? 500 : item.zIndex,
      '--cat-primary': activeCategory?.colorPrimary,
      '--cat-secondary': activeCategory?.colorSecondary,
    }"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
    @pointerenter="onPointerEnter"
    @pointerleave="onPointerLeave"
  >
    <!-- Pushpin -->
    <div
      class="pushpin"
      :class="{ 'connect-mode': connectMode }"
      @pointerdown.stop="onPinClick"
    >
      <div class="pin-head" :class="{ 'has-category': !!item.category }" />
      <div class="pin-needle" />
    </div>

    <!-- Polaroid view (with photo) -->
    <div v-if="item.photoSrc" class="polaroid">
      <div class="polaroid-photo">
        <img :src="item.photoSrc" draggable="false" />
      </div>
      <span class="polaroid-caption">{{ item.title }}</span>
    </div>

    <!-- Post-it note (no photo) -->
    <div v-else class="postit" :class="{ 'has-category': !!item.category }">
      <span class="postit-text">{{ item.title }}</span>
    </div>

    <!-- Delete button -->
    <button
      v-show="isHovered && !isDragging"
      class="delete-btn"
      @pointerdown.stop
      @click="emit('delete', item.id)"
      title="Delete"
    >
      ×
    </button>
  </div>
</template>

<style scoped>
.board-item {
  position: absolute;
  cursor: grab;
  user-select: none;
  filter: drop-shadow(2px 4px 8px rgba(0, 0, 0, 0.35));
  transition:
    filter 0.15s,
    opacity 0.2s;
}

.board-item.dragging {
  cursor: grabbing;
  filter: drop-shadow(4px 8px 16px rgba(0, 0, 0, 0.5));
}

.board-item.dimmed {
  opacity: 0.2;
  pointer-events: none;
}

/* Pushpin */
.pushpin {
  position: absolute;
  top: -8px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  z-index: 10;
  transition: transform 0.15s;
}

.pushpin:hover,
.pushpin.connect-mode:hover {
  transform: translateX(-50%) scale(1.3);
}

.pin-head {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 35%, #e74c3c, #922b21);
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.5),
    inset 0 1px 2px rgba(255, 255, 255, 0.3);
}

.pushpin.connect-mode .pin-head {
  background: radial-gradient(circle at 35% 35%, #f39c12, #d35400);
  box-shadow:
    0 0 6px 2px rgba(243, 156, 18, 0.6),
    0 1px 3px rgba(0, 0, 0, 0.5);
}

.pin-needle {
  width: 2px;
  height: 8px;
  background: linear-gradient(to bottom, #888, #555);
  border-radius: 0 0 1px 1px;
}

/* Polaroid collapsed view */
.polaroid {
  background: #ededed;
  padding: 8px 8px 36px;
  width: 160px;
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.2),
    0 4px 12px rgba(0, 0, 0, 0.15);
}

.polaroid-photo {
  width: 100%;
  height: 144px;
  overflow: hidden;
}

.polaroid-photo img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  user-select: none;
}

/* Post-it note */
.postit {
  background: linear-gradient(160deg, #fef08a 0%, #fde047 100%);
  width: 160px;
  height: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  box-sizing: border-box;
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.2),
    0 4px 12px rgba(0, 0, 0, 0.15);
}

.postit-text {
  font-family: 'Permanent Marker', cursive;
  font-size: 15px;
  color: #333;
  text-align: center;
  line-height: 1.4;
  word-break: break-word;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 5;
  -webkit-box-orient: vertical;
}

.polaroid-caption {
  display: block;
  margin-top: 10px;
  font-family: 'Permanent Marker', cursive;
  font-size: 14px;
  color: #222;
  text-align: center;
  letter-spacing: 0.08em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Delete button */
.delete-btn {
  position: absolute;
  top: -6px;
  right: -6px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: none;
  background: #c0392b;
  color: #fff;
  font-size: 14px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.4);
  z-index: 20;
  transition: background 0.15s;
}

.delete-btn:hover {
  background: #e74c3c;
}

/* Post-it category color */
.postit.has-category {
  background: linear-gradient(160deg, var(--cat-primary) 0%, var(--cat-secondary) 100%);
}

.postit.has-category .postit-text {
  color: #fff;
}

/* Pin-head category color */
.pin-head.has-category {
  background: radial-gradient(circle at 35% 35%, var(--cat-primary), var(--cat-secondary));
}
</style>
