import { useState } from "react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, Edit, User } from "lucide-react";
import { useDesignStore } from "@/store";

interface AppHeaderProps {
  onExport: () => void;
}

export default function AppHeader({ onExport }: AppHeaderProps) {
  const { documentName, setDocumentName, undo, redo, clearCanvas } = useDesignStore();
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [newName, setNewName] = useState(documentName);
  
  const handleRename = () => {
    setDocumentName(newName);
    setIsRenameDialogOpen(false);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
      if (e.shiftKey) {
        e.preventDefault();
        redo();
      } else {
        e.preventDefault();
        undo();
      }
    }
  };
  
  return (
    <header 
      className="h-12 bg-white border-b border-slate-200 flex items-center justify-between px-3 select-none"
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      {/* File menu section */}
      <div className="flex items-center space-x-2">
        {/* Logo */}
        <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center mr-1">
          <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 18.5C8 16.567 9.567 15 11.5 15H14V18.5C14 20.433 12.433 22 10.5 22C9.04131 22 7.77425 21.1841 7.26274 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M14 11.5C14 9.567 12.433 8 10.5 8H8V15H11.5C12.8978 15 14.1054 14.2041 14.5 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M8 2H14V8H8V2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M14 8C16.2091 8 18 9.79086 18 12C18 14.2091 16.2091 16 14 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        
        <div className="flex items-center space-x-2 text-sm">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="px-2 py-1 h-auto text-sm">File</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-48">
              <DropdownMenuItem onClick={clearCanvas}>
                <span>New</span>
                <span className="ml-auto text-xs text-muted-foreground">Ctrl+N</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {}}>
                <span>Open</span>
                <span className="ml-auto text-xs text-muted-foreground">Ctrl+O</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {}}>
                <span>Save</span>
                <span className="ml-auto text-xs text-muted-foreground">Ctrl+S</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onExport}>
                <span>Export</span>
                <span className="ml-auto text-xs text-muted-foreground">Ctrl+E</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="px-2 py-1 h-auto text-sm">Edit</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-48">
              <DropdownMenuItem onClick={undo}>
                <span>Undo</span>
                <span className="ml-auto text-xs text-muted-foreground">Ctrl+Z</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={redo}>
                <span>Redo</span>
                <span className="ml-auto text-xs text-muted-foreground">Ctrl+Y</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => {}}>
                <span>Cut</span>
                <span className="ml-auto text-xs text-muted-foreground">Ctrl+X</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {}}>
                <span>Copy</span>
                <span className="ml-auto text-xs text-muted-foreground">Ctrl+C</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {}}>
                <span>Paste</span>
                <span className="ml-auto text-xs text-muted-foreground">Ctrl+V</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="px-2 py-1 h-auto text-sm">View</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-48">
              <DropdownMenuItem onClick={() => {}}>
                <span>Zoom In</span>
                <span className="ml-auto text-xs text-muted-foreground">Ctrl++</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {}}>
                <span>Zoom Out</span>
                <span className="ml-auto text-xs text-muted-foreground">Ctrl+-</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {}}>
                <span>Fit to Screen</span>
                <span className="ml-auto text-xs text-muted-foreground">Ctrl+0</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button variant="ghost" className="px-2 py-1 h-auto text-sm">Help</Button>
        </div>
      </div>
      
      {/* Center title */}
      <div className="font-medium flex items-center">
        <span>{documentName}</span>
        <Button 
          variant="ghost" 
          size="icon" 
          className="ml-2 h-6 w-6 text-gray-400 hover:text-gray-600"
          onClick={() => setIsRenameDialogOpen(true)}
        >
          <Edit className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Right side actions */}
      <div className="flex items-center space-x-3">
        <Button 
          variant="outline" 
          size="sm"
          className="flex items-center gap-1"
          onClick={onExport}
        >
          <Download className="h-4 w-4" />
          Export
        </Button>
        <Button className="h-8 w-8 rounded-full p-0 bg-blue-500">
          <User className="h-4 w-4 text-white" />
        </Button>
      </div>
      
      {/* Rename dialog */}
      <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Design</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="name">Design Name</Label>
            <Input 
              id="name" 
              value={newName} 
              onChange={(e) => setNewName(e.target.value)}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRenameDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRename}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  );
}
