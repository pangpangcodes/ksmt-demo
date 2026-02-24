import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { password } = await request.json()

    // Get planner password from environment variable
    const PLANNER_PASSWORD = process.env.PLANNER_PASSWORD || 'planner'

    // Simple password check (MVP - no hashing)
    if (password === PLANNER_PASSWORD) {
      return NextResponse.json({
        authenticated: true,
        message: 'Authentication successful',
        token: password, // Return the password as the token for API requests
      })
    } else {
      return NextResponse.json(
        {
          authenticated: false,
          error: 'Invalid password. Please try again.',
        },
        { status: 401 }
      )
    }
  } catch (error) {
    console.error('Authentication error:', error)
    return NextResponse.json(
      {
        authenticated: false,
        error: 'Authentication failed. Please try again.',
      },
      { status: 500 }
    )
  }
}
