import { useState, useRef, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download } from "lucide-react";
import { useDesignStore } from "@/store";
import { drawShape } from "@/lib/shapes";

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ExportDialog({ open, onOpenChange }: ExportDialogProps) {
  const { elements, documentName } = useDesignStore();
  const [format, setFormat] = useState<string>("png");
  const [quality, setQuality] = useState<number>(90);
  const [filename, setFilename] = useState<string>(documentName);
  const [scale, setScale] = useState<number>(1);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Update filename when document name changes
  useEffect(() => {
    setFilename(documentName);
  }, [documentName]);
  
  // Generate preview when dialog opens
  useEffect(() => {
    if (open) {
      generatePreview();
    }
  }, [open, elements, format, scale]);
  
  // Generate the preview image
  const generatePreview = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Calculate boundaries
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    
    elements.forEach(element => {
      minX = Math.min(minX, element.x);
      minY = Math.min(minY, element.y);
      maxX = Math.max(maxX, element.x + element.width);
      maxY = Math.max(maxY, element.y + element.height);
    });
    
    // Apply some padding
    const padding = 20;
    minX = Math.max(0, minX - padding);
    minY = Math.max(0, minY - padding);
    maxX = maxX + padding;
    maxY = maxY + padding;
    
    // Set canvas size
    const width = (maxX - minX) * scale;
    const height = (maxY - minY) * scale;
    canvas.width = width;
    canvas.height = height;
    
    // Clear the canvas with white background
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, width, height);
    
    // Translate to adjust for the crop
    ctx.translate(-minX * scale, -minY * scale);
    ctx.scale(scale, scale);
    
    // Sort elements by z-index
    const sortedElements = [...elements].sort((a, b) => a.zIndex - b.zIndex);
    
    // Draw each element
    sortedElements.forEach(element => {
      ctx.save();
      
      // Set position
      ctx.translate(element.x + element.width / 2, element.y + element.height / 2);
      
      // Apply rotation if any
      if (element.rotation) {
        ctx.rotate((element.rotation * Math.PI) / 180);
      }
      
      // Move back to top-left
      ctx.translate(-element.width / 2, -element.height / 2);
      
      // Apply opacity
      ctx.globalAlpha = element.opacity || 1;
      
      // Draw the shapes directly on canvas
      if (element.type === 'rectangle') {
        // Fill
        if (element.fill && element.fill !== 'transparent') {
          ctx.fillStyle = element.fill;
          const cornerRadius = ((element.properties as any)?.cornerRadius || 0);
          
          if (cornerRadius > 0) {
            const radius = Math.min(cornerRadius, element.width / 2, element.height / 2);
            ctx.beginPath();
            ctx.moveTo(radius, 0);
            ctx.lineTo(element.width - radius, 0);
            ctx.quadraticCurveTo(element.width, 0, element.width, radius);
            ctx.lineTo(element.width, element.height - radius);
            ctx.quadraticCurveTo(element.width, element.height, element.width - radius, element.height);
            ctx.lineTo(radius, element.height);
            ctx.quadraticCurveTo(0, element.height, 0, element.height - radius);
            ctx.lineTo(0, radius);
            ctx.quadraticCurveTo(0, 0, radius, 0);
            ctx.closePath();
            ctx.fill();
          } else {
            ctx.fillRect(0, 0, element.width, element.height);
          }
        }
        
        // Stroke
        if (element.stroke && element.stroke !== 'transparent' && element.strokeWidth > 0) {
          ctx.strokeStyle = element.stroke;
          ctx.lineWidth = element.strokeWidth;
          const cornerRadius = ((element.properties as any)?.cornerRadius || 0);
          
          if (cornerRadius > 0) {
            const radius = Math.min(cornerRadius, element.width / 2, element.height / 2);
            ctx.beginPath();
            ctx.moveTo(radius, 0);
            ctx.lineTo(element.width - radius, 0);
            ctx.quadraticCurveTo(element.width, 0, element.width, radius);
            ctx.lineTo(element.width, element.height - radius);
            ctx.quadraticCurveTo(element.width, element.height, element.width - radius, element.height);
            ctx.lineTo(radius, element.height);
            ctx.quadraticCurveTo(0, element.height, 0, element.height - radius);
            ctx.lineTo(0, radius);
            ctx.quadraticCurveTo(0, 0, radius, 0);
            ctx.closePath();
            ctx.stroke();
          } else {
            ctx.strokeRect(0, 0, element.width, element.height);
          }
        }
      } else if (element.type === 'ellipse') {
        const radiusX = element.width / 2;
        const radiusY = element.height / 2;
        
        ctx.beginPath();
        ctx.ellipse(radiusX, radiusY, radiusX, radiusY, 0, 0, 2 * Math.PI);
        
        if (element.fill && element.fill !== 'transparent') {
          ctx.fillStyle = element.fill;
          ctx.fill();
        }
        
        if (element.stroke && element.stroke !== 'transparent' && element.strokeWidth > 0) {
          ctx.strokeStyle = element.stroke;
          ctx.lineWidth = element.strokeWidth;
          ctx.stroke();
        }
      } else if (element.type === 'line') {
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(element.width, element.height);
        
        if (element.stroke && element.stroke !== 'transparent' && element.strokeWidth > 0) {
          ctx.strokeStyle = element.stroke;
          ctx.lineWidth = element.strokeWidth;
          ctx.stroke();
        }
      } else if (element.type === 'text') {
        if (element.fill && element.fill !== 'transparent') {
          const fontSize = Math.min(element.height, 24);
          ctx.fillStyle = element.fill;
          ctx.font = `${fontSize}px sans-serif`;
          ctx.textBaseline = 'top';
          ctx.fillText(element.content || 'Text', 0, 0);
        }
      }
      
      ctx.restore();
    });
    
    // Generate preview URL
    const dataUrl = canvas.toDataURL(`image/${format}`, quality / 100);
    setPreviewUrl(dataUrl);
  };
  
  // Handle export button click
  const handleExport = () => {
    // Create download link
    const link = document.createElement('a');
    link.href = previewUrl;
    link.download = `${filename}.${format}`;
    link.click();
    
    // Close dialog
    onOpenChange(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Export Design</DialogTitle>
          <DialogDescription>
            Export your design as an image file.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="bg-gray-100 p-2 rounded-md">
            <canvas ref={canvasRef} className="hidden" />
            <div className="flex justify-center">
              <img 
                src={previewUrl} 
                alt="Preview" 
                className="max-w-full max-h-[200px] rounded border border-gray-200 bg-white shadow-sm" 
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label htmlFor="format">Format</Label>
              <Select value={format} onValueChange={setFormat}>
                <SelectTrigger id="format">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="png">PNG</SelectItem>
                  <SelectItem value="jpeg">JPEG</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="scale">Scale</Label>
              <Select 
                value={scale.toString()} 
                onValueChange={(val) => setScale(parseFloat(val))}
              >
                <SelectTrigger id="scale">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0.5">0.5x</SelectItem>
                  <SelectItem value="1">1x</SelectItem>
                  <SelectItem value="2">2x</SelectItem>
                  <SelectItem value="3">3x</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="filename">Filename</Label>
            <Input 
              id="filename" 
              value={filename} 
              onChange={(e) => setFilename(e.target.value)} 
            />
          </div>
          
          {format === 'jpeg' && (
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="quality">Quality</Label>
                <span className="text-sm text-gray-500">{quality}%</span>
              </div>
              <Input
                id="quality"
                type="range"
                min={10}
                max={100}
                step={5}
                value={quality}
                onChange={(e) => setQuality(parseInt(e.target.value))}
              />
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleExport} className="gap-1">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
