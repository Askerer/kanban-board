import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/cards - Add new card
export async function POST(request: NextRequest) {
  try {
    const { content, columnId } = await request.json()

    if (!content || !columnId) {
      return NextResponse.json(
        { error: 'Content and columnId are required' },
        { status: 400 }
      )
    }

    // Get the highest order in the column
    const lastCard = await prisma.card.findFirst({
      where: { columnId },
      orderBy: { order: 'desc' }
    })

    const newOrder = lastCard ? lastCard.order + 1 : 0

    const card = await prisma.card.create({
      data: {
        content,
        order: newOrder,
        columnId
      }
    })

    return NextResponse.json(card, { status: 201 })
  } catch (error) {
    console.error('Error creating card:', error)
    return NextResponse.json(
      { error: 'Failed to create card' },
      { status: 500 }
    )
  }
} 