import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ElementType, type Element } from '@shared/schema';
import { generateId } from '@/lib/canvas-utils';

// Define types for the design state
export type ToolType = 'select' | 'rectangle' | 'ellipse' | 'text' | 'line' | 'hand';

export interface UserCursor {
  userId: string;
  position: { x: number; y: number };
  username: string;
  color: string;
}

export interface ActiveUser {
  id: string;
  username: string;
  color: string;
  cursor?: { x: number; y: number };
  selections?: number[];
}

export interface DesignState {
  // Canvas state
  elements: Element[];
  selectedElementIds: number[];
  canvasWidth: number;
  canvasHeight: number;
  zoomLevel: number;
  panOffset: { x: number; y: number };
  
  // Tool state
  activeTool: ToolType;
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
  
  // UI state
  documentName: string;
  showExportDialog: boolean;
  theme: 'light' | 'dark';
  
  // Collaboration state
  activeUsers: ActiveUser[];
  userCursors: UserCursor[];
  isConnected: boolean;
  userId: string | null;
}

const initialState: DesignState = {
  // Canvas state
  elements: [],
  selectedElementIds: [],
  canvasWidth: 1200,
  canvasHeight: 800,
  zoomLevel: 1,
  panOffset: { x: 0, y: 0 },
  
  // Tool state
  activeTool: 'select',
  fillColor: '#3B82F6',
  strokeColor: '#000000',
  strokeWidth: 1,
  
  // UI state
  documentName: 'Untitled Design',
  showExportDialog: false,
  theme: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
  
  // Collaboration state
  activeUsers: [],
  userCursors: [],
  isConnected: false,
  userId: null,
};

export const designSlice = createSlice({
  name: 'design',
  initialState,
  reducers: {
    // Canvas state actions
    setElements: (state, action: PayloadAction<Element[]>) => {
      state.elements = action.payload;
    },
    
    addElement: (state, action: PayloadAction<Partial<Element>>) => {
      const newElement: Element = {
        id: action.payload.id || generateId(),
        type: action.payload.type || ElementType.RECTANGLE,
        x: action.payload.x || 0,
        y: action.payload.y || 0,
        width: action.payload.width || 100,
        height: action.payload.height || 100,
        rotation: action.payload.rotation || 0,
        fill: action.payload.fill || state.fillColor,
        stroke: action.payload.stroke || state.strokeColor,
        strokeWidth: action.payload.strokeWidth || state.strokeWidth,
        opacity: action.payload.opacity !== undefined ? action.payload.opacity : 1,
        zIndex: action.payload.zIndex || state.elements.length,
        content: action.payload.content || '',
        properties: action.payload.properties || {},
        designId: action.payload.designId || 1,
      };
      
      state.elements.push(newElement);
      state.selectedElementIds = [newElement.id];
    },
    
    updateElement: (state, action: PayloadAction<{ id: number, updates: Partial<Element> }>) => {
      const { id, updates } = action.payload;
      const elementIndex = state.elements.findIndex(el => el.id === id);
      
      if (elementIndex !== -1) {
        state.elements[elementIndex] = {
          ...state.elements[elementIndex],
          ...updates
        };
      }
    },
    
    deleteElement: (state, action: PayloadAction<number>) => {
      state.elements = state.elements.filter(el => el.id !== action.payload);
      
      if (state.selectedElementIds.includes(action.payload)) {
        state.selectedElementIds = state.selectedElementIds.filter(id => id !== action.payload);
      }
    },
    
    duplicateElement: (state, action: PayloadAction<number>) => {
      const elementToDuplicate = state.elements.find(el => el.id === action.payload);
      
      if (elementToDuplicate) {
        const newElement: Element = {
          ...elementToDuplicate,
          id: generateId(),
          x: elementToDuplicate.x + 20,
          y: elementToDuplicate.y + 20,
          zIndex: Math.max(...state.elements.map(el => el.zIndex), 0) + 1
        };
        
        state.elements.push(newElement);
        state.selectedElementIds = [newElement.id];
      }
    },
    
    // Selection actions
    selectElement: (state, action: PayloadAction<number>) => {
      state.selectedElementIds = [action.payload];
    },
    
    selectMultipleElements: (state, action: PayloadAction<number[]>) => {
      state.selectedElementIds = action.payload;
    },
    
    deselectAll: (state) => {
      state.selectedElementIds = [];
    },
    
    // Canvas view actions
    setZoomLevel: (state, action: PayloadAction<number>) => {
      state.zoomLevel = action.payload;
    },
    
    setPanOffset: (state, action: PayloadAction<{ x: number; y: number }>) => {
      state.panOffset = action.payload;
    },
    
    // Layer ordering actions
    bringForward: (state, action: PayloadAction<number>) => {
      const elementIndex = state.elements.findIndex(el => el.id === action.payload);
      
      if (elementIndex !== -1 && elementIndex < state.elements.length - 1) {
        const currentZIndex = state.elements[elementIndex].zIndex;
        const nextElement = state.elements[elementIndex + 1];
        
        state.elements[elementIndex].zIndex = nextElement.zIndex;
        nextElement.zIndex = currentZIndex;
      }
    },
    
    sendBackward: (state, action: PayloadAction<number>) => {
      const elementIndex = state.elements.findIndex(el => el.id === action.payload);
      
      if (elementIndex > 0) {
        const currentZIndex = state.elements[elementIndex].zIndex;
        const prevElement = state.elements[elementIndex - 1];
        
        state.elements[elementIndex].zIndex = prevElement.zIndex;
        prevElement.zIndex = currentZIndex;
      }
    },
    
    bringToFront: (state, action: PayloadAction<number>) => {
      const element = state.elements.find(el => el.id === action.payload);
      
      if (element) {
        const maxZIndex = Math.max(...state.elements.map(el => el.zIndex), 0);
        element.zIndex = maxZIndex + 1;
      }
    },
    
    sendToBack: (state, action: PayloadAction<number>) => {
      const element = state.elements.find(el => el.id === action.payload);
      
      if (element) {
        const minZIndex = Math.min(...state.elements.map(el => el.zIndex), 0);
        element.zIndex = minZIndex - 1;
      }
    },
    
    // Tool state actions
    setActiveTool: (state, action: PayloadAction<ToolType>) => {
      state.activeTool = action.payload;
    },
    
    setFillColor: (state, action: PayloadAction<string>) => {
      state.fillColor = action.payload;
      
      // Apply to selected elements if any
      if (state.selectedElementIds.length > 0) {
        state.elements = state.elements.map(element => {
          if (state.selectedElementIds.includes(element.id)) {
            return { ...element, fill: action.payload };
          }
          return element;
        });
      }
    },
    
    setStrokeColor: (state, action: PayloadAction<string>) => {
      state.strokeColor = action.payload;
      
      // Apply to selected elements if any
      if (state.selectedElementIds.length > 0) {
        state.elements = state.elements.map(element => {
          if (state.selectedElementIds.includes(element.id)) {
            return { ...element, stroke: action.payload };
          }
          return element;
        });
      }
    },
    
    setStrokeWidth: (state, action: PayloadAction<number>) => {
      state.strokeWidth = action.payload;
      
      // Apply to selected elements if any
      if (state.selectedElementIds.length > 0) {
        state.elements = state.elements.map(element => {
          if (state.selectedElementIds.includes(element.id)) {
            return { ...element, strokeWidth: action.payload };
          }
          return element;
        });
      }
    },
    
    // UI state actions
    setDocumentName: (state, action: PayloadAction<string>) => {
      state.documentName = action.payload;
    },
    
    setShowExportDialog: (state, action: PayloadAction<boolean>) => {
      state.showExportDialog = action.payload;
    },
    
    toggleTheme: (state) => {
      state.theme = state.theme === 'light' ? 'dark' : 'light';
    },
    
    // Canvas management actions
    clearCanvas: (state) => {
      state.elements = [];
      state.selectedElementIds = [];
    },
    
    // Collaboration actions
    setActiveUsers: (state, action: PayloadAction<ActiveUser[]>) => {
      state.activeUsers = action.payload;
    },
    
    updateActiveUsers: (state, action: PayloadAction<ActiveUser[]>) => {
      state.activeUsers = action.payload;
    },
    
    updateUserCursor: (state, action: PayloadAction<UserCursor>) => {
      const { userId } = action.payload;
      const cursorIndex = state.userCursors.findIndex(cursor => cursor.userId === userId);
      
      if (cursorIndex !== -1) {
        state.userCursors[cursorIndex] = action.payload;
      } else {
        state.userCursors.push(action.payload);
      }
    },
    
    updateUserCursors: (state, action: PayloadAction<UserCursor>) => {
      const { userId } = action.payload;
      const existingIndex = state.userCursors.findIndex(c => c.userId === userId);
      
      if (existingIndex !== -1) {
        state.userCursors[existingIndex] = action.payload;
      } else {
        state.userCursors.push(action.payload);
      }
    },
    
    removeUserCursor: (state, action: PayloadAction<string>) => {
      state.userCursors = state.userCursors.filter(cursor => cursor.userId !== action.payload);
    },
    
    setConnectionStatus: (state, action: PayloadAction<boolean>) => {
      state.isConnected = action.payload;
    },
    
    setUserId: (state, action: PayloadAction<string>) => {
      state.userId = action.payload;
    }
  }
});

export const { 
  setElements, addElement, updateElement, deleteElement, duplicateElement,
  selectElement, selectMultipleElements, deselectAll,
  setZoomLevel, setPanOffset,
  bringForward, sendBackward, bringToFront, sendToBack,
  setActiveTool, setFillColor, setStrokeColor, setStrokeWidth,
  setDocumentName, setShowExportDialog, toggleTheme,
  clearCanvas,
  setActiveUsers, updateActiveUsers, updateUserCursor, updateUserCursors, removeUserCursor,
  setConnectionStatus, setUserId
} = designSlice.actions;

export default designSlice.reducer;