import { config } from '@vue/test-utils'

config.global.stubs = {
  transition: false,
  'router-link': true,
  'router-view': true
}

class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

if (!global.ResizeObserver) {
  global.ResizeObserver = ResizeObserver
}

if (!global.matchMedia) {
  global.matchMedia = () => ({
    matches: false,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    dispatchEvent() {
      return false
    }
  })
}
