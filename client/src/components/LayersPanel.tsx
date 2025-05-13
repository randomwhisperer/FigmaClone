import { useEffect, useState } from "react";
import { ChevronDown, ChevronRight, Square, Circle, Type, Minus, Plus, Pencil, Eye, EyeOff, Lock, Unlock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDesignStore } from "@/store";
import { ElementType, type Element } from "@shared/schema";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function LayersPanel() {
  const { elements, selectedElementIds, selectElement, selectMultipleElements } = useDesignStore();
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({ canvas: true });
  
  // Sort elements by z-index for rendering order
  const sortedElements = [...elements].sort((a, b) => b.zIndex - a.zIndex);
  
  const toggleGroup = (id: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };
  
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
      selectMultipleElements(newSelection);
    } else {
      // Single select
      selectElement(id);
    }
  };
  
  const getLayerIcon = (type: string) => {
    switch (type) {
      case ElementType.RECTANGLE:
        return <Square className="h-4 w-4" />;
      case ElementType.ELLIPSE:
        return <Circle className="h-4 w-4" />;
      case ElementType.TEXT:
        return <Type className="h-4 w-4" />;
      case ElementType.LINE:
        return <Minus className="h-4 w-4" />;
      default:
        return <Pencil className="h-4 w-4" />;
    }
  };
  
  const getLayerName = (element: Element) => {
    switch (element.type) {
      case ElementType.RECTANGLE:
        return `Rectangle`;
      case ElementType.ELLIPSE:
        return `Circle`;
      case ElementType.TEXT:
        return `Text "${element.content || 'Text'}"`;
      case ElementType.LINE:
        return `Line`;
      default:
        return `Element`;
    }
  };
  
  useEffect(() => {
    // Ensure the Canvas group is always expanded by default
    setExpandedGroups(prev => ({ ...prev, canvas: true }));
  }, []);
  
  return (
    <div className="w-64 bg-[#F8F8F8] border-r border-slate-200 flex flex-col">
      <div className="p-3 border-b border-slate-200 flex justify-between items-center">
        <h3 className="font-medium text-sm">Layers</h3>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-6 w-6" 
          aria-label="Add Layer"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      
      <ScrollArea className="flex-1 p-1">
        <div className="select-none">
          {/* Canvas container */}
          <div>
            <div 
              className="flex items-center py-1.5 px-2 rounded hover:bg-slate-100 cursor-pointer"
              onClick={() => toggleGroup('canvas')}
            >
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-4 w-4 p-0 mr-1"
              >
                {expandedGroups.canvas ? (
                  <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 text-slate-500" />
                )}
              </Button>
              <Square className="w-4 h-4 text-slate-500 mr-1.5" />
              <span className="text-xs">Canvas</span>
            </div>
            
            {/* Nested elements */}
            {expandedGroups.canvas && (
              <div className="ml-5">
                {sortedElements.map((element) => (
                  <div 
                    key={element.id}
                    className={`flex items-center py-1.5 px-2 rounded cursor-pointer ${
                      selectedElementIds.includes(element.id) ? 'bg-slate-200' : 'hover:bg-slate-100'
                    }`}
                    onClick={(e) => handleLayerSelect(element.id, e)}
                  >
                    <div className="w-4 h-4 text-slate-500 mr-1.5">
                      {getLayerIcon(element.type)}
                    </div>
                    <span className="text-xs flex-1 truncate">{getLayerName(element)}</span>
                    
                    {/* Visibility toggle - optional */}
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-5 w-5 p-0 opacity-50 hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Toggle visibility logic would go here
                      }}
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                    
                    {/* Lock toggle - optional */}
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-5 w-5 p-0 opacity-50 hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Toggle lock logic would go here
                      }}
                    >
                      <Unlock className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                
                {sortedElements.length === 0 && (
                  <div className="py-1.5 px-2 text-xs text-slate-500 italic">
                    No elements yet
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
