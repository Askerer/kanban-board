import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/columns - Add new column
export async function POST(request: NextRequest) {
  try {
    const { title, boardId } = await request.json()

    if (!title || !boardId) {
      return NextResponse.json(
        { error: 'Title and boardId are required' },
        { status: 400 }
      )
    }

    // Get the highest order in the board
    const lastColumn = await prisma.column.findFirst({
      where: { boardId },
      orderBy: { order: 'desc' }
    })

    const newOrder = lastColumn ? lastColumn.order + 1 : 0

    const column = await prisma.column.create({
      data: {
        title,
        order: newOrder,
        boardId
      },
      include: {
        cards: {
          orderBy: {
            order: 'asc'
          }
        }
      }
    })

    return NextResponse.json(column, { status: 201 })
  } catch (error) {
    console.error('Error creating column:', error)
    return NextResponse.json(
      { error: 'Failed to create column' },
      { status: 500 }
    )
  }
} 