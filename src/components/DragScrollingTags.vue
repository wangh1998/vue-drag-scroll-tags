<template>
  <div class="drag-scroll-tag">
    <template v-if="!dragScrollTagIsLoaded">
      <div class="drag-scroll-tag__skeleton">
        <div
          v-for="i in dragScrollTagRows"
          :key="i"
          class="drag-scroll-tag__skeleton-row"
        >
          <div class="drag-scroll-tag__skeleton-items">
            <div
              v-for="j in dragScrollTagSkeletonColumns"
              :key="j"
              class="drag-scroll-tag__skeleton-item"
            >
              <van-skeleton :row="1" :loading="true" :row-width="['100%']" />
            </div>
          </div>
        </div>
      </div>
    </template>

    <template v-else>
      <div
        v-for="(row, rowIndex) in dragScrollTagRows"
        :key="rowIndex"
        class="drag-scroll-tag__container"
        :class="{
          'drag-scroll-tag__container--dragging':
            dragScrollTagIsDragging[rowIndex]
        }"
        @mousedown="onDragScrollTagStart($event, rowIndex)"
        @touchstart="onDragScrollTagStart($event, rowIndex)"
      >
        <div
          class="drag-scroll-tag__scroll"
          :class="[
            `drag-scroll-tag__scroll--${rowIndex + 1}`,
            {
              'drag-scroll-tag__scroll--dragging':
                dragScrollTagIsDragging[rowIndex]
            },
            {'drag-scroll-tag__scroll--ready': dragScrollTagIsLoaded}
          ]"
          :style="{
            '--offset': `${dragScrollTagPositions[rowIndex]}px`,
            '--animation-play-state': dragScrollTagIsDragging[rowIndex]
              ? 'paused'
              : 'running',
            '--scroll-duration': `${dragScrollTagEffectiveDurations[rowIndex]}s`
          }"
        >
          <div class="drag-scroll-tag__group">
            <div
              v-for="(tag, index) in getDragScrollTagRow(rowIndex)"
              :key="index"
              class="drag-scroll-tag__item"
            >
              <slot name="tag" :tag="tag"></slot>
            </div>
          </div>
          <div class="drag-scroll-tag__group">
            <div
              v-for="(tag, index) in getDragScrollTagRow(rowIndex)"
              :key="'clone-' + index"
              class="drag-scroll-tag__item"
            >
              <slot name="tag" :tag="tag"></slot>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script>
export default {
  name: 'DragScrollTag',
  props: {
    dragScrollTagList: {
      type: Array,
      default: () => []
    },
    dragScrollTagIsLoaded: {
      type: Boolean,
      default: false
    },
    dragScrollTagRows: {
      type: Number,
      default: 3,
      validator: function (value) {
        return value > 0
      }
    },
    dragScrollTagSkeletonColumns: {
      type: Number,
      default: 4,
      validator: function (value) {
        return value > 0
      }
    },
    dragScrollTagDurations: {
      type: Array,
      default: () => [],
      validator: function (value) {
        return value.every(
          (duration) => typeof duration === 'number' && duration > 0
        )
      }
    }
  },
  data() {
    return {
      dragScrollTagPositions: [],
      dragScrollTagIsDragging: [],
      dragScrollTagDragStates: [],
      dragScrollTagActiveIndex: null,
      dragScrollTagAllTags: []
    }
  },
  computed: {
    dragScrollTagEffectiveDurations() {
      const defaultDuration = 25
      return Array(this.dragScrollTagRows)
        .fill(null)
        .map((_, i) => this.dragScrollTagDurations[i] || defaultDuration)
    },
    dragScrollTagStyles() {
      let styles = ''
      for (let i = 1; i <= this.dragScrollTagRows; i++) {
        styles += `
          .drag-scroll-tag .drag-scroll-tag__scroll.drag-scroll-tag__scroll--${i} {
            --row-index: ${i - 1};
            animation-duration: ${
              this.dragScrollTagEffectiveDurations[i - 1]
            }s !important;
          }
        `
      }
      return styles
    }
  },
  watch: {
    dragScrollTagRows: {
      handler() {
        this.updateDragScrollTagStyles()
      },
      immediate: true
    },
    dragScrollTagDurations: {
      handler() {
        this.updateDragScrollTagStyles()
      }
    }
  },
  created() {
    this.initializeDragScrollTagArrays()
    this.distributeDragScrollTags()
  },
  mounted() {
    const styleElement = document.createElement('style')
    styleElement.setAttribute('data-drag-scroll-tag', '')
    styleElement.textContent = this.dragScrollTagStyles
    document.head.appendChild(styleElement)

    window.addEventListener('mousemove', this.onDragScrollTagMove)
    window.addEventListener('touchmove', this.onDragScrollTagMove, {
      passive: false
    })
    window.addEventListener('mouseup', this.onDragScrollTagEnd)
    window.addEventListener('touchend', this.onDragScrollTagEnd)
  },
  beforeDestroy() {
    const styleElement = document.querySelector('style[data-drag-scroll-tag]')
    if (styleElement) {
      styleElement.remove()
    }

    window.removeEventListener('mousemove', this.onDragScrollTagMove)
    window.removeEventListener('touchmove', this.onDragScrollTagMove)
    window.removeEventListener('mouseup', this.onDragScrollTagEnd)
    window.removeEventListener('touchend', this.onDragScrollTagEnd)
  },
  methods: {
    initializeDragScrollTagArrays() {
      this.dragScrollTagPositions = new Array(this.dragScrollTagRows).fill(0)
      this.dragScrollTagIsDragging = new Array(this.dragScrollTagRows).fill(
        false
      )
      this.dragScrollTagDragStates = new Array(this.dragScrollTagRows)
        .fill(null)
        .map(() => ({
          startX: 0,
          initialPosition: 0,
          startTime: 0,
          startTarget: null,
          containerWidth: 0
        }))
    },
    distributeDragScrollTags() {
      const tempTags = JSON.parse(JSON.stringify(this.dragScrollTagList))
      const tagsPerRow = Math.ceil(tempTags.length / this.dragScrollTagRows)
      this.dragScrollTagAllTags = Array(this.dragScrollTagRows)
        .fill(null)
        .map((_, index) =>
          tempTags.slice(index * tagsPerRow, (index + 1) * tagsPerRow)
        )
    },
    getDragScrollTagRow(rowIndex) {
      return this.dragScrollTagAllTags[rowIndex]
    },
    onDragScrollTagStart(event, rowIndex) {
      event.preventDefault()
      event.stopPropagation()

      const touch = event.type.includes('mouse') ? event : event.touches[0]

      this.dragScrollTagDragStates[rowIndex].startTime = Date.now()
      this.dragScrollTagDragStates[rowIndex].startTarget = event.target.closest(
        '.drag-scroll-tag__item'
      )
      this.dragScrollTagDragStates[rowIndex].startX = touch.clientX

      const container = event.currentTarget.querySelector(
        '.drag-scroll-tag__scroll'
      )
      if (!container) return

      const computedStyle = window.getComputedStyle(container)
      const transform = computedStyle.transform
      const matrix = new DOMMatrix(transform)
      const currentX = matrix.m41

      this.dragScrollTagDragStates[rowIndex].initialPosition = currentX
      this.$set(this.dragScrollTagPositions, rowIndex, currentX)

      const groupContainer = container.querySelector('.drag-scroll-tag__group')
      if (groupContainer) {
        this.dragScrollTagDragStates[rowIndex].containerWidth =
          groupContainer.offsetWidth
      }

      this.dragScrollTagActiveIndex = rowIndex
      this.$set(this.dragScrollTagIsDragging, rowIndex, true)
    },
    onDragScrollTagMove(event) {
      if (this.dragScrollTagActiveIndex === null) return

      event.preventDefault()
      event.stopPropagation()

      const touch = event.type.includes('mouse') ? event : event.touches[0]
      const state = this.dragScrollTagDragStates[this.dragScrollTagActiveIndex]
      const deltaX = touch.clientX - state.startX

      let newPosition = state.initialPosition + deltaX

      if (state.containerWidth > 0) {
        while (newPosition > 0) {
          newPosition -= state.containerWidth
        }
        while (newPosition < -state.containerWidth) {
          newPosition += state.containerWidth
        }
      }

      requestAnimationFrame(() => {
        this.$set(
          this.dragScrollTagPositions,
          this.dragScrollTagActiveIndex,
          newPosition
        )
      })
    },
    onDragScrollTagEnd(event) {
      if (this.dragScrollTagActiveIndex === null) return

      const state = this.dragScrollTagDragStates[this.dragScrollTagActiveIndex]
      const endTime = Date.now()
      const dragDuration = endTime - state.startTime

      const touch =
        event && event.type.includes('mouse')
          ? event
          : event && event.changedTouches
          ? event.changedTouches[0]
          : null
      const dragDistance = touch
        ? Math.abs(touch.clientX - state.startX)
        : Infinity

      if (dragDuration < 200 && dragDistance < 10 && state.startTarget) {
        const clickedTag = state.startTarget
        const rowTags = Array.from(
          clickedTag
            .closest('.drag-scroll-tag__container')
            .querySelector('.drag-scroll-tag__group:first-child').children
        )
        const index = rowTags.findIndex(
          (tag) => tag.textContent === clickedTag.textContent
        )
        if (index !== -1) {
          this.$emit(
            'tag-click',
            this.dragScrollTagAllTags[this.dragScrollTagActiveIndex][index]
          )
        }
      }

      let finalPosition =
        this.dragScrollTagPositions[this.dragScrollTagActiveIndex]

      if (state.containerWidth > 0) {
        while (finalPosition > 0) {
          finalPosition -= state.containerWidth
        }
        while (finalPosition < -state.containerWidth) {
          finalPosition += state.containerWidth
        }
      }

      this.$set(
        this.dragScrollTagPositions,
        this.dragScrollTagActiveIndex,
        finalPosition
      )
      this.dragScrollTagDragStates[
        this.dragScrollTagActiveIndex
      ].initialPosition = finalPosition
      this.$set(
        this.dragScrollTagIsDragging,
        this.dragScrollTagActiveIndex,
        false
      )
      this.dragScrollTagActiveIndex = null
    },
    updateDragScrollTagStyles() {
      const styleElement = document.querySelector('style[data-drag-scroll-tag]')
      if (styleElement) {
        styleElement.textContent = this.dragScrollTagStyles
      }
    }
  }
}
</script>

<style scoped>
.drag-scroll-tag {
  width: 100%;
  overflow: hidden;
  touch-action: none;
  margin-top: 20px;
}

.drag-scroll-tag__container {
  position: relative;
  width: 100%;
  height: 50px;
  cursor: grab;
  user-select: none;
  -webkit-user-select: none;
  overflow: hidden;
}

.drag-scroll-tag__container--dragging {
  cursor: grabbing;
}

.drag-scroll-tag__scroll {
  --offset: 0px;
  --animation-play-state: running;
  position: absolute;
  left: 0;
  top: 50%;
  display: flex;
  width: max-content;
  will-change: transform;
  transform: translate3d(var(--offset), -50%, 0);
  opacity: 0;
  visibility: hidden;
}

.drag-scroll-tag__scroll--ready {
  opacity: 1;
  visibility: visible;
  transition: opacity 0.3s ease-in;
}

.drag-scroll-tag__scroll--dragging {
  transition: none;
  animation: none !important;
}

.drag-scroll-tag__group {
  display: flex;
  gap: 20px;
  padding: 0 10px;
  min-width: 100%;
}

.drag-scroll-tag__scroll .drag-scroll-tag__group:last-child {
  position: absolute;
  left: 100%;
  top: 0;
}

.drag-scroll-tag__scroll--1.drag-scroll-tag__scroll--ready {
  animation: slide-tag-scroll-1 var(--scroll-duration) linear infinite;
  animation-play-state: var(--animation-play-state);
}

.drag-scroll-tag__scroll--2.drag-scroll-tag__scroll--ready {
  animation: slide-tag-scroll-2 var(--scroll-duration) linear infinite;
  animation-play-state: var(--animation-play-state);
}

.drag-scroll-tag__scroll--3.drag-scroll-tag__scroll--ready {
  animation: slide-tag-scroll-3 var(--scroll-duration) linear infinite;
  animation-play-state: var(--animation-play-state);
}

@keyframes slide-tag-scroll-1 {
  0% {
    transform: translate3d(var(--offset), -50%, 0);
  }
  100% {
    transform: translate3d(calc(var(--offset) - 100%), -50%, 0);
  }
}

@keyframes slide-tag-scroll-2 {
  0% {
    transform: translate3d(var(--offset), -50%, 0);
  }
  100% {
    transform: translate3d(calc(var(--offset) - 100%), -50%, 0);
  }
}

@keyframes slide-tag-scroll-3 {
  0% {
    transform: translate3d(var(--offset), -50%, 0);
  }
  100% {
    transform: translate3d(calc(var(--offset) - 100%), -50%, 0);
  }
}

.drag-scroll-tag__item {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  white-space: nowrap;
  transition: transform 0.2s;
}

.drag-scroll-tag__item:hover {
  transform: translateY(-2px);
}

.drag-scroll-tag__item img {
  width: 24px;
  height: 24px;
  margin-right: 8px;
}

.drag-scroll-tag__item span {
  font-size: 14px;
  color: #333;
}

.drag-scroll-tag__skeleton {
  padding: 0 16px;
  margin-bottom: 20px;
}

.drag-scroll-tag__skeleton-row {
  margin-bottom: 8px;
}

.drag-scroll-tag__skeleton-row:last-child {
  margin-bottom: 0;
}

.drag-scroll-tag__skeleton-items {
  display: flex;
}

.drag-scroll-tag__skeleton-item {
  flex: 1;
}

:deep(.van-skeleton) {
  width: 100%;
}

:deep(.van-skeleton__row) {
  height: 40px !important;
  margin: 0 !important;
  background: #f5f5f7;
  border-radius: 8px;
}
</style>