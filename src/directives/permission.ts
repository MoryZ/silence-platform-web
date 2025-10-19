import { hasPermission } from '@/utils/permissionCheck'

export const permissionDirective = {
  mounted(el: HTMLElement, binding: any) {
    checkPermission(el, binding)
  },
  
  updated(el: HTMLElement, binding: any) {
    checkPermission(el, binding)
  }
}

function checkPermission(el: HTMLElement, binding: any) {
  try {
    const { value } = binding
    
    if (value && !hasPermission(value)) {
      // 更安全的方式：设置 display: none 而不是移除元素
      el.style.display = 'none'
    } else {
      // 恢复显示
      el.style.display = ''
    }
  } catch (error) {
    console.warn('权限检查失败:', error)
    // 出错时默认显示元素
    el.style.display = ''
  }
}
