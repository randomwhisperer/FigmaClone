import { 
  MousePointer, 
  Square, 
  Circle, 
  Type, 
  Hand, 
  Minus, 
  ZoomIn, 
  ZoomOut 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ColorPicker } from "@/components/ui/color-picker";
import { useDesignStore } from "@/store";
import type { ToolType } from "@/store";

export default function ToolBar() {
  const { 
    activeTool, setActiveTool, 
    fillColor, setFillColor,
    strokeColor, setStrokeColor,
    zoomLevel, setZoomLevel
  } = useDesignStore();
  
  const handleToolSelect = (tool: ToolType) => {
    setActiveTool(tool);
  };
  
  const handleZoomChange = (value: string) => {
    const zoomValue = value === "fit" ? 1 : parseFloat(value) / 100;
    setZoomLevel(zoomValue);
  };
  
  const handleZoomIn = () => {
    setZoomLevel(Math.min(zoomLevel + 0.1, 3));
  };
  
  const handleZoomOut = () => {
    setZoomLevel(Math.max(zoomLevel - 0.1, 0.1));
  };
  
  return (
    <div className="h-12 px-3 bg-white border-b border-slate-200 flex items-center space-x-2">
      {/* Move/Select tool */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={activeTool === "select" ? "secondary" : "ghost"}
            size="icon"
            className="w-8 h-8"
            onClick={() => handleToolSelect("select")}
            aria-label="Select (V)"
          >
            <MousePointer className="h-5 w-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Select (V)</TooltipContent>
      </Tooltip>
      
      <Separator orientation="vertical" className="h-6" />
      
      {/* Shape tools */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={activeTool === "rectangle" ? "secondary" : "ghost"}
            size="icon"
            className="w-8 h-8"
            onClick={() => handleToolSelect("rectangle")}
            aria-label="Rectangle (R)"
          >
            <Square className="h-5 w-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Rectangle (R)</TooltipContent>
      </Tooltip>
      
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={activeTool === "ellipse" ? "secondary" : "ghost"}
            size="icon"
            className="w-8 h-8"
            onClick={() => handleToolSelect("ellipse")}
            aria-label="Ellipse (O)"
          >
            <Circle className="h-5 w-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Ellipse (O)</TooltipContent>
      </Tooltip>
      
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={activeTool === "line" ? "secondary" : "ghost"}
            size="icon"
            className="w-8 h-8"
            onClick={() => handleToolSelect("line")}
            aria-label="Line (L)"
          >
            <Minus className="h-5 w-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Line (L)</TooltipContent>
      </Tooltip>
      
      <Separator orientation="vertical" className="h-6" />
      
      {/* Text tool */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={activeTool === "text" ? "secondary" : "ghost"}
            size="icon"
            className="w-8 h-8"
            onClick={() => handleToolSelect("text")}
            aria-label="Text (T)"
          >
            <Type className="h-5 w-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Text (T)</TooltipContent>
      </Tooltip>
      
      <Separator orientation="vertical" className="h-6" />
      
      {/* Hand tool */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={activeTool === "hand" ? "secondary" : "ghost"}
            size="icon"
            className="w-8 h-8"
            onClick={() => handleToolSelect("hand")}
            aria-label="Hand (H)"
          >
            <Hand className="h-5 w-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Hand (H)</TooltipContent>
      </Tooltip>
      
      {/* Color tools */}
      <div className="ml-4 flex items-center space-x-2">
        <ColorPicker 
          color={fillColor} 
          onChange={setFillColor} 
          label="Fill" 
        />
        
        <ColorPicker 
          color={strokeColor} 
          onChange={setStrokeColor} 
          label="Stroke" 
          isStroke 
        />
      </div>
      
      {/* Zoom controls */}
      <div className="ml-auto flex items-center space-x-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8"
              onClick={handleZoomOut}
              aria-label="Zoom out"
            >
              <ZoomOut className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Zoom Out</TooltipContent>
        </Tooltip>
        
        <Select
          value={zoomLevel === 1 ? "fit" : `${Math.round(zoomLevel * 100)}`}
          onValueChange={handleZoomChange}
        >
          <SelectTrigger className="w-20 h-8">
            <SelectValue placeholder="Zoom" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="25">25%</SelectItem>
            <SelectItem value="50">50%</SelectItem>
            <SelectItem value="75">75%</SelectItem>
            <SelectItem value="100">100%</SelectItem>
            <SelectItem value="125">125%</SelectItem>
            <SelectItem value="150">150%</SelectItem>
            <SelectItem value="200">200%</SelectItem>
            <SelectItem value="fit">Fit</SelectItem>
          </SelectContent>
        </Select>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8"
              onClick={handleZoomIn}
              aria-label="Zoom in"
            >
              <ZoomIn className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Zoom In</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
