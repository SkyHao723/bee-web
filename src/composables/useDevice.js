// src/composables/useDevice.js
import { useBreakpoints } from '@vueuse/core'

export function useDevice() {
  const breakpoints = useBreakpoints({
    mobile: 768  // 小于等于768px视为移动端
  })

  const isMobile = breakpoints.smallerOrEqual('mobile')

  return { isMobile }
}
