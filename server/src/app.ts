import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import dotenv from 'dotenv'

dotenv.config()

const app = express()

const PORT = process.env.PORT || 5000

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

app.listen(PORT, () => {
  console.log(`ServEase API running on http://localhost:${PORT}`)
})