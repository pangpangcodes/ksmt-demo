import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-client'

// GET - Get vendors shared with a couple
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { data, error } = await supabase
      .from('shared_vendors')
      .select('*')
      .eq('planner_couple_id', id)
      .order('vendor_type', { ascending: true })
      .order('vendor_name', { ascending: true })

    if (error) {
      console.error('Failed to fetch vendors:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch vendors' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data || []
    })
  } catch (error) {
    console.error('Get vendors error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch vendors' },
      { status: 500 }
    )
  }
}

// POST - Add vendor to couple
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const vendorData = await request.json()

    const { data, error } = await supabase
      .from('shared_vendors')
      .insert({
        ...vendorData,
        planner_couple_id: id,
      })
      .select()
      .single()

    if (error) {
      console.error('Failed to add vendor:', error)
      return NextResponse.json(
        { error: 'Failed to add vendor' },
        { status: 500 }
      )
    }

    // Log activity
    await supabase.from('vendor_activity').insert({
      planner_couple_id: id,
      shared_vendor_id: data.id,
      action: 'vendor_shared',
      actor: 'planner',
    })

    return NextResponse.json(data)
  } catch (error) {
    console.error('Add vendor error:', error)
    return NextResponse.json(
      { error: 'Failed to add vendor' },
      { status: 500 }
    )
  }
}
