import React from 'react';
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { setDocumentName, toggleTheme, setShowExportDialog, clearCanvas } from "@/store/slices/designSlice";
import { undoDesign, redoDesign } from "@/store/store";
import { useTheme } from "@/contexts/ThemeContext";
import { 
  MenuIcon, Moon, Sun, Save, Download, Upload, 
  FileNew, FilePlus, Edit, Undo, Redo, Trash, 
  Settings, HelpCircle, User, ChevronDown, Menu
} from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger,
  DropdownMenuShortcut,
  DropdownMenuLabel,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

interface AppHeaderProps {
  onExport: () => void;
}

export function AppHeader({ onExport }: AppHeaderProps) {
  const dispatch = useAppDispatch();
  const { documentName } = useAppSelector(state => state.design.present);
  const { toast } = useToast();
  const { isDarkMode, toggleDarkMode } = useTheme();
  
  const [isRenameDialogOpen, setIsRenameDialogOpen] = React.useState(false);
  const [newName, setNewName] = React.useState(documentName);
  
  const handleRename = () => {
    dispatch(setDocumentName(newName));
    setIsRenameDialogOpen(false);
    toast({
      title: "Design renamed",
      description: `Design has been renamed to "${newName}"`,
    });
  };
  
  const handleNewDesign = () => {
    dispatch(clearCanvas());
    toast({
      title: "New Design",
      description: "Canvas cleared. Start creating your new design.",
    });
  };
  
  const handleThemeToggle = () => {
    dispatch(toggleTheme());
    toggleDarkMode();
  };
  
  const handleExport = () => {
    dispatch(setShowExportDialog(true));
    onExport();
  };
  
  const handleUndo = () => {
    dispatch(undoDesign());
  };
  
  const handleRedo = () => {
    dispatch(redoDesign());
  };
  
  return (
    <header className="figma-header flex items-center justify-between px-4">
      {/* Logo and left side navigation */}
      <div className="flex items-center space-x-2">
        <motion.div 
          whileHover={{ rotate: 10 }}
          className="w-8 h-8 bg-primary rounded-md flex items-center justify-center mr-1"
        >
          <svg className="w-5 h-5 text-primary-foreground" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 18.5C8 16.567 9.567 15 11.5 15H14V18.5C14 20.433 12.433 22 10.5 22C9.04131 22 7.77425 21.1841 7.26274 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M14 11.5C14 9.567 12.433 8 10.5 8H8V15H11.5C12.8978 15 14.1054 14.2041 14.5 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M8 2H14V8H8V2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M14 8C16.2091 8 18 9.79086 18 12C18 14.2091 16.2091 16 14 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </motion.div>
        
        <div className="hidden md:flex items-center space-x-1">
          {/* File Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="px-2 py-1 h-auto text-sm">
                File
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={handleNewDesign}>
                  <FileNew className="mr-2 h-4 w-4" />
                  <span>New</span>
                  <DropdownMenuShortcut>⌘N</DropdownMenuShortcut>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <FilePlus className="mr-2 h-4 w-4" />
                  <span>Open</span>
                  <DropdownMenuShortcut>⌘O</DropdownMenuShortcut>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Save className="mr-2 h-4 w-4" />
                  <span>Save</span>
                  <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={handleExport}>
                  <Download className="mr-2 h-4 w-4" />
                  <span>Export</span>
                  <DropdownMenuShortcut>⌘E</DropdownMenuShortcut>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Upload className="mr-2 h-4 w-4" />
                  <span>Import</span>
                  <DropdownMenuShortcut>⌘I</DropdownMenuShortcut>
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Edit Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="px-2 py-1 h-auto text-sm">
                Edit
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={handleUndo}>
                  <Undo className="mr-2 h-4 w-4" />
                  <span>Undo</span>
                  <DropdownMenuShortcut>⌘Z</DropdownMenuShortcut>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleRedo}>
                  <Redo className="mr-2 h-4 w-4" />
                  <span>Redo</span>
                  <DropdownMenuShortcut>⇧⌘Z</DropdownMenuShortcut>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem>
                  <Edit className="mr-2 h-4 w-4" />
                  <span>Rename</span>
                  <DropdownMenuShortcut>⌘R</DropdownMenuShortcut>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleNewDesign}>
                  <Trash className="mr-2 h-4 w-4" />
                  <span>Clear Canvas</span>
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* View Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="px-2 py-1 h-auto text-sm">
                View
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuGroup>
                <DropdownMenuItem>
                  <span>Zoom In</span>
                  <DropdownMenuShortcut>⌘+</DropdownMenuShortcut>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <span>Zoom Out</span>
                  <DropdownMenuShortcut>⌘-</DropdownMenuShortcut>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <span>Fit to Screen</span>
                  <DropdownMenuShortcut>⌘0</DropdownMenuShortcut>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleThemeToggle}>
                {isDarkMode ? (
                  <Sun className="mr-2 h-4 w-4" />
                ) : (
                  <Moon className="mr-2 h-4 w-4" />
                )}
                <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Help Button */}
          <Button variant="ghost" size="sm" className="px-2 py-1 h-auto text-sm">
            Help
          </Button>
        </div>
        
        {/* Mobile menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Menu className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="start">
            <DropdownMenuItem onClick={handleNewDesign}>
              <FileNew className="mr-2 h-4 w-4" />
              <span>New Design</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              <span>Export</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleUndo}>
              <Undo className="mr-2 h-4 w-4" />
              <span>Undo</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleRedo}>
              <Redo className="mr-2 h-4 w-4" />
              <span>Redo</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleThemeToggle}>
              {isDarkMode ? (
                <Sun className="mr-2 h-4 w-4" />
              ) : (
                <Moon className="mr-2 h-4 w-4" />
              )}
              <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {/* Center title */}
      <div className="flex items-center">
        <Button
          variant="ghost"
          className="font-medium text-sm flex items-center gap-1"
          onClick={() => setIsRenameDialogOpen(true)}
        >
          <span className="truncate max-w-[200px]">{documentName}</span>
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </div>
      
      {/* Right side actions */}
      <div className="flex items-center space-x-2">
        <Button
          variant="ghost"
          size="sm"
          className="hidden md:flex items-center gap-1"
          onClick={handleExport}
        >
          <Download className="h-4 w-4" />
          <span className="hidden lg:inline">Export</span>
        </Button>
        
        <Button
          variant="outline"
          size="icon"
          onClick={handleThemeToggle}
          className="hidden md:flex"
        >
          {isDarkMode ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon" variant="ghost">
              <User className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <HelpCircle className="mr-2 h-4 w-4" />
              <span>Help & Feedback</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {/* Rename dialog */}
      <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Rename Design</DialogTitle>
            <DialogDescription>
              Enter a new name for your design
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="name">Design Name</Label>
            <Input 
              id="name" 
              value={newName} 
              onChange={(e) => setNewName(e.target.value)}
              className="mt-1"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRenameDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRename}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  );
}