import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { ElementType, type Element } from '@shared/schema';
import { generateId } from '@/lib/canvas-utils';

export type ToolType = 'select' | 'rectangle' | 'ellipse' | 'text' | 'line' | 'hand';
export type HistoryEntry = { elements: Element[] };

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
  
  // History for undo/redo
  history: HistoryEntry[];
  historyIndex: number;
  
  // Actions
  setActiveTool: (tool: ToolType) => void;
  setZoomLevel: (level: number) => void;
  setPanOffset: (offset: { x: number; y: number }) => void;
  setFillColor: (color: string) => void;
  setStrokeColor: (color: string) => void;
  setStrokeWidth: (width: number) => void;
  setDocumentName: (name: string) => void;
  setShowExportDialog: (show: boolean) => void;
  
  addElement: (element: Partial<Element>) => void;
  updateElement: (id: number, updates: Partial<Element>) => void;
  deleteElement: (id: number) => void;
  duplicateElement: (id: number) => void;
  
  selectElement: (id: number) => void;
  selectMultipleElements: (ids: number[]) => void;
  deselectAll: () => void;
  
  bringForward: (id: number) => void;
  sendBackward: (id: number) => void;
  bringToFront: (id: number) => void;
  sendToBack: (id: number) => void;
  
  undo: () => void;
  redo: () => void;
  saveToHistory: () => void;
  
  clearCanvas: () => void;
}

export const useDesignStore = create<DesignState>()(
  devtools(
    (set, get) => ({
      // Initial state
      elements: [],
      selectedElementIds: [],
      canvasWidth: 800,
      canvasHeight: 600,
      zoomLevel: 1,
      panOffset: { x: 0, y: 0 },
      
      activeTool: 'select',
      fillColor: '#3B82F6', // Blue
      strokeColor: 'transparent',
      strokeWidth: 0,
      
      documentName: 'Untitled Design',
      showExportDialog: false,
      
      history: [{ elements: [] }],
      historyIndex: 0,
      
      // Tool actions
      setActiveTool: (tool) => set({ activeTool: tool }),
      setZoomLevel: (level) => set({ zoomLevel: level }),
      setPanOffset: (offset) => set({ panOffset: offset }),
      setFillColor: (color) => set({ fillColor: color }),
      setStrokeColor: (color) => set({ strokeColor: color }),
      setStrokeWidth: (width) => set({ strokeWidth: width }),
      setDocumentName: (name) => set({ documentName: name }),
      setShowExportDialog: (show) => set({ showExportDialog: show }),
      
      // Element actions
      addElement: (element) => {
        const state = get();
        const maxZIndex = state.elements.length > 0 
          ? Math.max(...state.elements.map(e => e.zIndex))
          : 0;
        
        const newElement: Element = {
          id: generateId(),
          designId: 1, // Default design ID
          type: element.type || ElementType.RECTANGLE,
          x: element.x || 100,
          y: element.y || 100,
          width: element.width || 100,
          height: element.height || 100,
          rotation: element.rotation || 0,
          fill: element.fill || state.fillColor,
          stroke: element.stroke || state.strokeColor,
          strokeWidth: element.strokeWidth || state.strokeWidth,
          opacity: element.opacity || 1,
          content: element.content || '',
          zIndex: maxZIndex + 1,
          properties: element.properties || {},
        };
        
        set(state => ({ 
          elements: [...state.elements, newElement],
          selectedElementIds: [newElement.id],
        }));
        
        get().saveToHistory();
      },
      
      updateElement: (id, updates) => {
        set(state => ({
          elements: state.elements.map(element => 
            element.id === id ? { ...element, ...updates } : element
          )
        }));
        get().saveToHistory();
      },
      
      deleteElement: (id) => {
        set(state => ({
          elements: state.elements.filter(element => element.id !== id),
          selectedElementIds: state.selectedElementIds.filter(elementId => elementId !== id)
        }));
        get().saveToHistory();
      },
      
      duplicateElement: (id) => {
        const state = get();
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
          
          set(state => ({ 
            elements: [...state.elements, newElement],
            selectedElementIds: [newElement.id],
          }));
          
          get().saveToHistory();
        }
      },
      
      selectElement: (id) => {
        set({ selectedElementIds: [id] });
      },
      
      selectMultipleElements: (ids) => {
        set({ selectedElementIds: ids });
      },
      
      deselectAll: () => {
        set({ selectedElementIds: [] });
      },
      
      bringForward: (id) => {
        set(state => {
          const elements = [...state.elements].sort((a, b) => a.zIndex - b.zIndex);
          const index = elements.findIndex(el => el.id === id);
          
          if (index < elements.length - 1) {
            const currentZIndex = elements[index].zIndex;
            const nextZIndex = elements[index + 1].zIndex;
            
            elements[index].zIndex = nextZIndex;
            elements[index + 1].zIndex = currentZIndex;
          }
          
          return { elements };
        });
        get().saveToHistory();
      },
      
      sendBackward: (id) => {
        set(state => {
          const elements = [...state.elements].sort((a, b) => a.zIndex - b.zIndex);
          const index = elements.findIndex(el => el.id === id);
          
          if (index > 0) {
            const currentZIndex = elements[index].zIndex;
            const prevZIndex = elements[index - 1].zIndex;
            
            elements[index].zIndex = prevZIndex;
            elements[index - 1].zIndex = currentZIndex;
          }
          
          return { elements };
        });
        get().saveToHistory();
      },
      
      bringToFront: (id) => {
        set(state => {
          const elements = [...state.elements];
          const maxZIndex = Math.max(...elements.map(e => e.zIndex)) + 1;
          
          return {
            elements: elements.map(el => 
              el.id === id ? { ...el, zIndex: maxZIndex } : el
            )
          };
        });
        get().saveToHistory();
      },
      
      sendToBack: (id) => {
        set(state => {
          const elements = [...state.elements];
          const minZIndex = Math.min(...elements.map(e => e.zIndex)) - 1;
          
          return {
            elements: elements.map(el => 
              el.id === id ? { ...el, zIndex: minZIndex } : el
            )
          };
        });
        get().saveToHistory();
      },
      
      // History management
      saveToHistory: () => {
        const state = get();
        const newHistoryEntry = { elements: [...state.elements] };
        
        // Slice off any future history entries if we're in the middle of the history
        const newHistory = state.history.slice(0, state.historyIndex + 1);
        
        set({
          history: [...newHistory, newHistoryEntry],
          historyIndex: state.historyIndex + 1
        });
      },
      
      undo: () => {
        const state = get();
        if (state.historyIndex > 0) {
          const newIndex = state.historyIndex - 1;
          const historyEntry = state.history[newIndex];
          
          set({
            elements: historyEntry.elements,
            historyIndex: newIndex
          });
        }
      },
      
      redo: () => {
        const state = get();
        if (state.historyIndex < state.history.length - 1) {
          const newIndex = state.historyIndex + 1;
          const historyEntry = state.history[newIndex];
          
          set({
            elements: historyEntry.elements,
            historyIndex: newIndex
          });
        }
      },
      
      clearCanvas: () => {
        set({
          elements: [],
          selectedElementIds: []
        });
        get().saveToHistory();
      }
    }),
    { name: 'design-store' }
  )
);
