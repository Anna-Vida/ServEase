import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { app } from './app.js'

describe('ServEase API', () => {
  describe('GET /api/health', () => {
    it('returns API health information', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.status).toBe('healthy')
      expect(response.body.service).toBe('ServEase API')

      expect(response.body.timestamp).toBeDefined()
      expect(
        Number.isNaN(Date.parse(response.body.timestamp))
      ).toBe(false)
    })
  })

  describe('GET /', () => {
    it('returns the API welcome response', async () => {
      const response = await request(app)
        .get('/')
        .expect(200)

      expect(response.body).toEqual({
        success: true,
        message: 'ServEase API is running.',
      })
    })
  })
})
