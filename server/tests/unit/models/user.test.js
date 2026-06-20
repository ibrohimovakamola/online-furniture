import bcrypt from 'bcryptjs'
import User from '../../../src/models/User.js'
import { createTestUser, TEST_PASSWORD } from '../../helpers/fixtures.js'

describe('User Model', () => {
  it('should hash password on save', async () => {
    const user = await createTestUser()
    const stored = await User.findById(user._id).select('+password')
    expect(stored.password).not.toBe(TEST_PASSWORD)
    expect(stored.password.startsWith('$2')).toBe(true)
  })

  it('should compare password correctly', async () => {
    const user = await createTestUser()
    const withPassword = await User.findById(user._id).select('+password')
    expect(await withPassword.comparePassword(TEST_PASSWORD)).toBe(true)
    expect(await withPassword.comparePassword('wrong-password')).toBe(false)
  })

  it('should not re-hash password when other fields change', async () => {
    const user = await createTestUser()
    const before = await User.findById(user._id).select('+password')
    user.firstName = 'Updated'
    await user.save()
    const after = await User.findById(user._id).select('+password')
    expect(after.password).toBe(before.password)
  })

  it('should enforce unique email', async () => {
    const email = `dup-${Date.now()}@test.com`
    await createTestUser({ email })
    await expect(createTestUser({ email })).rejects.toThrow(/duplicate|E11000/i)
  })

  it('should return safe object without password', async () => {
    const user = await createTestUser()
    const safe = user.toSafeObject()
    expect(safe.email).toBe(user.email)
    expect(safe.password).toBeUndefined()
  })

  it('should hash with bcrypt rounds from env', async () => {
    const plain = 'AnotherPass2!'
    const user = await User.create({
      firstName: 'Round',
      lastName: 'Test',
      email: `rounds-${Date.now()}@test.com`,
      password: plain,
    })
    const stored = await User.findById(user._id).select('+password')
    expect(await bcrypt.compare(plain, stored.password)).toBe(true)
  })
})
