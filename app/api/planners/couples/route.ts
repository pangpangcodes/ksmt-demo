import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { CreatePlannerCoupleInput, PlannerCouple } from '@/types/planner'

// Create server-side Supabase client with service role (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// GET - List all couples
export async function GET(request: NextRequest) {
  try {
    // Auth check
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token || token !== process.env.PLANNER_PASSWORD) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('planner_couples')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Failed to fetch couples:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch couples' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data || []
    })
  } catch (error) {
    console.error('Get couples error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch couples' },
      { status: 500 }
    )
  }
}

// POST - Create a new couple
export async function POST(request: NextRequest) {
  try {
    // Auth check
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token || token !== process.env.PLANNER_PASSWORD) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const input: CreatePlannerCoupleInput = await request.json()

    // Validate required fields
    if (!input.couple_names || input.couple_names.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Couple names are required' },
        { status: 400 }
      )
    }

    // Generate unique share link ID
    const shareLinkId = crypto.randomUUID()

    // Prepare couple data
    const coupleData = {
      couple_names: input.couple_names.trim(),
      couple_email: input.couple_email?.trim() || null,
      wedding_date: input.wedding_date || null,
      wedding_location: input.wedding_location?.trim() || null,
      notes: input.notes?.trim() || null,
      share_link_id: shareLinkId,
      is_active: true,
    }

    // Insert into database using admin client (bypasses RLS)
    const { data, error } = await supabaseAdmin
      .from('planner_couples')
      .insert(coupleData)
      .select()
      .single()

    if (error) {
      console.error('Failed to create couple:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to create couple' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data as PlannerCouple
    }, { status: 201 })
  } catch (error) {
    console.error('Create couple error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create couple' },
      { status: 500 }
    )
  }
}
