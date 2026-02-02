import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET() {
  try {
    const worktreesPath = path.join(process.cwd(), '..', 'data', 'worktrees.json')
    const data = fs.readFileSync(worktreesPath, 'utf-8')
    const worktrees = JSON.parse(data)
    return NextResponse.json(worktrees)
  } catch (error) {
    console.error('Failed to read worktrees:', error)
    return NextResponse.json({ worktrees: [] }, { status: 500 })
  }
}
