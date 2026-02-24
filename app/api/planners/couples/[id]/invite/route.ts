import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-client'
import { sendSharedWorkspaceInvitation } from '@/lib/email'

/**
 * POST /api/planner/couples/[id]/invite
 * Send email invitation to couple for shared workspace
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: coupleId } = await params

    // Fetch couple details
    const { data: couple, error: fetchError } = await supabase
      .from('planner_couples')
      .select('*')
      .eq('id', coupleId)
      .single()

    if (fetchError || !couple) {
      return NextResponse.json(
        { error: 'Couple not found' },
        { status: 404 }
      )
    }

    if (!couple.couple_email) {
      return NextResponse.json(
        { error: 'Couple email not provided' },
        { status: 400 }
      )
    }

    // Read optional vendor context from request body
    let vendorCategories: { type: string; count: number }[] = []
    let customMessage: string | undefined
    let plannerName: string | undefined
    try {
      const body = await request.json()
      vendorCategories = body.vendorCategories ?? []
      customMessage = body.customMessage || undefined
      plannerName = body.plannerName || undefined
    } catch {
      // body is optional - proceed with defaults
    }

    // Send invitation email
    const result = await sendSharedWorkspaceInvitation(
      couple.couple_email,
      couple.couple_names,
      couple.share_link_id,
      plannerName,
      vendorCategories,
      customMessage
    )

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to send email' },
        { status: 500 }
      )
    }

    // Log activity
    await supabase.from('vendor_activity').insert({
      planner_couple_id: coupleId,
      shared_vendor_id: null,
      action: 'invitation_sent',
      actor: 'planner',
      new_value: couple.couple_email
    })

    return NextResponse.json({
      success: true,
      message: `Invitation sent to ${couple.couple_email}`
    })

  } catch (error) {
    console.error('Error sending invitation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
