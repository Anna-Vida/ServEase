import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
export const app = express()

app.use(helmet())
app.use(cors())
app.use(express.json())
app.use(morgan('dev'))

app.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'ServEase API is running.',
  })
})

app.get('/api/health', (_req, res) => {
  res.status(200).json({
    success: true,
    status: 'healthy',
    service: 'ServEase API',
    timestamp: new Date().toISOString(),
  })
})
