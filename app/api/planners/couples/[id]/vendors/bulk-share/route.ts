import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-client'

/**
 * POST /api/planner/couples/[id]/vendors/bulk-share
 * Share multiple vendors from library with a couple
 */
export async function POST(
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
    const body: {
      vendor_ids: string[]
      custom_notes?: Record<string, string> // vendor_id -> custom note
    } = await request.json()

    if (!body.vendor_ids || !Array.isArray(body.vendor_ids) || body.vendor_ids.length === 0) {
      return NextResponse.json(
        { success: false, error: 'vendor_ids array is required' },
        { status: 400 }
      )
    }

    // supabase is already imported
    const coupleId = id

    // Verify couple exists
    const { data: couple, error: coupleError } = await supabase
      .from('planner_couples')
      .select('id')
      .eq('id', coupleId)
      .single()

    if (coupleError || !couple) {
      return NextResponse.json(
        { success: false, error: 'Couple not found' },
        { status: 404 }
      )
    }

    // Fetch vendor details from library
    const { data: libraryVendors, error: vendorsError } = await supabase
      .from('planner_vendor_library')
      .select('*')
      .in('id', body.vendor_ids)
      .eq('is_active', true)

    if (vendorsError) {
      console.error('Error fetching vendors:', vendorsError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch vendors from library' },
        { status: 500 }
      )
    }

    if (!libraryVendors || libraryVendors.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid vendors found in library' },
        { status: 404 }
      )
    }

    // Check for already shared vendors
    const { data: existingShares } = await supabase
      .from('shared_vendors')
      .select('vendor_library_id')
      .eq('planner_couple_id', coupleId)
      .in('vendor_library_id', body.vendor_ids)

    const existingVendorIds = new Set(
      existingShares?.map(s => s.vendor_library_id).filter(Boolean) || []
    )

    // Prepare shared vendor records
    const sharedVendorsToCreate = libraryVendors
      .filter(vendor => !existingVendorIds.has(vendor.id))
      .map(vendor => ({
        planner_couple_id: coupleId,
        vendor_library_id: vendor.id,
        // Copy fields from library vendor for backward compatibility
        vendor_name: vendor.vendor_name,
        vendor_type: vendor.vendor_type,
        contact_name: vendor.contact_name,
        email: vendor.email,
        phone: vendor.phone,
        instagram: vendor.instagram,
        website: vendor.website,
        estimated_cost_eur: vendor.vendor_currency === 'EUR' ? vendor.estimated_cost : null,
        estimated_cost_usd: vendor.vendor_currency === 'USD' ? vendor.estimated_cost : null,
        // Use custom note if provided, otherwise null (will fall back to library default_note on read)
        custom_note: body.custom_notes?.[vendor.id] || null,
        couple_status: null,
        couple_note: null
      }))

    if (sharedVendorsToCreate.length === 0) {
      return NextResponse.json(
        {
          success: true,
          message: 'All selected vendors are already shared with this couple',
          data: {
            shared: 0,
            skipped: body.vendor_ids.length
          }
        }
      )
    }

    // Bulk insert shared vendors
    const { data: createdShares, error: insertError } = await supabase
      .from('shared_vendors')
      .insert(sharedVendorsToCreate)
      .select()

    if (insertError) {
      console.error('Error creating shared vendors:', insertError)
      return NextResponse.json(
        { success: false, error: 'Failed to share vendors' },
        { status: 500 }
      )
    }

    // Log activity for each shared vendor
    const activities = createdShares?.map(share => ({
      planner_couple_id: coupleId,
      shared_vendor_id: share.id,
      action: 'vendor_shared',
      actor: 'planner',
      new_value: share.vendor_name
    }))

    if (activities && activities.length > 0) {
      await supabase.from('vendor_activity').insert(activities)
    }

    return NextResponse.json({
      success: true,
      message: `Successfully shared ${createdShares?.length || 0} vendor(s)`,
      data: {
        shared: createdShares?.length || 0,
        skipped: existingVendorIds.size,
        vendors: createdShares
      }
    }, { status: 201 })
  } catch (error) {
    console.error('Bulk share error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
