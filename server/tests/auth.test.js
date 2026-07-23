import { api } from './helpers/testApp.js'
import { createTestUser, TEST_PASSWORD } from './helpers/fixtures.js'

describe('Auth API', () => {
  let email
  let password

  beforeEach(async () => {
    const user = await createTestUser()
    email = user.email
    password = TEST_PASSWORD
  })

  it('POST /api/auth/signup — creates account', async () => {
    const newEmail = `signup-${Date.now()}@test.com`
    const res = await (await api())
      .post('/api/auth/signup')
      .send({
        email: newEmail,
        password: TEST_PASSWORD,
        name: 'Auth Test User',
        phone: '+998901234567',
      })
      .expect(201)

    expect(res.body.success).toBe(true)
    expect(res.body.token).toBeDefined()
    expect(res.body.user?.email || res.body.data?.user?.email).toBe(newEmail)
  })

  it('POST /api/auth/login — returns JWT', async () => {
    const res = await (await api())
      .post('/api/auth/login')
      .send({ email, password })
      .expect(200)

    expect(res.body.success).toBe(true)
    expect(res.body.token).toMatch(/^eyJ/)
  })

  it('POST /api/auth/login — rejects wrong password', async () => {
    const res = await (await api())
      .post('/api/auth/login')
      .send({ email, password: 'WrongPass1!' })
      .expect(401)

    expect(res.body.success).toBe(false)
    expect(res.body.statusCode).toBe(401)
  })

  it('GET /api/auth/me — requires authentication', async () => {
    await (await api()).get('/api/auth/me').expect(401)
  })

  it('GET /api/auth/me — returns profile with token', async () => {
    const login = await (await api())
      .post('/api/auth/login')
      .send({ email, password })

    const res = await (await api())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${login.body.token}`)
      .expect(200)

    expect(res.body.success).toBe(true)
    const profile = res.body.user || res.body.data?.user
    expect(profile.email).toBe(email)
  })

  it('POST /api/auth/signup — validation error for weak password', async () => {
    const res = await (await api())
      .post('/api/auth/signup')
      .send({ email: `weak-${Date.now()}@test.com`, password: 'short', name: 'Test' })
      .expect(400)

    expect(res.body.success).toBe(false)
    expect(res.body.statusCode).toBe(400)
  })

  it('POST /api/auth/refresh — rotates token with refresh cookie', async () => {
    const agent = await api()
    const login = await agent
      .post('/api/auth/login')
      .send({ email, password })
      .expect(200)

    const cookies = login.headers['set-cookie']
    const res = await agent
      .post('/api/auth/refresh')
      .set('Cookie', cookies)
      .expect(200)

    expect(res.body.token).toBeDefined()
    expect(res.body.token).not.toBe(login.body.token)
  })
})

describe('Auth controller — signup duplicate', () => {
  it('POST /api/auth/signup — conflict for duplicate email', async () => {
    const user = await createTestUser()
    const res = await (await api())
      .post('/api/auth/signup')
      .send({
        email: user.email,
        password: TEST_PASSWORD,
        name: 'Duplicate User',
        phone: '+998901234568',
      })
      .expect(409)

    expect(res.body.statusCode).toBe(409)
  })
})
