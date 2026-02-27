<script setup>
const emit = defineEmits(['pick', 'close'])

const EMOJIS = [
  '👤', '👥', '🕵️', '👮', '🧑', '💼', '🎭', '🧠',
  '🏢', '🏛️', '🏗️', '🏭', '🏦', '⚖️', '🔬', '🎓',
  '📍', '🗺️', '🌍', '🏠', '🏡', '🌆', '🗼', '⛰️',
  '🔍', '📋', '📄', '📸', '🎥', '🔒', '🗂️', '📰',
  '💡', '❓', '❗', '🔗', '⭐', '🎯', '🚨', '⚠️',
  '📌', '✅', '❌', '🔴', '🟡', '🟢', '🔵', '⬛',
  '★', '✓', '●', '○', '◆', '▲', '✕', '♦',
]
</script>

<template>
  <div class="picker-backdrop" @click="emit('close')">
    <div class="picker-grid" @click.stop>
      <button
        v-for="e in EMOJIS"
        :key="e"
        class="picker-btn"
        @click="emit('pick', e); emit('close')"
      >
        {{ e }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.picker-backdrop {
  position: fixed;
  inset: 0;
  z-index: 20000;
}

.picker-grid {
  position: absolute;
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 2px;
  background: #fff;
  border: 1px solid #d0c8b8;
  border-radius: 6px;
  padding: 6px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  max-height: 200px;
  overflow-y: auto;
  left: 0;
  top: 32px;
}

.picker-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  transition: background 0.1s;
}

.picker-btn:hover {
  background: #f0ebe0;
}
</style>
