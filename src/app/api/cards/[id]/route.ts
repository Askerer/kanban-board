import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// PATCH /api/cards/:id - Update card content or order
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { content, order, columnId } = await request.json()

    // First check if the card exists
    const existingCard = await prisma.card.findUnique({
      where: { id }
    })

    if (!existingCard) {
      return NextResponse.json(
        { error: 'Card not found' },
        { status: 404 }
      )
    }

    // If moving to a different column, verify the column exists
    if (columnId && columnId !== existingCard.columnId) {
      const targetColumn = await prisma.column.findUnique({
        where: { id: columnId }
      })

      if (!targetColumn) {
        return NextResponse.json(
          { error: 'Target column not found' },
          { status: 400 }
        )
      }
    }

    const updateData: any = {}
    if (content !== undefined) updateData.content = content
    if (order !== undefined) updateData.order = order
    if (columnId !== undefined) updateData.columnId = columnId

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      )
    }

    const card = await prisma.card.update({
      where: {
        id
      },
      data: updateData
    })

    return NextResponse.json(card)
  } catch (error) {
    console.error('Error updating card:', error)
    return NextResponse.json(
      { error: 'Failed to update card' },
      { status: 500 }
    )
  }
} 