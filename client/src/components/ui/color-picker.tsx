import { useState, useEffect, useRef } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  label?: string;
  isStroke?: boolean;
}

export function ColorPicker({ color, onChange, label, isStroke = false }: ColorPickerProps) {
  const [pickerColor, setPickerColor] = useState(color);
  const [isOpen, setIsOpen] = useState(false);
  
  // Refs for canvas
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rectRef = useRef<DOMRect | null>(null);
  const isDraggingRef = useRef(false);
  
  // Parse color to HSL for the hue slider
  const hexToHSL = (hex: string): [number, number, number] => {
    // Remove the # from the beginning of the hex color
    hex = hex.replace(/^#/, '');
    
    // Parse the r, g, b values
    let r = parseInt(hex.substring(0, 2), 16) / 255;
    let g = parseInt(hex.substring(2, 4), 16) / 255;
    let b = parseInt(hex.substring(4, 6), 16) / 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s, l = (max + min) / 2;
    
    if (max === min) {
      h = s = 0; // achromatic
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    
    return [h * 360, s * 100, l * 100];
  };
  
  // Parse HSL to hex
  const hslToHex = (h: number, s: number, l: number): string => {
    h /= 360;
    s /= 100;
    l /= 100;
    
    let r, g, b;
    
    if (s === 0) {
      r = g = b = l; // achromatic
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }
    
    const toHex = (x: number) => {
      const hex = Math.round(x * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  };
  
  // Draw the color spectrum
  const drawColorSpectrum = (hue: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw gradient - saturation (x-axis) and lightness (y-axis)
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        const s = x / width * 100;
        const l = (1 - y / height) * 100;
        
        ctx.fillStyle = `hsl(${hue}, ${s}%, ${l}%)`;
        ctx.fillRect(x, y, 1, 1);
      }
    }
  };
  
  // Get values from click position
  const getValuesFromPosition = (x: number, y: number): [number, number, number] => {
    const canvas = canvasRef.current;
    if (!canvas || !rectRef.current) return [0, 0, 0];
    
    const rect = rectRef.current;
    const canvasX = Math.max(0, Math.min(canvas.width, x - rect.left));
    const canvasY = Math.max(0, Math.min(canvas.height, y - rect.top));
    
    // Calculate saturation and lightness based on position
    const s = (canvasX / canvas.width) * 100;
    const l = (1 - canvasY / canvas.height) * 100;
    
    // Extract hue from current color
    const [h] = hexToHSL(pickerColor);
    
    return [h, s, l];
  };
  
  // Handle canvas mouse/touch events
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    rectRef.current = canvasRef.current.getBoundingClientRect();
    isDraggingRef.current = true;
    
    const [h, s, l] = getValuesFromPosition(e.clientX, e.clientY);
    const newColor = hslToHex(h, s, l);
    setPickerColor(newColor);
  };
  
  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current) return;
    
    const [h, s, l] = getValuesFromPosition(e.clientX, e.clientY);
    const newColor = hslToHex(h, s, l);
    setPickerColor(newColor);
  };
  
  const handleCanvasMouseUp = () => {
    isDraggingRef.current = false;
  };
  
  // Handle hue change
  const handleHueChange = (value: number[]) => {
    const hue = value[0];
    const [, s, l] = hexToHSL(pickerColor);
    const newColor = hslToHex(hue, s, l);
    setPickerColor(newColor);
    drawColorSpectrum(hue);
  };
  
  // Apply color change
  const applyColorChange = () => {
    onChange(pickerColor);
    setIsOpen(false);
  };
  
  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    if (!value.startsWith('#')) {
      value = `#${value}`;
    }
    if (/^#([0-9A-F]{3}){1,2}$/i.test(value)) {
      setPickerColor(value);
      
      // Redraw canvas
      const [h] = hexToHSL(value);
      drawColorSpectrum(h);
    }
  };
  
  // Handle open/close
  useEffect(() => {
    if (isOpen) {
      const [h] = hexToHSL(color);
      setPickerColor(color);
      setTimeout(() => drawColorSpectrum(h), 50);
    }
  }, [isOpen, color]);
  
  // Handle outside click to close
  useEffect(() => {
    document.addEventListener('mouseup', handleCanvasMouseUp);
    return () => {
      document.removeEventListener('mouseup', handleCanvasMouseUp);
    };
  }, []);
  
  // Get hue for slider
  const [hue] = hexToHSL(pickerColor);
  
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <div className="flex items-center gap-2">
        {label && <Label className="text-xs">{label}</Label>}
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            className="h-8 w-8 p-0 border flex justify-center items-center"
          >
            <div 
              className={`w-6 h-6 rounded-sm ${isStroke ? 'border-2 border-black' : ''}`}
              style={{ 
                backgroundColor: isStroke && color === 'transparent' ? 'white' : color,
                backgroundImage: isStroke && color === 'transparent' 
                  ? 'linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc), linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc)'
                  : 'none',
                backgroundSize: '6px 6px',
                backgroundPosition: '0 0, 3px 3px'
              }}
            />
          </Button>
        </PopoverTrigger>
      </div>
      
      <PopoverContent className="w-64">
        <div className="space-y-3">
          <div className="relative">
            <canvas 
              ref={canvasRef} 
              width={200} 
              height={150} 
              className="w-full h-[150px] rounded cursor-crosshair border"
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
            />
          </div>
          
          <div className="space-y-1">
            <Label className="text-xs">Hue</Label>
            <Slider 
              min={0} 
              max={360} 
              step={1} 
              value={[hue]} 
              onValueChange={handleHueChange}
              className="[&>.slot>.range]:bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <div className="relative">
              <Input 
                value={pickerColor.replace('#', '')} 
                onChange={handleInputChange} 
                maxLength={6}
                className="pl-5"
              />
              <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500">#</span>
            </div>
            
            {isStroke && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setPickerColor('transparent');
                  onChange('transparent');
                  setIsOpen(false);
                }}
              >
                Clear
              </Button>
            )}
            
            <Button 
              className="flex-1"
              onClick={applyColorChange}
            >
              Apply
            </Button>
          </div>
          
          <div 
            className="h-6 rounded-md"
            style={{ backgroundColor: pickerColor }}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
