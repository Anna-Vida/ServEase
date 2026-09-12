const API_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:5000'

type BookingConfirmationResult = {
  success: boolean
  message: string
  emailId?: string | null
}

export async function sendBookingConfirmation(
  bookingId: string,
  accessToken: string,
): Promise<BookingConfirmationResult> {
  const response = await fetch(
    `${API_URL}/api/notifications/booking-confirmation`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ bookingId }),
    },
  )

  const data = (await response.json()) as BookingConfirmationResult

  if (!response.ok) {
    throw new Error(
      data.message || 'Failed to send booking confirmation.',
    )
  }

  return data
}
