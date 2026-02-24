import { NextRequest, NextResponse } from 'next/server'

// In-memory cache: rate is valid for 24 hours
const cache: Record<string, { rate: number; fetchedAt: number }> = {}
const CACHE_TTL_MS = 24 * 60 * 60 * 1000

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const from = (searchParams.get('from') ?? 'USD').toUpperCase()
  const to = (searchParams.get('to') ?? 'EUR').toUpperCase()

  if (from === to) {
    return NextResponse.json({ rate: 1, from, to, fetchedAt: new Date().toISOString(), cached: false })
  }

  const cacheKey = `${from}_${to}`
  const now = Date.now()
  const cached = cache[cacheKey]

  if (cached && now - cached.fetchedAt < CACHE_TTL_MS) {
    return NextResponse.json({
      rate: cached.rate,
      from,
      to,
      fetchedAt: new Date(cached.fetchedAt).toISOString(),
      cached: true,
    })
  }

  try {
    // Frankfurter API - free, no key required, supports USD/EUR/GBP/CAD
    const res = await fetch(`https://api.frankfurter.app/latest?from=${from}&to=${to}`, {
      next: { revalidate: 86400 }, // Next.js fetch cache: 24h
    })

    if (!res.ok) throw new Error(`Frankfurter responded ${res.status}`)

    const data = await res.json()
    const rate = data.rates?.[to]

    if (!rate) throw new Error(`No rate for ${to} in response`)

    cache[cacheKey] = { rate, fetchedAt: now }

    return NextResponse.json({
      rate,
      from,
      to,
      fetchedAt: new Date(now).toISOString(),
      cached: false,
    })
  } catch (err) {
    console.error('Exchange rate fetch failed:', err)
    return NextResponse.json(
      { error: 'Failed to fetch exchange rate', details: String(err) },
      { status: 502 }
    )
  }
}
