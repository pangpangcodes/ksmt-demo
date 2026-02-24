import nodemailer from 'nodemailer'
import fs from 'fs'
import path from 'path'

function getLogoDataUri(): string {
  try {
    const logoPath = path.join(process.cwd(), 'public', 'images', 'ksmt-logo.jpg')
    const data = fs.readFileSync(logoPath)
    return `data:image/jpeg;base64,${data.toString('base64')}`
  } catch {
    return ''
  }
}

if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
  console.warn('Warning: Gmail credentials not set. Email sending will fail.')
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
})

interface VendorCategory {
  type: string
  count: number
}

export async function sendSharedWorkspaceInvitation(
  toEmail: string,
  coupleNames: string,
  shareLinkId: string,
  plannerName: string = 'La Bella Novia Wedding Planning',
  vendorCategories: VendorCategory[] = [],
  customMessage?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const workspaceLink = `${siteUrl}/s/${shareLinkId}`
    const logoUrl = getLogoDataUri()

    const emailFrom = process.env.GMAIL_USER || 'noreply@example.com'

    const bodyFont = 'Nunito, -apple-system, BlinkMacSystemFont, sans-serif'
    const headingFont = '"Playfair Display", Georgia, serif'
    const green = '#1b3b2b'

    const vendorListHtml = vendorCategories.length > 0
      ? vendorCategories.map(cat =>
          `<tr>
            <td style="padding: 0 0 12px 0; vertical-align: top; width: 24px;">
              <span style="font-weight: 600; font-size: 16px; color: ${green};">&#10003;</span>
            </td>
            <td style="padding: 0 0 12px 0; font-size: 14px; color: #44403c; line-height: 1.625; font-family: ${bodyFont};">
              ${cat.count} vendor${cat.count !== 1 ? 's' : ''} for ${cat.type}
            </td>
          </tr>`
        ).join('')
      : `<tr>
          <td style="padding: 0 0 12px 0; vertical-align: top; width: 24px;"><span style="font-weight: 600; font-size: 16px; color: ${green};">&#10003;</span></td>
          <td style="padding: 0 0 12px 0; font-size: 14px; color: #44403c; line-height: 1.625; font-family: ${bodyFont};">Vendor contact information</td>
        </tr>
        <tr>
          <td style="padding: 0 0 12px 0; vertical-align: top; width: 24px;"><span style="font-weight: 600; font-size: 16px; color: ${green};">&#10003;</span></td>
          <td style="padding: 0 0 12px 0; font-size: 14px; color: #44403c; line-height: 1.625; font-family: ${bodyFont};">Pricing estimates</td>
        </tr>
        <tr>
          <td style="padding: 0 0 12px 0; vertical-align: top; width: 24px;"><span style="font-weight: 600; font-size: 16px; color: ${green};">&#10003;</span></td>
          <td style="padding: 0 0 12px 0; font-size: 14px; color: #44403c; line-height: 1.625; font-family: ${bodyFont};">Personal recommendations</td>
        </tr>
        <tr>
          <td style="padding: 0; vertical-align: top; width: 24px;"><span style="font-weight: 600; font-size: 16px; color: ${green};">&#10003;</span></td>
          <td style="padding: 0; font-size: 14px; color: #44403c; line-height: 1.625; font-family: ${bodyFont};">Easy status tracking</td>
        </tr>`

    const customMessageHtml = customMessage ? `
      <div style="background-color: #fafaf9; border: 1px solid #e7e5e4; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
        <p style="font-size: 12px; font-weight: 600; color: #57534e; text-transform: uppercase; letter-spacing: 0.1em; margin: 0 0 12px 0; font-family: ${bodyFont};">Note from your planner:</p>
        <p style="font-size: 14px; color: #44403c; line-height: 1.625; font-style: italic; margin: 0; font-family: ${bodyFont};">"${customMessage}"</p>
      </div>` : ''

    const emailHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f4;">
<div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 12px; overflow: hidden;">

  <!-- Header -->
  <div style="background-color: ${green}; padding: 24px;">
    <table cellpadding="0" cellspacing="0" border="0">
      <tr>
        ${logoUrl ? `<td style="padding-right: 12px; vertical-align: middle;">
          <img src="${logoUrl}" alt="ksmt" width="40" height="40" style="display: block; border-radius: 4px;" />
        </td>` : ''}
        <td style="vertical-align: middle;">
          <span style="font-size: 24px; font-family: ${headingFont}; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: white;">KSMT</span>
        </td>
      </tr>
    </table>
  </div>

  <!-- Body -->
  <div style="padding: 32px; background-color: white;">

    <!-- Greeting -->
    <h1 style="font-size: 30px; font-weight: 600; color: #111827; margin: 0 0 24px 0; font-family: ${headingFont};">Hi ${coupleNames}!</h1>

    <!-- Main message -->
    <p style="font-size: 16px; color: #374151; line-height: 1.625; margin: 0 0 24px 0; font-family: ${bodyFont};">
      ${plannerName ? `Your planner at ${plannerName} has curated some wonderful vendor recommendations for your special day. Check them out in your private workspace!` : `I've curated some wonderful vendor recommendations for your special day. Check them out in your private workspace!`}
    </p>

    ${customMessageHtml}

    <!-- What's Included box -->
    <div style="background-color: #fafaf9; border: 1px solid #e7e5e4; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
      <p style="font-size: 12px; font-weight: 600; color: #57534e; text-transform: uppercase; letter-spacing: 0.1em; margin: 0 0 16px 0; font-family: ${bodyFont};">What's Included:</p>
      <table cellpadding="0" cellspacing="0" border="0" style="width: 100%;">
        ${vendorListHtml}
      </table>
    </div>

    <!-- CTA Button -->
    <div style="padding: 8px 0 24px 0;">
      <a href="${workspaceLink}" style="display: inline-block; padding: 12px 24px; color: white; font-size: 14px; font-weight: 600; border-radius: 8px; text-decoration: none; background-color: ${green}; font-family: ${bodyFont};">View My Vendors</a>
    </div>

    <!-- Privacy note -->
    <p style="font-size: 14px; color: #57534e; line-height: 1.625; margin: 0 0 24px 0; font-family: ${bodyFont};">
      This is your private workspace - only you can see and manage these vendors.
    </p>

    <!-- Footer -->
    <div style="padding-top: 24px; border-top: 1px solid #e7e5e4;">
      <p style="font-size: 14px; color: #57534e; line-height: 1.625; margin: 0; font-family: ${bodyFont};">
        Happy Planning!<br />${plannerName}
      </p>
    </div>

  </div>
</div>
</body>
</html>`

    await transporter.sendMail({
      from: `"ksmt" <${emailFrom}>`,
      to: toEmail,
      subject: `${coupleNames}: Your Wedding Vendor Recommendations`,
      html: emailHtml,
    })

    return { success: true }
  } catch (error) {
    console.error('Unexpected email error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email'
    }
  }
}

export async function sendMagicLink(
  toEmail: string,
  guestName: string,
  token: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const magicLink = `${siteUrl}/rsvp/view?token=${token}`

    const emailFrom = process.env.GMAIL_USER || 'noreply@example.com'

    // Create HTML email content directly
    const emailHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f0fdf4; margin: 0; padding: 20px;">
<div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
<div style="padding: 30px 30px 30px 30px;">
<p style="font-size: 16px; color: #374151; margin: 0 0 8px 0;">Hi ${guestName}!</p>
<p style="font-size: 16px; color: #374151; line-height: 1.5; margin: 0 0 20px 0;">You requested to view your RSVP to Monica and Kevin's wedding. Click the button below to access your submission.</p>
<div style="text-align: center; margin: 20px 0;">
<a href="${magicLink}" style="display: inline-block; background-color: #bbf7d0; color: #111827; padding: 8px 24px; text-decoration: none; border-radius: 9999px; font-weight: 600; font-size: 14px;">View My RSVP</a>
</div>
<p style="font-size: 12px; color: #6b7280; line-height: 1.5; margin: 20px 0 0 0; padding-top: 20px; border-top: 1px solid #e5e7eb;">This link will expire in 24 hours. If you didn't request this, you can safely ignore this email.</p>
</div>
<div style="background-color: #1f2937; padding: 12px; text-align: center;">
<p style="font-size: 14px; color: white; margin: 0; font-family: Georgia, 'Times New Roman', serif;">❤️ Sent with love from Monica and Kevin</p>
</div>
</div>
</body>
</html>`

    await transporter.sendMail({
      from: `"Monica & Kevin's Wedding" <${emailFrom}>`,
      to: toEmail,
      subject: 'View Your Wedding RSVP',
      html: emailHtml,
    })

    return { success: true }
  } catch (error) {
    console.error('Unexpected email error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email'
    }
  }
}
