import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-client'

interface VendorWithTags {
  id: string
  vendor_name: string
  vendor_type: string
  tags: string[] | null
}

/**
 * POST /api/planner/vendor-library/delete-all-tags
 * Delete all tags from all vendors in the library
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

    // Get dry_run parameter
    const { dry_run } = await request.json().catch(() => ({ dry_run: false }))

    // Fetch all vendors with tags
    const { data: vendors, error: fetchError } = await supabase
      .from('planner_vendor_library')
      .select('id, vendor_name, vendor_type, tags')
      .eq('is_active', true)
      .not('tags', 'is', null)

    if (fetchError) {
      throw fetchError
    }

    if (!vendors || vendors.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          total_vendors: 0,
          deleted: 0,
          vendors_affected: []
        }
      })
    }

    const vendorsAffected: Array<{
      vendor_name: string
      vendor_type: string
      tags_deleted: string[]
    }> = []

    // Delete tags from each vendor
    for (const vendor of vendors as VendorWithTags[]) {
      if (!vendor.tags || vendor.tags.length === 0) continue

      vendorsAffected.push({
        vendor_name: vendor.vendor_name,
        vendor_type: vendor.vendor_type,
        tags_deleted: vendor.tags
      })

      if (!dry_run) {
        // Set tags to null
        const { error: updateError } = await supabase
          .from('planner_vendor_library')
          .update({ tags: null })
          .eq('id', vendor.id)

        if (updateError) {
          console.error(`Error deleting tags from ${vendor.vendor_name}:`, updateError)
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        total_vendors: vendors.length,
        deleted: vendorsAffected.length,
        vendors_affected: vendorsAffected,
        dry_run
      }
    })

  } catch (error) {
    console.error('Error deleting tags:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete tags' },
      { status: 500 }
    )
  }
}
