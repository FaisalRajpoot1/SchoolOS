export interface ThreadSummary {
  id: string;
  subject: string;
  createdAt: string;
  lastMessageAt: string;
  withName: string;
  withRole: 'PARENT' | 'TEACHER';
  student: { id: string; name: string } | null;
  unreadCount: number;
}

export interface ThreadMessage {
  id: string;
  body: string;
  createdAt: string;
  mine: boolean;
  readAt: string | null;
}

export interface ThreadDetail {
  thread: ThreadSummary;
  messages: ThreadMessage[];
}

export interface MessageContact {
  userId: string;
  name: string;
  students?: string[];
}

export interface CreateThreadPayload {
  toUserId: string;
  studentId?: string;
  subject: string;
  body: string;
}
