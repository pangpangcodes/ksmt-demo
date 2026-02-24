import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-client'
import { sendSharedWorkspaceInvitation } from '@/lib/email'

// POST - Send invitation email to couple
export async function POST(request: Request) {
  try {
    const { couple_id, couple_email, couple_names, share_link } = await request.json()

    // Validate required fields
    if (!couple_id || !couple_names || !share_link) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (!couple_email) {
      return NextResponse.json(
        { error: 'Couple email is required to send invitation' },
        { status: 400 }
      )
    }

    // Extract share_link_id from full URL if needed
    const shareLinkId = share_link.includes('/shared/')
      ? share_link.split('/shared/')[1]
      : share_link

    // Send actual email
    const result = await sendSharedWorkspaceInvitation(
      couple_email,
      couple_names,
      shareLinkId
    )

    if (!result.success) {
      console.error('Email sending failed:', result.error)
      return NextResponse.json(
        { error: result.error || 'Failed to send email' },
        { status: 500 }
      )
    }

    // Log activity
    await supabase.from('vendor_activity').insert({
      planner_couple_id: couple_id,
      shared_vendor_id: null,
      action: 'invitation_sent',
      actor: 'planner',
      new_value: couple_email
    })

    console.log('✅ Invitation email sent successfully to:', couple_email)

    return NextResponse.json({
      success: true,
      message: `Invitation sent to ${couple_email}`,
      email_sent_to: couple_email,
    })
  } catch (error) {
    console.error('Send invitation error:', error)
    return NextResponse.json(
      { error: 'Failed to send invitation' },
      { status: 500 }
    )
  }
}
