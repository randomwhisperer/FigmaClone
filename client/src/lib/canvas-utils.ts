import { type Element, ElementType } from "@shared/schema";

// Generate a unique ID for elements
export function generateId(): number {
  return Math.floor(Math.random() * 1000000);
}

// Export the canvas as an image
export function exportCanvasAsImage(
  elements: Element[],
  format: 'png' | 'jpeg' = 'png',
  quality: number = 0.9,
  scale: number = 1
): Promise<string> {
  return new Promise((resolve, reject) => {
    // Create a canvas element
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }
    
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
    
    // Draw white background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);
    
    // Sort elements by z-index
    const sortedElements = [...elements].sort((a, b) => a.zIndex - b.zIndex);
    
    // Draw each element
    sortedElements.forEach(element => {
      // Save context state
      ctx.save();
      
      // Apply scale and translate to position
      ctx.scale(scale, scale);
      ctx.translate(-minX + element.x, -minY + element.y);
      
      // Apply element opacity
      ctx.globalAlpha = element.opacity || 1;
      
      // Draw the element based on its type
      switch (element.type) {
        case ElementType.RECTANGLE:
          if (element.fill && element.fill !== 'transparent') {
            ctx.fillStyle = element.fill;
            ctx.fillRect(0, 0, element.width, element.height);
          }
          
          if (element.stroke && element.stroke !== 'transparent' && element.strokeWidth > 0) {
            ctx.strokeStyle = element.stroke;
            ctx.lineWidth = element.strokeWidth;
            ctx.strokeRect(0, 0, element.width, element.height);
          }
          break;
          
        case ElementType.ELLIPSE:
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
          break;
          
        case ElementType.LINE:
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(element.width, element.height);
          
          if (element.stroke && element.stroke !== 'transparent' && element.strokeWidth > 0) {
            ctx.strokeStyle = element.stroke;
            ctx.lineWidth = element.strokeWidth;
            ctx.stroke();
          }
          break;
          
        case ElementType.TEXT:
          if (element.fill && element.fill !== 'transparent') {
            ctx.fillStyle = element.fill;
            ctx.font = '16px sans-serif';
            ctx.fillText(element.content || 'Text', 0, 16);
          }
          break;
      }
      
      // Restore context state
      ctx.restore();
    });
    
    // Convert canvas to data URL
    try {
      const dataUrl = canvas.toDataURL(`image/${format}`, quality);
      resolve(dataUrl);
    } catch (error) {
      reject(error);
    }
  });
}

// Apply a rotation transformation to coordinates
export function rotatePoint(
  x: number, 
  y: number, 
  centerX: number, 
  centerY: number, 
  angleDegrees: number
): { x: number; y: number } {
  // Convert angle to radians
  const angleRadians = (angleDegrees * Math.PI) / 180;
  
  // Translate point to origin
  const translatedX = x - centerX;
  const translatedY = y - centerY;
  
  // Apply rotation
  const rotatedX = translatedX * Math.cos(angleRadians) - translatedY * Math.sin(angleRadians);
  const rotatedY = translatedX * Math.sin(angleRadians) + translatedY * Math.cos(angleRadians);
  
  // Translate back
  return {
    x: rotatedX + centerX,
    y: rotatedY + centerY
  };
}

// Transform element coordinates and dimensions
export interface TransformOptions {
  translateX?: number;
  translateY?: number;
  scaleX?: number;
  scaleY?: number;
  rotation?: number;
}

export function transformElement(element: Element, options: TransformOptions): Element {
  const result = { ...element };
  
  // Apply translation
  if (options.translateX !== undefined) {
    result.x += options.translateX;
  }
  
  if (options.translateY !== undefined) {
    result.y += options.translateY;
  }
  
  // Apply scaling
  if (options.scaleX !== undefined) {
    result.width *= options.scaleX;
  }
  
  if (options.scaleY !== undefined) {
    result.height *= options.scaleY;
  }
  
  // Apply rotation
  if (options.rotation !== undefined) {
    result.rotation = (result.rotation || 0) + options.rotation;
  }
  
  return result;
}
