import { ElementType, type Element } from "@shared/schema";

// Helper types for shape properties
export interface ShapeProperties {
  cornerRadius?: number;
  [key: string]: any;
}

// Forward declaration of the drawShape function (implemented in shapes.tsx)
// This is just for the TypeScript type system
export function drawShape(element: Element): React.ReactNode {
  return null; // This implementation is never used - real implementation is in shapes.tsx
}

// Utility function to extract corner radius from shape properties
export function getCornerRadius(element: Element): number {
  if (element.type !== ElementType.RECTANGLE) return 0;
  
  const properties = element.properties as ShapeProperties;
  return properties?.cornerRadius || 0;
}

// Check if a point is inside a shape
export function isPointInShape(element: Element, x: number, y: number): boolean {
  // If the element has rotation, we need to account for that
  if (element.rotation && element.rotation !== 0) {
    // Transform the point to the element's coordinate system
    const centerX = element.x + element.width / 2;
    const centerY = element.y + element.height / 2;
    
    // Convert rotation to radians
    const radians = (element.rotation * Math.PI) / 180;
    const cos = Math.cos(-radians);
    const sin = Math.sin(-radians);
    
    // Translate point to origin
    const relativeX = x - centerX;
    const relativeY = y - centerY;
    
    // Rotate point
    const rotatedX = relativeX * cos - relativeY * sin;
    const rotatedY = relativeX * sin + relativeY * cos;
    
    // Translate point back
    const newX = rotatedX + centerX;
    const newY = rotatedY + centerY;
    
    // Use the rotated point for hit testing
    return isPointInUnrotatedShape(element, newX, newY);
  }
  
  return isPointInUnrotatedShape(element, x, y);
}

// Check if a point is inside a shape without considering rotation
function isPointInUnrotatedShape(element: Element, x: number, y: number): boolean {
  // Check if point is within the bounding box
  if (
    x < element.x ||
    y < element.y ||
    x > element.x + element.width ||
    y > element.y + element.height
  ) {
    return false;
  }
  
  // For rectangles, check if the point is inside considering corner radius
  if (element.type === ElementType.RECTANGLE) {
    const cornerRadius = getCornerRadius(element);
    
    if (cornerRadius > 0) {
      const maxRadius = Math.min(element.width / 2, element.height / 2, cornerRadius);
      
      // Check if point is in corner regions
      const isInCornerRegion = (
        (x < element.x + maxRadius && y < element.y + maxRadius) || // top-left
        (x > element.x + element.width - maxRadius && y < element.y + maxRadius) || // top-right
        (x < element.x + maxRadius && y > element.y + element.height - maxRadius) || // bottom-left
        (x > element.x + element.width - maxRadius && y > element.y + element.height - maxRadius) // bottom-right
      );
      
      if (isInCornerRegion) {
        // Calculate nearest corner
        let cornerX, cornerY;
        
        if (x < element.x + element.width / 2) {
          cornerX = element.x + maxRadius;
        } else {
          cornerX = element.x + element.width - maxRadius;
        }
        
        if (y < element.y + element.height / 2) {
          cornerY = element.y + maxRadius;
        } else {
          cornerY = element.y + element.height - maxRadius;
        }
        
        // Check if point is inside the rounded corner using distance formula
        const distance = Math.sqrt(Math.pow(x - cornerX, 2) + Math.pow(y - cornerY, 2));
        return distance <= maxRadius;
      }
      
      return true; // In the non-corner region
    }
    
    return true; // Regular rectangle
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
  
  // For text, just return true (already checked bounding box)
  return true;
}

// Calculate the dimensions of a bounding box that contains a rotated element
export function getRotatedBoundingBox(element: Element): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  if (!element.rotation || element.rotation === 0) {
    return {
      x: element.x,
      y: element.y,
      width: element.width,
      height: element.height
    };
  }
  
  // Get the center of the element
  const centerX = element.x + element.width / 2;
  const centerY = element.y + element.height / 2;
  
  // Calculate the corners of the element
  const corners = [
    { x: element.x, y: element.y },
    { x: element.x + element.width, y: element.y },
    { x: element.x + element.width, y: element.y + element.height },
    { x: element.x, y: element.y + element.height }
  ];
  
  // Convert rotation to radians
  const radians = (element.rotation * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  
  // Rotate each corner
  const rotatedCorners = corners.map(corner => {
    // Translate to origin
    const x = corner.x - centerX;
    const y = corner.y - centerY;
    
    // Rotate
    const rotatedX = x * cos - y * sin;
    const rotatedY = x * sin + y * cos;
    
    // Translate back
    return {
      x: rotatedX + centerX,
      y: rotatedY + centerY
    };
  });
  
  // Find min and max coordinates
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  
  rotatedCorners.forEach(corner => {
    minX = Math.min(minX, corner.x);
    minY = Math.min(minY, corner.y);
    maxX = Math.max(maxX, corner.x);
    maxY = Math.max(maxY, corner.y);
  });
  
  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  };
}

// Get the visible bounds of all elements
export function getVisibleBounds(elements: Element[]): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  if (elements.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }
  
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  
  elements.forEach(element => {
    const box = getRotatedBoundingBox(element);
    
    minX = Math.min(minX, box.x);
    minY = Math.min(minY, box.y);
    maxX = Math.max(maxX, box.x + box.width);
    maxY = Math.max(maxY, box.y + box.height);
  });
  
  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  };
}

// Get the transform string for CSS transform property
export function getTransformString(element: Element): string {
  const transforms: string[] = [];
  
  if (element.rotation && element.rotation !== 0) {
    transforms.push(`rotate(${element.rotation}deg)`);
  }
  
  return transforms.join(' ');
}

// Convert element properties to CSS properties
export function getElementStyles(element: Element): React.CSSProperties {
  const styles: React.CSSProperties = {
    position: 'absolute',
    left: `${element.x}px`,
    top: `${element.y}px`,
    width: `${element.width}px`,
    height: `${element.height}px`,
    opacity: element.opacity || 1
  };
  
  if (element.rotation && element.rotation !== 0) {
    styles.transform = getTransformString(element);
    styles.transformOrigin = 'center';
  }
  
  if (element.type === ElementType.RECTANGLE) {
    const cornerRadius = getCornerRadius(element);
    if (cornerRadius > 0) {
      styles.borderRadius = `${cornerRadius}px`;
    }
    
    if (element.fill && element.fill !== 'transparent') {
      styles.backgroundColor = element.fill;
    }
    
    if (element.stroke && element.stroke !== 'transparent' && element.strokeWidth > 0) {
      styles.border = `${element.strokeWidth}px solid ${element.stroke}`;
      styles.boxSizing = 'border-box';
    }
  } else if (element.type === ElementType.ELLIPSE) {
    styles.borderRadius = '50%';
    
    if (element.fill && element.fill !== 'transparent') {
      styles.backgroundColor = element.fill;
    }
    
    if (element.stroke && element.stroke !== 'transparent' && element.strokeWidth > 0) {
      styles.border = `${element.strokeWidth}px solid ${element.stroke}`;
      styles.boxSizing = 'border-box';
    }
  } else if (element.type === ElementType.TEXT) {
    styles.color = element.fill && element.fill !== 'transparent' ? element.fill : 'black';
    styles.fontFamily = 'sans-serif';
    styles.fontSize = `${Math.min(element.height, 24)}px`;
    styles.display = 'flex';
    styles.alignItems = 'center';
    styles.userSelect = 'none';
    styles.overflow = 'hidden';
  }
  
  return styles;
}

// Helper function to get element type name for display
export function getElementTypeName(type: string): string {
  switch (type) {
    case ElementType.RECTANGLE:
      return 'Rectangle';
    case ElementType.ELLIPSE:
      return 'Circle';
    case ElementType.LINE:
      return 'Line';
    case ElementType.TEXT:
      return 'Text';
    default:
      return 'Element';
  }
}

// Helper function for handling line elements
export function getLineStyles(element: Element): React.CSSProperties {
  // Calculate the angle and length of the line
  const length = Math.sqrt(Math.pow(element.width, 2) + Math.pow(element.height, 2));
  const angle = Math.atan2(element.height, element.width) * (180 / Math.PI);
  
  return {
    position: 'absolute',
    width: `${length}px`,
    height: `${element.strokeWidth}px`,
    backgroundColor: element.stroke === 'transparent' ? 'transparent' : element.stroke,
    opacity: element.opacity || 1,
    transformOrigin: 'left center',
    transform: `rotate(${angle}deg)`,
    top: '50%',
    marginTop: `-${element.strokeWidth / 2}px`
  };
}

// Check if two elements intersect
export function doElementsIntersect(element1: Element, element2: Element): boolean {
  const box1 = getRotatedBoundingBox(element1);
  const box2 = getRotatedBoundingBox(element2);
  
  return (
    box1.x < box2.x + box2.width &&
    box1.x + box1.width > box2.x &&
    box1.y < box2.y + box2.height &&
    box1.y + box1.height > box2.y
  );
}

// Snapping helpers
export function snapToGrid(value: number, gridSize: number): number {
  return Math.round(value / gridSize) * gridSize;
}

export function snapToObjects(
  value: number, 
  direction: 'x' | 'y', 
  element: Element, 
  otherElements: Element[], 
  threshold: number = 5
): number {
  let snappedValue = value;
  let minDistance = threshold;
  
  // Element edges
  const edges = direction === 'x' 
    ? [value, value + element.width] 
    : [value, value + element.height];
  
  // Element center
  const center = direction === 'x'
    ? value + element.width / 2
    : value + element.height / 2;
  
  otherElements.forEach(other => {
    if (other.id === element.id) return;
    
    // Other element edges
    const otherEdges = direction === 'x'
      ? [other.x, other.x + other.width]
      : [other.y, other.y + other.height];
    
    // Other element center
    const otherCenter = direction === 'x'
      ? other.x + other.width / 2
      : other.y + other.height / 2;
    
    // Check edges to edges
    edges.forEach(edge => {
      otherEdges.forEach(otherEdge => {
        const distance = Math.abs(edge - otherEdge);
        if (distance < minDistance) {
          minDistance = distance;
          snappedValue = value + (otherEdge - edge);
        }
      });
    });
    
    // Check center to center
    const centerDistance = Math.abs(center - otherCenter);
    if (centerDistance < minDistance) {
      minDistance = centerDistance;
      snappedValue = value + (otherCenter - center);
    }
  });
  
  return snappedValue;
}
