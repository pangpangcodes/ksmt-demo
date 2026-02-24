import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-client'

interface TagWithCount {
  tag: string
  count: number
}

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
    const vendorType = searchParams.get('vendor_type')

    // Build query to get all vendors with tags
    let query = supabase
      .from('planner_vendor_library')
      .select('tags, vendor_type')
      .eq('is_active', true)
      .not('tags', 'is', null)

    if (vendorType) {
      query = query.eq('vendor_type', vendorType)
    }

    const { data: vendors, error: vendorsError } = await query

    if (vendorsError) {
      throw vendorsError
    }

    // Process tags to get counts
    const tagCountMap = new Map<string, number>()
    let totalVendors = 0

    vendors?.forEach(vendor => {
      if (vendor.tags && Array.isArray(vendor.tags)) {
        totalVendors++
        vendor.tags.forEach(tag => {
          tagCountMap.set(tag, (tagCountMap.get(tag) || 0) + 1)
        })
      }
    })

    // Convert to array and sort by count
    const tags: TagWithCount[] = Array.from(tagCountMap.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)

    // Limit results
    const limit = vendorType ? 10 : 50
    const limitedTags = tags.slice(0, limit)

    return NextResponse.json({
      success: true,
      data: {
        tags: limitedTags,
        total_tags: tags.length,
        total_vendors: totalVendors,
        vendor_type: vendorType || null
      }
    })

  } catch (error) {
    console.error('Error fetching tags:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tags' },
      { status: 500 }
    )
  }
}
