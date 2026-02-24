import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-client'
import { VendorLibrary, CreateVendorLibraryInput } from '@/types/planner'

/**
 * GET /api/planner/vendor-library
 * List all vendors in the planner's library with optional filters
 */
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

    const { searchParams } = new URL(request.url)

    // Get filter parameters
    const vendorType = searchParams.get('type')
    const location = searchParams.get('location')
    const tags = searchParams.get('tags')
    const search = searchParams.get('search')

    // Build base query
    let query: any = supabase
      .from('planner_vendor_library')
      .select('*')
      .eq('is_active', true)

    // Apply filters
    if (vendorType) {
      query = query.eq('vendor_type', vendorType)
    }

    if (location) {
      query = query.ilike('location', `%${location}%`)
    }

    if (tags) {
      const tagArray = tags.split(',').map(t => t.trim())
      query = query.overlaps('tags', tagArray)
    }

    if (search) {
      query = query.or(`vendor_name.ilike.%${search}%,contact_name.ilike.%${search}%,email.ilike.%${search}%`)
    }

    // Execute query with ordering
    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch vendors' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data as VendorLibrary[]
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
 * POST /api/planner/vendor-library
 * Create a new vendor in the library
 */
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

    const body: CreateVendorLibraryInput = await request.json()

    // Validation
    if (!body.vendor_type || !body.vendor_name) {
      return NextResponse.json(
        { success: false, error: 'vendor_type and vendor_name are required' },
        { status: 400 }
      )
    }

    // supabase is already imported

    // Check for duplicate vendor name
    const { data: existing } = await supabase
      .from('planner_vendor_library')
      .select('id, vendor_name')
      .eq('vendor_name', body.vendor_name)
      .eq('is_active', true)
      .maybeSingle()

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: `A vendor named "${body.vendor_name}" already exists in your library`,
          duplicate_id: existing.id
        },
        { status: 409 }
      )
    }

    // Create vendor
    const { data, error } = await supabase
      .from('planner_vendor_library')
      .insert({
        vendor_type: body.vendor_type,
        vendor_name: body.vendor_name,
        contact_name: body.contact_name || null,
        email: body.email || null,
        phone: body.phone || null,
        website: body.website || null,
        instagram: body.instagram || null,
        location: body.location || null,
        tags: body.tags || null,
        portfolio_images: body.portfolio_images || null,
        pricing: body.pricing || null,
        description: body.description || null,
        is_active: true
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to create vendor' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data as VendorLibrary
    }, { status: 201 })
  } catch (error) {
    console.error('Vendor library POST error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
