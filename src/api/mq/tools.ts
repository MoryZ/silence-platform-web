// 通用工具函数

// 格式化时间戳
export const formatTimestamp = (timestamp: number): string => {
  return new Date(timestamp).toLocaleString()
}

// 格式化日期
export const formatDate = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 格式化时间
export const formatTime = (date: Date): string => {
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return `${hours}:${minutes}:${seconds}`
}

// 格式化日期时间
export const formatDateTime = (date: Date): string => {
  return `${formatDate(date)} ${formatTime(date)}`
}

// 格式化数字
export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat().format(num)
}

// 格式化文件大小
export const formatFileSize = (size: number): string => {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`
  if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(2)} MB`
  return `${(size / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

// 格式化持续时间
export const formatDuration = (ms: number): string => {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days}天${hours % 24}小时`
  if (hours > 0) return `${hours}小时${minutes % 60}分钟`
  if (minutes > 0) return `${minutes}分钟${seconds % 60}秒`
  return `${seconds}秒`
}

// 格式化百分比
export const formatPercent = (value: number): string => {
  return `${(value * 100).toFixed(1)}%`
}

// 生成随机ID
export const generateId = (): string => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

// 深拷贝对象
export const deepClone = <T>(obj: T): T => {
  if (obj === null || typeof obj !== 'object') return obj
  if (obj instanceof Date) return new Date(obj) as T
  if (obj instanceof Array) return obj.map(item => deepClone(item)) as T
  if (obj instanceof Object) {
    const copy = {} as T
    Object.keys(obj).forEach(key => {
      copy[key as keyof T] = deepClone(obj[key as keyof T])
    })
    return copy
  }
  throw new Error(`Unable to copy obj! Its type isn't supported.`)
}

// 防抖函数
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: number | undefined
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = window.setTimeout(() => func(...args), wait)
  }
}

// 节流函数
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: number | undefined
  let previous = 0
  return (...args: Parameters<T>) => {
    const now = Date.now()
    if (!previous) previous = now
    const remaining = wait - (now - previous)
    if (remaining <= 0 || remaining > wait) {
      if (timeout) {
        clearTimeout(timeout)
        timeout = undefined
      }
      previous = now
      func(...args)
    } else if (!timeout) {
      timeout = window.setTimeout(() => {
        previous = Date.now()
        timeout = undefined
        func(...args)
      }, remaining)
    }
  }
}

// 下载文件
export const downloadFile = (blob: Blob, filename: string): void => {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

// 复制文本到剪贴板
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (err) {
    console.error('Failed to copy text:', err)
    return false
  }
}

// 解析URL参数
export const parseUrlParams = (url: string): Record<string, string> => {
  const params: Record<string, string> = {}
  const searchParams = new URLSearchParams(new URL(url).search)
  for (const [key, value] of searchParams) {
    params[key] = value
  }
  return params
}

// 构建URL参数
export const buildUrlParams = (params: Record<string, any>): string => {
  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value))
    }
  })
  return searchParams.toString()
} 