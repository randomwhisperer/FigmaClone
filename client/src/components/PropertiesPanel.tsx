import { useState, useEffect } from "react";
import { useDesignStore } from "@/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ColorPicker } from "@/components/ui/color-picker";
import { ElementType, type Element } from "@shared/schema";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Square, 
  Circle, 
  Type, 
  Minus,
  Plus,
  ChevronsUp,
  ChevronsDown,
  ArrowUp,
  ArrowDown,
  X
} from "lucide-react";

export default function PropertiesPanel() {
  const { 
    elements, 
    selectedElementIds, 
    updateElement,
    bringForward,
    sendBackward,
    bringToFront,
    sendToBack,
    deleteElement
  } = useDesignStore();
  
  const [selectedElement, setSelectedElement] = useState<Element | null>(null);
  
  // Properties state
  const [width, setWidth] = useState<string>("0");
  const [height, setHeight] = useState<string>("0");
  const [x, setX] = useState<string>("0");
  const [y, setY] = useState<string>("0");
  const [rotation, setRotation] = useState<number>(0);
  const [opacity, setOpacity] = useState<number>(100);
  const [cornerRadius, setCornerRadius] = useState<string>("0");
  const [elementType, setElementType] = useState<string>(ElementType.RECTANGLE);
  const [textContent, setTextContent] = useState<string>("");
  
  // Update selected element when selection changes
  useEffect(() => {
    if (selectedElementIds.length === 1) {
      const element = elements.find(el => el.id === selectedElementIds[0]);
      if (element) {
        setSelectedElement(element);
        setElementType(element.type);
        setWidth(element.width.toString());
        setHeight(element.height.toString());
        setX(element.x.toString());
        setY(element.y.toString());
        setRotation(element.rotation || 0);
        setOpacity((element.opacity || 1) * 100);
        setCornerRadius(((element.properties as any)?.cornerRadius || 0).toString());
        setTextContent(element.content || "");
      }
    } else {
      setSelectedElement(null);
    }
  }, [selectedElementIds, elements]);
  
  // Apply properties changes to the element
  const applyChanges = () => {
    if (!selectedElement) return;
    
    updateElement(selectedElement.id, {
      width: parseFloat(width) || selectedElement.width,
      height: parseFloat(height) || selectedElement.height,
      x: parseFloat(x) || selectedElement.x,
      y: parseFloat(y) || selectedElement.y,
      rotation,
      opacity: opacity / 100,
      content: textContent,
      properties: {
        ...(selectedElement.properties as Record<string, any>),
        cornerRadius: parseFloat(cornerRadius) || 0
      }
    });
  };
  
  // Handle input changes
  const handleNumberInput = (
    setter: (value: string) => void, 
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;
    // Allow empty string or valid number
    if (value === "" || /^-?\d*\.?\d*$/.test(value)) {
      setter(value);
    }
  };
  
  const handleBlur = () => {
    applyChanges();
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      applyChanges();
    }
  };
  
  // Handle changing element type
  const handleTypeChange = (type: string) => {
    if (!selectedElement) return;
    
    updateElement(selectedElement.id, {
      type: type as ElementTypeValue
    });
    
    setElementType(type);
  };
  
  const handleFillColorChange = (color: string) => {
    if (!selectedElement) return;
    updateElement(selectedElement.id, { fill: color });
  };
  
  const handleStrokeColorChange = (color: string) => {
    if (!selectedElement) return;
    updateElement(selectedElement.id, { stroke: color });
  };
  
  const handleOpacityChange = (value: number[]) => {
    setOpacity(value[0]);
    
    // Debounce the update to avoid too many rerenders
    setTimeout(() => {
      if (!selectedElement) return;
      updateElement(selectedElement.id, { opacity: value[0] / 100 });
    }, 100);
  };
  
  if (!selectedElement) {
    return (
      <div className="w-72 bg-[#F8F8F8] border-l border-slate-200 flex flex-col">
        <div className="p-3 border-b border-slate-200">
          <h3 className="font-medium text-sm">Properties</h3>
        </div>
        
        <div className="flex-1 flex items-center justify-center text-sm text-slate-500">
          No element selected
        </div>
      </div>
    );
  }
  
  return (
    <div className="w-72 bg-[#F8F8F8] border-l border-slate-200 flex flex-col">
      <div className="p-3 border-b border-slate-200 flex justify-between items-center">
        <h3 className="font-medium text-sm">Properties</h3>
        <div className="flex space-x-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6"
            onClick={() => deleteElement(selectedElement.id)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <ScrollArea className="flex-1 p-3">
        {/* Type section */}
        <div className="mb-5">
          <h4 className="text-xs font-medium uppercase text-slate-500 mb-2">Type</h4>
          <div className="flex space-x-2">
            <Button
              variant={elementType === ElementType.RECTANGLE ? "default" : "outline"}
              size="sm"
              className="text-xs"
              onClick={() => handleTypeChange(ElementType.RECTANGLE)}
            >
              <Square className="h-3 w-3 mr-1" />
              Rectangle
            </Button>
            <Button
              variant={elementType === ElementType.ELLIPSE ? "default" : "outline"}
              size="sm"
              className="text-xs"
              onClick={() => handleTypeChange(ElementType.ELLIPSE)}
            >
              <Circle className="h-3 w-3 mr-1" />
              Ellipse
            </Button>
            <Button
              variant={elementType === ElementType.TEXT ? "default" : "outline"}
              size="sm"
              className="text-xs"
              onClick={() => handleTypeChange(ElementType.TEXT)}
            >
              <Type className="h-3 w-3 mr-1" />
              Text
            </Button>
          </div>
        </div>
        
        {/* Layer order controls */}
        <div className="mb-5">
          <h4 className="text-xs font-medium uppercase text-slate-500 mb-2">Layer Order</h4>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => bringToFront(selectedElement.id)}
              title="Bring to Front"
            >
              <ChevronsUp className="h-3 w-3 mr-1" />
              Front
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => bringForward(selectedElement.id)}
              title="Bring Forward"
            >
              <ArrowUp className="h-3 w-3 mr-1" />
              Forward
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => sendBackward(selectedElement.id)}
              title="Send Backward"
            >
              <ArrowDown className="h-3 w-3 mr-1" />
              Back
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => sendToBack(selectedElement.id)}
              title="Send to Back"
            >
              <ChevronsDown className="h-3 w-3 mr-1" />
              Bottom
            </Button>
          </div>
        </div>
        
        {/* Properties tabs */}
        <Tabs defaultValue="dimensions">
          <TabsList className="grid grid-cols-2 mb-2">
            <TabsTrigger value="dimensions" className="text-xs">Dimensions</TabsTrigger>
            <TabsTrigger value="appearance" className="text-xs">Appearance</TabsTrigger>
          </TabsList>
          
          {/* Dimensions tab */}
          <TabsContent value="dimensions" className="space-y-4">
            {/* Position */}
            <div className="space-y-2">
              <h4 className="text-xs font-medium uppercase text-slate-500">Position</h4>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs mb-1 block">X</Label>
                  <div className="relative">
                    <Input
                      value={x}
                      onChange={(e) => handleNumberInput(setX, e)}
                      onBlur={handleBlur}
                      onKeyDown={handleKeyDown}
                      className="pr-8 text-sm"
                    />
                    <div className="absolute inset-y-0 right-0 pr-2 flex items-center text-xs text-slate-400">px</div>
                  </div>
                </div>
                <div>
                  <Label className="text-xs mb-1 block">Y</Label>
                  <div className="relative">
                    <Input
                      value={y}
                      onChange={(e) => handleNumberInput(setY, e)}
                      onBlur={handleBlur}
                      onKeyDown={handleKeyDown}
                      className="pr-8 text-sm"
                    />
                    <div className="absolute inset-y-0 right-0 pr-2 flex items-center text-xs text-slate-400">px</div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Size */}
            <div className="space-y-2">
              <h4 className="text-xs font-medium uppercase text-slate-500">Size</h4>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs mb-1 block">Width</Label>
                  <div className="relative">
                    <Input
                      value={width}
                      onChange={(e) => handleNumberInput(setWidth, e)}
                      onBlur={handleBlur}
                      onKeyDown={handleKeyDown}
                      className="pr-8 text-sm"
                    />
                    <div className="absolute inset-y-0 right-0 pr-2 flex items-center text-xs text-slate-400">px</div>
                  </div>
                </div>
                <div>
                  <Label className="text-xs mb-1 block">Height</Label>
                  <div className="relative">
                    <Input
                      value={height}
                      onChange={(e) => handleNumberInput(setHeight, e)}
                      onBlur={handleBlur}
                      onKeyDown={handleKeyDown}
                      className="pr-8 text-sm"
                    />
                    <div className="absolute inset-y-0 right-0 pr-2 flex items-center text-xs text-slate-400">px</div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Rotation */}
            <div className="space-y-2">
              <h4 className="text-xs font-medium uppercase text-slate-500">Rotation</h4>
              <div className="flex items-center space-x-2">
                <Slider
                  min={0}
                  max={360}
                  step={1}
                  value={[rotation]}
                  onValueChange={(values) => {
                    setRotation(values[0]);
                    // Debounce the update
                    setTimeout(() => {
                      if (!selectedElement) return;
                      updateElement(selectedElement.id, { rotation: values[0] });
                    }, 100);
                  }}
                  className="flex-1"
                />
                <div className="relative w-16">
                  <Input
                    value={rotation}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      setRotation(val);
                    }}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    className="pr-6 text-sm"
                  />
                  <div className="absolute inset-y-0 right-0 pr-2 flex items-center text-xs text-slate-400">°</div>
                </div>
              </div>
            </div>
            
            {/* Text content - only shown for text elements */}
            {elementType === ElementType.TEXT && (
              <div className="space-y-2">
                <h4 className="text-xs font-medium uppercase text-slate-500">Text Content</h4>
                <div>
                  <Label className="text-xs mb-1 block">Content</Label>
                  <Input
                    value={textContent}
                    onChange={(e) => setTextContent(e.target.value)}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    className="text-sm"
                  />
                </div>
              </div>
            )}
          </TabsContent>
          
          {/* Appearance tab */}
          <TabsContent value="appearance" className="space-y-4">
            {/* Fill */}
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-xs font-medium uppercase text-slate-500">Fill</h4>
              </div>
              <div className="flex items-center space-x-2">
                <ColorPicker 
                  color={selectedElement.fill} 
                  onChange={handleFillColorChange} 
                />
                <div className="text-xs text-slate-600">
                  {selectedElement.fill === 'transparent' ? 'None' : selectedElement.fill}
                </div>
              </div>
            </div>
            
            {/* Stroke */}
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-xs font-medium uppercase text-slate-500">Stroke</h4>
              </div>
              <div className="flex items-center space-x-2">
                <ColorPicker 
                  color={selectedElement.stroke} 
                  onChange={handleStrokeColorChange} 
                  isStroke 
                />
                <div className="text-xs text-slate-600">
                  {selectedElement.stroke === 'transparent' ? 'None' : selectedElement.stroke}
                </div>
                <div className="relative">
                  <Input
                    value={selectedElement.strokeWidth.toString()}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      if (val >= 0) {
                        updateElement(selectedElement.id, { strokeWidth: val });
                      }
                    }}
                    className="w-14 h-8 pr-6 text-sm"
                  />
                  <div className="absolute inset-y-0 right-0 pr-2 flex items-center text-xs text-slate-400">px</div>
                </div>
              </div>
            </div>
            
            {/* Corner radius - only for rectangles */}
            {elementType === ElementType.RECTANGLE && (
              <div className="space-y-2">
                <Label className="text-xs font-medium uppercase text-slate-500 block">Corner Radius</Label>
                <div className="relative">
                  <Input
                    value={cornerRadius}
                    onChange={(e) => handleNumberInput(setCornerRadius, e)}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    className="pr-8 text-sm"
                  />
                  <div className="absolute inset-y-0 right-0 pr-2 flex items-center text-xs text-slate-400">px</div>
                </div>
              </div>
            )}
            
            {/* Opacity */}
            <div className="space-y-2">
              <Label className="text-xs font-medium uppercase text-slate-500 block">Opacity</Label>
              <div className="flex items-center space-x-2">
                <Slider
                  min={0}
                  max={100}
                  step={1}
                  value={[opacity]}
                  onValueChange={handleOpacityChange}
                  className="flex-1"
                />
                <div className="relative w-16">
                  <Input
                    value={opacity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      if (val >= 0 && val <= 100) {
                        setOpacity(val);
                        updateElement(selectedElement.id, { opacity: val / 100 });
                      }
                    }}
                    className="pr-6 text-sm"
                  />
                  <div className="absolute inset-y-0 right-0 pr-2 flex items-center text-xs text-slate-400">%</div>
                </div>
              </div>
            </div>
            
            {/* Effects - shadows, etc. */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-medium uppercase text-slate-500">Effects</h4>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-5 w-5 p-0"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              <div className="bg-white rounded border border-slate-200 p-2 text-xs text-slate-500">
                No effects added
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </ScrollArea>
    </div>
  );
}
