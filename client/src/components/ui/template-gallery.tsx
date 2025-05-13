import React, { useState } from "react";
import { motion } from "framer-motion";
import { useAppDispatch } from "@/store/hooks";
import { setElements, setDocumentName } from "@/store/slices/designSlice";
import { useToast } from "@/hooks/use-toast";
import { ElementType } from "@shared/schema";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Filter,
  LayoutTemplate,
  Laptop,
  Smartphone,
  Table2,
  MonitorSmartphone,
  Star,
  Heart,
  Clock,
  Calendar,
  UserCircle,
  ChevronDown,
  CheckCircle2,
  ArrowDownToLine
} from "lucide-react";

interface TemplateGalleryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Template interface
interface Template {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  category: string[];
  device: 'desktop' | 'mobile' | 'tablet' | 'responsive';
  premium: boolean;
  new: boolean;
  elements: any[];
}

// Sample templates data
const TEMPLATES: Template[] = [
  {
    id: "landing-page",
    name: "Modern Landing Page",
    description: "A clean landing page template with hero section, features, and call-to-action",
    thumbnail: "landing-template",
    category: ["marketing", "website"],
    device: "responsive",
    premium: false,
    new: true,
    elements: [
      {
        id: 1,
        type: ElementType.RECTANGLE,
        x: 50,
        y: 50,
        width: 700,
        height: 500,
        rotation: 0,
        fill: "#FFFFFF",
        stroke: "#EEEEEE",
        strokeWidth: 1,
        opacity: 1,
        zIndex: 1,
        designId: 1,
      },
      {
        id: 2,
        type: ElementType.RECTANGLE,
        x: 100,
        y: 100,
        width: 600,
        height: 100,
        rotation: 0,
        fill: "#F8F9FA",
        stroke: "",
        strokeWidth: 0,
        opacity: 1,
        zIndex: 2,
        designId: 1,
        properties: {
          text: "Welcome to Your Brand",
          fontSize: 32,
          fontWeight: "bold",
          textAlign: "center"
        }
      },
      {
        id: 3,
        type: ElementType.RECTANGLE,
        x: 200,
        y: 220,
        width: 400,
        height: 60,
        rotation: 0,
        fill: "#F8F9FA",
        stroke: "",
        strokeWidth: 0,
        opacity: 1,
        zIndex: 2,
        designId: 1,
        properties: {
          text: "Your compelling subtitle goes here. Engage your visitors with a clear value proposition.",
          fontSize: 16,
          textAlign: "center"
        }
      },
      {
        id: 4,
        type: ElementType.RECTANGLE,
        x: 300,
        y: 320,
        width: 200,
        height: 50,
        rotation: 0,
        fill: "#4F46E5",
        stroke: "#4338CA",
        strokeWidth: 0,
        opacity: 1,
        zIndex: 3,
        designId: 1,
        properties: {
          text: "Get Started",
          fontSize: 16,
          fontWeight: "bold",
          textColor: "#FFFFFF",
          textAlign: "center",
          cornerRadius: 8
        }
      },
    ]
  },
  {
    id: "dashboard",
    name: "Analytics Dashboard",
    description: "Modern dashboard layout with charts, stats, and data visualizations",
    thumbnail: "dashboard-template",
    category: ["admin", "dashboard"],
    device: "desktop",
    premium: true,
    new: false,
    elements: [
      {
        id: 1,
        type: ElementType.RECTANGLE,
        x: 50,
        y: 50,
        width: 900,
        height: 600,
        rotation: 0,
        fill: "#F9FAFB",
        stroke: "#E5E7EB",
        strokeWidth: 1,
        opacity: 1,
        zIndex: 1,
        designId: 1,
      },
      {
        id: 2,
        type: ElementType.RECTANGLE,
        x: 50,
        y: 50,
        width: 220,
        height: 600,
        rotation: 0,
        fill: "#1E293B",
        stroke: "",
        strokeWidth: 0,
        opacity: 1,
        zIndex: 2,
        designId: 1,
      },
      {
        id: 3,
        type: ElementType.RECTANGLE,
        x: 270,
        y: 50,
        width: 680,
        height: 70,
        rotation: 0,
        fill: "#FFFFFF",
        stroke: "#E5E7EB",
        strokeWidth: 1,
        opacity: 1,
        zIndex: 2,
        designId: 1,
      },
      {
        id: 4,
        type: ElementType.RECTANGLE,
        x: 300,
        y: 150,
        width: 180,
        height: 100,
        rotation: 0,
        fill: "#FFFFFF",
        stroke: "#E5E7EB",
        strokeWidth: 1,
        opacity: 1,
        zIndex: 3,
        designId: 1,
        properties: {
          cornerRadius: 8
        }
      },
      {
        id: 5,
        type: ElementType.RECTANGLE,
        x: 520,
        y: 150,
        width: 180,
        height: 100,
        rotation: 0,
        fill: "#FFFFFF",
        stroke: "#E5E7EB",
        strokeWidth: 1,
        opacity: 1,
        zIndex: 3,
        designId: 1,
        properties: {
          cornerRadius: 8
        }
      },
      {
        id: 6,
        type: ElementType.RECTANGLE,
        x: 740,
        y: 150,
        width: 180,
        height: 100,
        rotation: 0,
        fill: "#FFFFFF",
        stroke: "#E5E7EB",
        strokeWidth: 1,
        opacity: 1,
        zIndex: 3,
        designId: 1,
        properties: {
          cornerRadius: 8
        }
      },
      {
        id: 7,
        type: ElementType.RECTANGLE,
        x: 300,
        y: 280,
        width: 620,
        height: 340,
        rotation: 0,
        fill: "#FFFFFF",
        stroke: "#E5E7EB",
        strokeWidth: 1,
        opacity: 1,
        zIndex: 2,
        designId: 1,
        properties: {
          cornerRadius: 8
        }
      },
    ]
  },
  {
    id: "mobile-app",
    name: "Mobile App UI",
    description: "Clean mobile app UI design with navigation and common components",
    thumbnail: "mobile-template",
    category: ["mobile", "app"],
    device: "mobile",
    premium: false,
    new: false,
    elements: [
      {
        id: 1,
        type: ElementType.RECTANGLE,
        x: 50,
        y: 50,
        width: 320,
        height: 640,
        rotation: 0,
        fill: "#F9FAFB",
        stroke: "#E5E7EB",
        strokeWidth: 1,
        opacity: 1,
        zIndex: 1,
        designId: 1,
        properties: {
          cornerRadius: 24
        }
      },
      {
        id: 2,
        type: ElementType.RECTANGLE,
        x: 50,
        y: 50,
        width: 320,
        height: 60,
        rotation: 0,
        fill: "#FFFFFF",
        stroke: "#E5E7EB",
        strokeWidth: 0,
        opacity: 1,
        zIndex: 2,
        designId: 1,
      },
      {
        id: 3,
        type: ElementType.RECTANGLE,
        x: 50,
        y: 630,
        width: 320,
        height: 60,
        rotation: 0,
        fill: "#FFFFFF",
        stroke: "#E5E7EB",
        strokeWidth: 0,
        opacity: 1,
        zIndex: 2,
        designId: 1,
      },
      {
        id: 4,
        type: ElementType.RECTANGLE,
        x: 70,
        y: 130,
        width: 280,
        height: 120,
        rotation: 0,
        fill: "#FFFFFF",
        stroke: "#E5E7EB",
        strokeWidth: 1,
        opacity: 1,
        zIndex: 3,
        designId: 1,
        properties: {
          cornerRadius: 12
        }
      },
      {
        id: 5,
        type: ElementType.RECTANGLE,
        x: 70,
        y: 270,
        width: 280,
        height: 120,
        rotation: 0,
        fill: "#FFFFFF",
        stroke: "#E5E7EB",
        strokeWidth: 1,
        opacity: 1,
        zIndex: 3,
        designId: 1,
        properties: {
          cornerRadius: 12
        }
      },
      {
        id: 6,
        type: ElementType.RECTANGLE,
        x: 70,
        y: 410,
        width: 280,
        height: 120,
        rotation: 0,
        fill: "#FFFFFF",
        stroke: "#E5E7EB",
        strokeWidth: 1,
        opacity: 1,
        zIndex: 3,
        designId: 1,
        properties: {
          cornerRadius: 12
        }
      },
    ]
  },
  {
    id: "presentation",
    name: "Business Presentation",
    description: "Professional slides for business presentations with data points and clear sections",
    thumbnail: "presentation-template",
    category: ["presentation", "business"],
    device: "desktop",
    premium: true,
    new: true,
    elements: [
      {
        id: 1,
        type: ElementType.RECTANGLE,
        x: 50,
        y: 50,
        width: 800,
        height: 600,
        rotation: 0,
        fill: "#F8FAFC",
        stroke: "#E2E8F0",
        strokeWidth: 1,
        opacity: 1,
        zIndex: 1,
        designId: 1,
      },
      {
        id: 2,
        type: ElementType.RECTANGLE,
        x: 100,
        y: 100,
        width: 700,
        height: 120,
        rotation: 0,
        fill: "#0F172A",
        stroke: "",
        strokeWidth: 0,
        opacity: 1,
        zIndex: 2,
        designId: 1,
        properties: {
          text: "BUSINESS PRESENTATION",
          fontSize: 36,
          fontWeight: "bold",
          textColor: "#FFFFFF",
          textAlign: "center",
          cornerRadius: 8
        }
      },
      {
        id: 3,
        type: ElementType.RECTANGLE,
        x: 100,
        y: 250,
        width: 220,
        height: 300,
        rotation: 0,
        fill: "#F1F5F9",
        stroke: "#E2E8F0",
        strokeWidth: 1,
        opacity: 1,
        zIndex: 2,
        designId: 1,
        properties: {
          cornerRadius: 8
        }
      },
      {
        id: 4,
        type: ElementType.RECTANGLE,
        x: 340,
        y: 250,
        width: 220,
        height: 300,
        rotation: 0,
        fill: "#F1F5F9",
        stroke: "#E2E8F0",
        strokeWidth: 1,
        opacity: 1,
        zIndex: 2,
        designId: 1,
        properties: {
          cornerRadius: 8
        }
      },
      {
        id: 5,
        type: ElementType.RECTANGLE,
        x: 580,
        y: 250,
        width: 220,
        height: 300,
        rotation: 0,
        fill: "#F1F5F9",
        stroke: "#E2E8F0",
        strokeWidth: 1,
        opacity: 1,
        zIndex: 2,
        designId: 1,
        properties: {
          cornerRadius: 8
        }
      },
    ]
  },
  {
    id: "social-media",
    name: "Social Media Kit",
    description: "Multi-format social media templates optimized for different platforms",
    thumbnail: "social-template",
    category: ["marketing", "social-media"],
    device: "responsive",
    premium: false,
    new: false,
    elements: [
      {
        id: 1,
        type: ElementType.RECTANGLE,
        x: 50,
        y: 50,
        width: 1200,
        height: 628,
        rotation: 0,
        fill: "#4F46E5",
        stroke: "",
        strokeWidth: 0,
        opacity: 1,
        zIndex: 1,
        designId: 1,
      },
      {
        id: 2,
        type: ElementType.RECTANGLE,
        x: 450,
        y: 200,
        width: 400,
        height: 80,
        rotation: 0,
        fill: "#FFFFFF",
        stroke: "",
        strokeWidth: 0,
        opacity: 1,
        zIndex: 2,
        designId: 1,
        properties: {
          text: "BRAND HEADLINE",
          fontSize: 40,
          fontWeight: "bold",
          textAlign: "center"
        }
      },
      {
        id: 3,
        type: ElementType.RECTANGLE,
        x: 500,
        y: 300,
        width: 300,
        height: 50,
        rotation: 0,
        fill: "#FFFFFF",
        stroke: "",
        strokeWidth: 0,
        opacity: 0.9,
        zIndex: 2,
        designId: 1,
        properties: {
          text: "Your slogan goes here",
          fontSize: 20,
          textAlign: "center"
        }
      },
      {
        id: 4,
        type: ElementType.ELLIPSE,
        x: 600,
        y: 400,
        width: 100,
        height: 100,
        rotation: 0,
        fill: "#FFFFFF",
        stroke: "",
        strokeWidth: 0,
        opacity: 1,
        zIndex: 2,
        designId: 1,
      },
    ]
  },
  {
    id: "ecommerce",
    name: "eCommerce Product Page",
    description: "Detailed product page layout with images, description, and call-to-action",
    thumbnail: "ecommerce-template",
    category: ["ecommerce", "website"],
    device: "responsive",
    premium: true,
    new: false,
    elements: [
      {
        id: 1,
        type: ElementType.RECTANGLE,
        x: 50,
        y: 50,
        width: 800,
        height: 800,
        rotation: 0,
        fill: "#FFFFFF",
        stroke: "#E5E7EB",
        strokeWidth: 1,
        opacity: 1,
        zIndex: 1,
        designId: 1,
      },
      {
        id: 2,
        type: ElementType.RECTANGLE,
        x: 50,
        y: 50,
        width: 800,
        height: 60,
        rotation: 0,
        fill: "#F9FAFB",
        stroke: "#E5E7EB",
        strokeWidth: 1,
        opacity: 1,
        zIndex: 2,
        designId: 1,
      },
      {
        id: 3,
        type: ElementType.RECTANGLE,
        x: 80,
        y: 150,
        width: 380,
        height: 380,
        rotation: 0,
        fill: "#F3F4F6",
        stroke: "#E5E7EB",
        strokeWidth: 1,
        opacity: 1,
        zIndex: 2,
        designId: 1,
      },
      {
        id: 4,
        type: ElementType.RECTANGLE,
        x: 500,
        y: 150,
        width: 300,
        height: 50,
        rotation: 0,
        fill: "#F9FAFB",
        stroke: "",
        strokeWidth: 0,
        opacity: 1,
        zIndex: 2,
        designId: 1,
        properties: {
          text: "Product Name",
          fontSize: 24,
          fontWeight: "bold",
        }
      },
      {
        id: 5,
        type: ElementType.RECTANGLE,
        x: 500,
        y: 210,
        width: 300,
        height: 30,
        rotation: 0,
        fill: "#F9FAFB",
        stroke: "",
        strokeWidth: 0,
        opacity: 1,
        zIndex: 2,
        designId: 1,
        properties: {
          text: "$99.99",
          fontSize: 18,
          fontWeight: "bold",
          textColor: "#4F46E5"
        }
      },
      {
        id: 6,
        type: ElementType.RECTANGLE,
        x: 500,
        y: 260,
        width: 300,
        height: 100,
        rotation: 0,
        fill: "#F9FAFB",
        stroke: "",
        strokeWidth: 0,
        opacity: 1,
        zIndex: 2,
        designId: 1,
        properties: {
          text: "Product description text goes here with all the details about the features and benefits.",
          fontSize: 14,
        }
      },
      {
        id: 7,
        type: ElementType.RECTANGLE,
        x: 500,
        y: 400,
        width: 200,
        height: 50,
        rotation: 0,
        fill: "#4F46E5",
        stroke: "",
        strokeWidth: 0,
        opacity: 1,
        zIndex: 3,
        designId: 1,
        properties: {
          text: "Add to Cart",
          fontSize: 16,
          fontWeight: "bold",
          textColor: "#FFFFFF",
          textAlign: "center",
          cornerRadius: 8
        }
      },
    ]
  },
];

export function TemplateGallery({ open, onOpenChange }: TemplateGalleryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeDevice, setActiveDevice] = useState("all");
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [sortBy, setSortBy] = useState<"newest" | "popular">("newest");
  
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  
  // Filter templates based on search, category, and device
  const filteredTemplates = TEMPLATES.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          template.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = activeCategory === "all" || template.category.includes(activeCategory);
    
    const matchesDevice = activeDevice === "all" || template.device === activeDevice;
    
    return matchesSearch && matchesCategory && matchesDevice;
  });
  
  // Sort templates
  const sortedTemplates = [...filteredTemplates].sort((a, b) => {
    if (sortBy === "newest") {
      return a.new ? -1 : 1;
    } else {
      // Popular - assume premium templates are more popular for demo
      return a.premium ? -1 : 1;
    }
  });
  
  // Apply template to canvas
  const handleApplyTemplate = () => {
    if (!selectedTemplate) return;
    
    // Apply template elements to canvas
    dispatch(setElements(selectedTemplate.elements));
    
    // Set document name based on template
    dispatch(setDocumentName(selectedTemplate.name));
    
    // Show success toast
    toast({
      title: "Template Applied",
      description: `"${selectedTemplate.name}" template has been applied to your canvas.`,
    });
    
    // Close dialog
    onOpenChange(false);
  };

  // Format the template thumbnail display
  const renderTemplateThumbnail = (template: Template) => {
    // In a real app, this would display an actual image
    // For our simplified version, we'll create a placeholder based on the template type
    const getTemplateStyle = () => {
      switch (template.id) {
        case "landing-page":
          return {
            background: "linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%)"
          };
        case "dashboard":
          return {
            background: "linear-gradient(135deg, #0F172A 0%, #334155 100%)"
          };
        case "mobile-app":
          return {
            background: "linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)"
          };
        case "presentation":
          return {
            background: "linear-gradient(135deg, #0EA5E9 0%, #0369A1 100%)"
          };
        case "social-media":
          return {
            background: "linear-gradient(135deg, #EC4899 0%, #BE185D 100%)"
          };
        case "ecommerce":
          return {
            background: "linear-gradient(135deg, #10B981 0%, #047857 100%)"
          };
        default:
          return {
            background: "linear-gradient(135deg, #64748B 0%, #334155 100%)"
          };
      }
    };
    
    return (
      <div 
        className="w-full aspect-video rounded-md overflow-hidden relative"
        style={getTemplateStyle()}
      >
        <div className="absolute inset-0 flex items-center justify-center text-white">
          <LayoutTemplate className="h-12 w-12 opacity-20" />
        </div>
        
        {template.premium && (
          <div className="absolute top-2 right-2">
            <Badge variant="outline" className="bg-yellow-500/20 text-yellow-200 border-yellow-500/30">
              <Star className="h-3 w-3 mr-1 fill-yellow-200" />
              Premium
            </Badge>
          </div>
        )}
        
        {template.new && (
          <div className="absolute top-2 left-2">
            <Badge variant="outline" className="bg-blue-500/20 text-blue-200 border-blue-500/30">
              New
            </Badge>
          </div>
        )}
        
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-3">
          <h3 className="text-white font-medium text-sm">{template.name}</h3>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <LayoutTemplate className="h-5 w-5 mr-2 text-primary" />
            Template Gallery
          </DialogTitle>
          <DialogDescription>
            Choose from professionally designed templates to kickstart your designs
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] gap-6">
          {/* Left sidebar - Filters */}
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search templates..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="border rounded-md">
              <div className="p-3 border-b flex items-center justify-between">
                <h3 className="text-sm font-medium flex items-center">
                  <Filter className="h-4 w-4 mr-1.5" />
                  Filters
                </h3>
              </div>
              
              <div className="p-3 border-b">
                <h4 className="text-xs font-medium mb-2 text-muted-foreground">CATEGORIES</h4>
                <div className="space-y-1">
                  <Button
                    variant={activeCategory === "all" ? "default" : "ghost"}
                    size="sm"
                    className="w-full justify-start text-sm h-8"
                    onClick={() => setActiveCategory("all")}
                  >
                    All Categories
                  </Button>
                  <Button
                    variant={activeCategory === "marketing" ? "default" : "ghost"}
                    size="sm"
                    className="w-full justify-start text-sm h-8"
                    onClick={() => setActiveCategory("marketing")}
                  >
                    Marketing
                  </Button>
                  <Button
                    variant={activeCategory === "website" ? "default" : "ghost"}
                    size="sm"
                    className="w-full justify-start text-sm h-8"
                    onClick={() => setActiveCategory("website")}
                  >
                    Websites
                  </Button>
                  <Button
                    variant={activeCategory === "dashboard" ? "default" : "ghost"}
                    size="sm"
                    className="w-full justify-start text-sm h-8"
                    onClick={() => setActiveCategory("dashboard")}
                  >
                    Dashboards
                  </Button>
                  <Button
                    variant={activeCategory === "mobile" ? "default" : "ghost"}
                    size="sm"
                    className="w-full justify-start text-sm h-8"
                    onClick={() => setActiveCategory("mobile")}
                  >
                    Mobile Apps
                  </Button>
                  <Button
                    variant={activeCategory === "presentation" ? "default" : "ghost"}
                    size="sm"
                    className="w-full justify-start text-sm h-8"
                    onClick={() => setActiveCategory("presentation")}
                  >
                    Presentations
                  </Button>
                  <Button
                    variant={activeCategory === "social-media" ? "default" : "ghost"}
                    size="sm"
                    className="w-full justify-start text-sm h-8"
                    onClick={() => setActiveCategory("social-media")}
                  >
                    Social Media
                  </Button>
                </div>
              </div>
              
              <div className="p-3">
                <h4 className="text-xs font-medium mb-2 text-muted-foreground">DEVICE TYPE</h4>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={activeDevice === "all" ? "default" : "outline"}
                    size="sm"
                    className="h-8"
                    onClick={() => setActiveDevice("all")}
                  >
                    <MonitorSmartphone className="h-3.5 w-3.5 mr-1.5" />
                    All
                  </Button>
                  <Button
                    variant={activeDevice === "desktop" ? "default" : "outline"}
                    size="sm"
                    className="h-8"
                    onClick={() => setActiveDevice("desktop")}
                  >
                    <Laptop className="h-3.5 w-3.5 mr-1.5" />
                    Desktop
                  </Button>
                  <Button
                    variant={activeDevice === "mobile" ? "default" : "outline"}
                    size="sm"
                    className="h-8"
                    onClick={() => setActiveDevice("mobile")}
                  >
                    <Smartphone className="h-3.5 w-3.5 mr-1.5" />
                    Mobile
                  </Button>
                  <Button
                    variant={activeDevice === "tablet" ? "default" : "outline"}
                    size="sm"
                    className="h-8"
                    onClick={() => setActiveDevice("tablet")}
                  >
                    <Table2 className="h-3.5 w-3.5 mr-1.5" />
                    Tablet
                  </Button>
                  <Button
                    variant={activeDevice === "responsive" ? "default" : "outline"}
                    size="sm"
                    className="h-8"
                    onClick={() => setActiveDevice("responsive")}
                  >
                    <MonitorSmartphone className="h-3.5 w-3.5 mr-1.5" />
                    Responsive
                  </Button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right content - Templates */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Tabs defaultValue="all" className="w-[400px]">
                <TabsList>
                  <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
                  <TabsTrigger value="recent" className="text-xs">
                    <Clock className="h-3.5 w-3.5 mr-1.5" />
                    Recent
                  </TabsTrigger>
                  <TabsTrigger value="saved" className="text-xs">
                    <Heart className="h-3.5 w-3.5 mr-1.5" />
                    Saved
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => setSortBy(sortBy === "newest" ? "popular" : "newest")}
              >
                Sort: {sortBy === "newest" ? "Newest" : "Popular"}
                <ChevronDown className="h-3.5 w-3.5 ml-1.5" />
              </Button>
            </div>
            
            <ScrollArea className="h-[400px] pr-4">
              {sortedTemplates.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {sortedTemplates.map((template) => (
                    <motion.div
                      key={template.id}
                      whileHover={{ y: -5 }}
                      transition={{ duration: 0.2 }}
                      className={`border rounded-lg overflow-hidden cursor-pointer ${
                        selectedTemplate?.id === template.id ? "ring-2 ring-primary" : ""
                      }`}
                      onClick={() => setSelectedTemplate(template)}
                    >
                      {renderTemplateThumbnail(template)}
                      
                      <div className="p-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-medium">{template.name}</h3>
                            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                              {template.description}
                            </p>
                          </div>
                          
                          {selectedTemplate?.id === template.id && (
                            <div className="ml-2 flex-shrink-0">
                              <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                                <CheckCircle2 className="h-4 w-4 text-primary-foreground" />
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex items-center">
                            <Badge variant="secondary" className="text-xs">
                              {template.device}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center">
                            <UserCircle className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground ml-1">Design Team</span>
                          </div>
                          
                          <div className="flex items-center">
                            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground ml-1">
                              {template.new ? "2 days ago" : "2 months ago"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[300px] text-center">
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                    <Search className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium">No templates found</h3>
                  <p className="text-muted-foreground mt-1">
                    Try adjusting your search or filters
                  </p>
                  {searchQuery && (
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => setSearchQuery("")}
                    >
                      Clear search
                    </Button>
                  )}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
        
        <DialogFooter className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => {
              // In a real app, this would download the template
              toast({
                title: "Template Downloaded",
                description: "Template has been downloaded successfully.",
              });
            }}
            disabled={!selectedTemplate}
          >
            <ArrowDownToLine className="h-4 w-4 mr-2" />
            Download
          </Button>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleApplyTemplate}
              disabled={!selectedTemplate}
            >
              Use Template
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}