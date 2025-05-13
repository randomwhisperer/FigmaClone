import { useRef, useEffect, useState, useCallback } from "react";
import { useDesignStore } from "@/store";
import { ElementType, type Element } from "@shared/schema";
import { drawShape, isPointInShape } from "@/lib/shapes.tsx";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, Wifi, WifiOff } from "lucide-react";
import { useWebSocket } from "@/contexts/WebSocketContext";

interface CanvasProps {
  width?: number;
  height?: number;
}

export default function Canvas({ width = 800, height = 600 }: CanvasProps) {
  // Get WebSocket context for collaboration
  const { 
    connected, 
    users, 
    clientId, 
    userColor,
    sendCursorPosition,
    joinDesign,
    sendSelectionChange
  } = useWebSocket();
  
  // Get state from store
  const { 
    elements, 
    activeTool, 
    selectedElementIds, 
    zoomLevel, 
    panOffset,
    fillColor,
    strokeColor,
    strokeWidth,
    activeUsers,
    
    addElement,
    updateElement,
    selectElement,
    selectMultipleElements,
    deselectAll,
    setPanOffset,
    setZoomLevel,
    deleteElement,
    setActiveTool
  } = useDesignStore();
  
  // Canvas refs
  const canvasRef = useRef<HTMLDivElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  
  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [dragStartPos, setDragStartPos] = useState<{ x: number, y: number } | null>(null);
  const [selectedElementsStartState, setSelectedElementsStartState] = useState<Element[]>([]);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<{ x: number, y: number } | null>(null);
  const [selectionBox, setSelectionBox] = useState<{ x: number, y: number, width: number, height: number } | null>(null);
  
  // Get real coordinates accounting for zoom and pan
  const getTransformedPoint = useCallback((clientX: number, clientY: number) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (clientX - rect.left - panOffset.x) / zoomLevel;
    const y = (clientY - rect.top - panOffset.y) / zoomLevel;
    
    return { x, y };
  }, [zoomLevel, panOffset]);
  
  // Handle mouse down
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left click
    
    const { x, y } = getTransformedPoint(e.clientX, e.clientY);
    
    // Handle panning with space key, hand tool, or middle mouse button
    if (activeTool === 'hand' || e.button === 1) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
      return;
    }
    
    // For select tool, check if clicking on an existing element
    if (activeTool === 'select') {
      // Check if clicked on any element (in reverse order by zIndex)
      const sortedElements = [...elements].sort((a, b) => b.zIndex - a.zIndex);
      
      for (const element of sortedElements) {
        if (isPointInShape(element, x, y)) {
          // Check if holding shift to add to selection
          if (e.shiftKey) {
            const currentSelectedIds = [...selectedElementIds];
            if (currentSelectedIds.includes(element.id)) {
              // Remove from selection if already selected
              selectMultipleElements(currentSelectedIds.filter(id => id !== element.id));
            } else {
              // Add to selection
              selectMultipleElements([...currentSelectedIds, element.id]);
            }
          } else if (!selectedElementIds.includes(element.id)) {
            // Select single element if not already selected
            selectElement(element.id);
          }
          
          // Start dragging the element(s)
          setDragStartPos({ x, y });
          
          // Save the start state of all selected elements
          setSelectedElementsStartState(
            elements.filter(el => selectedElementIds.includes(el.id) || el.id === element.id)
          );
          
          return;
        }
      }
      
      // If clicked on empty space, start selection box
      setSelectionBox({ x, y, width: 0, height: 0 });
      
      // Deselect all if not holding shift
      if (!e.shiftKey) {
        deselectAll();
      }
      
      return;
    }
    
    // Start drawing a new shape
    if (activeTool !== 'select' && activeTool !== 'hand') {
      setIsDrawing(true);
      setDragStartPos({ x, y });
      
      // Create new element
      addElement({
        type: activeTool,
        x,
        y,
        width: 0,
        height: 0,
        fill: fillColor,
        stroke: strokeColor,
        strokeWidth,
        content: activeTool === 'text' ? 'Text' : ''
      });
    }
  }, [
    activeTool, 
    elements, 
    selectedElementIds, 
    zoomLevel, 
    panOffset, 
    fillColor, 
    strokeColor, 
    strokeWidth,
    getTransformedPoint,
    addElement,
    selectElement,
    selectMultipleElements,
    deselectAll
  ]);
  
  // Handle mouse move
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const { x, y } = getTransformedPoint(e.clientX, e.clientY);
    
    // Send cursor position to WebSocket server if connected
    if (connected) {
      sendCursorPosition(x, y);
    }
    
    // Handle panning
    if (isPanning && panStart) {
      setPanOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      });
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
    
    // Handle element drawing or dragging
    if (dragStartPos && (isDrawing || selectedElementIds.length > 0)) {
      const dx = x - dragStartPos.x;
      const dy = y - dragStartPos.y;
      
      if (isDrawing) {
        // Drawing a new element
        const newElement = elements[elements.length - 1];
        
        if (activeTool === 'line') {
          updateElement(newElement.id, {
            width: dx,
            height: dy
          });
        } else {
          // For rectangle, ellipse, and text
          updateElement(newElement.id, {
            width: Math.abs(dx),
            height: Math.abs(dy),
            x: dx < 0 ? x : dragStartPos.x,
            y: dy < 0 ? y : dragStartPos.y
          });
        }
      } else if (selectedElementIds.length > 0 && selectedElementsStartState.length > 0) {
        // Dragging existing elements
        selectedElementsStartState.forEach(element => {
          if (selectedElementIds.includes(element.id)) {
            updateElement(element.id, {
              x: element.x + dx,
              y: element.y + dy
            });
          }
        });
      }
    }
  }, [
    elements, 
    isDrawing, 
    dragStartPos, 
    selectionBox, 
    isPanning, 
    panStart, 
    selectedElementIds, 
    selectedElementsStartState,
    activeTool,
    getTransformedPoint,
    updateElement
  ]);
  
  // Handle mouse up
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
      
      // Select all elements that intersect with the selection box
      const newSelectedIds = elements.filter(element => {
        return (
          element.x < normalizedBox.x + normalizedBox.width &&
          element.x + element.width > normalizedBox.x &&
          element.y < normalizedBox.y + normalizedBox.height &&
          element.y + element.height > normalizedBox.y
        );
      }).map(element => element.id);
      
      selectMultipleElements(newSelectedIds);
      setSelectionBox(null);
    }
    
    setIsDrawing(false);
    setDragStartPos(null);
    setSelectedElementsStartState([]);
    setIsPanning(false);
    setPanStart(null);
  }, [elements, selectionBox, selectMultipleElements]);
  
  // Handle wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      const newZoom = Math.max(0.1, Math.min(3, zoomLevel + delta));
      
      setZoomLevel(newZoom);
    }
  }, [zoomLevel, setZoomLevel]);
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Tool shortcuts
      if (e.key === 'v') setActiveTool('select');
      if (e.key === 'r') setActiveTool('rectangle');
      if (e.key === 'o') setActiveTool('ellipse');
      if (e.key === 'l') setActiveTool('line');
      if (e.key === 't') setActiveTool('text');
      if (e.key === 'h') setActiveTool('hand');
      
      // Delete selected elements
      if (e.key === 'Delete' || e.key === 'Backspace') {
        selectedElementIds.forEach(id => {
          deleteElement(id);
        });
      }
      
      // Space key for panning
      if (e.key === ' ' && !isPanning) {
        setIsPanning(true);
        document.body.style.cursor = 'grab';
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      // Release space key panning
      if (e.key === ' ') {
        setIsPanning(false);
        document.body.style.cursor = 'default';
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [selectedElementIds, isPanning]);
  
  // Cursor styles based on active tool
  const getCursorStyle = () => {
    if (isPanning) return 'grabbing';
    
    switch (activeTool) {
      case 'select': return 'default';
      case 'hand': return 'grab';
      case 'text': return 'text';
      default: return 'crosshair';
    }
  };
  
  // Render elements and selection box
  return (
    <div 
      ref={canvasContainerRef}
      className="flex-1 bg-[#F0F0F0] overflow-hidden flex items-center justify-center relative"
      onWheel={handleWheel}
    >
      <div 
        ref={canvasRef}
        className="bg-white shadow-lg"
        style={{
          width: `${width}px`,
          height: `${height}px`,
          transform: `scale(${zoomLevel}) translate(${panOffset.x / zoomLevel}px, ${panOffset.y / zoomLevel}px)`,
          transformOrigin: 'center',
          cursor: getCursorStyle(),
          position: 'relative',
          overflow: 'hidden',
          backgroundImage: `
            linear-gradient(45deg, #F8F8F8 25%, transparent 25%),
            linear-gradient(-45deg, #F8F8F8 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, #F8F8F8 75%),
            linear-gradient(-45deg, transparent 75%, #F8F8F8 75%)
          `,
          backgroundSize: '20px 20px',
          backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Render all elements */}
        {elements.sort((a, b) => a.zIndex - b.zIndex).map((element) => (
          <div
            key={element.id}
            style={{
              position: 'absolute',
              left: `${element.x}px`,
              top: `${element.y}px`,
              width: `${element.width}px`,
              height: `${element.height}px`,
              transform: element.rotation ? `rotate(${element.rotation}deg)` : undefined,
              pointerEvents: activeTool === 'select' ? 'auto' : 'none',
              zIndex: element.zIndex
            }}
          >
            {/* Draw the shape */}
            {drawShape(element)}
            
            {/* Selection outline and handles */}
            {selectedElementIds.includes(element.id) && (
              <>
                <div 
                  className="absolute -inset-1 border-2 border-blue-500 border-dashed rounded pointer-events-none"
                  style={{ zIndex: 9999 }}
                />
                
                {/* Resize handles */}
                <div className="absolute -m-1 w-2 h-2 bg-white rounded-full border border-blue-500 cursor-nwse-resize left-0 top-0" />
                <div className="absolute -m-1 w-2 h-2 bg-white rounded-full border border-blue-500 cursor-ns-resize left-1/2 top-0" />
                <div className="absolute -m-1 w-2 h-2 bg-white rounded-full border border-blue-500 cursor-nesw-resize right-0 top-0" />
                <div className="absolute -m-1 w-2 h-2 bg-white rounded-full border border-blue-500 cursor-ew-resize right-0 top-1/2" />
                <div className="absolute -m-1 w-2 h-2 bg-white rounded-full border border-blue-500 cursor-nwse-resize right-0 bottom-0" />
                <div className="absolute -m-1 w-2 h-2 bg-white rounded-full border border-blue-500 cursor-ns-resize left-1/2 bottom-0" />
                <div className="absolute -m-1 w-2 h-2 bg-white rounded-full border border-blue-500 cursor-nesw-resize left-0 bottom-0" />
                <div className="absolute -m-1 w-2 h-2 bg-white rounded-full border border-blue-500 cursor-ew-resize left-0 top-1/2" />
              </>
            )}
          </div>
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
              pointerEvents: 'none'
            }}
          />
        )}
      </div>
      
      {/* Canvas controls overlay */}
      <div className="absolute bottom-4 right-4 flex items-center space-x-2 bg-white rounded-md shadow-md p-1">
        <Button 
          variant="ghost" 
          size="icon" 
          className="w-8 h-8" 
          onClick={() => setZoomLevel(Math.max(0.1, zoomLevel - 0.1))}
          aria-label="Zoom out"
        >
          <ZoomOut className="h-5 w-5" />
        </Button>
        <span className="text-sm font-medium">{Math.round(zoomLevel * 100)}%</span>
        <Button 
          variant="ghost" 
          size="icon" 
          className="w-8 h-8" 
          onClick={() => setZoomLevel(Math.min(3, zoomLevel + 0.1))}
          aria-label="Zoom in"
        >
          <ZoomIn className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
