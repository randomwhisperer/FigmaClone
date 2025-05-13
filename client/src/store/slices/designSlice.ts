import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import undoable from 'redux-undo';
import { ElementType, type Element } from '@shared/schema';
import { generateId } from '@/lib/canvas-utils';

export type ToolType = 'select' | 'rectangle' | 'ellipse' | 'text' | 'line' | 'hand';

interface DesignState {
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
  sidebarCollapsed: boolean;
}

const initialState: DesignState = {
  // Canvas state
  elements: [],
  selectedElementIds: [],
  canvasWidth: 800,
  canvasHeight: 600,
  zoomLevel: 1,
  panOffset: { x: 0, y: 0 },
  
  // Tool state
  activeTool: 'select',
  fillColor: '#3B82F6', // Blue
  strokeColor: 'transparent',
  strokeWidth: 0,
  
  // UI state
  documentName: 'Untitled Design',
  showExportDialog: false,
  theme: 'light',
  sidebarCollapsed: false,
};

// Slice for elements and canvas state
const designSlice = createSlice({
  name: 'design',
  initialState,
  reducers: {
    // Tool actions
    setActiveTool: (state, action: PayloadAction<ToolType>) => {
      state.activeTool = action.payload;
    },
    setZoomLevel: (state, action: PayloadAction<number>) => {
      state.zoomLevel = action.payload;
    },
    setPanOffset: (state, action: PayloadAction<{ x: number; y: number }>) => {
      state.panOffset = action.payload;
    },
    setFillColor: (state, action: PayloadAction<string>) => {
      state.fillColor = action.payload;
    },
    setStrokeColor: (state, action: PayloadAction<string>) => {
      state.strokeColor = action.payload;
    },
    setStrokeWidth: (state, action: PayloadAction<number>) => {
      state.strokeWidth = action.payload;
    },
    setDocumentName: (state, action: PayloadAction<string>) => {
      state.documentName = action.payload;
    },
    setShowExportDialog: (state, action: PayloadAction<boolean>) => {
      state.showExportDialog = action.payload;
    },
    toggleTheme: (state) => {
      state.theme = state.theme === 'light' ? 'dark' : 'light';
    },
    toggleSidebar: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    
    // Element actions
    addElement: (state, action: PayloadAction<Partial<Element>>) => {
      const maxZIndex = state.elements.length > 0 
        ? Math.max(...state.elements.map(e => e.zIndex))
        : 0;
      
      const newElement: Element = {
        id: generateId(),
        designId: 1, // Default design ID
        type: action.payload.type || ElementType.RECTANGLE,
        x: action.payload.x || 100,
        y: action.payload.y || 100,
        width: action.payload.width || 100,
        height: action.payload.height || 100,
        rotation: action.payload.rotation || 0,
        fill: action.payload.fill || state.fillColor,
        stroke: action.payload.stroke || state.strokeColor,
        strokeWidth: action.payload.strokeWidth || state.strokeWidth,
        opacity: action.payload.opacity || 1,
        content: action.payload.content || '',
        zIndex: maxZIndex + 1,
        properties: action.payload.properties || {},
      };
      
      state.elements.push(newElement);
      state.selectedElementIds = [newElement.id];
    },
    
    updateElement: (state, action: PayloadAction<{ id: number; updates: Partial<Element> }>) => {
      const { id, updates } = action.payload;
      const index = state.elements.findIndex(element => element.id === id);
      
      if (index !== -1) {
        state.elements[index] = { ...state.elements[index], ...updates };
      }
    },
    
    deleteElement: (state, action: PayloadAction<number>) => {
      const id = action.payload;
      state.elements = state.elements.filter(element => element.id !== id);
      state.selectedElementIds = state.selectedElementIds.filter(elementId => elementId !== id);
    },
    
    duplicateElement: (state, action: PayloadAction<number>) => {
      const id = action.payload;
      const elementToDuplicate = state.elements.find(element => element.id === id);
      
      if (elementToDuplicate) {
        const maxZIndex = Math.max(...state.elements.map(e => e.zIndex));
        const newElement: Element = {
          ...elementToDuplicate,
          id: generateId(),
          x: elementToDuplicate.x + 20,
          y: elementToDuplicate.y + 20,
          zIndex: maxZIndex + 1,
        };
        
        state.elements.push(newElement);
        state.selectedElementIds = [newElement.id];
      }
    },
    
    selectElement: (state, action: PayloadAction<number>) => {
      state.selectedElementIds = [action.payload];
    },
    
    selectMultipleElements: (state, action: PayloadAction<number[]>) => {
      state.selectedElementIds = action.payload;
    },
    
    deselectAll: (state) => {
      state.selectedElementIds = [];
    },
    
    bringForward: (state, action: PayloadAction<number>) => {
      const id = action.payload;
      const elements = [...state.elements].sort((a, b) => a.zIndex - b.zIndex);
      const index = elements.findIndex(el => el.id === id);
      
      if (index < elements.length - 1) {
        const currentZIndex = elements[index].zIndex;
        const nextZIndex = elements[index + 1].zIndex;
        
        // Find the element in the original array and update it
        const originalIndex = state.elements.findIndex(el => el.id === id);
        if (originalIndex !== -1) {
          state.elements[originalIndex].zIndex = nextZIndex;
        }
        
        // Find the next element in the original array and update it
        const nextElementId = elements[index + 1].id;
        const nextOriginalIndex = state.elements.findIndex(el => el.id === nextElementId);
        if (nextOriginalIndex !== -1) {
          state.elements[nextOriginalIndex].zIndex = currentZIndex;
        }
      }
    },
    
    sendBackward: (state, action: PayloadAction<number>) => {
      const id = action.payload;
      const elements = [...state.elements].sort((a, b) => a.zIndex - b.zIndex);
      const index = elements.findIndex(el => el.id === id);
      
      if (index > 0) {
        const currentZIndex = elements[index].zIndex;
        const prevZIndex = elements[index - 1].zIndex;
        
        // Find the element in the original array and update it
        const originalIndex = state.elements.findIndex(el => el.id === id);
        if (originalIndex !== -1) {
          state.elements[originalIndex].zIndex = prevZIndex;
        }
        
        // Find the previous element in the original array and update it
        const prevElementId = elements[index - 1].id;
        const prevOriginalIndex = state.elements.findIndex(el => el.id === prevElementId);
        if (prevOriginalIndex !== -1) {
          state.elements[prevOriginalIndex].zIndex = currentZIndex;
        }
      }
    },
    
    bringToFront: (state, action: PayloadAction<number>) => {
      const id = action.payload;
      const maxZIndex = Math.max(...state.elements.map(e => e.zIndex)) + 1;
      
      const index = state.elements.findIndex(el => el.id === id);
      if (index !== -1) {
        state.elements[index].zIndex = maxZIndex;
      }
    },
    
    sendToBack: (state, action: PayloadAction<number>) => {
      const id = action.payload;
      const minZIndex = Math.min(...state.elements.map(e => e.zIndex)) - 1;
      
      const index = state.elements.findIndex(el => el.id === id);
      if (index !== -1) {
        state.elements[index].zIndex = minZIndex;
      }
    },
    
    clearCanvas: (state) => {
      state.elements = [];
      state.selectedElementIds = [];
    },
  },
});

// Create the undoable reducer
const undoableDesign = undoable(designSlice.reducer, {
  limit: 50, // Limit the history to 50 steps
  filter: (action, currentState, previousState) => {
    // Don't add an undo point for these actions
    const nonUndoableActions = [
      'design/setActiveTool',
      'design/setZoomLevel',
      'design/setPanOffset',
      'design/setFillColor',
      'design/setStrokeColor',
      'design/setStrokeWidth',
      'design/setShowExportDialog',
      'design/selectElement',
      'design/selectMultipleElements',
      'design/deselectAll',
      'design/toggleTheme',
      'design/toggleSidebar',
    ];
    
    return !nonUndoableActions.includes(action.type);
  },
});

export const { 
  setActiveTool,
  setZoomLevel,
  setPanOffset,
  setFillColor,
  setStrokeColor,
  setStrokeWidth,
  setDocumentName,
  setShowExportDialog,
  toggleTheme,
  toggleSidebar,
  addElement,
  updateElement,
  deleteElement,
  duplicateElement,
  selectElement,
  selectMultipleElements,
  deselectAll,
  bringForward,
  sendBackward,
  bringToFront,
  sendToBack,
  clearCanvas,
} = designSlice.actions;

export default undoableDesign;