import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-client'
import { normalizeTags } from '@/lib/tagUtils'

interface VendorWithTags {
  id: string
  vendor_name: string
  vendor_type: string
  tags: string[] | null
}

/**
 * POST /api/planner/vendor-library/normalize-tags
 * Normalize all existing tags in the database
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
          changed: 0,
          unchanged: 0,
          changes: []
        }
      })
    }

    let changedCount = 0
    let unchangedCount = 0
    const changes: Array<{
      vendor_name: string
      vendor_type: string
      old_tags: string[]
      new_tags: string[]
    }> = []

    // Check each vendor's tags
    for (const vendor of vendors as VendorWithTags[]) {
      if (!vendor.tags || vendor.tags.length === 0) continue

      const normalizedTags = normalizeTags(vendor.tags)

      // Compare original and normalized
      const originalSorted = JSON.stringify([...vendor.tags].sort())
      const normalizedSorted = JSON.stringify([...normalizedTags].sort())

      if (originalSorted !== normalizedSorted) {
        changedCount++
        changes.push({
          vendor_name: vendor.vendor_name,
          vendor_type: vendor.vendor_type,
          old_tags: vendor.tags,
          new_tags: normalizedTags
        })

        if (!dry_run) {
          // Update the vendor with normalized tags
          const { error: updateError } = await supabase
            .from('planner_vendor_library')
            .update({ tags: normalizedTags })
            .eq('id', vendor.id)

          if (updateError) {
            console.error(`Error updating ${vendor.vendor_name}:`, updateError)
          }
        }
      } else {
        unchangedCount++
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        total_vendors: vendors.length,
        changed: changedCount,
        unchanged: unchangedCount,
        changes,
        dry_run
      }
    })

  } catch (error) {
    console.error('Error normalizing tags:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to normalize tags' },
      { status: 500 }
    )
  }
}
