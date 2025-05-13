import React, { useState, useEffect, useRef } from "react";
import { 
  MessageSquare, 
  XCircle, 
  Send, 
  Edit2, 
  Trash2, 
  User, 
  CheckCircle2,
  AlertCircle,
  Plus,
  Filter
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format, formatDistanceToNow } from 'date-fns';
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { useWebSocket } from "@/contexts/WebSocketContext";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectGroup, 
  SelectItem, 
  SelectLabel, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

// Types for comments system
interface CommentUser {
  id: string;
  name: string;
  avatarColor: string;
  initials: string;
}

interface CommentPosition {
  x: number;
  y: number;
}

interface CommentReply {
  id: string;
  content: string;
  createdAt: Date;
  userId: string;
  edited: boolean;
}

interface Comment {
  id: string;
  content: string;
  position: CommentPosition;
  createdAt: Date;
  userId: string;
  elementId?: number | null;
  status: 'open' | 'resolved';
  replies: CommentReply[];
  edited: boolean;
}

type StatusFilter = 'all' | 'open' | 'resolved';
type SortOption = 'newest' | 'oldest' | 'updated';

// Demo users for the comments system
const DEMO_USERS: CommentUser[] = [
  { id: 'user-1', name: 'Current User', avatarColor: '#3b82f6', initials: 'CU' },
  { id: 'user-2', name: 'John Smith', avatarColor: '#10b981', initials: 'JS' },
  { id: 'user-3', name: 'Emma Wilson', avatarColor: '#f97316', initials: 'EW' },
  { id: 'user-4', name: 'Alex Johnson', avatarColor: '#8b5cf6', initials: 'AJ' },
];

// Generate sample comments
const generateDemoComments = (): Comment[] => {
  const twoHoursAgo = new Date();
  twoHoursAgo.setHours(twoHoursAgo.getHours() - 2);
  
  const oneDayAgo = new Date();
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);
  
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  
  return [
    {
      id: 'comment-1',
      content: 'Can we make this section stand out more? Perhaps with a brighter color or different typography.',
      position: { x: 350, y: 200 },
      createdAt: twoHoursAgo,
      userId: 'user-2',
      elementId: 2,
      status: 'open',
      edited: false,
      replies: [
        {
          id: 'reply-1',
          content: 'I agree, it needs more contrast with the background.',
          createdAt: new Date(twoHoursAgo.getTime() + 30 * 60000),
          userId: 'user-1',
          edited: false,
        },
        {
          id: 'reply-2',
          content: 'Let\'s try using our brand accent color.',
          createdAt: new Date(twoHoursAgo.getTime() + 45 * 60000),
          userId: 'user-3',
          edited: false,
        }
      ]
    },
    {
      id: 'comment-2',
      content: 'The logo placement seems a bit off-center, can we adjust it?',
      position: { x: 100, y: 150 },
      createdAt: oneDayAgo,
      userId: 'user-3',
      elementId: 4,
      status: 'resolved',
      edited: true,
      replies: [
        {
          id: 'reply-3',
          content: 'Fixed! I\'ve aligned it properly.',
          createdAt: new Date(oneDayAgo.getTime() + 2 * 60 * 60000),
          userId: 'user-1',
          edited: false,
        }
      ]
    },
    {
      id: 'comment-3',
      content: 'I think we should simplify this navigation menu and reduce the number of options.',
      position: { x: 220, y: 80 },
      createdAt: threeDaysAgo,
      userId: 'user-4',
      elementId: 1,
      status: 'open',
      edited: false,
      replies: []
    }
  ];
};

interface CommentsListProps {
  onCommentSelect: (comment: Comment) => void;
  onAddMarker: () => void;
}

export function CommentsList({ onCommentSelect, onAddMarker }: CommentsListProps) {
  const [comments, setComments] = useState<Comment[]>(generateDemoComments());
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [showFilters, setShowFilters] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'comments' | 'resolved'>('comments');
  
  const currentUser = DEMO_USERS[0]; // Using first user as current user
  
  // Apply filters and sorting
  const filteredComments = comments.filter(comment => {
    // Status filter
    if (statusFilter !== 'all' && comment.status !== statusFilter) {
      return false;
    }
    
    // Active tab filter
    if (activeTab === 'comments' && comment.status === 'resolved') {
      return false;
    }
    if (activeTab === 'resolved' && comment.status === 'open') {
      return false;
    }
    
    // Search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesContent = comment.content.toLowerCase().includes(query);
      const matchesUser = DEMO_USERS.find(u => u.id === comment.userId)?.name.toLowerCase().includes(query);
      const matchesReplies = comment.replies.some(reply => 
        reply.content.toLowerCase().includes(query)
      );
      
      return matchesContent || matchesUser || matchesReplies;
    }
    
    return true;
  });
  
  // Sort comments
  const sortedComments = [...filteredComments].sort((a, b) => {
    switch (sortOption) {
      case 'newest':
        return b.createdAt.getTime() - a.createdAt.getTime();
      case 'oldest':
        return a.createdAt.getTime() - b.createdAt.getTime();
      case 'updated':
        // Sort by latest reply or creation date if no replies
        const aLatest = a.replies.length > 0 
          ? a.replies[a.replies.length - 1].createdAt.getTime() 
          : a.createdAt.getTime();
        const bLatest = b.replies.length > 0 
          ? b.replies[b.replies.length - 1].createdAt.getTime() 
          : b.createdAt.getTime();
        return bLatest - aLatest;
      default:
        return 0;
    }
  });
  
  const handleEditComment = (comment: Comment) => {
    setEditingCommentId(comment.id);
    setEditText(comment.content);
  };
  
  const saveEditedComment = (commentId: string) => {
    setComments(prevComments => 
      prevComments.map(comment => 
        comment.id === commentId
          ? { ...comment, content: editText, edited: true }
          : comment
      )
    );
    setEditingCommentId(null);
  };
  
  const cancelEdit = () => {
    setEditingCommentId(null);
    setEditText('');
  };
  
  const resolveComment = (commentId: string) => {
    setComments(prevComments => 
      prevComments.map(comment => 
        comment.id === commentId
          ? { ...comment, status: 'resolved' }
          : comment
      )
    );
  };
  
  const reopenComment = (commentId: string) => {
    setComments(prevComments => 
      prevComments.map(comment => 
        comment.id === commentId
          ? { ...comment, status: 'open' }
          : comment
      )
    );
  };
  
  const deleteComment = (commentId: string) => {
    setComments(prevComments => 
      prevComments.filter(comment => comment.id !== commentId)
    );
  };
  
  const addReply = (commentId: string, content: string) => {
    if (!content.trim()) return;
    
    const newReply: CommentReply = {
      id: `reply-${Date.now()}`,
      content,
      createdAt: new Date(),
      userId: currentUser.id,
      edited: false,
    };
    
    setComments(prevComments => 
      prevComments.map(comment => 
        comment.id === commentId
          ? { ...comment, replies: [...comment.replies, newReply] }
          : comment
      )
    );
  };
  
  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium">Comments & Feedback</h3>
          <Button size="sm" variant="outline" onClick={onAddMarker}>
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add Comment
          </Button>
        </div>
        
        <div className="relative">
          <Input
            placeholder="Search comments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
          <MessageSquare className="h-4 w-4 absolute left-2.5 top-2.5 text-muted-foreground" />
        </div>
        
        <div className="flex items-center justify-between mt-3">
          <Tabs 
            defaultValue="comments" 
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as 'comments' | 'resolved')}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="comments">
                Open
                <Badge variant="secondary" className="ml-1.5">
                  {comments.filter(c => c.status === 'open').length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="resolved">
                Resolved
                <Badge variant="secondary" className="ml-1.5">
                  {comments.filter(c => c.status === 'resolved').length}
                </Badge>
              </TabsTrigger>
            </TabsList>
          </Tabs>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowFilters(!showFilters)}
            className="ml-2"
          >
            <Filter className="h-4 w-4" />
          </Button>
        </div>
        
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-2 gap-2 mt-3">
                <div>
                  <Label htmlFor="status-filter" className="text-xs">Status</Label>
                  <Select
                    value={statusFilter}
                    onValueChange={(value) => setStatusFilter(value as StatusFilter)}
                  >
                    <SelectTrigger id="status-filter" className="h-8">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="sort-option" className="text-xs">Sort By</Label>
                  <Select
                    value={sortOption}
                    onValueChange={(value) => setSortOption(value as SortOption)}
                  >
                    <SelectTrigger id="sort-option" className="h-8">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Newest</SelectItem>
                      <SelectItem value="oldest">Oldest</SelectItem>
                      <SelectItem value="updated">Recently Updated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      <ScrollArea className="flex-1">
        {sortedComments.length > 0 ? (
          <div className="p-3 space-y-3">
            <AnimatePresence>
              {sortedComments.map(comment => (
                <motion.div
                  key={comment.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => onCommentSelect(comment)}
                  className="cursor-pointer"
                >
                  <Card className={cn(
                    "transition-colors hover:border-blue-300",
                    comment.status === 'resolved' && "opacity-75"
                  )}>
                    <CardHeader className="p-3 pb-2">
                      <div className="flex justify-between">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback 
                              style={{ backgroundColor: DEMO_USERS.find(u => u.id === comment.userId)?.avatarColor }}
                            >
                              {DEMO_USERS.find(u => u.id === comment.userId)?.initials}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="text-sm font-medium">
                              {DEMO_USERS.find(u => u.id === comment.userId)?.name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {formatDistanceToNow(comment.createdAt, { addSuffix: true })}
                              {comment.edited && <span className="ml-1">(edited)</span>}
                            </div>
                          </div>
                        </div>
                        
                        <Badge variant={comment.status === 'open' ? "default" : "secondary"}>
                          {comment.status === 'open' ? 
                            <AlertCircle className="h-3 w-3 mr-1" /> : 
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                          }
                          {comment.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="p-3 pt-0">
                      {editingCommentId === comment.id ? (
                        <div className="space-y-2">
                          <Textarea 
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            className="min-h-[80px]"
                          />
                          <div className="flex justify-end gap-2">
                            <Button size="sm" variant="outline" onClick={cancelEdit}>
                              Cancel
                            </Button>
                            <Button 
                              size="sm" 
                              onClick={() => saveEditedComment(comment.id)}
                              disabled={!editText.trim()}
                            >
                              Save
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm">{comment.content}</p>
                      )}
                    </CardContent>
                    
                    {comment.replies.length > 0 && (
                      <div className="px-3 pb-2">
                        <Separator className="my-2" />
                        <div className="text-xs text-muted-foreground mb-1">
                          {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
                        </div>
                        <div className="space-y-2">
                          {comment.replies.slice(-1).map(reply => (
                            <div key={reply.id} className="flex items-start gap-2">
                              <Avatar className="h-5 w-5 mt-0.5">
                                <AvatarFallback 
                                  style={{ backgroundColor: DEMO_USERS.find(u => u.id === reply.userId)?.avatarColor }}
                                  className="text-[10px]"
                                >
                                  {DEMO_USERS.find(u => u.id === reply.userId)?.initials}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="bg-muted p-2 rounded-md text-sm">
                                  <span className="font-medium text-xs">
                                    {DEMO_USERS.find(u => u.id === reply.userId)?.name}
                                  </span>
                                  <p className="text-xs mt-0.5">{reply.content}</p>
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  {formatDistanceToNow(reply.createdAt, { addSuffix: true })}
                                </div>
                              </div>
                            </div>
                          ))}
                          
                          {comment.replies.length > 1 && (
                            <Button 
                              variant="link" 
                              size="sm" 
                              className="p-0 h-auto text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                onCommentSelect(comment);
                              }}
                            >
                              View all replies
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <CardFooter className="p-3 pt-0 flex justify-between">
                      <CommentReplyForm
                        commentId={comment.id}
                        onAddReply={addReply}
                        inline
                      />
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <svg
                              width="15"
                              height="15"
                              viewBox="0 0 15 15"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4"
                            >
                              <path
                                d="M3.625 7.5C3.625 8.12132 3.12132 8.625 2.5 8.625C1.87868 8.625 1.375 8.12132 1.375 7.5C1.375 6.87868 1.87868 6.375 2.5 6.375C3.12132 6.375 3.625 6.87868 3.625 7.5ZM8.625 7.5C8.625 8.12132 8.12132 8.625 7.5 8.625C6.87868 8.625 6.375 8.12132 6.375 7.5C6.375 6.87868 6.87868 6.375 7.5 6.375C8.12132 6.375 8.625 6.87868 8.625 7.5ZM13.625 7.5C13.625 8.12132 13.1213 8.625 12.5 8.625C11.8787 8.625 11.375 8.12132 11.375 7.5C11.375 6.87868 11.8787 6.375 12.5 6.375C13.1213 6.375 13.625 6.87868 13.625 7.5Z"
                                fill="currentColor"
                                fillRule="evenodd"
                                clipRule="evenodd"
                              ></path>
                            </svg>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {comment.status === 'open' ? (
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              resolveComment(comment.id);
                            }}>
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Mark as resolved
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              reopenComment(comment.id);
                            }}>
                              <AlertCircle className="h-4 w-4 mr-2" />
                              Reopen comment
                            </DropdownMenuItem>
                          )}
                          
                          {comment.userId === currentUser.id && (
                            <>
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                handleEditComment(comment);
                              }}>
                                <Edit2 className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                deleteComment(comment.id);
                              }}>
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </CardFooter>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center p-4 text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground mb-2" />
            <h3 className="font-medium">No comments found</h3>
            <p className="text-sm text-muted-foreground max-w-md mt-1">
              {searchQuery
                ? "Try adjusting your search or filters"
                : activeTab === 'comments'
                ? "Create a comment to provide feedback on the design"
                : "No resolved comments yet"}
            </p>
            {searchQuery && (
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-4"
                onClick={() => setSearchQuery('')}
              >
                Clear search
              </Button>
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

interface CommentDetailProps {
  comment: Comment | null;
  onClose: () => void;
}

export function CommentDetail({ comment, onClose }: CommentDetailProps) {
  const [replyText, setReplyText] = useState('');
  const [editingReplyId, setEditingReplyId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [displayedComment, setDisplayedComment] = useState<Comment | null>(comment);
  
  const currentUser = DEMO_USERS[0]; // Using first user as current user
  
  useEffect(() => {
    setDisplayedComment(comment);
  }, [comment]);
  
  if (!displayedComment) return null;
  
  const handleAddReply = () => {
    if (!replyText.trim()) return;
    
    const newReply: CommentReply = {
      id: `reply-${Date.now()}`,
      content: replyText,
      createdAt: new Date(),
      userId: currentUser.id,
      edited: false,
    };
    
    setDisplayedComment(prev => prev ? {
      ...prev,
      replies: [...prev.replies, newReply]
    } : null);
    
    setReplyText('');
  };
  
  const handleEditReply = (replyId: string) => {
    const reply = displayedComment.replies.find(r => r.id === replyId);
    if (reply) {
      setEditingReplyId(replyId);
      setEditText(reply.content);
    }
  };
  
  const saveEditedReply = () => {
    if (!editingReplyId || !editText.trim()) return;
    
    setDisplayedComment(prev => prev ? {
      ...prev,
      replies: prev.replies.map(reply => 
        reply.id === editingReplyId
          ? { ...reply, content: editText, edited: true }
          : reply
      )
    } : null);
    
    setEditingReplyId(null);
    setEditText('');
  };
  
  const cancelEditReply = () => {
    setEditingReplyId(null);
    setEditText('');
  };
  
  const deleteReply = (replyId: string) => {
    setDisplayedComment(prev => prev ? {
      ...prev,
      replies: prev.replies.filter(reply => reply.id !== replyId)
    } : null);
  };
  
  const handleResolve = () => {
    setDisplayedComment(prev => prev ? {
      ...prev,
      status: 'resolved'
    } : null);
  };
  
  const handleReopen = () => {
    setDisplayedComment(prev => prev ? {
      ...prev,
      status: 'open'
    } : null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.2 }}
      className="h-full flex flex-col"
    >
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={onClose}>
            <XCircle className="h-4 w-4" />
          </Button>
          <h3 className="font-medium">Comment Details</h3>
        </div>
        <div>
          <Badge variant={displayedComment.status === 'open' ? "default" : "secondary"}>
            {displayedComment.status === 'open' ? 
              <AlertCircle className="h-3 w-3 mr-1" /> : 
              <CheckCircle2 className="h-3 w-3 mr-1" />
            }
            {displayedComment.status}
          </Badge>
        </div>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-4">
          <div className="flex items-start gap-3">
            <Avatar className="h-9 w-9">
              <AvatarFallback 
                style={{ backgroundColor: DEMO_USERS.find(u => u.id === displayedComment.userId)?.avatarColor }}
              >
                {DEMO_USERS.find(u => u.id === displayedComment.userId)?.initials}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <div className="flex justify-between">
                <div>
                  <div className="font-medium">
                    {DEMO_USERS.find(u => u.id === displayedComment.userId)?.name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {format(displayedComment.createdAt, 'PPP')} at {format(displayedComment.createdAt, 'p')}
                    {displayedComment.edited && <span className="ml-1">(edited)</span>}
                  </div>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 15 15"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                      >
                        <path
                          d="M3.625 7.5C3.625 8.12132 3.12132 8.625 2.5 8.625C1.87868 8.625 1.375 8.12132 1.375 7.5C1.375 6.87868 1.87868 6.375 2.5 6.375C3.12132 6.375 3.625 6.87868 3.625 7.5ZM8.625 7.5C8.625 8.12132 8.12132 8.625 7.5 8.625C6.87868 8.625 6.375 8.12132 6.375 7.5C6.375 6.87868 6.87868 6.375 7.5 6.375C8.12132 6.375 8.625 6.87868 8.625 7.5ZM13.625 7.5C13.625 8.12132 13.1213 8.625 12.5 8.625C11.8787 8.625 11.375 8.12132 11.375 7.5C11.375 6.87868 11.8787 6.375 12.5 6.375C13.1213 6.375 13.625 6.87868 13.625 7.5Z"
                          fill="currentColor"
                          fillRule="evenodd"
                          clipRule="evenodd"
                        ></path>
                      </svg>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {displayedComment.status === 'open' ? (
                      <DropdownMenuItem onClick={handleResolve}>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Mark as resolved
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem onClick={handleReopen}>
                        <AlertCircle className="h-4 w-4 mr-2" />
                        Reopen comment
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              <div className="mt-3 p-3 bg-muted rounded-lg">
                <p>{displayedComment.content}</p>
              </div>
              
              <Separator className="my-6" />
              
              <div className="space-y-4">
                <h4 className="text-sm font-medium">
                  {displayedComment.replies.length} {displayedComment.replies.length === 1 ? 'Reply' : 'Replies'}
                </h4>
                
                {displayedComment.replies.map(reply => (
                  <div key={reply.id} className="flex items-start gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback 
                        style={{ backgroundColor: DEMO_USERS.find(u => u.id === reply.userId)?.avatarColor }}
                      >
                        {DEMO_USERS.find(u => u.id === reply.userId)?.initials}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <div>
                          <div className="font-medium text-sm">
                            {DEMO_USERS.find(u => u.id === reply.userId)?.name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatDistanceToNow(reply.createdAt, { addSuffix: true })}
                            {reply.edited && <span className="ml-1">(edited)</span>}
                          </div>
                        </div>
                        
                        {reply.userId === currentUser.id && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7">
                                <svg
                                  width="15"
                                  height="15"
                                  viewBox="0 0 15 15"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-3 w-3"
                                >
                                  <path
                                    d="M3.625 7.5C3.625 8.12132 3.12132 8.625 2.5 8.625C1.87868 8.625 1.375 8.12132 1.375 7.5C1.375 6.87868 1.87868 6.375 2.5 6.375C3.12132 6.375 3.625 6.87868 3.625 7.5ZM8.625 7.5C8.625 8.12132 8.12132 8.625 7.5 8.625C6.87868 8.625 6.375 8.12132 6.375 7.5C6.375 6.87868 6.87868 6.375 7.5 6.375C8.12132 6.375 8.625 6.87868 8.625 7.5ZM13.625 7.5C13.625 8.12132 13.1213 8.625 12.5 8.625C11.8787 8.625 11.375 8.12132 11.375 7.5C11.375 6.87868 11.8787 6.375 12.5 6.375C13.1213 6.375 13.625 6.87868 13.625 7.5Z"
                                    fill="currentColor"
                                    fillRule="evenodd"
                                    clipRule="evenodd"
                                  ></path>
                                </svg>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditReply(reply.id)}>
                                <Edit2 className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => deleteReply(reply.id)}>
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                      
                      {editingReplyId === reply.id ? (
                        <div className="mt-2 space-y-2">
                          <Textarea 
                            value={editText} 
                            onChange={(e) => setEditText(e.target.value)}
                            className="min-h-[80px]"
                          />
                          <div className="flex justify-end gap-2">
                            <Button size="sm" variant="outline" onClick={cancelEditReply}>
                              Cancel
                            </Button>
                            <Button 
                              size="sm" 
                              onClick={saveEditedReply}
                              disabled={!editText.trim()}
                            >
                              Save
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-1.5 text-sm">
                          <p>{reply.content}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>
      
      <div className="p-4 border-t">
        <div className="flex items-start gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback style={{ backgroundColor: currentUser.avatarColor }}>
              {currentUser.initials}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <Textarea
              placeholder="Add a reply..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              className="min-h-[80px] resize-none"
            />
            
            <div className="flex justify-end mt-2">
              <Button 
                onClick={handleAddReply} 
                disabled={!replyText.trim()}
                size="sm"
              >
                <Send className="h-3.5 w-3.5 mr-1.5" />
                Post Reply
              </Button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

interface CommentMarkerProps {
  position: CommentPosition;
  onClick: () => void;
  isSelected?: boolean;
  isResolved?: boolean;
}

export function CommentMarker({ 
  position, 
  onClick, 
  isSelected = false,
  isResolved = false 
}: CommentMarkerProps) {
  return (
    <div 
      className="absolute"
      style={{ 
        left: `${position.x}px`, 
        top: `${position.y}px`, 
        transform: 'translate(-50%, -50%)',
        zIndex: 9999
      }}
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        onClick={onClick}
        className={cn(
          "h-6 w-6 rounded-full flex items-center justify-center cursor-pointer",
          isSelected ? "ring-2 ring-offset-2 ring-primary" : "",
          isResolved ? "bg-green-100" : "bg-blue-100"
        )}
      >
        <MessageSquare 
          className={cn(
            "h-4 w-4", 
            isResolved ? "text-green-600" : "text-blue-600"
          )} 
        />
      </motion.div>
    </div>
  );
}

interface CommentReplyFormProps {
  commentId: string;
  onAddReply: (commentId: string, content: string) => void;
  inline?: boolean;
}

export function CommentReplyForm({ 
  commentId, 
  onAddReply, 
  inline = false 
}: CommentReplyFormProps) {
  const [showForm, setShowForm] = useState(false);
  const [replyText, setReplyText] = useState('');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!replyText.trim()) return;
    
    onAddReply(commentId, replyText);
    setReplyText('');
    
    if (inline) {
      setShowForm(false);
    }
  };
  
  if (inline && !showForm) {
    return (
      <Button 
        variant="ghost" 
        size="sm"
        className="h-8 text-xs"
        onClick={(e) => {
          e.stopPropagation();
          setShowForm(true);
        }}
      >
        Reply
      </Button>
    );
  }
  
  return (
    <form 
      onSubmit={handleSubmit} 
      onClick={(e) => e.stopPropagation()}
      className={inline ? "w-full" : ""}
    >
      <div className="flex gap-2">
        <Input
          type="text"
          placeholder="Add a reply..."
          value={replyText}
          onChange={(e) => setReplyText(e.target.value)}
          className="h-8 text-xs"
          autoFocus={inline}
        />
        <Button 
          type="submit" 
          size="sm" 
          variant="ghost" 
          className="h-8 px-2"
          disabled={!replyText.trim()}
        >
          <Send className="h-3.5 w-3.5" />
        </Button>
      </div>
    </form>
  );
}