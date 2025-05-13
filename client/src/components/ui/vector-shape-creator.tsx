import React, { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { 
  Square, 
  Circle, 
  Triangle, 
  Pentagon, 
  Hexagon, 
  Star, 
  Heart,
  Plus,
  Minus,
  RotateCcw,
  Download,
  Undo,
  Redo
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAppDispatch } from "@/store/hooks";
import { addElement } from "@/store/slices/designSlice";
import { ElementType } from "@shared/schema";

interface Point {
  x: number;
  y: number;
}

interface VectorShapeCreatorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SHAPES = [
  { id: "rectangle", icon: <Square className="h-5 w-5" />, name: "Rectangle" },
  { id: "ellipse", icon: <Circle className="h-5 w-5" />, name: "Circle" },
  { id: "triangle", icon: <Triangle className="h-5 w-5" />, name: "Triangle" },
  { id: "pentagon", icon: <Pentagon className="h-5 w-5" />, name: "Pentagon" },
  { id: "hexagon", icon: <Hexagon className="h-5 w-5" />, name: "Hexagon" },
  { id: "star", icon: <Star className="h-5 w-5" />, name: "Star" },
  { id: "heart", icon: <Heart className="h-5 w-5" />, name: "Heart" },
];

const generateShapePath = (
  shapeType: string,
  width: number,
  height: number,
  cornerRadius = 0,
  extraParams: Record<string, number> = {}
): string => {
  const halfWidth = width / 2;
  const halfHeight = height / 2;

  switch (shapeType) {
    case "rectangle":
      if (cornerRadius > 0) {
        const r = Math.min(cornerRadius, Math.min(width, height) / 2);
        return `M${r},0 H${width - r} Q${width},0 ${width},${r} V${height - r} Q${width},${height} ${width - r},${height} H${r} Q0,${height} 0,${height - r} V${r} Q0,0 ${r},0 Z`;
      }
      return `M0,0 H${width} V${height} H0 Z`;

    case "ellipse":
      return `M${halfWidth},0 A${halfWidth},${halfHeight} 0 1 1 ${halfWidth},${height} A${halfWidth},${halfHeight} 0 1 1 ${halfWidth},0 Z`;

    case "triangle":
      return `M${halfWidth},0 L${width},${height} L0,${height} Z`;

    case "pentagon": {
      const points: Point[] = [];
      for (let i = 0; i < 5; i++) {
        const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
        points.push({
          x: halfWidth + halfWidth * Math.cos(angle),
          y: halfHeight + halfHeight * Math.sin(angle),
        });
      }
      return `M${points.map(p => `${p.x},${p.y}`).join(" L")} Z`;
    }

    case "hexagon": {
      const points: Point[] = [];
      for (let i = 0; i < 6; i++) {
        const angle = (i * 2 * Math.PI) / 6;
        points.push({
          x: halfWidth + halfWidth * Math.cos(angle),
          y: halfHeight + halfHeight * Math.sin(angle),
        });
      }
      return `M${points.map(p => `${p.x},${p.y}`).join(" L")} Z`;
    }

    case "star": {
      const points: Point[] = [];
      const innerRadius = halfWidth * (extraParams.innerRadius || 0.4);
      for (let i = 0; i < 10; i++) {
        const radius = i % 2 === 0 ? halfWidth : innerRadius;
        const angle = (i * Math.PI) / 5 - Math.PI / 2;
        points.push({
          x: halfWidth + radius * Math.cos(angle),
          y: halfHeight + radius * Math.sin(angle),
        });
      }
      return `M${points.map(p => `${p.x},${p.y}`).join(" L")} Z`;
    }

    case "heart": {
      // Create a heart shape with bezier curves
      const topY = height * 0.3;
      return `
        M${halfWidth},${height}
        C${width * 0.75},${height * 0.85} ${width},${height * 0.65} ${width},${topY}
        C${width},${height * 0.15} ${halfWidth * 1.5},${height * 0.15} ${halfWidth},${topY}
        C${halfWidth * 0.5},${height * 0.15} 0,${height * 0.15} 0,${topY}
        C0,${height * 0.65} ${width * 0.25},${height * 0.85} ${halfWidth},${height}
        Z
      `.replace(/\s+/g, " ").trim();
    }

    default:
      return `M0,0 H${width} V${height} H0 Z`;
  }
};

export function VectorShapeCreator({ open, onOpenChange }: VectorShapeCreatorProps) {
  const [activeTab, setActiveTab] = useState("shapes");
  const [selectedShape, setSelectedShape] = useState("rectangle");
  const [width, setWidth] = useState(200);
  const [height, setHeight] = useState(200);
  const [cornerRadius, setCornerRadius] = useState(0);
  const [fill, setFill] = useState("#3B82F6");
  const [stroke, setStroke] = useState("#000000");
  const [strokeWidth, setStrokeWidth] = useState(1);
  const [innerRadius, setInnerRadius] = useState(0.4); // For star shape
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const isDragging = useRef(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);
  
  const { toast } = useToast();
  const dispatch = useAppDispatch();

  // Generate current shape path
  const currentShapePath = generateShapePath(
    selectedShape,
    width,
    height,
    cornerRadius,
    { innerRadius }
  );

  // Save a snapshot of the current shape
  const saveSnapshot = () => {
    setUndoStack(prev => [...prev, currentShapePath]);
    setRedoStack([]);
  };

  // Handle undo action
  const handleUndo = () => {
    if (undoStack.length > 0) {
      const lastState = undoStack[undoStack.length - 1];
      setRedoStack(prev => [...prev, currentShapePath]);
      setUndoStack(prev => prev.slice(0, -1));
      // Apply the last state - this is simplified, in reality you'd need to parse the path
    }
  };

  // Handle redo action
  const handleRedo = () => {
    if (redoStack.length > 0) {
      const nextState = redoStack[redoStack.length - 1];
      setUndoStack(prev => [...prev, currentShapePath]);
      setRedoStack(prev => prev.slice(0, -1));
      // Apply the next state - this is simplified
    }
  };

  // Reset to default shape
  const handleReset = () => {
    saveSnapshot();
    setWidth(200);
    setHeight(200);
    setCornerRadius(0);
    setInnerRadius(0.4);
  };

  // Handle zoom in
  const handleZoomIn = () => {
    saveSnapshot();
    setWidth(prev => Math.min(prev * 1.1, 500));
    setHeight(prev => Math.min(prev * 1.1, 500));
  };

  // Handle zoom out
  const handleZoomOut = () => {
    saveSnapshot();
    setWidth(prev => Math.max(prev * 0.9, 50));
    setHeight(prev => Math.max(prev * 0.9, 50));
  };

  // Handle shape selection
  const handleShapeSelect = (shapeId: string) => {
    saveSnapshot();
    setSelectedShape(shapeId);
  };

  // Export shape as SVG
  const handleExportSVG = () => {
    if (svgRef.current) {
      const svgData = new XMLSerializer().serializeToString(svgRef.current);
      const blob = new Blob([svgData], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement("a");
      link.href = url;
      link.download = `${selectedShape}-shape.svg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({
        title: "SVG Exported",
        description: "Your shape has been exported as an SVG file.",
      });
    }
  };

  // Add shape to canvas
  const handleAddToCanvas = () => {
    const shapeProperties = {
      type: ElementType.RECTANGLE, // Default to rectangle type in our schema
      x: 100,
      y: 100,
      width,
      height,
      rotation: 0,
      fill,
      stroke,
      strokeWidth,
      opacity: 1,
      properties: {
        cornerRadius,
        customShape: selectedShape,
        path: currentShapePath,
        innerRadius: selectedShape === "star" ? innerRadius : undefined,
      },
    };
    
    dispatch(addElement(shapeProperties));
    
    toast({
      title: "Shape Added",
      description: "Your custom shape has been added to the canvas.",
    });
    
    onOpenChange(false);
  };

  // Update corner radius based on shape
  useEffect(() => {
    if (selectedShape !== "rectangle") {
      setCornerRadius(0);
    }
  }, [selectedShape]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) { // Left button
      isDragging.current = true;
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        lastPos.current = {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        };
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging.current && lastPos.current) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const currentX = e.clientX - rect.left;
        const currentY = e.clientY - rect.top;
        
        // Calculate the center point of the SVG view
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        // Calculate the difference from the center
        const diffX = currentX - centerX;
        const diffY = currentY - centerY;
        
        // Adjust width/height based on direction from center
        if (Math.abs(diffX) > Math.abs(diffY)) {
          // Horizontal movement dominates
          setWidth(prev => Math.max(50, prev + (currentX - lastPos.current!.x)));
        } else {
          // Vertical movement dominates
          setHeight(prev => Math.max(50, prev + (currentY - lastPos.current!.y)));
        }
        
        lastPos.current = { x: currentX, y: currentY };
      }
    }
  };

  const handleMouseUp = () => {
    if (isDragging.current) {
      isDragging.current = false;
      lastPos.current = null;
      saveSnapshot();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Vector Shape Creator</DialogTitle>
          <DialogDescription>
            Design custom vector shapes to add to your canvas
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
          {/* Left panel with tools */}
          <div className="space-y-4">
            <Tabs defaultValue="shapes" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-2">
                <TabsTrigger value="shapes">Shapes</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>
              
              <TabsContent value="shapes" className="space-y-4 pt-4">
                <div className="grid grid-cols-3 gap-2">
                  {SHAPES.map((shape) => (
                    <Button
                      key={shape.id}
                      variant={selectedShape === shape.id ? "default" : "outline"}
                      className="h-20 flex flex-col items-center justify-center gap-1 p-1"
                      onClick={() => handleShapeSelect(shape.id)}
                    >
                      {shape.icon}
                      <span className="text-xs">{shape.name}</span>
                    </Button>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="settings" className="space-y-4 pt-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="width">Width: {width}px</Label>
                    <Slider 
                      id="width"
                      min={50} 
                      max={500} 
                      step={1}
                      value={[width]}
                      onValueChange={(value) => setWidth(value[0])}
                      onValueCommit={() => saveSnapshot()}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="height">Height: {height}px</Label>
                    <Slider 
                      id="height"
                      min={50} 
                      max={500} 
                      step={1}
                      value={[height]}
                      onValueChange={(value) => setHeight(value[0])}
                      onValueCommit={() => saveSnapshot()}
                    />
                  </div>

                  {selectedShape === "rectangle" && (
                    <div className="space-y-2">
                      <Label htmlFor="cornerRadius">Corner Radius: {cornerRadius}px</Label>
                      <Slider 
                        id="cornerRadius"
                        min={0} 
                        max={100} 
                        step={1}
                        value={[cornerRadius]}
                        onValueChange={(value) => setCornerRadius(value[0])}
                        onValueCommit={() => saveSnapshot()}
                      />
                    </div>
                  )}

                  {selectedShape === "star" && (
                    <div className="space-y-2">
                      <Label htmlFor="innerRadius">Inner Radius: {(innerRadius * 100).toFixed(0)}%</Label>
                      <Slider 
                        id="innerRadius"
                        min={0.1} 
                        max={0.9} 
                        step={0.05}
                        value={[innerRadius]}
                        onValueChange={(value) => setInnerRadius(value[0])}
                        onValueCommit={() => saveSnapshot()}
                      />
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor="stroke-width">Stroke Width: {strokeWidth}px</Label>
                    <Slider 
                      id="stroke-width"
                      min={0} 
                      max={10} 
                      step={0.5}
                      value={[strokeWidth]}
                      onValueChange={(value) => setStrokeWidth(value[0])}
                      onValueCommit={() => saveSnapshot()}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="fill-color" className="block mb-1">Fill</Label>
                      <div className="flex border rounded-md overflow-hidden">
                        <input 
                          id="fill-color"
                          type="color" 
                          value={fill} 
                          onChange={(e) => setFill(e.target.value)}
                          onBlur={() => saveSnapshot()}
                          className="w-10 h-10 cursor-pointer border-0" 
                        />
                        <input 
                          type="text" 
                          value={fill} 
                          onChange={(e) => setFill(e.target.value)}
                          onBlur={() => saveSnapshot()}
                          className="flex-1 px-2 text-sm focus:outline-none" 
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="stroke-color" className="block mb-1">Stroke</Label>
                      <div className="flex border rounded-md overflow-hidden">
                        <input 
                          id="stroke-color"
                          type="color" 
                          value={stroke} 
                          onChange={(e) => setStroke(e.target.value)}
                          onBlur={() => saveSnapshot()}
                          className="w-10 h-10 cursor-pointer border-0" 
                        />
                        <input 
                          type="text" 
                          value={stroke} 
                          onChange={(e) => setStroke(e.target.value)}
                          onBlur={() => saveSnapshot()}
                          className="flex-1 px-2 text-sm focus:outline-none" 
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
            
            {/* Actions */}
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-sm">Actions</CardTitle>
              </CardHeader>
              <CardContent className="py-0">
                <div className="grid grid-cols-4 gap-2">
                  <Button variant="outline" size="sm" onClick={handleZoomIn} title="Zoom In">
                    <Plus className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleZoomOut} title="Zoom Out">
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleReset} title="Reset">
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleExportSVG} title="Export SVG">
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleUndo} 
                    disabled={undoStack.length === 0}
                    title="Undo"
                  >
                    <Undo className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleRedo}
                    disabled={redoStack.length === 0}
                    title="Redo"
                  >
                    <Redo className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
              <CardFooter className="pt-4">
                <Button onClick={handleAddToCanvas} className="w-full">
                  Add to Canvas
                </Button>
              </CardFooter>
            </Card>
          </div>
          
          {/* Right panel with preview */}
          <div 
            className="md:col-span-2 bg-muted/40 rounded-lg overflow-hidden flex items-center justify-center"
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <div className="w-full h-[400px] relative flex items-center justify-center">
              <div className="absolute inset-0 grid grid-cols-[repeat(20,minmax(0,1fr))] grid-rows-[repeat(20,minmax(0,1fr))] opacity-10 pointer-events-none">
                {Array.from({ length: 20 }).map((_, colIndex) => (
                  Array.from({ length: 20 }).map((_, rowIndex) => (
                    <div 
                      key={`${colIndex}-${rowIndex}`} 
                      className="border border-gray-400"
                    />
                  ))
                ))}
              </div>
              
              <svg
                ref={svgRef}
                width={width}
                height={height}
                viewBox={`0 0 ${width} ${height}`}
                className="drop-shadow-md"
              >
                <path
                  d={currentShapePath}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={strokeWidth}
                />
              </svg>
              
              <div className="absolute top-2 left-2 bg-background/80 text-xs rounded px-2 py-1 pointer-events-none">
                {width} × {height}px
              </div>
              
              <div className="absolute bottom-2 right-2 text-xs text-muted-foreground pointer-events-none">
                Drag shape to resize
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}