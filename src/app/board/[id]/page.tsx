'use client'

import { useState, useEffect } from 'react'
import { use } from 'react'
import { Board, Column, Card } from '@/types'
import { Plus, ArrowLeft, Calendar, User, Flag, MessageCircle } from 'lucide-react'
import Link from 'next/link'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import AddCardModal from '@/components/AddCardModal'
import AddColumnModal from '@/components/AddColumnModal'
import CardDetailModal from '@/components/CardDetailModal'

interface BoardPageProps {
  params: Promise<{ id: string }>
}

// Sortable Card Component
function SortableCard({ card, onCardClick }: { card: Card, onCardClick: (card: Card) => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high': return 'text-red-500 bg-red-50'
      case 'medium': return 'text-yellow-500 bg-yellow-50'
      case 'low': return 'text-green-500 bg-green-50'
      default: return 'text-gray-500 bg-gray-50'
    }
  }

  const formatDueDate = (dueDate?: Date) => {
    if (!dueDate) return null
    const date = new Date(dueDate)
    const now = new Date()
    const isOverdue = date < now
    const isToday = date.toDateString() === now.toDateString()
    
    return (
      <div className={`flex items-center gap-1 text-xs ${
        isOverdue ? 'text-red-600' : isToday ? 'text-orange-600' : 'text-gray-600'
      }`}>
        <Calendar size={12} />
        {date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </div>
    )
  }

  const handleCardClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onCardClick(card)
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={handleCardClick}
      className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      {/* Priority indicator */}
      {card.priority && (
        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium mb-2 ${getPriorityColor(card.priority)}`}>
          <Flag size={10} />
          {card.priority.toUpperCase()}
        </div>
      )}
      
      {/* Content */}
      <p className="text-gray-900 mb-3">{card.content}</p>
      
      {/* Card metadata */}
      <div className="space-y-2">
        {/* Due date */}
        {card.dueDate && formatDueDate(card.dueDate)}
        
        {/* Assigned person */}
        {card.assignedTo && (
          <div className="flex items-center gap-1 text-xs text-gray-600">
            <User size={12} />
            {card.assignedTo}
          </div>
        )}
        
        {/* Comments count */}
        {card.comments && card.comments.length > 0 && (
          <div className="flex items-center gap-1 text-xs text-gray-600">
            <MessageCircle size={12} />
            {card.comments.length} comment{card.comments.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  )
}

// Sortable Column Component
function SortableColumn({ 
  column, 
  onAddCard,
  onCardClick
}: { 
  column: Column
  onAddCard: (columnId: string) => void
  onCardClick: (card: Card) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: column.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-gray-50 rounded-lg p-4 min-w-[300px] max-w-[300px]"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">{column.title}</h3>
        <span className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full">
          {column.cards.length}
        </span>
      </div>

      <SortableContext items={column.cards.map(card => card.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-3">
          {column.cards.map((card) => (
            <SortableCard key={card.id} card={card} onCardClick={onCardClick} />
          ))}
        </div>
      </SortableContext>

      <button
        onClick={() => onAddCard(column.id)}
        className="w-full mt-4 p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors flex items-center justify-center gap-2"
      >
        <Plus size={16} />
        Add Card
      </button>
    </div>
  )
}

export default function BoardPage({ params }: BoardPageProps) {
  const { id } = use(params)
  const [board, setBoard] = useState<Board | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeCard, setActiveCard] = useState<Card | null>(null)
  const [showAddCardModal, setShowAddCardModal] = useState(false)
  const [showAddColumnModal, setShowAddColumnModal] = useState(false)
  const [showCardDetailModal, setShowCardDetailModal] = useState(false)
  const [selectedCard, setSelectedCard] = useState<Card | null>(null)
  const [selectedColumnId, setSelectedColumnId] = useState<string>('')

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  useEffect(() => {
    fetchBoard()
  }, [id])

  const fetchBoard = async () => {
    try {
      const response = await fetch(`/api/boards/${id}`)
      if (response.ok) {
        const data = await response.json()
        setBoard(data)
      }
    } catch (error) {
      console.error('Error fetching board:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddCard = (columnId: string) => {
    setSelectedColumnId(columnId)
    setShowAddCardModal(true)
  }

  const handleAddCardSubmit = async (cardData: {
    content: string
    dueDate?: Date
    assignedTo?: string
    priority?: 'low' | 'medium' | 'high'
    initialComment?: string
  }) => {
    if (!board) return

    try {
      const response = await fetch('/api/cards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...cardData,
          columnId: selectedColumnId,
        }),
      })

      if (response.ok) {
        const newCard = await response.json()
        // Update the board state with the new card
        setBoard(prev => {
          if (!prev) return prev
          return {
            ...prev,
            columns: prev.columns.map(col =>
              col.id === selectedColumnId
                ? { ...col, cards: [...col.cards, newCard] }
                : col
            )
          }
        })
      }
    } catch (error) {
      console.error('Error adding card:', error)
    }
  }

  const handleAddColumn = async (title: string) => {
    if (!board) return

    try {
      const response = await fetch('/api/columns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          boardId: board.id,
        }),
      })

      if (response.ok) {
        const newColumn = await response.json()
        setBoard(prev => {
          if (!prev) return prev
          return {
            ...prev,
            columns: [...prev.columns, newColumn]
          }
        })
      }
    } catch (error) {
      console.error('Error adding column:', error)
    }
  }

  const handleCardClick = (card: Card) => {
    setSelectedCard(card)
    setShowCardDetailModal(true)
  }

  const handleCardUpdate = async (updatedCard: Partial<Card>) => {
    if (!selectedCard) return

    try {
      const response = await fetch(`/api/cards/${selectedCard.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedCard),
      })

      if (response.ok) {
        const updated = await response.json()
        // Update the board state with the updated card
        setBoard(prev => {
          if (!prev) return prev
          return {
            ...prev,
            columns: prev.columns.map(col => ({
              ...col,
              cards: col.cards.map(card => 
                card.id === selectedCard.id ? updated : card
              )
            }))
          }
        })
      }
    } catch (error) {
      console.error('Error updating card:', error)
    }
  }

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const card = board?.columns
      .flatMap(col => col.cards)
      .find(c => c.id === active.id)
    
    if (card) {
      setActiveCard(card)
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    
    if (over && active.id !== over.id) {
      const cardId = active.id as string
      const targetColumnId = over.id as string
      
      // Check if the target is a column (not another card)
      const targetColumn = board?.columns.find(col => col.id === targetColumnId)
      if (!targetColumn) return
      
      // Check if the card exists in the current board
      const cardExists = board?.columns.some(col => 
        col.cards.some(card => card.id === cardId)
      )
      if (!cardExists) return
      
      try {
        const response = await fetch(`/api/cards/${cardId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            columnId: targetColumnId,
          }),
        })

        if (response.ok) {
          // Update the board state
          setBoard(prev => {
            if (!prev) return prev
            
            // Find the card being moved
            let movedCard: Card | null = null
            let sourceColumnId = ''
            
            for (const col of prev.columns) {
              const card = col.cards.find(c => c.id === cardId)
              if (card) {
                movedCard = card
                sourceColumnId = col.id
                break
              }
            }
            
            if (!movedCard || sourceColumnId === targetColumnId) return prev
            
            return {
              ...prev,
              columns: prev.columns.map(col => {
                if (col.id === sourceColumnId) {
                  // Remove card from source column
                  return {
                    ...col,
                    cards: col.cards.filter(c => c.id !== cardId)
                  }
                } else if (col.id === targetColumnId) {
                  // Add card to target column
                  return {
                    ...col,
                    cards: [...col.cards, { ...movedCard!, columnId: targetColumnId }]
                  }
                }
                return col
              })
            }
          })
        } else {
          console.error('Failed to update card:', response.statusText)
        }
      } catch (error) {
        console.error('Error moving card:', error)
      }
    }
    
    setActiveCard(null)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (!board) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-lg">Board not found</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft size={20} />
                Back to Boards
              </Link>
              <h1 className="text-xl font-semibold text-gray-900">{board.title}</h1>
            </div>
            <button 
              onClick={() => setShowAddColumnModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus size={16} />
              Add Column
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-6 overflow-x-auto pb-4">
            {board.columns.map((column) => (
              <SortableColumn 
                key={column.id} 
                column={column} 
                onAddCard={handleAddCard}
                onCardClick={handleCardClick}
              />
            ))}
          </div>
          
          <DragOverlay>
            {activeCard ? (
              <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 w-72 opacity-90">
                <p className="text-gray-900">{activeCard.content}</p>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Modals */}
      <AddCardModal
        isOpen={showAddCardModal}
        onClose={() => setShowAddCardModal(false)}
        onAdd={handleAddCardSubmit}
        columnTitle={board.columns.find(col => col.id === selectedColumnId)?.title || ''}
      />
      
      <AddColumnModal
        isOpen={showAddColumnModal}
        onClose={() => setShowAddColumnModal(false)}
        onAdd={handleAddColumn}
      />

      <CardDetailModal
        isOpen={showCardDetailModal}
        onClose={() => setShowCardDetailModal(false)}
        card={selectedCard}
        onUpdate={handleCardUpdate}
      />
    </div>
  )
} 