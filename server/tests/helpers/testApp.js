import request from 'supertest'

let appInstance

export async function getTestApp() {
  if (!appInstance) {
    appInstance = (await import('../../src/app.js')).default
  }
  return appInstance
}

export async function api() {
  const app = await getTestApp()
  return request(app)
}
