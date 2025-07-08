'use client'

import { useState, useEffect } from 'react'
import { X, Calendar, User, Flag, MessageCircle, Plus } from 'lucide-react'
import { Card, Comment } from '@/types'

interface CardDetailModalProps {
  isOpen: boolean
  onClose: () => void
  card: Card | null
  onUpdate: (cardData: Partial<Card>) => void
}

export default function CardDetailModal({ isOpen, onClose, card, onUpdate }: CardDetailModalProps) {
  const [content, setContent] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [assignedTo, setAssignedTo] = useState('')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium')
  const [newComment, setNewComment] = useState('')
  const [comments, setComments] = useState<Comment[]>([])

  useEffect(() => {
    if (card) {
      setContent(card.content)
      setDueDate(card.dueDate ? new Date(card.dueDate).toISOString().slice(0, 16) : '')
      setAssignedTo(card.assignedTo || '')
      setPriority(card.priority || 'medium')
      setComments(card.comments || [])
    }
  }, [card])

  const handleSave = () => {
    if (!card) return

    const updatedCard = {
      ...card,
      content,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      assignedTo: assignedTo.trim() || undefined,
      priority,
      comments
    }

    onUpdate(updatedCard)
    onClose()
  }

  const handleAddComment = () => {
    if (!newComment.trim()) return

    const comment: Comment = {
      id: Date.now().toString(),
      content: newComment.trim(),
      author: 'Current User', // In a real app, this would come from auth
      createdAt: new Date()
    }

    setComments([...comments, comment])
    setNewComment('')
  }

  const handleDeleteComment = (commentId: string) => {
    setComments(comments.filter(c => c.id !== commentId))
  }

  if (!isOpen || !card) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">卡片詳情 (Card Details)</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6">
          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              內容 (Content)
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={3}
            />
          </div>

          {/* Due Date and Assigned To Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar size={16} className="inline mr-1" />
                時間 (Due Date)
              </label>
              <input
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User size={16} className="inline mr-1" />
                負責人 (Responsible Person)
              </label>
              <input
                type="text"
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                placeholder="Enter person's name or email..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Flag size={16} className="inline mr-1" />
              Priority
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high')}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          {/* Comments Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MessageCircle size={16} className="inline mr-1" />
              Comments
            </label>
            
            {/* Add new comment */}
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
              />
              <button
                onClick={handleAddComment}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
              >
                <Plus size={16} />
              </button>
            </div>

            {/* Comments list */}
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {comments.map((comment) => (
                <div key={comment.id} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{comment.author}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">
                        {new Date(comment.createdAt).toLocaleString()}
                      </span>
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        className="text-red-500 hover:text-red-700 text-xs"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-900">{comment.content}</p>
                </div>
              ))}
              {comments.length === 0 && (
                <p className="text-gray-500 text-sm text-center py-4">No comments yet</p>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              onClick={handleSave}
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
            >
              Save Changes
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}