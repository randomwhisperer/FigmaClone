import React from 'react';
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { 
  setActiveTool, 
  setFillColor, 
  setStrokeColor, 
  setStrokeWidth, 
  setZoomLevel,
  type ToolType 
} from "@/store/slices/designSlice";
import { 
  MousePointer, 
  Square, 
  Circle, 
  Type, 
  Hand, 
  Minus, 
  ZoomIn, 
  ZoomOut,
  Pipette,
  Image,
  Pen,
  Eraser,
  Star,
  CornerUpLeft,
  Lock,
  Shuffle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { HexColorPicker } from "react-colorful";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { motion } from "framer-motion";

interface ToolButtonProps {
  icon: React.ReactNode;
  onClick: () => void;
  isActive?: boolean;
  tooltip: string;
  shortcut?: string;
}

function ToolButton({ icon, onClick, isActive, tooltip, shortcut }: ToolButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "tool-button",
            isActive && "active"
          )}
          onClick={onClick}
        >
          {icon}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="right" sideOffset={10}>
        <div className="flex flex-col">
          <span>{tooltip}</span>
          {shortcut && <span className="text-xs text-muted-foreground">{shortcut}</span>}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  title: string;
}

function ColorPickerButton({ color, onChange, title }: ColorPickerProps) {
  return (
    <Popover>
      <TooltipTrigger asChild>
        <PopoverTrigger asChild>
          <Button variant="outline" className="h-8 w-8 p-0 rounded-md">
            <div 
              className="h-6 w-6 rounded-sm"
              style={{ 
                backgroundColor: color === 'transparent' ? 'white' : color,
                backgroundImage: color === 'transparent' 
                  ? 'linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc), linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc)'
                  : 'none',
                backgroundSize: '6px 6px',
                backgroundPosition: '0 0, 3px 3px'
              }}
            />
            <span className="sr-only">{title}</span>
          </Button>
        </PopoverTrigger>
      </TooltipTrigger>
      <PopoverContent side="right" className="w-auto p-3">
        <div className="flex flex-col gap-3">
          <div className="text-sm font-medium">{title}</div>
          <HexColorPicker color={color === 'transparent' ? '#ffffff' : color} onChange={onChange} />
          <div className="flex gap-2">
            {color === 'transparent' ? (
              <Button 
                size="sm" 
                variant="secondary" 
                className="flex-1"
                onClick={() => onChange('#000000')}
              >
                Enable
              </Button>
            ) : (
              <Button 
                size="sm" 
                variant="secondary" 
                className="flex-1"
                onClick={() => onChange('transparent')}
              >
                Disable
              </Button>
            )}
            <Button 
              size="sm" 
              className="flex-1"
              onClick={() => onChange(color)}
            >
              Apply
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function Toolbar() {
  const { 
    activeTool, 
    fillColor, 
    strokeColor, 
    strokeWidth,
    zoomLevel
  } = useAppSelector(state => state.design.present);
  
  const dispatch = useAppDispatch();
  
  const handleToolSelect = (tool: ToolType) => {
    dispatch(setActiveTool(tool));
  };
  
  const handleFillColorChange = (color: string) => {
    dispatch(setFillColor(color));
  };
  
  const handleStrokeColorChange = (color: string) => {
    dispatch(setStrokeColor(color));
  };
  
  const handleStrokeWidthChange = (values: number[]) => {
    dispatch(setStrokeWidth(values[0]));
  };
  
  const handleZoomChange = (value: string) => {
    const zoomValue = value === "fit" ? 1 : parseFloat(value) / 100;
    dispatch(setZoomLevel(zoomValue));
  };
  
  const handleZoomIn = () => {
    dispatch(setZoomLevel(Math.min(zoomLevel + 0.1, 3)));
  };
  
  const handleZoomOut = () => {
    dispatch(setZoomLevel(Math.max(zoomLevel - 0.1, 0.1)));
  };
  
  // Toolbar animation
  const toolbarVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.05
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0 }
  };
  
  return (
    <motion.div 
      className="figma-toolbar border-b flex items-center px-2 py-1"
      variants={toolbarVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Selection tools */}
      <motion.div className="flex items-center space-x-1" variants={itemVariants}>
        <ToolButton
          icon={<MousePointer className="h-4 w-4" />}
          onClick={() => handleToolSelect("select")}
          isActive={activeTool === "select"}
          tooltip="Select Tool"
          shortcut="V"
        />
        
        <ToolButton
          icon={<Hand className="h-4 w-4" />}
          onClick={() => handleToolSelect("hand")}
          isActive={activeTool === "hand"}
          tooltip="Hand Tool"
          shortcut="H"
        />
      </motion.div>
      
      <Separator orientation="vertical" className="h-6 mx-2" />
      
      {/* Shape tools */}
      <motion.div className="flex items-center space-x-1" variants={itemVariants}>
        <ToolButton
          icon={<Square className="h-4 w-4" />}
          onClick={() => handleToolSelect("rectangle")}
          isActive={activeTool === "rectangle"}
          tooltip="Rectangle Tool"
          shortcut="R"
        />
        
        <ToolButton
          icon={<Circle className="h-4 w-4" />}
          onClick={() => handleToolSelect("ellipse")}
          isActive={activeTool === "ellipse"}
          tooltip="Ellipse Tool"
          shortcut="O"
        />
        
        <ToolButton
          icon={<Star className="h-4 w-4" />}
          onClick={() => handleToolSelect("rectangle")} // Will be updated in future
          tooltip="Star Tool"
          shortcut="*"
        />
        
        <ToolButton
          icon={<Minus className="h-4 w-4" />}
          onClick={() => handleToolSelect("line")}
          isActive={activeTool === "line"}
          tooltip="Line Tool"
          shortcut="L"
        />
      </motion.div>
      
      <Separator orientation="vertical" className="h-6 mx-2" />
      
      {/* Other tools */}
      <motion.div className="flex items-center space-x-1" variants={itemVariants}>
        <ToolButton
          icon={<Type className="h-4 w-4" />}
          onClick={() => handleToolSelect("text")}
          isActive={activeTool === "text"}
          tooltip="Text Tool"
          shortcut="T"
        />
        
        <ToolButton
          icon={<Pen className="h-4 w-4" />}
          onClick={() => handleToolSelect("rectangle")} // Will be updated in future
          tooltip="Pen Tool"
          shortcut="P"
        />
        
        <ToolButton
          icon={<Image className="h-4 w-4" />}
          onClick={() => handleToolSelect("rectangle")} // Will be updated in future
          tooltip="Image Tool"
          shortcut="I"
        />
      </motion.div>
      
      <Separator orientation="vertical" className="h-6 mx-2" />
      
      {/* Color tools */}
      <motion.div className="flex items-center space-x-3 ml-1" variants={itemVariants}>
        <div className="flex flex-col items-center">
          <span className="text-xs text-muted-foreground mb-1">Fill</span>
          <ColorPickerButton 
            color={fillColor} 
            onChange={handleFillColorChange}
            title="Fill Color"
          />
        </div>
        
        <div className="flex flex-col items-center">
          <span className="text-xs text-muted-foreground mb-1">Stroke</span>
          <ColorPickerButton 
            color={strokeColor} 
            onChange={handleStrokeColorChange}
            title="Stroke Color"
          />
        </div>
        
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground mb-1">Width</span>
          <div className="flex items-center w-24 px-2">
            <Slider
              min={0}
              max={20}
              step={1}
              value={[strokeWidth]}
              onValueChange={handleStrokeWidthChange}
            />
            <span className="ml-2 text-xs w-4">{strokeWidth}</span>
          </div>
        </div>
      </motion.div>
      
      {/* Zoom controls */}
      <motion.div 
        className="ml-auto flex items-center space-x-1"
        variants={itemVariants}
      >
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={handleZoomOut}
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        
        <Select
          value={zoomLevel === 1 ? "fit" : `${Math.round(zoomLevel * 100)}`}
          onValueChange={handleZoomChange}
        >
          <SelectTrigger className="w-20 h-7 text-xs">
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
        
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={handleZoomIn}
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
      </motion.div>
    </motion.div>
  );
}