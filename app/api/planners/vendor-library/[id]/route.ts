import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-client'
import { VendorLibrary, UpdateVendorLibraryInput } from '@/types/planner'

/**
 * GET /api/planner/vendor-library/[id]
 * Get a single vendor from the library
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Auth check
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token || token !== process.env.PLANNER_PASSWORD) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // supabase is already imported
    const { id } = await params

    const { data, error } = await supabase
      .from('planner_vendor_library')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      return NextResponse.json(
        { success: false, error: 'Vendor not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data as VendorLibrary
    })
  } catch (error) {
    console.error('Vendor library GET error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/planner/vendor-library/[id]
 * Update a vendor in the library
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Auth check
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token || token !== process.env.PLANNER_PASSWORD) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    const body: UpdateVendorLibraryInput = await request.json()
    // supabase is already imported

    // Build update object (only include provided fields)
    const updateData: any = {}
    if (body.vendor_type !== undefined) updateData.vendor_type = body.vendor_type
    if (body.vendor_name !== undefined) updateData.vendor_name = body.vendor_name
    if (body.contact_name !== undefined) updateData.contact_name = body.contact_name
    if (body.email !== undefined) updateData.email = body.email
    if (body.phone !== undefined) updateData.phone = body.phone
    if (body.website !== undefined) updateData.website = body.website
    if (body.instagram !== undefined) updateData.instagram = body.instagram
    if (body.location !== undefined) updateData.location = body.location
    if (body.tags !== undefined) updateData.tags = body.tags
    if (body.portfolio_images !== undefined) updateData.portfolio_images = body.portfolio_images
    if (body.pricing !== undefined) updateData.pricing = body.pricing
    if (body.description !== undefined) updateData.description = body.description
    if (body.is_active !== undefined) updateData.is_active = body.is_active

    // Check if vendor name is being changed to a duplicate
    if (body.vendor_name) {
      const { data: existing } = await supabase
        .from('planner_vendor_library')
        .select('id, vendor_name')
        .eq('vendor_name', body.vendor_name)
        .neq('id', id)
        .eq('is_active', true)
        .maybeSingle()

      if (existing) {
        return NextResponse.json(
          {
            success: false,
            error: `A vendor named "${body.vendor_name}" already exists in your library`
          },
          { status: 409 }
        )
      }
    }

    const { data, error } = await supabase
      .from('planner_vendor_library')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error || !data) {
      console.error('Database error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to update vendor' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data as VendorLibrary
    })
  } catch (error) {
    console.error('Vendor library PATCH error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/planner/vendor-library/[id]
 * Archive (soft delete) a vendor from the library
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Auth check
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token || token !== process.env.PLANNER_PASSWORD) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // supabase is already imported
    const { id } = await params

    // Soft delete by setting is_active to false
    const { data, error } = await supabase
      .from('planner_vendor_library')
      .update({ is_active: false })
      .eq('id', id)
      .select()
      .single()

    if (error || !data) {
      console.error('Database error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to archive vendor' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Vendor archived successfully',
      data: data as VendorLibrary
    })
  } catch (error) {
    console.error('Vendor library DELETE error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
