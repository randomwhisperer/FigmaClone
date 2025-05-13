import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { 
  addElement, 
  updateElement, 
  deleteElement, 
  updateActiveUsers,
  updateUserCursors 
} from '@/store/slices/designSlice';
import { useToast } from '@/hooks/use-toast';
import { type Element } from '@shared/schema';

// Import the MessageType enum values from the server
export enum MessageType {
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
  JOIN_DESIGN = 'join_design',
  LEAVE_DESIGN = 'leave_design',
  UPDATE_ELEMENT = 'update_element',
  ADD_ELEMENT = 'add_element',
  DELETE_ELEMENT = 'delete_element',
  SELECTION_CHANGE = 'selection_change',
  USER_CURSOR = 'user_cursor',
  SYNC_DESIGN = 'sync_design',
  ERROR = 'error'
}

interface WebSocketMessage {
  type: MessageType;
  payload?: any;
  designId?: number;
  userId?: string;
  timestamp?: number;
}

interface User {
  id: string;
  username: string;
  color: string;
  cursor?: { x: number; y: number };
  selections?: number[];
}

interface WebSocketContextType {
  connected: boolean;
  users: User[];
  clientId: string | null;
  userColor: string | null;
  joinDesign: (designId: number, username?: string) => void;
  leaveDesign: () => void;
  sendElementUpdate: (element: Element) => void;
  sendElementAdd: (element: Partial<Element>) => void;
  sendElementDelete: (elementId: number) => void;
  sendSelectionChange: (selectedElementIds: number[]) => void;
  sendCursorPosition: (x: number, y: number) => void;
}

const WebSocketContext = createContext<WebSocketContextType>({
  connected: false,
  users: [],
  clientId: null,
  userColor: null,
  joinDesign: () => {},
  leaveDesign: () => {},
  sendElementUpdate: () => {},
  sendElementAdd: () => {},
  sendElementDelete: () => {},
  sendSelectionChange: () => {},
  sendCursorPosition: () => {}
});

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [connected, setConnected] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [clientId, setClientId] = useState<string | null>(null);
  const [userColor, setUserColor] = useState<string | null>(null);
  
  const socket = useRef<WebSocket | null>(null);
  const currentDesignId = useRef<number | null>(null);
  
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  
  // Connect to WebSocket when the component mounts
  useEffect(() => {
    connect();
    
    // Clean up on unmount
    return () => {
      if (socket.current && socket.current.readyState === 1) { // 1 = OPEN
        socket.current.close();
      }
    };
  }, []);
  
  // Function to establish WebSocket connection
  const connect = () => {
    // Use secure WebSocket if site is served over HTTPS
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // Use the same path as the server
    const wsUrl = `${protocol}//${window.location.host}/ws-collaboration`;
    
    socket.current = new WebSocket(wsUrl);
    
    socket.current.onopen = () => {
      console.log('WebSocket connection established');
      setConnected(true);
    };
    
    socket.current.onclose = () => {
      console.log('WebSocket connection closed');
      setConnected(false);
      setClientId(null);
      setUserColor(null);
      
      // Attempt to reconnect after delay
      setTimeout(() => {
        if (socket.current?.readyState !== WebSocket.OPEN) {
          connect();
        }
      }, 3000);
    };
    
    socket.current.onerror = (error) => {
      console.error('WebSocket error:', error);
      toast({
        title: 'Connection Error',
        description: 'There was an error with the WebSocket connection',
        variant: 'destructive'
      });
    };
    
    socket.current.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        handleMessage(message);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
  };
  
  // Handle incoming WebSocket messages
  const handleMessage = (message: WebSocketMessage) => {
    const { type, payload, userId } = message;
    
    switch (type) {
      case MessageType.CONNECT:
        setClientId(payload.clientId);
        setUserColor(payload.color);
        break;
        
      case MessageType.JOIN_DESIGN:
        handleUserJoined(payload.user);
        toast({
          title: 'User Joined',
          description: payload.message,
        });
        break;
        
      case MessageType.LEAVE_DESIGN:
        handleUserLeft(payload.userId);
        toast({
          title: 'User Left',
          description: payload.message,
        });
        break;
        
      case MessageType.SYNC_DESIGN:
        handleSyncDesign(payload);
        break;
        
      case MessageType.ADD_ELEMENT:
        if (userId !== clientId) { // Only apply changes from other users
          dispatch(addElement(payload.element));
        }
        break;
        
      case MessageType.UPDATE_ELEMENT:
        if (userId !== clientId) { // Only apply changes from other users
          dispatch(updateElement({
            id: payload.element.id,
            updates: payload.element
          }));
        }
        break;
        
      case MessageType.DELETE_ELEMENT:
        if (userId !== clientId) { // Only apply changes from other users
          dispatch(deleteElement(payload.elementId));
        }
        break;
        
      case MessageType.SELECTION_CHANGE:
        if (userId !== clientId) { // Only track selections from other users
          handleUserSelection(payload);
        }
        break;
        
      case MessageType.USER_CURSOR:
        if (userId !== clientId) { // Only track cursors from other users
          handleUserCursor(payload);
        }
        break;
        
      case MessageType.ERROR:
        toast({
          title: 'Error',
          description: payload.message,
          variant: 'destructive'
        });
        break;
        
      default:
        console.warn('Unknown message type:', type);
    }
  };
  
  // Send a message to the WebSocket server
  const sendMessage = (message: WebSocketMessage) => {
    if (socket.current && socket.current.readyState === 1) { // 1 = OPEN
      socket.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected');
      toast({
        title: 'Connection Issue',
        description: 'Not connected to collaboration server',
        variant: 'destructive'
      });
    }
  };
  
  // Join a design
  const joinDesign = (designId: number, username: string = 'User') => {
    if (!connected) {
      toast({
        title: 'Connection Issue',
        description: 'Not connected to collaboration server',
        variant: 'destructive'
      });
      return;
    }
    
    currentDesignId.current = designId;
    
    sendMessage({
      type: MessageType.JOIN_DESIGN,
      designId,
      payload: {
        username
      }
    });
  };
  
  // Leave the current design
  const leaveDesign = () => {
    if (currentDesignId.current) {
      sendMessage({
        type: MessageType.LEAVE_DESIGN,
        designId: currentDesignId.current
      });
      
      currentDesignId.current = null;
      setUsers([]);
    }
  };
  
  // Send element updates to the server
  const sendElementUpdate = (element: Element) => {
    if (!currentDesignId.current) return;
    
    sendMessage({
      type: MessageType.UPDATE_ELEMENT,
      designId: currentDesignId.current,
      payload: {
        id: element.id,
        updates: element
      }
    });
  };
  
  // Send new element to the server
  const sendElementAdd = (element: Partial<Element>) => {
    if (!currentDesignId.current) return;
    
    sendMessage({
      type: MessageType.ADD_ELEMENT,
      designId: currentDesignId.current,
      payload: element
    });
  };
  
  // Send element deletion to the server
  const sendElementDelete = (elementId: number) => {
    if (!currentDesignId.current) return;
    
    sendMessage({
      type: MessageType.DELETE_ELEMENT,
      designId: currentDesignId.current,
      payload: {
        id: elementId
      }
    });
  };
  
  // Send selection change to the server
  const sendSelectionChange = (selectedElementIds: number[]) => {
    if (!currentDesignId.current) return;
    
    sendMessage({
      type: MessageType.SELECTION_CHANGE,
      designId: currentDesignId.current,
      payload: {
        selectedElementIds
      }
    });
  };
  
  // Send cursor position to the server
  const sendCursorPosition = (x: number, y: number) => {
    if (!currentDesignId.current) return;
    
    sendMessage({
      type: MessageType.USER_CURSOR,
      designId: currentDesignId.current,
      payload: {
        position: { x, y }
      }
    });
  };
  
  // Handle initial sync of design data
  const handleSyncDesign = (payload: any) => {
    const { design, elements, activeUsers } = payload;
    
    // Update design data in Redux store
    // We should add logic here to load the design and elements into the store
    
    // Update active users
    setUsers(activeUsers || []);
    dispatch(updateActiveUsers(activeUsers || []));
    
    toast({
      title: 'Design Loaded',
      description: `Loaded design "${design.name}" with ${elements.length} elements and ${activeUsers.length} active users`
    });
  };
  
  // Handle a user joining the design
  const handleUserJoined = (user: User) => {
    setUsers(prev => [...prev.filter(u => u.id !== user.id), user]);
    dispatch(updateActiveUsers([...users.filter(u => u.id !== user.id), user]));
  };
  
  // Handle a user leaving the design
  const handleUserLeft = (userId: string) => {
    setUsers(prev => prev.filter(user => user.id !== userId));
    dispatch(updateActiveUsers(users.filter(user => user.id !== userId)));
  };
  
  // Handle user selection changes
  const handleUserSelection = (payload: any) => {
    const { userId, selectedElementIds, username, color } = payload;
    
    // Update the user's selection in the users list
    setUsers(prev => prev.map(user => 
      user.id === userId 
        ? { ...user, selections: selectedElementIds }
        : user
    ));
    
    // Update in Redux store
    dispatch(updateActiveUsers(
      users.map(user => 
        user.id === userId 
          ? { ...user, selections: selectedElementIds }
          : user
      )
    ));
  };
  
  // Handle user cursor movements
  const handleUserCursor = (payload: any) => {
    const { userId, position, username, color } = payload;
    
    // Update the user's cursor position in the users list
    setUsers(prev => prev.map(user => 
      user.id === userId 
        ? { ...user, cursor: position }
        : user
    ));
    
    // Update cursors in Redux store
    dispatch(updateUserCursors({
      userId,
      position,
      username: username || 'User',
      color: color || '#6366F1'
    }));
  };
  
  const contextValue: WebSocketContextType = {
    connected,
    users,
    clientId,
    userColor,
    joinDesign,
    leaveDesign,
    sendElementUpdate,
    sendElementAdd,
    sendElementDelete,
    sendSelectionChange,
    sendCursorPosition
  };
  
  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
};

// Hook to use the WebSocket context
export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};