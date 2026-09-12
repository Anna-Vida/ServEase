import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import Login from './Login'

// Rendering the form should not require Supabase credentials or a connection.
vi.mock('../lib/supabase', () => ({ supabase: {} }))

describe('Login page', () => {
  it('renders the login form', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    )

    expect(
      screen.getByRole('heading', { name: /sign in to your workspace/i })
    ).toBeInTheDocument()

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()

    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument()

    expect(
      screen.getByRole('button', { name: /sign in/i })
    ).toBeInTheDocument()
  })
})
