import React, { useState, useRef, useEffect, useCallback } from "react";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Grid, 
  Ruler, 
  AlignVerticalJustifyCenter, 
  AlignHorizontalJustifyCenter,
  Maximize,
  Minimize,
  MoveHorizontal,
  MoveVertical,
  Copy,
  Crosshair,
  Lock,
  Unlock,
  EyeOff,
} from "lucide-react";
import { 
  setZoomLevel,
  setPanOffset,
  selectElement,
  selectMultipleElements,
  deselectAll,
  addElement,
  updateElement,
  deleteElement,
  bringToFront,
  sendToBack,
  bringForward,
  sendBackward,
  duplicateElement,
} from "@/store/slices/designSlice";
import { ElementType, type Element } from "@shared/schema";
import { useTheme } from "@/contexts/ThemeContext";
import { useWebSocket } from "@/contexts/WebSocketContext";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Slider } from "@/components/ui/slider";
import { 
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
  ContextMenuGroup,
  ContextMenuLabel,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger
} from "@/components/ui/context-menu";
import { cn } from "@/lib/utils";
import { drawShape, isPointInShape } from "@/lib/shapes.tsx";
import { 
  snapToGrid, 
  snapToObjects,
  getRotatedBoundingBox,
  getTransformString,
  transformElement
} from "@/lib/canvas-utils";
import { CommentMarker } from "@/components/ui/comments-panel";

interface EnhancedCanvasProps {
  width?: number;
  height?: number;
  className?: string;
  onElementSelect?: (elementId: number) => void;
  onContextMenu?: (e: React.MouseEvent, element?: Element) => void;
}

// Canvas guide type
interface Guide {
  position: number;
  orientation: 'horizontal' | 'vertical';
  isSnapping?: boolean;
}

// Enum for multi-select modes
enum SelectionMode {
  REPLACE,
  ADD,
  TOGGLE
}

export default function EnhancedCanvas({
  width = 1200,
  height = 800,
  className,
  onElementSelect,
  onContextMenu
}: EnhancedCanvasProps) {
  // State from Redux store
  const dispatch = useAppDispatch();
  const {
    elements,
    selectedElementIds,
    zoomLevel,
    panOffset,
    activeTool,
    fillColor,
    strokeColor,
    strokeWidth,
  } = useAppSelector(state => state.design.present);

  // WebSocket context for real-time collaboration
  const { connected, sendCursorPosition, sendSelectionChange } = useWebSocket();

  // Local state
  const [isDrawing, setIsDrawing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [dragStartPos, setDragStartPos] = useState<{ x: number, y: number } | null>(null);
  const [selectedElementsStartState, setSelectedElementsStartState] = useState<Element[]>([]);
  const [panStart, setPanStart] = useState<{ x: number, y: number } | null>(null);
  const [selectionBox, setSelectionBox] = useState<{ x: number, y: number, width: number, height: number } | null>(null);
  const [showRulers, setShowRulers] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [gridSize, setGridSize] = useState(20);
  const [snapToGridEnabled, setSnapToGridEnabled] = useState(true);
  const [showGuides, setShowGuides] = useState(true);
  const [guides, setGuides] = useState<Guide[]>([]);
  const [activeGuide, setActiveGuide] = useState<Guide | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStartData, setResizeStartData] = useState<{
    element: Element;
    handle: string;
    startWidth: number;
    startHeight: number;
    startX: number;
    startY: number;
    aspectRatio: number;
  } | null>(null);
  const [isRotating, setIsRotating] = useState(false);
  const [rotateStartAngle, setRotateStartAngle] = useState(0);
  const [rotateStartElementAngle, setRotateStartElementAngle] = useState(0);
  const [mouseCursorPos, setMouseCursorPos] = useState<{ x: number, y: number }>({ x: 0, y: 0 });
  const [comments, setComments] = useState<{
    id: string;
    position: { x: number, y: number };
    resolved: boolean;
  }[]>([
    { id: 'comment-1', position: { x: 300, y: 200 }, resolved: false },
    { id: 'comment-2', position: { x: 500, y: 400 }, resolved: true },
  ]);
  const [selectedComment, setSelectedComment] = useState<string | null>(null);
  const [showAlignmentLines, setShowAlignmentLines] = useState(true);
  const [alignmentLines, setAlignmentLines] = useState<{
    horizontal: number[];
    vertical: number[];
  }>({
    horizontal: [],
    vertical: []
  });
  const [hiddenElementIds, setHiddenElementIds] = useState<number[]>([]);
  const [lockedElementIds, setLockedElementIds] = useState<number[]>([]);

  // Refs
  const canvasRef = useRef<HTMLDivElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const horizontalRulerRef = useRef<HTMLDivElement>(null);
  const verticalRulerRef = useRef<HTMLDivElement>(null);
  const rulerCornerRef = useRef<HTMLDivElement>(null);
  const isSpacePressed = useRef(false);
  const isShiftPressed = useRef(false);
  const isAltPressed = useRef(false);
  const contextMenuPosition = useRef<{ x: number, y: number } | null>(null);

  // Theme context
  const { isDarkMode } = useTheme();

  // Get transformed point accounting for zoom and pan
  const getTransformedPoint = useCallback((clientX: number, clientY: number) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (clientX - rect.left - panOffset.x) / zoomLevel;
    const y = (clientY - rect.top - panOffset.y) / zoomLevel;
    
    return { x, y };
  }, [zoomLevel, panOffset]);

  // Calculate alignment guides
  const calculateAlignmentGuides = useCallback((movingElements: Element[]) => {
    if (!showAlignmentLines || movingElements.length === 0) {
      setAlignmentLines({ horizontal: [], vertical: [] });
      return;
    }

    const horizontalLines: number[] = [];
    const verticalLines: number[] = [];
    
    // Get bounding boxes of moving elements
    const movingBoxes = movingElements.map(el => {
      const { x, y, width, height } = el;
      return {
        left: x,
        right: x + width,
        top: y,
        bottom: y + height,
        centerX: x + width / 2,
        centerY: y + height / 2
      };
    });
    
    // Check alignment with non-moving elements
    const staticElements = elements.filter(el => 
      !movingElements.some(mel => mel.id === el.id) && 
      !hiddenElementIds.includes(el.id)
    );
    
    staticElements.forEach(el => {
      const { x, y, width, height } = el;
      const box = {
        left: x,
        right: x + width,
        top: y,
        bottom: y + height,
        centerX: x + width / 2,
        centerY: y + height / 2
      };
      
      // Check each moving element against this static element
      movingBoxes.forEach(movingBox => {
        // Horizontal alignments (y-axis)
        // Top edge alignment
        if (Math.abs(movingBox.top - box.top) < 5) {
          horizontalLines.push(box.top);
        }
        
        // Bottom edge alignment
        if (Math.abs(movingBox.bottom - box.bottom) < 5) {
          horizontalLines.push(box.bottom);
        }
        
        // Center alignment
        if (Math.abs(movingBox.centerY - box.centerY) < 5) {
          horizontalLines.push(box.centerY);
        }
        
        // Top to bottom alignment
        if (Math.abs(movingBox.top - box.bottom) < 5) {
          horizontalLines.push(box.bottom);
        }
        
        // Bottom to top alignment
        if (Math.abs(movingBox.bottom - box.top) < 5) {
          horizontalLines.push(box.top);
        }
        
        // Vertical alignments (x-axis)
        // Left edge alignment
        if (Math.abs(movingBox.left - box.left) < 5) {
          verticalLines.push(box.left);
        }
        
        // Right edge alignment
        if (Math.abs(movingBox.right - box.right) < 5) {
          verticalLines.push(box.right);
        }
        
        // Center alignment
        if (Math.abs(movingBox.centerX - box.centerX) < 5) {
          verticalLines.push(box.centerX);
        }
        
        // Left to right alignment
        if (Math.abs(movingBox.left - box.right) < 5) {
          verticalLines.push(box.right);
        }
        
        // Right to left alignment
        if (Math.abs(movingBox.right - box.left) < 5) {
          verticalLines.push(box.left);
        }
      });
    });
    
    // Remove duplicates
    const uniqueHorizontal = Array.from(new Set(horizontalLines));
    const uniqueVertical = Array.from(new Set(verticalLines));
    
    setAlignmentLines({
      horizontal: uniqueHorizontal,
      vertical: uniqueVertical
    });
  }, [elements, showAlignmentLines, hiddenElementIds]);

  // Get cursor position for rulers
  const updateRulerCursors = useCallback((clientX: number, clientY: number) => {
    const { x, y } = getTransformedPoint(clientX, clientY);
    
    if (horizontalRulerRef.current) {
      const cursorElement = horizontalRulerRef.current.querySelector('.ruler-cursor') as HTMLElement;
      if (cursorElement) {
        cursorElement.style.left = `${x * zoomLevel + panOffset.x}px`;
      }
    }
    
    if (verticalRulerRef.current) {
      const cursorElement = verticalRulerRef.current.querySelector('.ruler-cursor') as HTMLElement;
      if (cursorElement) {
        cursorElement.style.top = `${y * zoomLevel + panOffset.y}px`;
      }
    }
  }, [getTransformedPoint, zoomLevel, panOffset]);

  // Render ruler ticks
  const renderRulerTicks = useCallback((ruler: HTMLDivElement, orientation: 'horizontal' | 'vertical') => {
    if (!ruler) return;
    
    const rulerLength = orientation === 'horizontal' ? width : height;
    const numTicks = Math.ceil(rulerLength / 10); // One tick every 10 pixels
    const ticksContainer = document.createElement('div');
    ticksContainer.className = 'ruler-ticks';
    
    // Major ticks every 100px, minor ticks every 50px, smallest ticks every 10px
    for (let i = 0; i <= numTicks; i++) {
      const tick = document.createElement('div');
      const position = i * 10;
      
      if (position % 100 === 0) { // Major tick
        tick.className = 'ruler-tick major';
        const label = document.createElement('span');
        label.className = 'ruler-label';
        label.textContent = `${position}`;
        tick.appendChild(label);
      } else if (position % 50 === 0) { // Minor tick
        tick.className = 'ruler-tick minor';
      } else { // Smallest tick
        tick.className = 'ruler-tick small';
      }
      
      if (orientation === 'horizontal') {
        tick.style.left = `${position}px`;
      } else {
        tick.style.top = `${position}px`;
      }
      
      ticksContainer.appendChild(tick);
    }
    
    // Create cursor indicator
    const cursor = document.createElement('div');
    cursor.className = 'ruler-cursor';
    
    // Clear existing content and append new elements
    ruler.innerHTML = '';
    ruler.appendChild(ticksContainer);
    ruler.appendChild(cursor);
  }, [width, height]);

  // Initialize rulers
  useEffect(() => {
    if (showRulers) {
      if (horizontalRulerRef.current) {
        renderRulerTicks(horizontalRulerRef.current, 'horizontal');
      }
      
      if (verticalRulerRef.current) {
        renderRulerTicks(verticalRulerRef.current, 'vertical');
      }
    }
  }, [showRulers, renderRulerTicks]);

  // Handle mouse down event
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left click
    
    const { x, y } = getTransformedPoint(e.clientX, e.clientY);
    setMouseCursorPos({ x, y });
    
    // Pan with space key or middle mouse button
    if (isSpacePressed.current || e.button === 1 || activeTool === 'hand') {
      setIsPanning(true);
      setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
      return;
    }
    
    // Handle selection tool
    if (activeTool === 'select') {
      // Check if clicking on any existing element (in reverse order by zIndex)
      const sortedElements = [...elements]
        .filter(el => !hiddenElementIds.includes(el.id))
        .sort((a, b) => b.zIndex - a.zIndex);
      
      let foundElement = false;
      
      for (const element of sortedElements) {
        // Skip locked elements for modification
        if (lockedElementIds.includes(element.id)) continue;
        
        if (isPointInShape(element, x, y)) {
          foundElement = true;
          
          // Determine selection mode based on modifier keys
          let selectionMode = SelectionMode.REPLACE;
          if (isShiftPressed.current) {
            selectionMode = selectedElementIds.includes(element.id) 
              ? SelectionMode.TOGGLE 
              : SelectionMode.ADD;
          }
          
          // Update selection based on mode
          switch (selectionMode) {
            case SelectionMode.REPLACE:
              if (!selectedElementIds.includes(element.id)) {
                dispatch(selectElement(element.id));
                if (onElementSelect) onElementSelect(element.id);
                
                // Send selection to WebSocket
                if (connected) {
                  sendSelectionChange([element.id]);
                }
              }
              break;
            case SelectionMode.ADD:
              dispatch(selectMultipleElements([...selectedElementIds, element.id]));
              // Send selection to WebSocket
              if (connected) {
                sendSelectionChange([...selectedElementIds, element.id]);
              }
              break;
            case SelectionMode.TOGGLE:
              const newSelection = selectedElementIds.filter(id => id !== element.id);
              dispatch(selectMultipleElements(newSelection));
              // Send selection to WebSocket
              if (connected) {
                sendSelectionChange(newSelection);
              }
              break;
          }
          
          // Start dragging the element(s)
          setIsDragging(true);
          setDragStartPos({ x, y });
          
          // Save the start state of all selected elements
          setSelectedElementsStartState(
            elements.filter(el => selectedElementIds.includes(el.id) || el.id === element.id)
          );
          
          break;
        }
      }
      
      // If clicked on empty space, start selection box
      if (!foundElement) {
        setSelectionBox({ x, y, width: 0, height: 0 });
        
        // Deselect all if not holding shift
        if (!isShiftPressed.current) {
          dispatch(deselectAll());
          
          // Send empty selection to WebSocket
          if (connected) {
            sendSelectionChange([]);
          }
        }
      }
      
      return;
    }
    
    // Start drawing a new shape
    if (activeTool !== 'select' && activeTool !== 'hand') {
      setIsDrawing(true);
      setDragStartPos({ x, y });
      
      // Create new element based on the active tool
      dispatch(addElement({
        type: activeTool as ElementType,
        x,
        y,
        width: 0,
        height: 0,
        rotation: 0,
        fill: fillColor,
        stroke: strokeColor,
        strokeWidth,
        opacity: 1,
        content: activeTool === 'text' ? 'Text' : ''
      }));
    }
  }, [
    elements, 
    activeTool, 
    selectedElementIds, 
    zoomLevel, 
    panOffset, 
    fillColor, 
    strokeColor, 
    strokeWidth,
    hiddenElementIds,
    lockedElementIds,
    connected,
    getTransformedPoint,
    dispatch,
    onElementSelect,
    sendSelectionChange
  ]);

  // Handle mouse move event
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const { x, y } = getTransformedPoint(e.clientX, e.clientY);
    setMouseCursorPos({ x, y });
    
    // Update ruler cursors
    if (showRulers) {
      updateRulerCursors(e.clientX, e.clientY);
    }
    
    // Send cursor position to WebSocket for collaboration
    if (connected) {
      sendCursorPosition(x, y);
    }
    
    // Handle panning
    if (isPanning && panStart) {
      dispatch(setPanOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      }));
      return;
    }
    
    // Handle rotation
    if (isRotating && dragStartPos && rotateStartAngle !== undefined) {
      const centerX = dragStartPos.x;
      const centerY = dragStartPos.y;
      
      // Calculate angle between center and current mouse position
      const angle = Math.atan2(y - centerY, x - centerX) * (180 / Math.PI);
      const angleDiff = angle - rotateStartAngle;
      
      // Get selected element
      const selectedElement = selectedElementIds.length === 1 
        ? elements.find(el => el.id === selectedElementIds[0])
        : null;
      
      if (selectedElement) {
        // Calculate new rotation, keeping it between 0-360
        let newRotation = (rotateStartElementAngle + angleDiff) % 360;
        if (newRotation < 0) newRotation += 360;
        
        // Snap to common angles if holding shift
        if (isShiftPressed.current) {
          const snapAngles = [0, 45, 90, 135, 180, 225, 270, 315, 360];
          const closestAngle = snapAngles.reduce((prev, curr) => {
            return (Math.abs(curr - newRotation) < Math.abs(prev - newRotation)) ? curr : prev;
          });
          
          if (Math.abs(closestAngle - newRotation) < 5) {
            newRotation = closestAngle;
          }
        }
        
        // Update element rotation
        dispatch(updateElement({
          id: selectedElement.id,
          updates: {
            rotation: newRotation
          }
        }));
      }
      
      return;
    }
    
    // Handle resizing
    if (isResizing && resizeStartData) {
      const { element, handle, startWidth, startHeight, startX, startY, aspectRatio } = resizeStartData;
      
      // Calculate the delta from starting position
      const dx = x - dragStartPos!.x;
      const dy = y - dragStartPos!.y;
      
      // Initialize new dimensions and position
      let newWidth = startWidth;
      let newHeight = startHeight;
      let newX = startX;
      let newY = startY;
      
      // Apply resize based on handle position
      switch (handle) {
        case 'top-left':
          newWidth = startWidth - dx;
          newHeight = startHeight - dy;
          newX = startX + dx;
          newY = startY + dy;
          break;
        case 'top':
          newHeight = startHeight - dy;
          newY = startY + dy;
          break;
        case 'top-right':
          newWidth = startWidth + dx;
          newHeight = startHeight - dy;
          newY = startY + dy;
          break;
        case 'right':
          newWidth = startWidth + dx;
          break;
        case 'bottom-right':
          newWidth = startWidth + dx;
          newHeight = startHeight + dy;
          break;
        case 'bottom':
          newHeight = startHeight + dy;
          break;
        case 'bottom-left':
          newWidth = startWidth - dx;
          newHeight = startHeight + dy;
          newX = startX + dx;
          break;
        case 'left':
          newWidth = startWidth - dx;
          newX = startX + dx;
          break;
      }
      
      // Apply minimum size constraints
      newWidth = Math.max(10, newWidth);
      newHeight = Math.max(10, newHeight);
      
      // Maintain aspect ratio if shift is pressed
      if (isShiftPressed.current && aspectRatio) {
        if (handle.includes('top') || handle.includes('bottom')) {
          // Adjust width based on height change
          newWidth = newHeight * aspectRatio;
        } else {
          // Adjust height based on width change
          newHeight = newWidth / aspectRatio;
        }
        
        // Adjust position for handles that affect position
        if (handle.includes('left')) {
          newX = startX + (startWidth - newWidth);
        }
        if (handle.includes('top')) {
          newY = startY + (startHeight - newHeight);
        }
      }
      
      // Apply snapping if enabled
      if (snapToGridEnabled) {
        newX = snapToGrid(newX, gridSize);
        newY = snapToGrid(newY, gridSize);
        newWidth = snapToGrid(newWidth, gridSize);
        newHeight = snapToGrid(newHeight, gridSize);
      }
      
      // Update element
      dispatch(updateElement({
        id: element.id,
        updates: {
          x: newX,
          y: newY,
          width: newWidth,
          height: newHeight
        }
      }));
      
      return;
    }
    
    // Handle selection box
    if (selectionBox !== null) {
      setSelectionBox({
        ...selectionBox,
        width: x - selectionBox.x,
        height: y - selectionBox.y
      });
      return;
    }
    
    // Handle drawing a new element
    if (isDrawing && dragStartPos) {
      const newElement = elements[elements.length - 1];
      const dx = x - dragStartPos.x;
      const dy = y - dragStartPos.y;
      
      if (activeTool === 'line') {
        // For line, we just track the end point
        dispatch(updateElement({
          id: newElement.id,
          updates: {
            width: dx,
            height: dy
          }
        }));
      } else {
        // For rectangle, ellipse, and text - maintain aspect ratio if shift is pressed
        if (isShiftPressed.current && activeTool !== 'text') {
          const absWidth = Math.abs(dx);
          const absHeight = Math.abs(dy);
          const size = Math.max(absWidth, absHeight);
          
          const updatedX = dx < 0 ? dragStartPos.x - size : dragStartPos.x;
          const updatedY = dy < 0 ? dragStartPos.y - size : dragStartPos.y;
          
          dispatch(updateElement({
            id: newElement.id,
            updates: {
              x: updatedX,
              y: updatedY,
              width: size,
              height: size
            }
          }));
        } else {
          // Normal resizing without aspect ratio constraint
          dispatch(updateElement({
            id: newElement.id,
            updates: {
              width: Math.abs(dx),
              height: Math.abs(dy),
              x: dx < 0 ? x : dragStartPos.x,
              y: dy < 0 ? y : dragStartPos.y
            }
          }));
        }
      }
      
      return;
    }
    
    // Handle dragging existing elements
    if (isDragging && dragStartPos && selectedElementIds.length > 0 && selectedElementsStartState.length > 0) {
      const dx = x - dragStartPos.x;
      const dy = y - dragStartPos.y;
      
      // If alt/option is pressed, duplicate elements on first move
      if (isAltPressed.current && Math.abs(dx) + Math.abs(dy) > 5) {
        isAltPressed.current = false; // Reset to prevent multiple duplications
        
        // Create duplicates of selected elements
        const duplicatedIds: number[] = [];
        
        selectedElementIds.forEach(id => {
          const element = elements.find(el => el.id === id);
          if (element) {
            dispatch(duplicateElement(id));
            // Note: We would need the new IDs here, but for simplicity
            // we'll just keep the original selection
          }
        });
      }
      
      // Calculate new positions with potential snapping
      const updatedElements = selectedElementsStartState.map(element => {
        if (selectedElementIds.includes(element.id)) {
          let newX = element.x + dx;
          let newY = element.y + dy;
          
          // Apply grid snapping if enabled
          if (snapToGridEnabled) {
            newX = snapToGrid(newX, gridSize);
            newY = snapToGrid(newY, gridSize);
          }
          
          // Apply object snapping with alignment guides
          const movingElements = selectedElementsStartState.filter(el => 
            selectedElementIds.includes(el.id)
          ).map(el => ({
            ...el,
            x: el === element ? newX : el.x + dx,
            y: el === element ? newY : el.y + dy
          }));
          
          calculateAlignmentGuides(movingElements);
          
          return {
            ...element,
            x: newX,
            y: newY
          };
        }
        return element;
      });
      
      // Update all selected elements
      updatedElements.forEach(element => {
        if (selectedElementIds.includes(element.id)) {
          dispatch(updateElement({
            id: element.id,
            updates: {
              x: element.x,
              y: element.y
            }
          }));
        }
      });
    }
  }, [
    activeTool,
    connected,
    dispatch,
    dragStartPos,
    elements,
    getTransformedPoint,
    gridSize,
    isDrawing,
    isDragging,
    isPanning,
    isResizing,
    isRotating,
    panOffset,
    panStart,
    resizeStartData,
    rotateStartAngle,
    rotateStartElementAngle,
    selectedElementIds,
    selectedElementsStartState,
    selectionBox,
    sendCursorPosition,
    showRulers,
    snapToGridEnabled,
    updateRulerCursors,
    zoomLevel,
    calculateAlignmentGuides
  ]);

  // Handle mouse up event
  const handleMouseUp = useCallback(() => {
    // Finish selection box if active
    if (selectionBox) {
      // Normalize the selection box dimensions
      const normalizedBox = {
        x: selectionBox.width < 0 ? selectionBox.x + selectionBox.width : selectionBox.x,
        y: selectionBox.height < 0 ? selectionBox.y + selectionBox.height : selectionBox.y,
        width: Math.abs(selectionBox.width),
        height: Math.abs(selectionBox.height)
      };
      
      // Only select elements if the box has some size (not just a click)
      if (normalizedBox.width > 5 || normalizedBox.height > 5) {
        // Find elements that intersect with the selection box
        const selectedElements = elements
          .filter(element => !hiddenElementIds.includes(element.id))
          .filter(element => {
            // Check if element intersects with selection box
            return (
              element.x < normalizedBox.x + normalizedBox.width &&
              element.x + element.width > normalizedBox.x &&
              element.y < normalizedBox.y + normalizedBox.height &&
              element.y + element.height > normalizedBox.y
            );
          });
        
        const newSelectedIds = selectedElements.map(element => element.id);
        
        // Combine with existing selection if shift was pressed
        if (isShiftPressed.current) {
          const combinedSelection = [
            ...selectedElementIds,
            ...newSelectedIds.filter(id => !selectedElementIds.includes(id))
          ];
          dispatch(selectMultipleElements(combinedSelection));
          
          // Send selection to WebSocket
          if (connected) {
            sendSelectionChange(combinedSelection);
          }
        } else {
          dispatch(selectMultipleElements(newSelectedIds));
          
          // Send selection to WebSocket
          if (connected) {
            sendSelectionChange(newSelectedIds);
          }
        }
      }
      
      setSelectionBox(null);
    }
    
    // Clear alignment guides
    setAlignmentLines({ horizontal: [], vertical: [] });
    
    // Reset states
    setIsDrawing(false);
    setIsDragging(false);
    setIsPanning(false);
    setIsResizing(false);
    setIsRotating(false);
    setDragStartPos(null);
    setSelectedElementsStartState([]);
    setPanStart(null);
    setResizeStartData(null);
  }, [
    connected, 
    dispatch, 
    elements, 
    hiddenElementIds,
    isShiftPressed, 
    selectedElementIds, 
    selectionBox, 
    sendSelectionChange
  ]);

  // Handle wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      const newZoom = Math.max(0.1, Math.min(3, zoomLevel + delta));
      
      // Get mouse position before zoom
      const { x: mouseX, y: mouseY } = getTransformedPoint(e.clientX, e.clientY);
      
      // Apply zoom
      dispatch(setZoomLevel(newZoom));
      
      // Adjust pan to keep the point under the mouse in the same position
      const newPanX = e.clientX - mouseX * newZoom;
      const newPanY = e.clientY - mouseY * newZoom;
      
      dispatch(setPanOffset({ x: newPanX, y: newPanY }));
    }
  }, [dispatch, getTransformedPoint, zoomLevel]);

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Modifier keys
      if (e.key === ' ' && !isSpacePressed.current) {
        isSpacePressed.current = true;
        document.body.style.cursor = 'grab';
      }
      
      if (e.shiftKey && !isShiftPressed.current) {
        isShiftPressed.current = true;
      }
      
      if ((e.altKey || e.key === 'Alt') && !isAltPressed.current) {
        isAltPressed.current = true;
      }
      
      // Delete selected elements
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedElementIds.length > 0) {
        e.preventDefault();
        
        // Only delete unlocked elements
        const elementsToDelete = selectedElementIds.filter(id => !lockedElementIds.includes(id));
        elementsToDelete.forEach(id => {
          dispatch(deleteElement(id));
        });
        
        return;
      }
      
      // Copy with Ctrl+C / Cmd+C
      if ((e.ctrlKey || e.metaKey) && e.key === 'c' && selectedElementIds.length > 0) {
        // In a real app, this would copy elements to clipboard
        // For simplicity, we'll just show a toast or log
        console.log('Copy', selectedElementIds);
        return;
      }
      
      // Paste with Ctrl+V / Cmd+V
      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        // In a real app, this would paste elements from clipboard
        // For simplicity, we'll just duplicate the last selected element
        if (selectedElementIds.length > 0) {
          dispatch(duplicateElement(selectedElementIds[0]));
        }
        return;
      }
      
      // Duplicate with Ctrl+D / Cmd+D
      if ((e.ctrlKey || e.metaKey) && e.key === 'd' && selectedElementIds.length > 0) {
        e.preventDefault(); // Prevent browser bookmark action
        selectedElementIds.forEach(id => {
          dispatch(duplicateElement(id));
        });
        return;
      }
      
      // Select all with Ctrl+A / Cmd+A
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault(); // Prevent browser select all action
        
        // Select all visible elements
        const visibleElementIds = elements
          .filter(el => !hiddenElementIds.includes(el.id))
          .map(el => el.id);
        
        dispatch(selectMultipleElements(visibleElementIds));
        
        // Send selection to WebSocket
        if (connected) {
          sendSelectionChange(visibleElementIds);
        }
        
        return;
      }
      
      // Undo/Redo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          // Redo with Ctrl+Shift+Z / Cmd+Shift+Z
          // This would be handled by the store's middleware
        } else {
          // Undo with Ctrl+Z / Cmd+Z
          // This would be handled by the store's middleware
        }
        return;
      }
      
      // Bring to front with Ctrl+]
      if ((e.ctrlKey || e.metaKey) && e.key === ']' && selectedElementIds.length > 0) {
        selectedElementIds.forEach(id => {
          dispatch(bringToFront(id));
        });
        return;
      }
      
      // Send to back with Ctrl+[
      if ((e.ctrlKey || e.metaKey) && e.key === '[' && selectedElementIds.length > 0) {
        selectedElementIds.forEach(id => {
          dispatch(sendToBack(id));
        });
        return;
      }
      
      // Bring forward with Ctrl+Shift+]
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === ']' && selectedElementIds.length > 0) {
        selectedElementIds.forEach(id => {
          dispatch(bringForward(id));
        });
        return;
      }
      
      // Send backward with Ctrl+Shift+[
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === '[' && selectedElementIds.length > 0) {
        selectedElementIds.forEach(id => {
          dispatch(sendBackward(id));
        });
        return;
      }
      
      // Arrow keys for nudging elements
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key) && 
          selectedElementIds.length > 0 && 
          !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        
        // Larger moves with shift key
        const moveAmount = e.shiftKey ? 10 : 1;
        
        // Calculate move deltas
        let dx = 0;
        let dy = 0;
        
        switch (e.key) {
          case 'ArrowUp':
            dy = -moveAmount;
            break;
          case 'ArrowDown':
            dy = moveAmount;
            break;
          case 'ArrowLeft':
            dx = -moveAmount;
            break;
          case 'ArrowRight':
            dx = moveAmount;
            break;
        }
        
        // Move each selected element
        selectedElementIds.forEach(id => {
          const element = elements.find(el => el.id === id);
          if (element && !lockedElementIds.includes(id)) {
            dispatch(updateElement({
              id: element.id,
              updates: {
                x: element.x + dx,
                y: element.y + dy
              }
            }));
          }
        });
        
        return;
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        isSpacePressed.current = false;
        document.body.style.cursor = 'default';
      }
      
      if (!e.shiftKey && isShiftPressed.current) {
        isShiftPressed.current = false;
      }
      
      if (!e.altKey && isAltPressed.current) {
        isAltPressed.current = false;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [
    connected, 
    dispatch, 
    elements, 
    hiddenElementIds, 
    lockedElementIds,
    selectedElementIds, 
    sendSelectionChange
  ]);

  // Get canvas cursor style
  const getCanvasCursor = () => {
    if (isPanning || isSpacePressed.current) return 'grabbing';
    if (isDragging) return 'move';
    if (isResizing) return 'nwse-resize'; // This should be more specific based on the handle
    if (isRotating) return 'crosshair';
    
    switch (activeTool) {
      case 'select': return 'default';
      case 'hand': return 'grab';
      case 'text': return 'text';
      default: return 'crosshair';
    }
  };

  // Handle resize handle interaction
  const handleResizeHandleMouseDown = (
    e: React.MouseEvent, 
    elementId: number, 
    handle: string
  ) => {
    e.stopPropagation(); // Prevent canvas mousedown from triggering
    
    // Find the element
    const element = elements.find(el => el.id === elementId);
    if (!element || lockedElementIds.includes(elementId)) return;
    
    // Set up resize data
    setIsResizing(true);
    setDragStartPos(getTransformedPoint(e.clientX, e.clientY));
    setResizeStartData({
      element,
      handle,
      startWidth: element.width,
      startHeight: element.height,
      startX: element.x,
      startY: element.y,
      aspectRatio: element.width / element.height
    });
  };

  // Handle rotation handle interaction
  const handleRotateHandleMouseDown = (
    e: React.MouseEvent, 
    elementId: number
  ) => {
    e.stopPropagation(); // Prevent canvas mousedown from triggering
    
    // Find the element
    const element = elements.find(el => el.id === elementId);
    if (!element || lockedElementIds.includes(elementId)) return;
    
    // Calculate center point of the element
    const centerX = element.x + element.width / 2;
    const centerY = element.y + element.height / 2;
    
    // Get current mouse position
    const { x, y } = getTransformedPoint(e.clientX, e.clientY);
    
    // Calculate starting angle
    const startAngle = Math.atan2(y - centerY, x - centerX) * (180 / Math.PI);
    
    // Set up rotation data
    setIsRotating(true);
    setDragStartPos({ x: centerX, y: centerY });
    setRotateStartAngle(startAngle);
    setRotateStartElementAngle(element.rotation || 0);
  };

  // Handle context menu
  const handleCanvasContextMenu = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent default browser context menu
    
    // Save position for context menu
    contextMenuPosition.current = { x: e.clientX, y: e.clientY };
    
    // If custom context menu handler is provided, use it
    if (onContextMenu) {
      // Find element under cursor
      const { x, y } = getTransformedPoint(e.clientX, e.clientY);
      const sortedElements = [...elements]
        .filter(el => !hiddenElementIds.includes(el.id))
        .sort((a, b) => b.zIndex - a.zIndex);
      
      let targetElement: Element | undefined;
      for (const element of sortedElements) {
        if (isPointInShape(element, x, y)) {
          targetElement = element;
          break;
        }
      }
      
      onContextMenu(e, targetElement);
    }
  };

  // Toggle element visibility
  const toggleElementVisibility = (elementId: number) => {
    if (hiddenElementIds.includes(elementId)) {
      setHiddenElementIds(hiddenElementIds.filter(id => id !== elementId));
    } else {
      setHiddenElementIds([...hiddenElementIds, elementId]);
    }
  };

  // Toggle element lock state
  const toggleElementLock = (elementId: number) => {
    if (lockedElementIds.includes(elementId)) {
      setLockedElementIds(lockedElementIds.filter(id => id !== elementId));
    } else {
      setLockedElementIds([...lockedElementIds, elementId]);
    }
  };

  // Render resize handles for selected elements
  const renderResizeHandles = (element: Element) => {
    if (lockedElementIds.includes(element.id)) return null;
    
    const handles = [
      { position: 'top-left', cursor: 'nwse-resize' },
      { position: 'top', cursor: 'ns-resize' },
      { position: 'top-right', cursor: 'nesw-resize' },
      { position: 'right', cursor: 'ew-resize' },
      { position: 'bottom-right', cursor: 'nwse-resize' },
      { position: 'bottom', cursor: 'ns-resize' },
      { position: 'bottom-left', cursor: 'nesw-resize' },
      { position: 'left', cursor: 'ew-resize' }
    ];
    
    return (
      <>
        {handles.map(({ position, cursor }) => (
          <div
            key={`${element.id}-${position}`}
            className="absolute w-2 h-2 bg-white border border-primary rounded-full z-50"
            style={{
              cursor,
              ...(position.includes('top') ? { top: '-4px' } : {}),
              ...(position.includes('bottom') ? { bottom: '-4px' } : {}),
              ...(position.includes('left') ? { left: '-4px' } : {}),
              ...(position.includes('right') ? { right: '-4px' } : {}),
              ...(position === 'top' ? { left: 'calc(50% - 3px)' } : {}),
              ...(position === 'bottom' ? { left: 'calc(50% - 3px)' } : {}),
              ...(position === 'left' ? { top: 'calc(50% - 3px)' } : {}),
              ...(position === 'right' ? { top: 'calc(50% - 3px)' } : {})
            }}
            onMouseDown={(e) => handleResizeHandleMouseDown(e, element.id, position)}
          />
        ))}
        
        {/* Rotation handle */}
        <div
          className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-6 cursor-crosshair"
          onMouseDown={(e) => handleRotateHandleMouseDown(e, element.id)}
        >
          <div className="w-px h-4 bg-primary mx-auto"></div>
          <div className="w-3 h-3 rounded-full bg-white border border-primary"></div>
        </div>
      </>
    );
  };

  return (
    <div className={cn(
      "enhanced-canvas-container relative h-full w-full overflow-hidden select-none bg-slate-100 dark:bg-slate-900",
      className
    )}>
      {/* Canvas controls */}
      <div className="absolute top-2 left-2 z-10 flex gap-1">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="icon" 
                className="h-8 w-8 bg-background"
                onClick={() => setShowRulers(!showRulers)}
              >
                <Ruler className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {showRulers ? "Hide Rulers" : "Show Rulers"}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="icon" 
                className="h-8 w-8 bg-background"
                onClick={() => setShowGrid(!showGrid)}
              >
                <Grid className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {showGrid ? "Hide Grid" : "Show Grid"}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <DropdownMenu>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="h-8 w-8 bg-background">
                    <AlignVerticalJustifyCenter className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                Alignment Options
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => setSnapToGridEnabled(!snapToGridEnabled)}>
              <Grid className="h-4 w-4 mr-2" />
              {snapToGridEnabled ? "Disable Snap to Grid" : "Enable Snap to Grid"}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setShowAlignmentLines(!showAlignmentLines)}>
              <AlignHorizontalJustifyCenter className="h-4 w-4 mr-2" />
              {showAlignmentLines ? "Hide Alignment Guides" : "Show Alignment Guides"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => setGridSize(10)}
              className={gridSize === 10 ? "bg-accent" : ""}
            >
              Grid Size: 10px
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setGridSize(20)}
              className={gridSize === 20 ? "bg-accent" : ""}
            >
              Grid Size: 20px
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setGridSize(50)}
              className={gridSize === 50 ? "bg-accent" : ""}
            >
              Grid Size: 50px
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <DropdownMenu>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="h-8 w-8 bg-background">
                    <Crosshair className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                View Options
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => dispatch(setZoomLevel(1))}>
              <Maximize className="h-4 w-4 mr-2" />
              Reset Zoom (100%)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => dispatch(setPanOffset({ x: 0, y: 0 }))}>
              <MoveHorizontal className="h-4 w-4 mr-2" />
              Reset Pan
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => {
              dispatch(setZoomLevel(1));
              dispatch(setPanOffset({ x: 0, y: 0 }));
            }}>
              <Maximize className="h-4 w-4 mr-2" />
              Reset View
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {/* Zoom controls */}
      <div className="absolute bottom-2 right-2 z-10 flex items-center gap-2 bg-background p-1 rounded-md shadow-sm">
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-7 w-7" 
          onClick={() => dispatch(setZoomLevel(Math.max(0.1, zoomLevel - 0.1)))}
        >
          <Minimize className="h-4 w-4" />
        </Button>
        
        <div className="min-w-[80px]">
          <Slider 
            value={[zoomLevel * 100]} 
            min={10} 
            max={300} 
            step={10} 
            onValueChange={(value) => dispatch(setZoomLevel(value[0] / 100))} 
          />
        </div>
        
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-7 w-7" 
          onClick={() => dispatch(setZoomLevel(Math.min(3, zoomLevel + 0.1)))}
        >
          <Maximize className="h-4 w-4" />
        </Button>
        
        <div className="text-xs font-medium min-w-[40px]">
          {Math.round(zoomLevel * 100)}%
        </div>
      </div>
      
      {/* Canvas container with rulers */}
      <div 
        ref={canvasContainerRef}
        className={cn(
          "canvas-container h-full w-full overflow-auto",
          showRulers ? "pt-6 pl-6" : ""
        )}
      >
        {/* Ruler corner */}
        {showRulers && (
          <div 
            ref={rulerCornerRef}
            className="absolute top-0 left-0 z-10 w-6 h-6 bg-background border-r border-b"
          />
        )}
        
        {/* Horizontal ruler */}
        {showRulers && (
          <div 
            ref={horizontalRulerRef}
            className={cn(
              "absolute top-0 left-6 right-0 h-6 z-10 bg-background border-b overflow-hidden",
              "ruler horizontal-ruler"
            )}
          />
        )}
        
        {/* Vertical ruler */}
        {showRulers && (
          <div 
            ref={verticalRulerRef}
            className={cn(
              "absolute top-6 left-0 bottom-0 w-6 z-10 bg-background border-r overflow-hidden",
              "ruler vertical-ruler"
            )}
          />
        )}
        
        {/* Main canvas */}
        <ContextMenu>
          <ContextMenuTrigger asChild>
            <div 
              ref={canvasRef}
              className="relative bg-white dark:bg-gray-900 shadow-lg"
              style={{
                width: `${width}px`,
                height: `${height}px`,
                transform: `scale(${zoomLevel}) translate(${panOffset.x / zoomLevel}px, ${panOffset.y / zoomLevel}px)`,
                transformOrigin: 'top left',
                cursor: getCanvasCursor(),
                backgroundImage: showGrid ? `
                  linear-gradient(to right, rgba(128, 128, 128, 0.1) 1px, transparent 1px),
                  linear-gradient(to bottom, rgba(128, 128, 128, 0.1) 1px, transparent 1px)
                ` : 'none',
                backgroundSize: showGrid ? `${gridSize}px ${gridSize}px` : '0 0'
              }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onWheel={handleWheel}
              onContextMenu={handleCanvasContextMenu}
            >
              {/* Render alignment guides */}
              {showAlignmentLines && (
                <>
                  {alignmentLines.horizontal.map((line, index) => (
                    <div 
                      key={`h-${index}-${line}`}
                      className="absolute w-full h-px bg-blue-500"
                      style={{ 
                        top: `${line}px`,
                        pointerEvents: 'none',
                        zIndex: 9999
                      }}
                    />
                  ))}
                  
                  {alignmentLines.vertical.map((line, index) => (
                    <div 
                      key={`v-${index}-${line}`}
                      className="absolute w-px h-full bg-blue-500"
                      style={{ 
                        left: `${line}px`,
                        pointerEvents: 'none',
                        zIndex: 9999
                      }}
                    />
                  ))}
                </>
              )}
              
              {/* Render canvas elements */}
              {elements
                .filter(element => !hiddenElementIds.includes(element.id))
                .sort((a, b) => a.zIndex - b.zIndex)
                .map((element) => {
                  const isSelected = selectedElementIds.includes(element.id);
                  const isLocked = lockedElementIds.includes(element.id);
                  
                  return (
                    <div
                      key={element.id}
                      className={cn(
                        "absolute",
                        isSelected && "outline-dashed outline-1 outline-blue-500",
                        isLocked && "cursor-not-allowed",
                        hiddenElementIds.includes(element.id) && "opacity-50"
                      )}
                      style={{
                        left: `${element.x}px`,
                        top: `${element.y}px`,
                        width: `${element.width}px`,
                        height: `${element.height}px`,
                        transform: getTransformString(element),
                        zIndex: element.zIndex,
                        opacity: element.opacity
                      }}
                    >
                      {/* Render the element shape */}
                      {drawShape(element)}
                      
                      {/* Render resize handles if selected */}
                      {isSelected && renderResizeHandles(element)}
                      
                      {/* Lock indicator */}
                      {isLocked && isSelected && (
                        <div className="absolute -top-6 -right-6 bg-background rounded-full p-1 shadow-sm">
                          <Lock className="h-4 w-4 text-amber-500" />
                        </div>
                      )}
                    </div>
                  );
                })
              }
              
              {/* Render comments */}
              {comments.map((comment) => (
                <CommentMarker
                  key={comment.id}
                  position={comment.position}
                  onClick={() => setSelectedComment(comment.id)}
                  isSelected={selectedComment === comment.id}
                  isResolved={comment.resolved}
                />
              ))}
              
              {/* Selection box */}
              {selectionBox && (
                <div
                  style={{
                    position: 'absolute',
                    left: `${selectionBox.width < 0 ? selectionBox.x + selectionBox.width : selectionBox.x}px`,
                    top: `${selectionBox.height < 0 ? selectionBox.y + selectionBox.height : selectionBox.y}px`,
                    width: `${Math.abs(selectionBox.width)}px`,
                    height: `${Math.abs(selectionBox.height)}px`,
                    border: '1px solid #3B82F6',
                    backgroundColor: 'rgba(59, 130, 246, 0.05)',
                    pointerEvents: 'none',
                    zIndex: 9999
                  }}
                />
              )}
              
              {/* Custom guides */}
              {guides.map((guide, index) => (
                <div
                  key={`guide-${index}`}
                  className={cn(
                    "absolute bg-pink-500",
                    guide.orientation === 'horizontal' ? 'w-full h-px' : 'h-full w-px',
                    guide.isSnapping ? 'opacity-100' : 'opacity-50'
                  )}
                  style={{
                    [guide.orientation === 'horizontal' ? 'top' : 'left']: `${guide.position}px`,
                    zIndex: 9999,
                    pointerEvents: 'none'
                  }}
                />
              ))}
              
              {/* Element visibility menu */}
              <ContextMenuContent className="w-64">
                <ContextMenuGroup>
                  <ContextMenuLabel>Canvas</ContextMenuLabel>
                  <ContextMenuItem onClick={() => setShowGrid(!showGrid)}>
                    <Grid className="h-4 w-4 mr-2" />
                    {showGrid ? "Hide Grid" : "Show Grid"}
                  </ContextMenuItem>
                  <ContextMenuItem onClick={() => setShowRulers(!showRulers)}>
                    <Ruler className="h-4 w-4 mr-2" />
                    {showRulers ? "Hide Rulers" : "Show Rulers"}
                  </ContextMenuItem>
                </ContextMenuGroup>
                
                <ContextMenuSeparator />
                
                {selectedElementIds.length > 0 && (
                  <ContextMenuGroup>
                    <ContextMenuLabel>Element</ContextMenuLabel>
                    
                    <ContextMenuItem
                      onClick={() => {
                        selectedElementIds.forEach(id => {
                          dispatch(duplicateElement(id));
                        });
                      }}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Duplicate
                      <ContextMenuShortcut>⌘D</ContextMenuShortcut>
                    </ContextMenuItem>
                    
                    <ContextMenuSub>
                      <ContextMenuSubTrigger>
                        <AlignVerticalJustifyCenter className="h-4 w-4 mr-2" />
                        Arrange
                      </ContextMenuSubTrigger>
                      <ContextMenuSubContent className="w-48">
                        <ContextMenuItem
                          onClick={() => {
                            selectedElementIds.forEach(id => {
                              dispatch(bringToFront(id));
                            });
                          }}
                        >
                          Bring to Front
                          <ContextMenuShortcut>⌘]</ContextMenuShortcut>
                        </ContextMenuItem>
                        <ContextMenuItem
                          onClick={() => {
                            selectedElementIds.forEach(id => {
                              dispatch(sendToBack(id));
                            });
                          }}
                        >
                          Send to Back
                          <ContextMenuShortcut>⌘[</ContextMenuShortcut>
                        </ContextMenuItem>
                        <ContextMenuItem
                          onClick={() => {
                            selectedElementIds.forEach(id => {
                              dispatch(bringForward(id));
                            });
                          }}
                        >
                          Bring Forward
                          <ContextMenuShortcut>⇧⌘]</ContextMenuShortcut>
                        </ContextMenuItem>
                        <ContextMenuItem
                          onClick={() => {
                            selectedElementIds.forEach(id => {
                              dispatch(sendBackward(id));
                            });
                          }}
                        >
                          Send Backward
                          <ContextMenuShortcut>⇧⌘[</ContextMenuShortcut>
                        </ContextMenuItem>
                      </ContextMenuSubContent>
                    </ContextMenuSub>
                    
                    <ContextMenuItem
                      onClick={() => {
                        selectedElementIds.forEach(id => {
                          toggleElementVisibility(id);
                        });
                      }}
                    >
                      <EyeOff className="h-4 w-4 mr-2" />
                      {selectedElementIds.some(id => hiddenElementIds.includes(id))
                        ? "Show Elements"
                        : "Hide Elements"
                      }
                    </ContextMenuItem>
                    
                    <ContextMenuItem
                      onClick={() => {
                        selectedElementIds.forEach(id => {
                          toggleElementLock(id);
                        });
                      }}
                    >
                      {selectedElementIds.some(id => lockedElementIds.includes(id))
                        ? (
                          <>
                            <Unlock className="h-4 w-4 mr-2" />
                            Unlock Elements
                          </>
                        )
                        : (
                          <>
                            <Lock className="h-4 w-4 mr-2" />
                            Lock Elements
                          </>
                        )
                      }
                    </ContextMenuItem>
                    
                    <ContextMenuSeparator />
                    
                    <ContextMenuItem
                      onClick={() => {
                        selectedElementIds.forEach(id => {
                          if (!lockedElementIds.includes(id)) {
                            dispatch(deleteElement(id));
                          }
                        });
                      }}
                      className="text-red-500 focus:text-red-500"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                      <ContextMenuShortcut>⌫</ContextMenuShortcut>
                    </ContextMenuItem>
                  </ContextMenuGroup>
                )}
              </ContextMenuContent>
            </div>
          </ContextMenuTrigger>
        </ContextMenu>
      </div>
      
      {/* Mouse position indicator */}
      <div className="absolute bottom-2 left-2 text-xs bg-background px-2 py-1 rounded shadow-sm">
        {Math.round(mouseCursorPos.x)}, {Math.round(mouseCursorPos.y)}
      </div>
    </div>
  );
}