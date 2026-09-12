import { Resend } from 'resend'

type BookingEmailParams = {
  to: string
  customerName: string
  serviceName: string
  appointmentDate: string
  appointmentTime: string
  status: string
}

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY

  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not configured')
  }

  return new Resend(apiKey)
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function formatDate(date: string) {
  const parsedDate = new Date(`${date}T00:00:00`)

  if (Number.isNaN(parsedDate.getTime())) {
    return date
  }

  return new Intl.DateTimeFormat('en-PH', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(parsedDate)
}

function formatTime(time: string) {
  const [hourString, minuteString] = time.split(':')

  const hour = Number(hourString)
  const minute = Number(minuteString)

  if (
    Number.isNaN(hour) ||
    Number.isNaN(minute)
  ) {
    return time
  }

  const date = new Date()

  date.setHours(hour, minute, 0, 0)

  return new Intl.DateTimeFormat('en-PH', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date)
}

export async function sendBookingConfirmationEmail({
  to,
  customerName,
  serviceName,
  appointmentDate,
  appointmentTime,
  status,
}: BookingEmailParams) {
  const resend = getResendClient()

  const formattedStatus = capitalize(status)
  const formattedDate = formatDate(appointmentDate)
  const formattedTime = formatTime(appointmentTime)

  const { data, error } = await resend.emails.send({
    from: 'ServEase <onboarding@resend.dev>',
    to: [to],
    subject: `ServEase Booking ${formattedStatus}`,
    html: `
      <!DOCTYPE html>
      <html>
        <body
          style="
            margin:0;
            padding:0;
            background:#020617;
            font-family:Arial,Helvetica,sans-serif;
            color:#ffffff;
          "
        >
          <table
            width="100%"
            cellpadding="0"
            cellspacing="0"
            style="
              width:100%;
              background:#020617;
              padding:40px 20px;
            "
          >
            <tr>
              <td align="center">

                <table
                  width="100%"
                  cellpadding="0"
                  cellspacing="0"
                  style="
                    max-width:620px;
                    background:#0f172a;
                    border:1px solid #1e293b;
                    border-radius:24px;
                    overflow:hidden;
                  "
                >

                  <!-- HEADER -->
                  <tr>
                    <td
                      style="
                        padding:32px;
                        background:linear-gradient(
                          135deg,
                          #4f46e5,
                          #7c3aed,
                          #0891b2
                        );
                      "
                    >

                      <table
                        cellpadding="0"
                        cellspacing="0"
                        style="
                          width:52px;
                          height:52px;
                          border-radius:16px;
                          background:rgba(255,255,255,0.16);
                          border:1px solid rgba(255,255,255,0.28);
                        "
                      >
                        <tr>
                          <td
                            align="center"
                            valign="middle"
                            style="
                              font-size:25px;
                              font-weight:800;
                              color:#ffffff;
                              letter-spacing:-1px;
                            "
                          >
                            SE
                          </td>
                        </tr>
                      </table>

                      <div
                        style="
                          margin-top:18px;
                          font-size:13px;
                          font-weight:700;
                          letter-spacing:2.5px;
                          color:#dbeafe;
                        "
                      >
                        ServEase
                      </div>

                      <h1
                        style="
                          margin:8px 0 0;
                          font-size:30px;
                          line-height:1.2;
                          color:#ffffff;
                        "
                      >
                        Booking Confirmation
                      </h1>

                      <p
                        style="
                          margin:10px 0 0;
                          font-size:15px;
                          line-height:1.6;
                          color:#e0e7ff;
                        "
                      >
                        Your appointment request has been received successfully.
                      </p>

                    </td>
                  </tr>

                  <!-- BODY -->
                  <tr>
                    <td style="padding:32px;">

                      <p
                        style="
                          margin:0 0 8px;
                          font-size:16px;
                          color:#e2e8f0;
                        "
                      >
                        Hello
                        <strong style="color:#ffffff;">
                          ${customerName}
                        </strong>,
                      </p>

                      <p
                        style="
                          margin:0 0 24px;
                          font-size:14px;
                          line-height:1.7;
                          color:#94a3b8;
                        "
                      >
                        Here are the details of your ServEase booking.
                      </p>

                      <table
                        width="100%"
                        cellpadding="0"
                        cellspacing="0"
                        style="
                          background:#111827;
                          border:1px solid #1f2937;
                          border-radius:18px;
                          padding:20px;
                        "
                      >

                        <tr>
                          <td
                            style="
                              padding:12px 0;
                              font-size:14px;
                              color:#64748b;
                            "
                          >
                            Service
                          </td>

                          <td
                            align="right"
                            style="
                              padding:12px 0;
                              font-size:14px;
                              font-weight:600;
                              color:#ffffff;
                            "
                          >
                            ${serviceName}
                          </td>
                        </tr>

                        <tr>
                          <td
                            style="
                              padding:12px 0;
                              border-top:1px solid #1f2937;
                              font-size:14px;
                              color:#64748b;
                            "
                          >
                            Date
                          </td>

                          <td
                            align="right"
                            style="
                              padding:12px 0;
                              border-top:1px solid #1f2937;
                              font-size:14px;
                              font-weight:600;
                              color:#ffffff;
                            "
                          >
                            ${formattedDate}
                          </td>
                        </tr>

                        <tr>
                          <td
                            style="
                              padding:12px 0;
                              border-top:1px solid #1f2937;
                              font-size:14px;
                              color:#64748b;
                            "
                          >
                            Time
                          </td>

                          <td
                            align="right"
                            style="
                              padding:12px 0;
                              border-top:1px solid #1f2937;
                              font-size:14px;
                              font-weight:600;
                              color:#ffffff;
                            "
                          >
                            ${formattedTime}
                          </td>
                        </tr>

                        <tr>
                          <td
                            style="
                              padding:12px 0;
                              border-top:1px solid #1f2937;
                              font-size:14px;
                              color:#64748b;
                            "
                          >
                            Status
                          </td>

                          <td
                            align="right"
                            style="
                              padding:12px 0;
                              border-top:1px solid #1f2937;
                            "
                          >
                            <span
                              style="
                                display:inline-block;
                                padding:7px 13px;
                                border-radius:999px;
                                background:#312e81;
                                color:#c7d2fe;
                                font-size:12px;
                                font-weight:700;
                                letter-spacing:0.5px;
                              "
                            >
                              ${formattedStatus}
                            </span>
                          </td>
                        </tr>

                      </table>

                      <div
                        style="
                          margin-top:24px;
                          padding:16px 18px;
                          border-radius:16px;
                          background:#0c4a6e20;
                          border:1px solid #164e63;
                        "
                      >
                        <p
                          style="
                            margin:0;
                            font-size:13px;
                            line-height:1.6;
                            color:#bae6fd;
                          "
                        >
                          We’ll keep you updated if your appointment status changes.
                        </p>
                      </div>

                    </td>
                  </tr>

                  <!-- FOOTER -->
                  <tr>
                    <td
                      style="
                        padding:20px 32px;
                        background:#020617;
                        border-top:1px solid #1e293b;
                      "
                    >
                      <p
                        style="
                          margin:0;
                          font-size:12px;
                          color:#64748b;
                        "
                      >
                        © 2026 ServEase. All rights reserved.
                      </p>
                    </td>
                  </tr>

                </table>

              </td>
            </tr>
          </table>
        </body>
      </html>
    `,
  })

  if (error) {
    throw new Error(error.message)
  }

  return data
}