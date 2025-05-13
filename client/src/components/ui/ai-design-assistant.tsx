import React, { useState, useRef } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { addElement, setElements, setDocumentName } from "@/store/slices/designSlice";
import { 
  Sparkles, 
  PenTool, 
  Palette, 
  Wand2, 
  Scissors, 
  MessageCircle, 
  RefreshCw,
  Check,
  Lightbulb,
  Zap
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ElementType } from "@shared/schema";

interface AIDesignAssistantProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Simulated AI recommendations
const COLOR_PALETTES = [
  {
    id: "modern-blue",
    name: "Modern Blue",
    colors: ["#2563EB", "#60A5FA", "#DBEAFE", "#1E3A8A", "#F8FAFC"],
    description: "Professional and clean blue palette with good contrast",
  },
  {
    id: "eco-green",
    name: "Eco Green",
    colors: ["#059669", "#34D399", "#D1FAE5", "#064E3B", "#ECFDF5"],
    description: "Fresh and natural greens for environmental themes",
  },
  {
    id: "warm-sunset",
    name: "Warm Sunset",
    colors: ["#F59E0B", "#FBBF24", "#FEF3C7", "#92400E", "#FFFBEB"],
    description: "Warm and inviting sunset-inspired colors",
  },
  {
    id: "bold-purple",
    name: "Bold Purple",
    colors: ["#7C3AED", "#A78BFA", "#EDE9FE", "#4C1D95", "#F5F3FF"],
    description: "Creative and bold purple scheme for standout designs",
  },
  {
    id: "crimson-red",
    name: "Crimson Red",
    colors: ["#DC2626", "#F87171", "#FEE2E2", "#7F1D1D", "#FEF2F2"],
    description: "Powerful and energetic red palette for high impact",
  },
];

// Simulated layout presets
const LAYOUT_PRESETS = [
  {
    id: "hero-section",
    name: "Hero Section",
    preview: "hero-layout",
    description: "Large header area with prominent call-to-action",
    elements: [
      {
        id: 1,
        type: ElementType.RECTANGLE,
        x: 50,
        y: 50,
        width: 700,
        height: 400,
        rotation: 0,
        fill: "#FFFFFF",
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
        width: 300,
        height: 60,
        rotation: 0,
        fill: "#F1F5F9",
        stroke: "#E2E8F0",
        strokeWidth: 0,
        opacity: 1,
        zIndex: 2,
        designId: 1,
        properties: {
          text: "Hero Title Text"
        }
      },
      {
        id: 3,
        type: ElementType.RECTANGLE,
        x: 100,
        y: 180,
        width: 500,
        height: 120,
        rotation: 0,
        fill: "#F1F5F9",
        stroke: "#E2E8F0",
        strokeWidth: 0,
        opacity: 1,
        zIndex: 2,
        designId: 1,
        properties: {
          text: "Subtitle with more details"
        }
      },
      {
        id: 4,
        type: ElementType.RECTANGLE,
        x: 100,
        y: 320,
        width: 120,
        height: 40,
        rotation: 0,
        fill: "#3B82F6",
        stroke: "#2563EB",
        strokeWidth: 0,
        opacity: 1,
        zIndex: 2,
        designId: 1,
        properties: {
          cornerRadius: 20,
          text: "Button"
        }
      },
    ]
  },
  {
    id: "feature-grid",
    name: "Feature Grid",
    preview: "feature-grid",
    description: "3x2 grid layout for showcasing product features",
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
        width: 180,
        height: 180,
        rotation: 0,
        fill: "#F1F5F9",
        stroke: "#E2E8F0",
        strokeWidth: 1,
        opacity: 1,
        zIndex: 2,
        designId: 1,
      },
      {
        id: 3,
        type: ElementType.RECTANGLE,
        x: 310,
        y: 100,
        width: 180,
        height: 180,
        rotation: 0,
        fill: "#F1F5F9",
        stroke: "#E2E8F0",
        strokeWidth: 1,
        opacity: 1,
        zIndex: 2,
        designId: 1,
      },
      {
        id: 4,
        type: ElementType.RECTANGLE,
        x: 520,
        y: 100,
        width: 180,
        height: 180,
        rotation: 0,
        fill: "#F1F5F9",
        stroke: "#E2E8F0",
        strokeWidth: 1,
        opacity: 1,
        zIndex: 2,
        designId: 1,
      },
      {
        id: 5,
        type: ElementType.RECTANGLE,
        x: 100,
        y: 310,
        width: 180,
        height: 180,
        rotation: 0,
        fill: "#F1F5F9",
        stroke: "#E2E8F0",
        strokeWidth: 1,
        opacity: 1,
        zIndex: 2,
        designId: 1,
      },
      {
        id: 6,
        type: ElementType.RECTANGLE,
        x: 310,
        y: 310,
        width: 180,
        height: 180,
        rotation: 0,
        fill: "#F1F5F9",
        stroke: "#E2E8F0",
        strokeWidth: 1,
        opacity: 1,
        zIndex: 2,
        designId: 1,
      },
      {
        id: 7,
        type: ElementType.RECTANGLE,
        x: 520,
        y: 310,
        width: 180,
        height: 180,
        rotation: 0,
        fill: "#F1F5F9",
        stroke: "#E2E8F0",
        strokeWidth: 1,
        opacity: 1,
        zIndex: 2,
        designId: 1,
      },
    ]
  },
  {
    id: "testimonial-section",
    name: "Testimonial Section",
    preview: "testimonial-section",
    description: "Customer testimonials with profile images and quotes",
    elements: [
      {
        id: 1,
        type: ElementType.RECTANGLE,
        x: 50,
        y: 50,
        width: 700,
        height: 400,
        rotation: 0,
        fill: "#FFFFFF",
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
        width: 300,
        height: 50,
        rotation: 0,
        fill: "#F8FAFC",
        stroke: "#E2E8F0",
        strokeWidth: 0,
        opacity: 1,
        zIndex: 2,
        designId: 1,
        properties: {
          text: "What Our Customers Say"
        }
      },
      {
        id: 3,
        type: ElementType.ELLIPSE,
        x: 150,
        y: 180,
        width: 60,
        height: 60,
        rotation: 0,
        fill: "#E2E8F0",
        stroke: "#CBD5E1",
        strokeWidth: 1,
        opacity: 1,
        zIndex: 2,
        designId: 1,
      },
      {
        id: 4,
        type: ElementType.RECTANGLE,
        x: 230,
        y: 180,
        width: 400,
        height: 80,
        rotation: 0,
        fill: "#F1F5F9",
        stroke: "#E2E8F0",
        strokeWidth: 1,
        opacity: 1,
        zIndex: 2,
        designId: 1,
        properties: {
          cornerRadius: 8,
          text: "Testimonial quote text here"
        }
      },
      {
        id: 5,
        type: ElementType.ELLIPSE,
        x: 150,
        y: 280,
        width: 60,
        height: 60,
        rotation: 0,
        fill: "#E2E8F0",
        stroke: "#CBD5E1",
        strokeWidth: 1,
        opacity: 1,
        zIndex: 2,
        designId: 1,
      },
      {
        id: 6,
        type: ElementType.RECTANGLE,
        x: 230,
        y: 280,
        width: 400,
        height: 80,
        rotation: 0,
        fill: "#F1F5F9",
        stroke: "#E2E8F0",
        strokeWidth: 1,
        opacity: 1,
        zIndex: 2,
        designId: 1,
        properties: {
          cornerRadius: 8,
          text: "Another testimonial quote"
        }
      },
    ]
  }
];

// Design tips
const DESIGN_TIPS = [
  {
    id: 1,
    title: "Use whitespace effectively",
    description: "Don't crowd your designs. Adequate whitespace improves readability and helps guide the viewer's eye.",
    icon: <Lightbulb className="h-5 w-5" />
  },
  {
    id: 2,
    title: "Maintain consistent typography",
    description: "Limit yourself to 2-3 font families and use consistent sizing hierarchies throughout your design.",
    icon: <PenTool className="h-5 w-5" />
  },
  {
    id: 3,
    title: "Follow the 60-30-10 color rule",
    description: "Use your primary color for 60% of the design, secondary for 30%, and accent for 10% for visual balance.",
    icon: <Palette className="h-5 w-5" />
  },
  {
    id: 4,
    title: "Align elements to a grid",
    description: "Create visual order by aligning elements to a consistent grid system throughout your design.",
    icon: <Scissors className="h-5 w-5" />
  },
  {
    id: 5,
    title: "Ensure adequate contrast",
    description: "Text should have sufficient contrast with background colors for better readability and accessibility.",
    icon: <Zap className="h-5 w-5" />
  }
];

export function AIDesignAssistant({ open, onOpenChange }: AIDesignAssistantProps) {
  const [activeTab, setActiveTab] = useState("chat");
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{role: 'user' | 'ai', content: string}>>([
    {
      role: 'ai',
      content: "Hi there! I'm your AI design assistant. Ask me questions about design principles, layout suggestions, or color recommendations!"
    }
  ]);
  const [selectedPalette, setSelectedPalette] = useState<string | null>(null);
  const [selectedLayout, setSelectedLayout] = useState<string | null>(null);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const dispatch = useAppDispatch();
  const elements = useAppSelector(state => state.design.present.elements);

  // Scroll to bottom of chat when messages change
  React.useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  // Simulate AI chat response
  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!prompt.trim()) return;
    
    // Add user message
    setChatMessages(prev => [...prev, { role: 'user', content: prompt }]);
    setGenerating(true);
    
    // Simulated AI response delay
    setTimeout(() => {
      let response = "I'm analyzing your request about design...";
      
      // Very basic keyword response simulation
      if (prompt.toLowerCase().includes("color")) {
        response = "For color selection, consider your brand personality and audience. Use contrast for readability, and remember the 60-30-10 rule: 60% dominant color, 30% secondary color, and 10% accent color. Check the 'Color Palettes' tab for some curated options!";
      } else if (prompt.toLowerCase().includes("layout")) {
        response = "For effective layouts, establish a clear visual hierarchy with the most important elements drawing attention first. Use grids to maintain alignment and consistency. Visit the 'Layout Presets' tab to see some ready-made layout templates!";
      } else if (prompt.toLowerCase().includes("typography") || prompt.toLowerCase().includes("font")) {
        response = "Good typography enhances readability. Limit yourself to 2-3 font families, use consistent sizing, and ensure proper contrast with backgrounds. Sans-serif fonts work well for digital interfaces, while serif fonts can add sophistication to headings.";
      } else if (prompt.toLowerCase().includes("principle") || prompt.toLowerCase().includes("rule")) {
        response = "Key design principles include: balance (visual weight distribution), contrast (creating visual interest), hierarchy (guiding viewers), alignment (creating order), repetition (creating consistency), and proximity (grouping related items). These principles help create cohesive, engaging designs.";
      } else {
        response = "That's an interesting question! When designing, always consider your audience and purpose first. Balance aesthetic appeal with functionality, and maintain consistency throughout your design. Would you like specific tips on color, layout, or typography?";
      }
      
      // Add AI response
      setChatMessages(prev => [...prev, { role: 'ai', content: response }]);
      setGenerating(false);
      setPrompt("");
    }, 1500);
  };

  // Apply selected color palette to canvas elements
  const handleApplyPalette = () => {
    if (!selectedPalette) return;
    
    // Find selected palette
    const palette = COLOR_PALETTES.find(p => p.id === selectedPalette);
    if (!palette) return;
    
    // Apply colors to existing elements (in a real app, this would be more sophisticated)
    if (elements.length > 0) {
      const updatedElements = elements.map((element, index) => ({
        ...element,
        fill: palette.colors[index % palette.colors.length]
      }));
      
      dispatch(setElements(updatedElements));
      
      toast({
        title: "Color Palette Applied",
        description: `Applied "${palette.name}" palette to your design elements.`,
      });
    } else {
      // Create demo elements if canvas is empty
      const demoElements = [
        {
          id: 1,
          type: ElementType.RECTANGLE,
          x: 100,
          y: 100,
          width: 200,
          height: 200,
          rotation: 0,
          fill: palette.colors[0],
          stroke: palette.colors[3],
          strokeWidth: 1,
          opacity: 1,
          zIndex: 1,
          designId: 1,
        },
        {
          id: 2,
          type: ElementType.ELLIPSE,
          x: 350,
          y: 150,
          width: 150,
          height: 150,
          rotation: 0,
          fill: palette.colors[1],
          stroke: palette.colors[3],
          strokeWidth: 1,
          opacity: 1,
          zIndex: 2,
          designId: 1,
        },
        {
          id: 3,
          type: ElementType.RECTANGLE,
          x: 150,
          y: 350,
          width: 400,
          height: 100,
          rotation: 0,
          fill: palette.colors[2],
          stroke: palette.colors[3],
          strokeWidth: 1,
          opacity: 1,
          zIndex: 3,
          designId: 1,
          properties: {
            cornerRadius: 8
          }
        },
      ];
      
      dispatch(setElements(demoElements));
      dispatch(setDocumentName(`${palette.name} Design`));
      
      toast({
        title: "Color Palette Applied",
        description: `Created a new design with "${palette.name}" palette.`,
      });
    }
    
    onOpenChange(false);
  };

  // Apply selected layout to canvas
  const handleApplyLayout = () => {
    if (!selectedLayout) return;
    
    // Find selected layout
    const layout = LAYOUT_PRESETS.find(l => l.id === selectedLayout);
    if (!layout) return;
    
    // Apply layout (replace current elements)
    dispatch(setElements(layout.elements));
    dispatch(setDocumentName(`${layout.name} Design`));
    
    toast({
      title: "Layout Applied",
      description: `Applied "${layout.name}" layout to your canvas.`,
    });
    
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Design Assistant
          </DialogTitle>
          <DialogDescription>
            Get AI-powered design guidance and recommendations
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="chat" value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <TabsList className="grid grid-cols-3">
            <TabsTrigger value="chat" className="flex items-center gap-1.5">
              <MessageCircle className="h-4 w-4" />
              <span>Chat</span>
            </TabsTrigger>
            <TabsTrigger value="palettes" className="flex items-center gap-1.5">
              <Palette className="h-4 w-4" />
              <span>Color Palettes</span>
            </TabsTrigger>
            <TabsTrigger value="layouts" className="flex items-center gap-1.5">
              <Wand2 className="h-4 w-4" />
              <span>Layout Presets</span>
            </TabsTrigger>
          </TabsList>
          
          {/* AI Chat */}
          <TabsContent value="chat" className="flex flex-col h-[450px]">
            <ScrollArea className="flex-1 pr-4 mb-4">
              <div className="space-y-4 pt-2">
                {chatMessages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-2 ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      {message.content}
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
                
                {generating && (
                  <div className="flex justify-start">
                    <div className="max-w-[80%] rounded-lg px-4 py-2 bg-muted flex items-center gap-2">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>AI is thinking...</span>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
            
            <form onSubmit={handleChatSubmit} className="flex gap-2">
              <Input
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ask about design tips, color theory, layouts..."
                disabled={generating}
                className="flex-1"
              />
              <Button type="submit" disabled={!prompt.trim() || generating}>
                Send
              </Button>
            </form>
            
            <div className="mt-4">
              <span className="text-xs text-muted-foreground">Design tips:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {DESIGN_TIPS.map((tip) => (
                  <Button
                    key={tip.id}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1 text-xs h-7"
                    onClick={() => setPrompt(`Tell me about ${tip.title.toLowerCase()}`)}
                  >
                    {tip.icon}
                    <span className="truncate max-w-[100px]">{tip.title}</span>
                  </Button>
                ))}
              </div>
            </div>
          </TabsContent>
          
          {/* Color Palettes */}
          <TabsContent value="palettes" className="h-[450px]">
            <ScrollArea className="h-full pr-4">
              <div className="space-y-4 pt-2">
                <p className="text-sm text-muted-foreground">
                  Select a color palette to apply to your design elements. Each palette is professionally curated for harmonious color combinations.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <AnimatePresence>
                    {COLOR_PALETTES.map((palette) => (
                      <motion.div
                        key={palette.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Card 
                          className={`cursor-pointer transition-all hover:border-primary ${
                            selectedPalette === palette.id ? 'border-primary ring-1 ring-primary' : ''
                          }`}
                          onClick={() => setSelectedPalette(palette.id)}
                        >
                          <CardHeader className="p-4 pb-2">
                            <CardTitle className="text-base flex items-center justify-between">
                              {palette.name}
                              {selectedPalette === palette.id && (
                                <Check className="h-4 w-4 text-primary" />
                              )}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-4 space-y-3">
                            <div className="flex gap-1">
                              {palette.colors.map((color, index) => (
                                <div
                                  key={index}
                                  className="h-10 flex-1 rounded-md"
                                  style={{ backgroundColor: color }}
                                  title={color}
                                />
                              ))}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {palette.description}
                            </p>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            </ScrollArea>
            
            <DialogFooter className="mt-4">
              <Button 
                variant="outline" 
                onClick={() => setSelectedPalette(null)}
                disabled={!selectedPalette}
              >
                Clear Selection
              </Button>
              <Button 
                onClick={handleApplyPalette}
                disabled={!selectedPalette}
              >
                Apply Palette
              </Button>
            </DialogFooter>
          </TabsContent>
          
          {/* Layout Presets */}
          <TabsContent value="layouts" className="h-[450px]">
            <ScrollArea className="h-full pr-4">
              <div className="space-y-4 pt-2">
                <p className="text-sm text-muted-foreground">
                  Choose from pre-designed layout templates to kickstart your design. Select a template and customize it to fit your needs.
                </p>
                
                <div className="grid grid-cols-1 gap-4">
                  <AnimatePresence>
                    {LAYOUT_PRESETS.map((layout) => (
                      <motion.div
                        key={layout.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Card 
                          className={`cursor-pointer transition-all hover:border-primary ${
                            selectedLayout === layout.id ? 'border-primary ring-1 ring-primary' : ''
                          }`}
                          onClick={() => setSelectedLayout(layout.id)}
                        >
                          <CardHeader className="p-4 pb-2">
                            <CardTitle className="text-base flex items-center justify-between">
                              {layout.name}
                              {selectedLayout === layout.id && (
                                <Check className="h-4 w-4 text-primary" />
                              )}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-4 pt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-muted rounded-md aspect-video flex items-center justify-center overflow-hidden relative">
                              {/* Simplified preview */}
                              <div className="absolute inset-0 p-2">
                                {layout.id === "hero-section" && (
                                  <div className="w-full h-full border border-border p-1">
                                    <div className="h-2 w-1/3 bg-muted-foreground/20 mb-1 mt-1 ml-1"></div>
                                    <div className="h-1 w-2/3 bg-muted-foreground/20 mb-1 ml-1"></div>
                                    <div className="h-1 w-1/2 bg-muted-foreground/20 mb-2 ml-1"></div>
                                    <div className="h-1.5 w-8 bg-primary ml-1 rounded-sm"></div>
                                  </div>
                                )}
                                
                                {layout.id === "feature-grid" && (
                                  <div className="w-full h-full border border-border p-1">
                                    <div className="grid grid-cols-3 gap-1 h-full">
                                      <div className="bg-muted-foreground/20"></div>
                                      <div className="bg-muted-foreground/20"></div>
                                      <div className="bg-muted-foreground/20"></div>
                                      <div className="bg-muted-foreground/20"></div>
                                      <div className="bg-muted-foreground/20"></div>
                                      <div className="bg-muted-foreground/20"></div>
                                    </div>
                                  </div>
                                )}
                                
                                {layout.id === "testimonial-section" && (
                                  <div className="w-full h-full border border-border p-1">
                                    <div className="h-1.5 w-1/3 bg-muted-foreground/20 mb-2 mt-1 mx-auto"></div>
                                    <div className="flex items-center mb-1">
                                      <div className="h-3 w-3 rounded-full bg-muted-foreground/20 mr-1"></div>
                                      <div className="h-1 flex-1 bg-muted-foreground/20"></div>
                                    </div>
                                    <div className="flex items-center">
                                      <div className="h-3 w-3 rounded-full bg-muted-foreground/20 mr-1"></div>
                                      <div className="h-1 flex-1 bg-muted-foreground/20"></div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <div>
                              <p className="text-sm">
                                {layout.description}
                              </p>
                              <p className="text-xs text-muted-foreground mt-2">
                                This template will replace your current canvas elements.
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            </ScrollArea>
            
            <DialogFooter className="mt-4">
              <Button 
                variant="outline" 
                onClick={() => setSelectedLayout(null)}
                disabled={!selectedLayout}
              >
                Clear Selection
              </Button>
              <Button 
                onClick={handleApplyLayout}
                disabled={!selectedLayout}
              >
                Apply Layout
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}