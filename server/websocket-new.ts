import { WebSocketServer } from 'ws';
import { Server } from 'http';
import { log } from './vite';
import { Element, type Design } from '../shared/schema';
import { storage } from './storage';

// Define message types for WebSocket communication
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

// Define interfaces for WebSocket messages
export interface WebSocketMessage {
  type: MessageType;
  payload?: any;
  designId?: number;
  userId?: string;
  timestamp?: number;
}

// Client connection with additional metadata
interface Client {
  id: string;
  ws: any; // Using 'any' to avoid WebSocket type issues
  designId?: number;
  username?: string;
  color?: string;
  cursor?: { x: number; y: number };
  selections?: number[];
}

// Generate a unique ID for clients
const generateId = () => Math.random().toString(36).substring(2, 10);

// Generate a random color for user representation
const generateColor = () => {
  const colors = [
    '#F87171', // Red
    '#FB923C', // Orange
    '#FBBF24', // Amber
    '#A3E635', // Lime
    '#34D399', // Emerald
    '#22D3EE', // Cyan
    '#818CF8', // Indigo
    '#C084FC', // Violet
    '#F472B6', // Pink
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

export class WebSocketServerHandler {
  private wss: WebSocketServer;
  private clients: Map<string, Client> = new Map();
  private designClients: Map<number, Set<string>> = new Map(); // designId -> clientIds

  constructor(server: Server) {
    // Use a specific path for our WebSocket server to avoid conflicts with Vite's WebSocket
    this.wss = new WebSocketServer({ 
      server,
      path: '/ws-collaboration'
    });
    this.setupWSS();
    
    log('WebSocket server initialized on path /ws-collaboration', 'websocket');
  }

  private setupWSS() {
    this.wss.on('connection', (ws: any) => {
      const clientId = generateId();
      const client: Client = {
        id: clientId,
        ws,
        color: generateColor(),
      };
      
      this.clients.set(clientId, client);
      
      // Send initial connection confirmation
      this.sendToClient(client, {
        type: MessageType.CONNECT,
        payload: {
          clientId,
          color: client.color,
          message: 'Connected to design server'
        }
      });
      
      log(`Client connected: ${clientId}`, 'websocket');

      ws.on('message', (message: any) => {
        try {
          const data: WebSocketMessage = JSON.parse(message.toString());
          this.handleMessage(client, data);
        } catch (err) {
          log(`Error parsing message: ${err}`, 'websocket');
          this.sendToClient(client, {
            type: MessageType.ERROR,
            payload: {
              message: 'Invalid message format'
            }
          });
        }
      });

      ws.on('close', () => {
        // Notify other clients in the same design
        if (client.designId) {
          this.broadcastToDesign(client.designId, {
            type: MessageType.DISCONNECT,
            payload: {
              clientId,
              message: 'Client disconnected'
            }
          }, client.id);
          
          // Remove client from design group
          const designClients = this.designClients.get(client.designId);
          if (designClients) {
            designClients.delete(client.id);
            if (designClients.size === 0) {
              this.designClients.delete(client.designId);
            }
          }
        }
        
        // Remove the client
        this.clients.delete(client.id);
        log(`Client disconnected: ${client.id}`, 'websocket');
      });
    });
  }

  private async handleMessage(client: Client, message: WebSocketMessage) {
    const { type, payload, designId } = message;
    
    // Add timestamp to track message ordering
    message.timestamp = Date.now();
    message.userId = client.id;
    
    switch (type) {
      case MessageType.JOIN_DESIGN:
        if (designId) {
          await this.handleJoinDesign(client, designId, payload);
        }
        break;
        
      case MessageType.LEAVE_DESIGN:
        this.handleLeaveDesign(client);
        break;
        
      case MessageType.UPDATE_ELEMENT:
        await this.handleUpdateElement(client, payload);
        break;
        
      case MessageType.ADD_ELEMENT:
        await this.handleAddElement(client, payload);
        break;
        
      case MessageType.DELETE_ELEMENT:
        await this.handleDeleteElement(client, payload);
        break;
        
      case MessageType.SELECTION_CHANGE:
        this.handleSelectionChange(client, payload);
        break;
        
      case MessageType.USER_CURSOR:
        this.handleUserCursor(client, payload);
        break;
        
      default:
        this.sendToClient(client, {
          type: MessageType.ERROR,
          payload: {
            message: `Unknown message type: ${type}`
          }
        });
    }
  }

  private async handleJoinDesign(client: Client, designId: number, payload: any) {
    try {
      // Set client's current design
      client.designId = designId;
      client.username = payload.username || `User ${client.id}`;
      
      // Create set of clients for this design if it doesn't exist
      if (!this.designClients.has(designId)) {
        this.designClients.set(designId, new Set());
      }
      
      // Add client to design group
      const designClients = this.designClients.get(designId);
      if (designClients) {
        designClients.add(client.id);
      }
      
      // Get design data to sync with client
      const design = await storage.getDesign(designId);
      const elements = await storage.getElementsByDesignId(designId);
      
      if (!design) {
        this.sendToClient(client, {
          type: MessageType.ERROR,
          payload: {
            message: `Design with ID ${designId} not found`
          }
        });
        return;
      }
      
      // Get all active users in this design
      const clientSet = this.designClients.get(designId);
      const activeUsers = clientSet ? Array.from(clientSet)
        .map(id => {
          const c = this.clients.get(id);
          if (!c) return null;
          return {
            id: c.id,
            username: c.username,
            color: c.color,
            cursor: c.cursor,
            selections: c.selections
          };
        }).filter(Boolean) : [];
      
      // Send design data to the joining client
      this.sendToClient(client, {
        type: MessageType.SYNC_DESIGN,
        designId,
        payload: {
          design,
          elements,
          activeUsers
        }
      });
      
      // Notify other clients that a new user joined
      this.broadcastToDesign(designId, {
        type: MessageType.JOIN_DESIGN,
        designId,
        payload: {
          user: {
            id: client.id,
            username: client.username,
            color: client.color
          },
          message: `${client.username} joined the design`
        }
      }, client.id);
      
      log(`Client ${client.id} joined design ${designId}`, 'websocket');
    } catch (error) {
      log(`Error joining design: ${error}`, 'websocket');
      this.sendToClient(client, {
        type: MessageType.ERROR,
        payload: {
          message: 'Error joining design'
        }
      });
    }
  }

  private handleLeaveDesign(client: Client) {
    if (!client.designId) return;
    
    const designId = client.designId;
    
    // Notify other clients that this user left
    this.broadcastToDesign(designId, {
      type: MessageType.LEAVE_DESIGN,
      designId,
      payload: {
        userId: client.id,
        message: `${client.username} left the design`
      }
    }, client.id);
    
    // Remove client from design group
    const designClients = this.designClients.get(designId);
    if (designClients) {
      designClients.delete(client.id);
      if (designClients.size === 0) {
        this.designClients.delete(designId);
      }
    }
    
    // Reset client's design state
    client.designId = undefined;
    client.selections = undefined;
    
    log(`Client ${client.id} left design ${designId}`, 'websocket');
  }

  private async handleUpdateElement(client: Client, payload: any) {
    if (!client.designId) {
      this.sendToClient(client, {
        type: MessageType.ERROR,
        payload: {
          message: 'Not joined any design'
        }
      });
      return;
    }
    
    try {
      const { id, updates } = payload;
      
      // Update the element in storage
      const updatedElement = await storage.updateElement(id, updates);
      
      if (!updatedElement) {
        this.sendToClient(client, {
          type: MessageType.ERROR,
          payload: {
            message: `Element with ID ${id} not found`
          }
        });
        return;
      }
      
      // Broadcast the update to all clients in the design
      this.broadcastToDesign(client.designId, {
        type: MessageType.UPDATE_ELEMENT,
        designId: client.designId,
        payload: {
          element: updatedElement,
          userId: client.id
        }
      });
      
      log(`Element ${id} updated by client ${client.id}`, 'websocket');
    } catch (error) {
      log(`Error updating element: ${error}`, 'websocket');
      this.sendToClient(client, {
        type: MessageType.ERROR,
        payload: {
          message: 'Error updating element'
        }
      });
    }
  }

  private async handleAddElement(client: Client, payload: any) {
    if (!client.designId) {
      this.sendToClient(client, {
        type: MessageType.ERROR,
        payload: {
          message: 'Not joined any design'
        }
      });
      return;
    }
    
    try {
      const elementData = {
        ...payload,
        designId: client.designId
      };
      
      // Add the element to storage
      const newElement = await storage.createElement(elementData);
      
      // Broadcast the new element to all clients in the design
      this.broadcastToDesign(client.designId, {
        type: MessageType.ADD_ELEMENT,
        designId: client.designId,
        payload: {
          element: newElement,
          userId: client.id
        }
      });
      
      log(`Element added by client ${client.id}`, 'websocket');
    } catch (error) {
      log(`Error adding element: ${error}`, 'websocket');
      this.sendToClient(client, {
        type: MessageType.ERROR,
        payload: {
          message: 'Error adding element'
        }
      });
    }
  }

  private async handleDeleteElement(client: Client, payload: any) {
    if (!client.designId) {
      this.sendToClient(client, {
        type: MessageType.ERROR,
        payload: {
          message: 'Not joined any design'
        }
      });
      return;
    }
    
    try {
      const { id } = payload;
      
      // Delete the element from storage
      const success = await storage.deleteElement(id);
      
      if (!success) {
        this.sendToClient(client, {
          type: MessageType.ERROR,
          payload: {
            message: `Element with ID ${id} not found`
          }
        });
        return;
      }
      
      // Broadcast the deletion to all clients in the design
      this.broadcastToDesign(client.designId, {
        type: MessageType.DELETE_ELEMENT,
        designId: client.designId,
        payload: {
          elementId: id,
          userId: client.id
        }
      });
      
      log(`Element ${id} deleted by client ${client.id}`, 'websocket');
    } catch (error) {
      log(`Error deleting element: ${error}`, 'websocket');
      this.sendToClient(client, {
        type: MessageType.ERROR,
        payload: {
          message: 'Error deleting element'
        }
      });
    }
  }

  private handleSelectionChange(client: Client, payload: any) {
    if (!client.designId) return;
    
    // Update client's selection state
    client.selections = payload.selectedElementIds || [];
    
    // Broadcast selection change to other clients
    this.broadcastToDesign(client.designId, {
      type: MessageType.SELECTION_CHANGE,
      designId: client.designId,
      payload: {
        userId: client.id,
        selectedElementIds: client.selections,
        username: client.username,
        color: client.color
      }
    }, client.id);
  }

  private handleUserCursor(client: Client, payload: any) {
    if (!client.designId) return;
    
    // Update client's cursor position
    client.cursor = payload.position;
    
    // Broadcast cursor position to other clients
    this.broadcastToDesign(client.designId, {
      type: MessageType.USER_CURSOR,
      designId: client.designId,
      payload: {
        userId: client.id,
        position: client.cursor,
        username: client.username,
        color: client.color
      }
    }, client.id);
  }

  // Send a message to a specific client
  private sendToClient(client: Client, message: WebSocketMessage) {
    if (client.ws.readyState === 1) { // 1 = OPEN
      client.ws.send(JSON.stringify(message));
    }
  }

  // Broadcast a message to all clients in a design
  private broadcastToDesign(designId: number, message: WebSocketMessage, excludeClientId?: string) {
    const clientIds = this.designClients.get(designId);
    if (!clientIds) return;
    
    // Convert Set to Array for iteration
    Array.from(clientIds).forEach(clientId => {
      if (excludeClientId && clientId === excludeClientId) return;
      
      const client = this.clients.get(clientId);
      if (client) {
        this.sendToClient(client, message);
      }
    });
  }

  // Broadcast a message to all connected clients
  private broadcastToAll(message: WebSocketMessage, excludeClientId?: string) {
    // Convert Map to Array of entries for iteration
    Array.from(this.clients.entries()).forEach(([clientId, client]) => {
      if (excludeClientId && clientId === excludeClientId) return;
      this.sendToClient(client, message);
    });
  }
}

// Export a function to create the WebSocket server
export function createWebSocketServer(server: Server): WebSocketServerHandler {
  return new WebSocketServerHandler(server);
}