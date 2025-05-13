import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, LayoutTemplate, Grid3X3, FileText, PresentationIcon, ChartPie, Database, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAppDispatch } from "@/store/hooks";
import { setElements, setDocumentName } from "@/store/slices/designSlice";
import { motion } from "framer-motion";
import { ElementType } from "@shared/schema";

// Template categories
const CATEGORIES = [
  { id: "all", name: "All" },
  { id: "ui", name: "UI Design" },
  { id: "presentation", name: "Presentations" },
  { id: "infographic", name: "Infographics" },
  { id: "social", name: "Social Media" },
  { id: "print", name: "Print" },
];

// Template data - in a real app, this would be fetched from an API
const TEMPLATES = [
  {
    id: 1,
    title: "Dashboard Layout",
    description: "Modern dashboard template with widgets and charts",
    categories: ["ui"],
    thumbnail: "dashboard-template",
    icon: <LayoutTemplate className="h-5 w-5" />,
    elements: [
      {
        id: 1,
        type: ElementType.RECTANGLE,
        x: 50,
        y: 50,
        width: 700,
        height: 500,
        rotation: 0,
        fill: "#ffffff",
        stroke: "#e2e8f0",
        strokeWidth: 1,
        opacity: 1,
        zIndex: 1,
        designId: 1,
      },
      {
        id: 2,
        type: ElementType.RECTANGLE,
        x: 70,
        y: 70,
        width: 660,
        height: 60,
        rotation: 0,
        fill: "#f8fafc",
        stroke: "#e2e8f0",
        strokeWidth: 1,
        opacity: 1,
        zIndex: 2,
        designId: 1,
      },
      {
        id: 3,
        type: ElementType.RECTANGLE,
        x: 70,
        y: 150,
        width: 200,
        height: 150,
        rotation: 0,
        fill: "#f1f5f9",
        stroke: "#e2e8f0",
        strokeWidth: 1,
        opacity: 1,
        zIndex: 2,
        designId: 1,
      },
      {
        id: 4,
        type: ElementType.RECTANGLE,
        x: 290,
        y: 150,
        width: 200,
        height: 150,
        rotation: 0,
        fill: "#f1f5f9",
        stroke: "#e2e8f0",
        strokeWidth: 1,
        opacity: 1,
        zIndex: 2,
        designId: 1,
      },
      {
        id: 5,
        type: ElementType.RECTANGLE,
        x: 510,
        y: 150,
        width: 200,
        height: 150,
        rotation: 0,
        fill: "#f1f5f9",
        stroke: "#e2e8f0",
        strokeWidth: 1,
        opacity: 1,
        zIndex: 2,
        designId: 1,
      },
      {
        id: 6,
        type: ElementType.RECTANGLE,
        x: 70,
        y: 320,
        width: 440,
        height: 200,
        rotation: 0,
        fill: "#f1f5f9",
        stroke: "#e2e8f0",
        strokeWidth: 1,
        opacity: 1,
        zIndex: 2,
        designId: 1,
      },
      {
        id: 7,
        type: ElementType.RECTANGLE,
        x: 530,
        y: 320,
        width: 180,
        height: 200,
        rotation: 0,
        fill: "#f1f5f9",
        stroke: "#e2e8f0",
        strokeWidth: 1,
        opacity: 1,
        zIndex: 2,
        designId: 1,
      },
    ]
  },
  {
    id: 2,
    title: "Presentation Slides",
    description: "Professional slide deck with title and content layouts",
    categories: ["presentation"],
    thumbnail: "presentation-template",
    icon: <PresentationIcon className="h-5 w-5" />,
    elements: [
      {
        id: 1,
        type: ElementType.RECTANGLE,
        x: 50,
        y: 50,
        width: 700,
        height: 500,
        rotation: 0,
        fill: "#f8fafc",
        stroke: "#e2e8f0",
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
        height: 80,
        rotation: 0,
        fill: "#e2e8f0",
        stroke: "#cbd5e1",
        strokeWidth: 1,
        opacity: 1,
        zIndex: 2,
        designId: 1,
      },
      {
        id: 3,
        type: ElementType.TEXT,
        x: 100,
        y: 200,
        width: 600,
        height: 300,
        rotation: 0,
        fill: "#f8fafc",
        stroke: "#cbd5e1",
        strokeWidth: 0,
        opacity: 1,
        zIndex: 2,
        content: "Presentation Content",
        designId: 1,
      },
    ]
  },
  {
    id: 3,
    title: "Social Media Post",
    description: "Instagram and Facebook post templates",
    categories: ["social"],
    thumbnail: "social-template",
    icon: <Grid3X3 className="h-5 w-5" />,
    elements: [
      {
        id: 1,
        type: ElementType.RECTANGLE,
        x: 150,
        y: 50,
        width: 500,
        height: 500,
        rotation: 0,
        fill: "#f0f4f8",
        stroke: "#cbd5e0",
        strokeWidth: 1,
        opacity: 1,
        zIndex: 1,
        designId: 1,
      },
      {
        id: 2,
        type: ElementType.RECTANGLE,
        x: 180,
        y: 80,
        width: 440,
        height: 320,
        rotation: 0,
        fill: "#edf2f7",
        stroke: "#a0aec0",
        strokeWidth: 1,
        opacity: 1,
        zIndex: 2,
        designId: 1,
      },
      {
        id: 3,
        type: ElementType.RECTANGLE,
        x: 180,
        y: 420,
        width: 440,
        height: 100,
        rotation: 0,
        fill: "#e2e8f0",
        stroke: "#a0aec0",
        strokeWidth: 1,
        opacity: 1,
        zIndex: 2,
        designId: 1,
      },
    ]
  },
  {
    id: 4,
    title: "Infographic Layout",
    description: "Data visualization and information display",
    categories: ["infographic"],
    thumbnail: "infographic-template",
    icon: <ChartPie className="h-5 w-5" />,
    elements: [
      {
        id: 1,
        type: ElementType.RECTANGLE,
        x: 50,
        y: 50,
        width: 300,
        height: 500,
        rotation: 0,
        fill: "#ffffff",
        stroke: "#e2e8f0",
        strokeWidth: 1,
        opacity: 1,
        zIndex: 1,
        designId: 1,
      },
      {
        id: 2,
        type: ElementType.RECTANGLE,
        x: 370,
        y: 50,
        width: 380,
        height: 240,
        rotation: 0,
        fill: "#ffffff", 
        stroke: "#e2e8f0",
        strokeWidth: 1,
        opacity: 1,
        zIndex: 1,
        designId: 1,
      },
      {
        id: 3,
        type: ElementType.RECTANGLE,
        x: 370,
        y: 310,
        width: 380,
        height: 240,
        rotation: 0,
        fill: "#ffffff",
        stroke: "#e2e8f0",
        strokeWidth: 1,
        opacity: 1,
        zIndex: 1,
        designId: 1,
      },
    ]
  },
  {
    id: 5,
    title: "Business Card",
    description: "Professional business card design",
    categories: ["print"],
    thumbnail: "business-card-template",
    icon: <FileText className="h-5 w-5" />,
    elements: [
      {
        id: 1,
        type: ElementType.RECTANGLE,
        x: 250,
        y: 200,
        width: 300,
        height: 180,
        rotation: 0,
        fill: "#ffffff",
        stroke: "#000000",
        strokeWidth: 1,
        opacity: 1,
        zIndex: 1,
        designId: 1,
      },
      {
        id: 2,
        type: ElementType.TEXT,
        x: 270,
        y: 220,
        width: 260,
        height: 30,
        rotation: 0,
        fill: "#000000",
        stroke: "#000000",
        strokeWidth: 0,
        opacity: 1,
        zIndex: 2,
        content: "Company Name",
        designId: 1,
      },
      {
        id: 3,
        type: ElementType.LINE,
        x: 270,
        y: 260,
        width: 260,
        height: 0,
        rotation: 0,
        fill: "#000000",
        stroke: "#000000",
        strokeWidth: 1,
        opacity: 1,
        zIndex: 2,
        designId: 1,
      },
      {
        id: 4,
        type: ElementType.TEXT,
        x: 270,
        y: 280,
        width: 260,
        height: 80,
        rotation: 0,
        fill: "#000000",
        stroke: "#000000",
        strokeWidth: 0,
        opacity: 1,
        zIndex: 2,
        content: "John Smith\nProduct Designer\njohn@example.com\n+1 (555) 123-4567",
        designId: 1,
      },
    ]
  },
  {
    id: 6,
    title: "Data Dashboard",
    description: "Analytics and reporting dashboard",
    categories: ["ui"],
    thumbnail: "data-dashboard-template",
    icon: <Database className="h-5 w-5" />,
    elements: [
      // Similar element structure to other templates
      {
        id: 1,
        type: ElementType.RECTANGLE,
        x: 50,
        y: 50,
        width: 700,
        height: 500,
        rotation: 0,
        fill: "#f8fafc",
        stroke: "#e2e8f0",
        strokeWidth: 1,
        opacity: 1,
        zIndex: 1,
        designId: 1,
      },
    ]
  },
  {
    id: 7,
    title: "Email Newsletter",
    description: "Email marketing template design",
    categories: ["social"],
    thumbnail: "email-template",
    icon: <Mail className="h-5 w-5" />,
    elements: [
      // Similar element structure to other templates
      {
        id: 1,
        type: ElementType.RECTANGLE,
        x: 150,
        y: 50,
        width: 500,
        height: 600,
        rotation: 0,
        fill: "#ffffff",
        stroke: "#e2e8f0",
        strokeWidth: 1,
        opacity: 1,
        zIndex: 1,
        designId: 1,
      },
    ]
  },
];

interface TemplateGalleryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TemplateGallery({ open, onOpenChange }: TemplateGalleryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const { toast } = useToast();
  const dispatch = useAppDispatch();

  // Filter templates based on search query and active category
  const filteredTemplates = TEMPLATES.filter((template) => {
    const matchesSearch = template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === "all" || template.categories.includes(activeCategory);
    return matchesSearch && matchesCategory;
  });

  const handleSelectTemplate = (template: typeof TEMPLATES[0]) => {
    // Load template elements into the canvas
    dispatch(setElements(template.elements));
    
    // Set document name
    dispatch(setDocumentName(template.title));
    
    // Close the dialog
    onOpenChange(false);
    
    // Show toast notification
    toast({
      title: "Template Applied",
      description: `"${template.title}" template has been loaded.`,
    });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Template Gallery</DialogTitle>
          <DialogDescription>
            Choose a template to start designing quickly
          </DialogDescription>
        </DialogHeader>

        <div className="relative mt-2">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search templates..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <Tabs defaultValue="all" value={activeCategory} onValueChange={setActiveCategory} className="mt-2">
          <TabsList className="w-full justify-start overflow-auto">
            {CATEGORIES.map((category) => (
              <TabsTrigger key={category.id} value={category.id}>
                {category.name}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={activeCategory} className="mt-4">
            <ScrollArea className="h-[450px] pr-4">
              <motion.div 
                className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {filteredTemplates.map((template) => (
                  <motion.div key={template.id} variants={itemVariants}>
                    <Card className="overflow-hidden cursor-pointer hover:border-primary transition-all"
                          onClick={() => handleSelectTemplate(template)}>
                      <CardHeader className="p-4 pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base flex items-center gap-2">
                            {template.icon}
                            {template.title}
                          </CardTitle>
                        </div>
                        <CardDescription className="text-xs">
                          {template.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <div className="bg-muted rounded-md aspect-video flex items-center justify-center overflow-hidden">
                          <div className="text-muted-foreground text-xs">Template Preview</div>
                        </div>
                      </CardContent>
                      <CardFooter className="p-4 pt-0 flex justify-between">
                        <div className="flex flex-wrap gap-1">
                          {template.categories.map((category) => (
                            <Badge key={category} variant="outline" className="text-xs font-normal">
                              {CATEGORIES.find(c => c.id === category)?.name || category}
                            </Badge>
                          ))}
                        </div>
                        <Button size="sm" variant="ghost">
                          Use
                        </Button>
                      </CardFooter>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>

              {filteredTemplates.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="text-muted-foreground mb-2">
                    <Search className="h-10 w-10 mx-auto mb-2" />
                    <h3 className="font-medium">No templates found</h3>
                  </div>
                  <p className="text-sm text-muted-foreground max-w-md">
                    We couldn't find any templates matching your search criteria. Try using different keywords or browse 
                    all templates.
                  </p>
                  {searchQuery && (
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => setSearchQuery("")}
                    >
                      Clear Search
                    </Button>
                  )}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}