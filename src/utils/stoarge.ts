/**
 * 封装localStorage工具类，提供类型安全和错误处理
 */
export const ls = {
  /**
   * 将数据存储到localStorage
   * @param key 存储键名
   * @param value 要存储的数据
   */
  set(key: string, value: any): void {
    try {
      const stringValue = JSON.stringify(value);
      localStorage.setItem(key, stringValue);
    } catch (error) {
      console.error(`Error saving to localStorage key ${key}:`, error);
    }
  },

  /**
   * 从localStorage获取数据
   * @param key 存储键名
   * @returns 存储的数据，如果不存在或解析出错则返回null
   */
  get<T>(key: string): T | null {
    try {
      if (!localStorage.hasOwnProperty(key)) {
        return null;
      }
      
      const value = localStorage.getItem(key);
      if (!value) {
        return null;
      }
      
      return JSON.parse(value) as T;
    } catch (error) {
      console.error(`Error parsing localStorage key ${key}:`, error);
      return null;
    }
  },

  /**
   * 删除localStorage中的数据
   * @param key 要删除的键名
   */
  remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing localStorage key ${key}:`, error);
    }
  },

  /**
   * 清空localStorage中的所有数据
   */
  clear(): void {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  },
  
  /**
   * 检查localStorage中是否存在指定键
   * @param key 要检查的键名
   * @returns 是否存在该键
   */
  has(key: string): boolean {
    return localStorage.hasOwnProperty(key);
  }
}


