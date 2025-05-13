import { useState, useEffect } from "react";
import AppHeader from "@/components/AppHeader";
import ToolBar from "@/components/ToolBar";
import LayersPanel from "@/components/LayersPanel";
import Canvas from "@/components/Canvas";
import PropertiesPanel from "@/components/PropertiesPanel";
import ExportDialog from "@/components/ExportDialog";
import { useDesignStore } from "@/store";
import { useToast } from "@/hooks/use-toast";

export default function Design() {
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const { setActiveTool } = useDesignStore();
  const { toast } = useToast();
  
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
      
      // Export shortcut
      if (e.key === 'e' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setIsExportDialogOpen(true);
      }
      
      // Ctrl+N for new design
      if (e.key === 'n' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        useDesignStore.getState().clearCanvas();
        toast({
          title: "New Design",
          description: "Canvas cleared. Start creating your new design.",
        });
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  return (
    <div className="h-screen flex flex-col bg-[#F0F0F0] text-slate-900 font-sans">
      <AppHeader onExport={() => setIsExportDialogOpen(true)} />
      <ToolBar />
      
      {/* Main content area with panels and canvas */}
      <div className="flex-1 flex overflow-hidden">
        <LayersPanel />
        <Canvas />
        <PropertiesPanel />
      </div>
      
      {/* Export dialog */}
      <ExportDialog 
        open={isExportDialogOpen} 
        onOpenChange={setIsExportDialogOpen} 
      />
    </div>
  );
}
