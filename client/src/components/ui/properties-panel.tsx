import React, { useState, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { updateElement, deleteElement, duplicateElement } from "@/store/slices/designSlice";
import { ElementType, type Element } from "@shared/schema";
import { 
  Button,
  Input, 
  Label,
  Slider,
  Tabs, 
  TabsContent,
  TabsList, 
  TabsTrigger,
  Separator,
  Card,
  CardContent
} from "@/components/ui";
import { 
  Square, Circle, Type, Minus, 
  Copy, Trash, CornerUpLeft, ArrowUp, 
  ArrowDown, ChevronsUp, ChevronsDown 
} from "lucide-react";
import { HexColorPicker } from "react-colorful";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion } from "framer-motion";

export function PropertiesPanel() {
  const dispatch = useAppDispatch();
  const { elements, selectedElementIds } = useAppSelector(state => state.design.present);
  
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
  const [fill, setFill] = useState<string>("#3B82F6");
  const [stroke, setStroke] = useState<string>("transparent");
  const [strokeWidth, setStrokeWidth] = useState<number>(0);
  
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
        setFill(element.fill || "#3B82F6");
        setStroke(element.stroke || "transparent");
        setStrokeWidth(element.strokeWidth || 0);
      }
    } else {
      setSelectedElement(null);
    }
  }, [selectedElementIds, elements]);
  
  // Apply properties changes to the element
  const applyChanges = () => {
    if (!selectedElement) return;
    
    dispatch(updateElement({
      id: selectedElement.id,
      updates: {
        width: parseFloat(width) || selectedElement.width,
        height: parseFloat(height) || selectedElement.height,
        x: parseFloat(x) || selectedElement.x,
        y: parseFloat(y) || selectedElement.y,
        rotation,
        opacity: opacity / 100,
        content: textContent,
        fill,
        stroke,
        strokeWidth,
        properties: {
          ...(selectedElement.properties as Record<string, any>),
          cornerRadius: parseFloat(cornerRadius) || 0
        }
      }
    }));
  };
  
  // Handle number input changes
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
  
  const handleSliderChange = (values: number[], setter: React.Dispatch<React.SetStateAction<number>>) => {
    setter(values[0]);
    // Debounce the update to avoid too many renders
    setTimeout(applyChanges, 100);
  };
  
  const handleBlur = () => {
    applyChanges();
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      applyChanges();
    }
  };
  
  const handleDelete = () => {
    if (!selectedElement) return;
    dispatch(deleteElement(selectedElement.id));
  };
  
  const handleDuplicate = () => {
    if (!selectedElement) return;
    dispatch(duplicateElement(selectedElement.id));
  };
  
  // Animation variants
  const panelVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.3 } }
  };
  
  if (!selectedElement) {
    return (
      <div className="w-64 bg-background border-l figma-sidebar flex flex-col">
        <div className="p-3 border-b">
          <h3 className="font-medium text-sm">Properties</h3>
        </div>
        
        <div className="flex-1 flex items-center justify-center p-4 text-center">
          <div className="text-muted-foreground text-sm max-w-xs">
            <p>Select an element on the canvas to edit its properties</p>
            <Button
              variant="outline"
              className="mt-4 text-xs"
              onClick={() => {
                // Sample rectangle for demonstration
                dispatch(updateElement({
                  id: 1,
                  updates: {
                    type: ElementType.RECTANGLE,
                    x: 100,
                    y: 100,
                    width: 200,
                    height: 150,
                    fill: "#3B82F6"
                  }
                }));
              }}
            >
              Create a Rectangle
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <motion.div 
      className="w-64 bg-background border-l figma-sidebar flex flex-col"
      initial="hidden"
      animate="visible"
      variants={panelVariants}
    >
      <div className="p-3 border-b flex justify-between items-center">
        <h3 className="font-medium text-sm">Properties</h3>
        <div className="flex space-x-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6 text-muted-foreground hover:text-destructive"
            onClick={handleDelete}
          >
            <Trash className="h-3.5 w-3.5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6"
            onClick={handleDuplicate}
          >
            <Copy className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-4">
          {/* Element type badge */}
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 text-primary">
              {elementType === ElementType.RECTANGLE && <Square className="w-4 h-4" />}
              {elementType === ElementType.ELLIPSE && <Circle className="w-4 h-4" />}
              {elementType === ElementType.TEXT && <Type className="w-4 h-4" />}
              {elementType === ElementType.LINE && <Minus className="w-4 h-4" />}
            </div>
            <span className="text-xs font-medium">{elementType.charAt(0).toUpperCase() + elementType.slice(1)}</span>
            <span className="text-xs text-muted-foreground ml-auto">ID: {selectedElement.id}</span>
          </div>
          
          <Separator />
          
          <Tabs defaultValue="layout">
            <TabsList className="grid grid-cols-3 mb-2">
              <TabsTrigger value="layout" className="text-xs">Layout</TabsTrigger>
              <TabsTrigger value="appearance" className="text-xs">Appearance</TabsTrigger>
              <TabsTrigger value="effects" className="text-xs">Effects</TabsTrigger>
            </TabsList>
            
            {/* Layout tab */}
            <TabsContent value="layout" className="space-y-4">
              {/* Position */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">Position</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">X</Label>
                      <span className="text-xs text-muted-foreground">px</span>
                    </div>
                    <Input
                      value={x}
                      onChange={(e) => handleNumberInput(setX, e)}
                      onBlur={handleBlur}
                      onKeyDown={handleKeyDown}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Y</Label>
                      <span className="text-xs text-muted-foreground">px</span>
                    </div>
                    <Input
                      value={y}
                      onChange={(e) => handleNumberInput(setY, e)}
                      onBlur={handleBlur}
                      onKeyDown={handleKeyDown}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
              </div>
              
              {/* Size */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">Size</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Width</Label>
                      <span className="text-xs text-muted-foreground">px</span>
                    </div>
                    <Input
                      value={width}
                      onChange={(e) => handleNumberInput(setWidth, e)}
                      onBlur={handleBlur}
                      onKeyDown={handleKeyDown}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Height</Label>
                      <span className="text-xs text-muted-foreground">px</span>
                    </div>
                    <Input
                      value={height}
                      onChange={(e) => handleNumberInput(setHeight, e)}
                      onBlur={handleBlur}
                      onKeyDown={handleKeyDown}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
              </div>
              
              {/* Rotation */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium text-muted-foreground">Rotation</Label>
                  <span className="text-xs text-muted-foreground">{rotation}°</span>
                </div>
                <div className="flex items-center gap-2">
                  <Slider
                    min={0}
                    max={360}
                    step={1}
                    value={[rotation]}
                    onValueChange={(values) => handleSliderChange(values, setRotation)}
                    className="flex-1"
                  />
                  <Input
                    value={rotation}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      setRotation(val);
                    }}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    className="w-14 h-8 text-xs"
                  />
                </div>
              </div>
              
              {/* Text content - only shown for text elements */}
              {elementType === ElementType.TEXT && (
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground">Content</Label>
                  <Input
                    value={textContent}
                    onChange={(e) => setTextContent(e.target.value)}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    className="h-8 text-xs"
                  />
                </div>
              )}
              
              {/* Corner radius - only for rectangles */}
              {elementType === ElementType.RECTANGLE && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium text-muted-foreground">Corner Radius</Label>
                    <span className="text-xs text-muted-foreground">{cornerRadius}px</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Slider
                      min={0}
                      max={100}
                      step={1}
                      value={[parseFloat(cornerRadius) || 0]}
                      onValueChange={(values) => {
                        setCornerRadius(values[0].toString());
                        setTimeout(applyChanges, 100);
                      }}
                      className="flex-1"
                    />
                    <Input
                      value={cornerRadius}
                      onChange={(e) => handleNumberInput(setCornerRadius, e)}
                      onBlur={handleBlur}
                      onKeyDown={handleKeyDown}
                      className="w-14 h-8 text-xs"
                    />
                  </div>
                </div>
              )}
              
              {/* Arrange elements */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">Arrange</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="text-xs h-8"
                    onClick={() => dispatch(ChevronsUp(selectedElement.id))}
                  >
                    <ChevronsUp className="h-3 w-3 mr-1" />
                    Bring to Front
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="text-xs h-8"
                    onClick={() => dispatch(ArrowUp(selectedElement.id))}
                  >
                    <ArrowUp className="h-3 w-3 mr-1" />
                    Forward
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="text-xs h-8"
                    onClick={() => dispatch(ArrowDown(selectedElement.id))}
                  >
                    <ArrowDown className="h-3 w-3 mr-1" />
                    Backward
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="text-xs h-8"
                    onClick={() => dispatch(ChevronsDown(selectedElement.id))}
                  >
                    <ChevronsDown className="h-3 w-3 mr-1" />
                    Send to Back
                  </Button>
                </div>
              </div>
            </TabsContent>
            
            {/* Appearance tab */}
            <TabsContent value="appearance" className="space-y-4">
              {/* Fill color */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">Fill</Label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-8 h-8 rounded-md border"
                      style={{ backgroundColor: fill === 'transparent' ? 'white' : fill }}
                    />
                    <Input
                      value={fill === 'transparent' ? '' : fill.replace('#', '')}
                      onChange={(e) => {
                        const newColor = e.target.value ? `#${e.target.value}` : 'transparent';
                        setFill(newColor);
                      }}
                      onBlur={handleBlur}
                      className="flex-1 h-8 text-xs"
                      placeholder="HEX color"
                      maxLength={7}
                    />
                    <Button 
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => setFill(fill === 'transparent' ? '#000000' : 'transparent')}
                    >
                      {fill === 'transparent' ? 'On' : 'Off'}
                    </Button>
                  </div>
                  
                  <Card className="border">
                    <CardContent className="p-3">
                      <HexColorPicker 
                        color={fill === 'transparent' ? '#ffffff' : fill} 
                        onChange={(color) => {
                          setFill(color);
                          setTimeout(applyChanges, 100);
                        }}
                        style={{ width: '100%', height: '120px' }}
                      />
                    </CardContent>
                  </Card>
                </div>
              </div>
              
              {/* Stroke color and width */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">Stroke</Label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-8 h-8 rounded-md border"
                      style={{ 
                        backgroundColor: stroke === 'transparent' ? 'white' : stroke,
                        backgroundImage: stroke === 'transparent' 
                          ? 'linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc), linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc)'
                          : 'none',
                        backgroundSize: '6px 6px',
                        backgroundPosition: '0 0, 3px 3px'
                      }}
                    />
                    <Input
                      value={stroke === 'transparent' ? '' : stroke.replace('#', '')}
                      onChange={(e) => {
                        const newColor = e.target.value ? `#${e.target.value}` : 'transparent';
                        setStroke(newColor);
                      }}
                      onBlur={handleBlur}
                      className="flex-1 h-8 text-xs"
                      placeholder="HEX color"
                      maxLength={7}
                    />
                    <Button 
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => setStroke(stroke === 'transparent' ? '#000000' : 'transparent')}
                    >
                      {stroke === 'transparent' ? 'On' : 'Off'}
                    </Button>
                  </div>
                  
                  {stroke !== 'transparent' && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">Width</Label>
                        <span className="text-xs text-muted-foreground">{strokeWidth}px</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Slider
                          min={0}
                          max={20}
                          step={1}
                          value={[strokeWidth]}
                          onValueChange={(values) => handleSliderChange(values, setStrokeWidth)}
                          className="flex-1"
                        />
                        <Input
                          value={strokeWidth}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setStrokeWidth(val);
                          }}
                          onBlur={handleBlur}
                          onKeyDown={handleKeyDown}
                          className="w-14 h-8 text-xs"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
            
            {/* Effects tab */}
            <TabsContent value="effects" className="space-y-4">
              {/* Opacity */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium text-muted-foreground">Opacity</Label>
                  <span className="text-xs text-muted-foreground">{opacity}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <Slider
                    min={0}
                    max={100}
                    step={1}
                    value={[opacity]}
                    onValueChange={(values) => handleSliderChange(values, setOpacity)}
                    className="flex-1"
                  />
                  <Input
                    value={opacity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      setOpacity(Math.min(100, Math.max(0, val)));
                    }}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    className="w-14 h-8 text-xs"
                  />
                </div>
              </div>
              
              {/* Future effects: shadows, blurs, etc. */}
              <div className="rounded-md border border-dashed p-3 flex items-center justify-center">
                <p className="text-xs text-muted-foreground">More effects coming soon...</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </ScrollArea>
    </motion.div>
  );
}