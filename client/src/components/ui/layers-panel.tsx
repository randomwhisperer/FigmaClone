import React, { useState } from 'react';
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { 
  selectElement, 
  selectMultipleElements,
  bringForward,
  sendBackward,
  bringToFront,
  sendToBack,
  deleteElement,
  updateElement,
  duplicateElement
} from "@/store/slices/designSlice";
import { 
  ChevronDown, 
  ChevronRight, 
  Square, 
  Circle, 
  Type, 
  Minus, 
  Plus, 
  Pencil, 
  Eye, 
  EyeOff, 
  Lock, 
  Unlock,
  Copy,
  Trash,
  MoreVertical,
  ArrowUp,
  ArrowDown,
  ChevronsUp,
  ChevronsDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ElementType, type Element } from "@shared/schema";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { getElementDisplayName } from "@/lib/shapes.tsx";
import { motion, AnimatePresence } from "framer-motion";

export function LayersPanel() {
  const dispatch = useAppDispatch();
  const { elements, selectedElementIds } = useAppSelector(state => state.design.present);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    canvas: true,
    locked: false,
    hidden: false
  });
  
  // Sort elements by z-index for rendering order (highest z-index at top)
  const sortedElements = [...elements].sort((a, b) => b.zIndex - a.zIndex);
  
  // Split elements into visible and hidden
  const visibleElements = sortedElements.filter(e => e.opacity !== 0);
  
  const handleLayerSelect = (id: number, e: React.MouseEvent) => {
    if (e.shiftKey) {
      // Multi-select with Shift key
      const newSelection = [...selectedElementIds];
      if (newSelection.includes(id)) {
        const index = newSelection.indexOf(id);
        newSelection.splice(index, 1);
      } else {
        newSelection.push(id);
      }
      dispatch(selectMultipleElements(newSelection));
    } else {
      // Single select
      dispatch(selectElement(id));
    }
  };
  
  const handleDragEnd = (result: any) => {
    // Dropped outside the list
    if (!result.destination) {
      return;
    }
    
    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;
    
    if (sourceIndex === destinationIndex) {
      return;
    }
    
    // Get the actual elements being moved
    const sourceElement = visibleElements[sourceIndex];
    const destinationElement = visibleElements[destinationIndex];
    
    // Swap their z-indices
    dispatch(updateElement({ 
      id: sourceElement.id,
      updates: { zIndex: destinationElement.zIndex }
    }));
    
    dispatch(updateElement({ 
      id: destinationElement.id,
      updates: { zIndex: sourceElement.zIndex }
    }));
  };
  
  const toggleGroup = (id: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };
  
  const handleToggleVisibility = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const element = elements.find(el => el.id === id);
    if (element) {
      dispatch(updateElement({
        id,
        updates: { opacity: element.opacity === 0 ? 1 : 0 }
      }));
    }
  };
  
  const handleDuplicate = (id: number) => {
    dispatch(duplicateElement(id));
  };
  
  const handleDelete = (id: number) => {
    dispatch(deleteElement(id));
  };
  
  const getLayerIcon = (type: string) => {
    switch (type) {
      case ElementType.RECTANGLE:
        return <Square className="h-3.5 w-3.5" />;
      case ElementType.ELLIPSE:
        return <Circle className="h-3.5 w-3.5" />;
      case ElementType.TEXT:
        return <Type className="h-3.5 w-3.5" />;
      case ElementType.LINE:
        return <Minus className="h-3.5 w-3.5" />;
      default:
        return <Pencil className="h-3.5 w-3.5" />;
    }
  };
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    show: { opacity: 1, x: 0 }
  };
  
  return (
    <div className="w-60 bg-background border-r figma-sidebar flex flex-col">
      <div className="p-3 border-b flex justify-between items-center">
        <h3 className="font-medium text-sm">Layers</h3>
        <div className="flex items-center space-x-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6" 
            aria-label="Add Layer"
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-2">
          <Collapsible 
            open={expandedGroups.canvas} 
            onOpenChange={() => toggleGroup('canvas')}
            className="space-y-1"
          >
            <CollapsibleTrigger asChild>
              <div className="flex items-center py-1.5 px-2 rounded-md hover:bg-secondary cursor-pointer">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-4 w-4 p-0 mr-1"
                >
                  {expandedGroups.canvas ? (
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                </Button>
                <Square className="w-3.5 h-3.5 text-muted-foreground mr-1.5" />
                <span className="text-xs">Canvas</span>
                <Badge variant="outline" className="ml-auto text-[0.65rem] h-4 px-1">
                  {visibleElements.length}
                </Badge>
              </div>
            </CollapsibleTrigger>
            
            <CollapsibleContent>
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="layers">
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="space-y-1 pl-6"
                    >
                      <AnimatePresence>
                        <motion.div
                          variants={containerVariants}
                          initial="hidden"
                          animate="show"
                        >
                          {visibleElements.map((element, index) => (
                            <Draggable 
                              key={element.id.toString()} 
                              draggableId={element.id.toString()} 
                              index={index}
                            >
                              {(provided, snapshot) => (
                                <motion.div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  variants={itemVariants}
                                  className={`
                                    flex items-center py-1 px-2 rounded-md 
                                    ${selectedElementIds.includes(element.id) ? 'bg-secondary/80' : 'hover:bg-secondary/50'}
                                    ${snapshot.isDragging ? 'opacity-70' : 'opacity-100'}
                                    transition-colors duration-150 cursor-pointer
                                  `}
                                  onClick={(e) => handleLayerSelect(element.id, e)}
                                >
                                  <div className="w-4 h-4 text-muted-foreground mr-1 flex items-center justify-center">
                                    {getLayerIcon(element.type)}
                                  </div>
                                  <span className="text-xs flex-1 truncate">
                                    {getElementDisplayName(element)}
                                  </span>
                                  
                                  {/* Controls */}
                                  <div className="flex space-x-1">
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="h-5 w-5 p-0 opacity-50 hover:opacity-100"
                                      onClick={(e) => handleToggleVisibility(element.id, e)}
                                    >
                                      {element.opacity > 0 ? (
                                        <Eye className="h-3 w-3" />
                                      ) : (
                                        <EyeOff className="h-3 w-3" />
                                      )}
                                    </Button>
                                    
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button 
                                          variant="ghost" 
                                          size="icon" 
                                          className="h-5 w-5 p-0 opacity-50 hover:opacity-100"
                                        >
                                          <MoreVertical className="h-3 w-3" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent side="right" align="start" className="w-44">
                                        <DropdownMenuItem onClick={() => dispatch(bringToFront(element.id))}>
                                          <ChevronsUp className="mr-2 h-3.5 w-3.5" />
                                          <span className="text-xs">Bring to Front</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => dispatch(bringForward(element.id))}>
                                          <ArrowUp className="mr-2 h-3.5 w-3.5" />
                                          <span className="text-xs">Bring Forward</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => dispatch(sendBackward(element.id))}>
                                          <ArrowDown className="mr-2 h-3.5 w-3.5" />
                                          <span className="text-xs">Send Backward</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => dispatch(sendToBack(element.id))}>
                                          <ChevronsDown className="mr-2 h-3.5 w-3.5" />
                                          <span className="text-xs">Send to Back</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => handleDuplicate(element.id)}>
                                          <Copy className="mr-2 h-3.5 w-3.5" />
                                          <span className="text-xs">Duplicate</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem 
                                          onClick={() => handleDelete(element.id)}
                                          className="text-destructive focus:text-destructive"
                                        >
                                          <Trash className="mr-2 h-3.5 w-3.5" />
                                          <span className="text-xs">Delete</span>
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                </motion.div>
                              )}
                            </Draggable>
                          ))}
                          
                          {visibleElements.length === 0 && (
                            <div className="py-2 px-2 text-xs text-muted-foreground italic">
                              No elements yet. Use tools to create shapes.
                            </div>
                          )}
                        </motion.div>
                      </AnimatePresence>
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </ScrollArea>
      
      <div className="p-3 border-t">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{elements.length} elements</span>
          <span>{selectedElementIds.length} selected</span>
        </div>
      </div>
    </div>
  );
}