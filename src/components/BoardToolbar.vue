<script setup>
import { useCorkboardStore } from '@/stores/corkboard'

defineProps({
  connectMode: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['add-card', 'cancel-connect', 'center-board'])

const store = useCorkboardStore()

async function fetchAsDataURL(src) {
  const response = await fetch(src)
  const blob = await response.blob()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

function importBoard() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json,application/json'
  input.onchange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result)
        store.importBoard(data)
      } catch {
        alert('Invalid corkboard file.')
      }
    }
    reader.readAsText(file)
  }
  input.click()
}

async function exportBoard() {
  const items = await Promise.all(
    store.items.map(async (item) => {
      if (item.photoSrc && /^https?:\/\//.test(item.photoSrc)) {
        try {
          return { ...item, photoSrc: await fetchAsDataURL(item.photoSrc) }
        } catch {
          return item
        }
      }
      return item
    }),
  )

  const data = JSON.stringify({ items, connections: store.connections }, null, 2)
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'corkboard-export.json'
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <div class="toolbar">
    <button class="btn" @click="emit('add-card')">+ Card</button>
    <button class="btn" @click="emit('center-board')">⊙ Center</button>
    <button class="btn" @click="importBoard">↑ Import</button>
    <button class="btn" @click="exportBoard">↓ Export</button>
    <button v-if="connectMode" class="btn btn-cancel" @click="emit('cancel-connect')">
      ✕ Cancel Connect
    </button>
  </div>
</template>

<style scoped>
.toolbar {
  position: fixed;
  top: 16px;
  left: 16px;
  display: flex;
  gap: 8px;
  z-index: 9000;
}

.btn {
  padding: 8px 14px;
  border: none;
  border-radius: 4px;
  background: #2c3e50;
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
  letter-spacing: 0.03em;
  transition: background 0.15s;
}

.btn:hover {
  background: #3d556b;
}

.btn-cancel {
  background: #c0392b;
}

.btn-cancel:hover {
  background: #e74c3c;
}
</style>
