import { useState, useEffect, useRef } from "react";
import { AppHeader } from "@/components/ui/header";
import ToolBar from "@/components/ToolBar";
import LayersPanel from "@/components/LayersPanel";
import PropertiesPanel from "@/components/PropertiesPanel";
import ExportDialog from "@/components/ExportDialog";
import EnhancedCanvas from "@/components/ui/enhanced-canvas";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { useToast } from "@/hooks/use-toast";
import { useWebSocket } from "@/contexts/WebSocketContext";
import { VersionHistory } from "@/components/ui/version-history";
import { TemplateGallery } from "@/components/ui/template-gallery";
import { AIDesignAssistant } from "@/components/ui/ai-design-assistant";
import { VectorShapeCreator } from "@/components/ui/vector-shape-creator";
import { CommentsList, CommentDetail } from "@/components/ui/comments-panel";
import { CollaborationStatus } from "@/components/ui/collaboration-status";
import { 
  ResizableHandle, 
  ResizablePanel, 
  ResizablePanelGroup 
} from "@/components/ui/resizable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { clearCanvas, selectElement } from "@/store/slices/designSlice";
import { type Comment, type Element } from "@shared/schema";
import { 
  History, 
  Grid3X3, 
  Sparkles, 
  MessageSquare, 
  PenSquare, 
  LayoutTemplate
} from "lucide-react";

export default function Design() {
  // State
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isVersionHistoryOpen, setIsVersionHistoryOpen] = useState(false);
  const [isTemplateGalleryOpen, setIsTemplateGalleryOpen] = useState(false);
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
  const [isVectorShapeCreatorOpen, setIsVectorShapeCreatorOpen] = useState(false);
  const [selectedComment, setSelectedComment] = useState<Comment | null>(null);
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [rightPanelTab, setRightPanelTab] = useState("properties");
  
  // Refs
  const lastSelectedElementRef = useRef<number | null>(null);
  
  // Redux
  const dispatch = useAppDispatch();
  const selectedElementIds = useAppSelector(state => state.design.present.selectedElementIds);
  
  // WebSocket
  const { connected, joinDesign } = useWebSocket();
  
  // Toast
  const { toast } = useToast();
  
  // Join design on mount
  useEffect(() => {
    if (connected) {
      joinDesign(1, "User");
    }
  }, [connected, joinDesign]);
  
  // Set initial focus on the app
  useEffect(() => {
    document.body.focus();
  }, []);
  
  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent shortcuts in input fields
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      // Export shortcut (Ctrl+E)
      if (e.key === 'e' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setIsExportDialogOpen(true);
      }
      
      // New design shortcut (Ctrl+N)
      if (e.key === 'n' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        dispatch(clearCanvas());
        toast({
          title: "New Design",
          description: "Canvas cleared. Start creating your new design.",
        });
      }
      
      // Version history shortcut (Ctrl+H)
      if (e.key === 'h' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setIsVersionHistoryOpen(true);
      }
      
      // Template gallery shortcut (Ctrl+T)
      if (e.key === 't' && (e.ctrlKey || e.metaKey) && e.shiftKey) {
        e.preventDefault();
        setIsTemplateGalleryOpen(true);
      }
      
      // AI Assistant shortcut (Ctrl+Shift+A)
      if (e.key === 'a' && (e.ctrlKey || e.metaKey) && e.shiftKey) {
        e.preventDefault();
        setIsAIAssistantOpen(true);
      }
      
      // Vector Shape Creator shortcut (Ctrl+Shift+V)
      if (e.key === 'v' && (e.ctrlKey || e.metaKey) && e.shiftKey) {
        e.preventDefault();
        setIsVectorShapeCreatorOpen(true);
      }
      
      // Comments panel shortcut (Ctrl+Shift+C)
      if (e.key === 'c' && (e.ctrlKey || e.metaKey) && e.shiftKey) {
        e.preventDefault();
        setRightPanelTab("comments");
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dispatch, toast]);
  
  // Handle element selection
  const handleElementSelect = (elementId: number) => {
    dispatch(selectElement(elementId));
    lastSelectedElementRef.current = elementId;
  };
  
  // Handle comment selection
  const handleCommentSelect = (comment: Comment) => {
    setSelectedComment(comment);
  };
  
  // Handle adding a new comment
  const handleAddComment = () => {
    setIsAddingComment(true);
    setRightPanelTab("comments");
    toast({
      title: "Add Comment",
      description: "Click on the canvas to place your comment",
    });
  };
  
  return (
    <div className="h-screen flex flex-col bg-background">
      <AppHeader onExport={() => setIsExportDialogOpen(true)} />
      
      <div className="flex items-center border-b">
        <ToolBar />
        
        <Separator orientation="vertical" className="h-10 mx-2" />
        
        <div className="flex items-center gap-2 ml-auto pr-4">
          <Button 
            variant="ghost" 
            size="sm" 
            className="gap-1.5"
            onClick={() => setIsTemplateGalleryOpen(true)}
          >
            <LayoutTemplate className="h-4 w-4" />
            <span className="hidden md:inline">Templates</span>
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="gap-1.5"
            onClick={() => setIsVectorShapeCreatorOpen(true)}
          >
            <PenSquare className="h-4 w-4" />
            <span className="hidden md:inline">Vector</span>
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="gap-1.5"
            onClick={() => setIsAIAssistantOpen(true)}
          >
            <Sparkles className="h-4 w-4" />
            <span className="hidden md:inline">AI Assistant</span>
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="gap-1.5"
            onClick={() => setIsVersionHistoryOpen(true)}
          >
            <History className="h-4 w-4" />
            <span className="hidden md:inline">History</span>
          </Button>
          
          <CollaborationStatus compact />
        </div>
      </div>
      
      {/* Main content area with panels and canvas */}
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        {/* Left panel - Layers */}
        <ResizablePanel 
          defaultSize={20} 
          minSize={15} 
          maxSize={30}
          className="border-r"
        >
          <div className="h-full flex flex-col">
            <div className="border-b p-2 flex items-center justify-between">
              <h2 className="text-sm font-medium">Layers & Assets</h2>
            </div>
            <LayersPanel />
          </div>
        </ResizablePanel>
        
        <ResizableHandle />
        
        {/* Center - Canvas */}
        <ResizablePanel defaultSize={60}>
          <EnhancedCanvas 
            onElementSelect={handleElementSelect}
          />
        </ResizablePanel>
        
        <ResizableHandle />
        
        {/* Right panel - Properties/Comments */}
        <ResizablePanel 
          defaultSize={20} 
          minSize={15} 
          maxSize={30}
          className="border-l"
        >
          <Tabs 
            defaultValue="properties" 
            value={rightPanelTab}
            onValueChange={setRightPanelTab}
            className="h-full flex flex-col"
          >
            <div className="border-b p-2">
              <TabsList className="grid grid-cols-2">
                <TabsTrigger value="properties" className="text-xs">
                  <Grid3X3 className="h-3.5 w-3.5 mr-1.5" />
                  Properties
                </TabsTrigger>
                <TabsTrigger value="comments" className="text-xs">
                  <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
                  Comments
                </TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="properties" className="flex-1 flex flex-col">
              <PropertiesPanel />
            </TabsContent>
            
            <TabsContent value="comments" className="flex-1 p-0 mt-0">
              {selectedComment ? (
                <CommentDetail 
                  comment={selectedComment} 
                  onClose={() => setSelectedComment(null)} 
                />
              ) : (
                <CommentsList 
                  onCommentSelect={handleCommentSelect}
                  onAddMarker={handleAddComment}
                />
              )}
            </TabsContent>
          </Tabs>
        </ResizablePanel>
      </ResizablePanelGroup>
      
      {/* Export dialog */}
      <ExportDialog 
        open={isExportDialogOpen} 
        onOpenChange={setIsExportDialogOpen} 
      />
      
      {/* Version history dialog */}
      <VersionHistory
        open={isVersionHistoryOpen}
        onOpenChange={setIsVersionHistoryOpen}
      />
      
      {/* Template gallery dialog */}
      <TemplateGallery
        open={isTemplateGalleryOpen}
        onOpenChange={setIsTemplateGalleryOpen}
      />
      
      {/* AI Assistant dialog */}
      <AIDesignAssistant
        open={isAIAssistantOpen}
        onOpenChange={setIsAIAssistantOpen}
      />
      
      {/* Vector Shape Creator dialog */}
      <VectorShapeCreator
        open={isVectorShapeCreatorOpen}
        onOpenChange={setIsVectorShapeCreatorOpen}
      />
    </div>
  );
}
