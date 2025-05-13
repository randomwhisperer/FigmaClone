import React from 'react';
import { ElementType, type Element } from "@shared/schema";

// Draw shapes as React components
export function drawShape(element: Element) {
  switch (element.type) {
    case ElementType.RECTANGLE:
      return (
        <div
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: element.fill === 'transparent' ? 'transparent' : element.fill,
            opacity: element.opacity || 1,
            borderRadius: ((element.properties as any)?.cornerRadius || 0) + 'px',
            border: element.stroke !== 'transparent' ? `${element.strokeWidth}px solid ${element.stroke}` : 'none',
            boxSizing: 'border-box'
          }}
        />
      );
      
    case ElementType.ELLIPSE:
      return (
        <div
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: element.fill === 'transparent' ? 'transparent' : element.fill,
            opacity: element.opacity || 1,
            borderRadius: '50%',
            border: element.stroke !== 'transparent' ? `${element.strokeWidth}px solid ${element.stroke}` : 'none',
            boxSizing: 'border-box'
          }}
        />
      );
      
    case ElementType.LINE:
      // Calculate the angle and length of the line
      const length = Math.sqrt(Math.pow(element.width, 2) + Math.pow(element.height, 2));
      const angle = Math.atan2(element.height, element.width) * (180 / Math.PI);
      
      return (
        <div
          style={{
            position: 'absolute',
            width: `${length}px`,
            height: `${element.strokeWidth}px`,
            backgroundColor: element.stroke === 'transparent' ? 'transparent' : element.stroke,
            opacity: element.opacity || 1,
            transformOrigin: 'left center',
            transform: `rotate(${angle}deg)`,
            top: '50%',
            marginTop: `-${element.strokeWidth / 2}px`
          }}
        />
      );
      
    case ElementType.TEXT:
      return (
        <div
          style={{
            width: '100%',
            height: '100%',
            color: element.fill === 'transparent' ? 'black' : element.fill,
            opacity: element.opacity || 1,
            fontSize: Math.min(element.height, 24),
            fontFamily: 'sans-serif',
            display: 'flex',
            alignItems: 'center',
            userSelect: 'none',
            overflow: 'hidden'
          }}
        >
          {element.content || 'Text'}
        </div>
      );
      
    default:
      return null;
  }
}

// Check if a point is inside a shape
export function isPointInShape(element: Element, x: number, y: number): boolean {
  // Check if point is within the bounding box
  if (
    x < element.x ||
    y < element.y ||
    x > element.x + element.width ||
    y > element.y + element.height
  ) {
    return false;
  }
  
  // For ellipse, check if point is inside the ellipse using the ellipse equation
  if (element.type === ElementType.ELLIPSE) {
    const centerX = element.x + element.width / 2;
    const centerY = element.y + element.height / 2;
    const radiusX = element.width / 2;
    const radiusY = element.height / 2;
    
    // Apply the ellipse equation: (x-h)²/a² + (y-k)²/b² <= 1
    const normalizedX = (x - centerX) / radiusX;
    const normalizedY = (y - centerY) / radiusY;
    return (normalizedX * normalizedX + normalizedY * normalizedY) <= 1;
  }
  
  // For lines, check if point is close to the line
  if (element.type === ElementType.LINE) {
    const lineEndX = element.x + element.width;
    const lineEndY = element.y + element.height;
    
    // Calculate distance from point to line
    const lengthSquared = Math.pow(element.width, 2) + Math.pow(element.height, 2);
    if (lengthSquared === 0) return false; // Line is a point
    
    // Calculate t parameter of closest point
    const t = Math.max(0, Math.min(1, ((x - element.x) * element.width + (y - element.y) * element.height) / lengthSquared));
    
    // Calculate closest point on the line
    const closestX = element.x + t * element.width;
    const closestY = element.y + t * element.height;
    
    // Calculate distance from point to closest point on line
    const distance = Math.sqrt(Math.pow(x - closestX, 2) + Math.pow(y - closestY, 2));
    
    // Check if distance is within a threshold (e.g. half stroke width or minimum 5px)
    const threshold = Math.max(element.strokeWidth / 2, 5);
    return distance <= threshold;
  }
  
  // For rectangle and text, just return true (already checked bounding box)
  return true;
}

// Helper function to get element name
export function getElementDisplayName(element: Element): string {
  switch (element.type) {
    case ElementType.RECTANGLE:
      return 'Rectangle';
    case ElementType.ELLIPSE:
      return 'Circle';
    case ElementType.LINE:
      return 'Line';
    case ElementType.TEXT:
      return `Text "${element.content || 'Text'}"`;
    default:
      return 'Element';
  }
}