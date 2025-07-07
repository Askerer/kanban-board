import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// PATCH /api/columns/:id - Update column title or order
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { title, order } = await request.json()

    const updateData: any = {}
    if (title !== undefined) updateData.title = title
    if (order !== undefined) updateData.order = order

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      )
    }

    const column = await prisma.column.update({
      where: {
        id
      },
      data: updateData,
      include: {
        cards: {
          orderBy: {
            order: 'asc'
          }
        }
      }
    })

    return NextResponse.json(column)
  } catch (error) {
    console.error('Error updating column:', error)
    return NextResponse.json(
      { error: 'Failed to update column' },
      { status: 500 }
    )
  }
} 