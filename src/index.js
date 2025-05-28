/* eslint-disable */
import DragScrollingTags from './components/DragScrollingTags.vue'

// 安装方法
const install = function (Vue) {
  if (install.installed) return
  install.installed = true
  Vue.component('DragScrollingTags', DragScrollingTags)
}

// 自动安装
if (typeof window !== 'undefined' && window.Vue) {
  install(window.Vue)
}

export default {
  install,
  DragScrollingTags
}