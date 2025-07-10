export interface Card {
  id: string;
  content: string;
  order: number;
  columnId: string;
  dueDate?: Date;
  assignedTo?: string;
  priority?: 'low' | 'medium' | 'high';
  comments: Comment[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Comment {
  id: string;
  content: string;
  author: string;
  createdAt: Date;
}

export interface ActivityLog {
  id: string;
  cardId: string;
  action: 'created' | 'updated' | 'moved' | 'assigned' | 'commented';
  description: string;
  timestamp: Date;
  userId?: string;
}

export interface Column {
  id: string;
  title: string;
  order: number;
  boardId: string;
  createdAt: Date;
  updatedAt: Date;
  cards: Card[];
}

export interface Board {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  columns: Column[];
} 