import MockAdapter from 'axios-mock-adapter'

import request from '@/utils/request'

export function createHttpMock() {
  return new MockAdapter(request)
}

export function ok(data) {
  return () => [200, { code: 20000, data }]
}
