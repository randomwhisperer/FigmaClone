import React, { useState } from "react";
import {
  ArrowDownToLine,
  FileIcon,
  MoreHorizontal,
  Save,
  PanelLeft,
  PanelRight,
  Moon,
  Sun,
  Share,
  Users,
  Github,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setDocumentName, toggleTheme } from "@/store/slices/designSlice";
import { useTheme } from "@/contexts/ThemeContext";
import { useWebSocket } from "@/contexts/WebSocketContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion } from "framer-motion";

interface AppHeaderProps {
  onExport: () => void;
}

export function AppHeader({ onExport }: AppHeaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [documentName, setLocalDocumentName] = useState("");
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  
  const dispatch = useAppDispatch();
  const title = useAppSelector(state => state.design.present.documentName);
  const canUndo = useAppSelector(state => state.design.past.length > 0);
  const canRedo = useAppSelector(state => state.design.future.length > 0);
  
  const { isDarkMode, toggleDarkMode } = useTheme();
  const { connected, users } = useWebSocket();
  const { toast } = useToast();
  
  // Handle title edit start
  const handleEditStart = () => {
    setLocalDocumentName(title);
    setIsEditing(true);
  };
  
  // Handle title save
  const handleTitleSave = () => {
    if (documentName.trim()) {
      dispatch(setDocumentName(documentName));
    }
    setIsEditing(false);
  };
  
  // Handle save action
  const handleSave = () => {
    toast({
      title: "Design Saved",
      description: "Your design has been saved successfully.",
    });
  };
  
  // Handle share action
  const handleShare = () => {
    setIsShareDialogOpen(true);
  };
  
  // Handle copy share link
  const handleCopyLink = () => {
    navigator.clipboard.writeText("https://design.example.com/shared/design-123");
    toast({
      title: "Link Copied",
      description: "Share link has been copied to clipboard.",
    });
    setIsShareDialogOpen(false);
  };

  return (
    <header className="flex items-center justify-between h-14 px-4 border-b bg-background">
      <div className="flex items-center gap-3">
        <div className="flex items-center">
          {/* Logo */}
          <motion.div
            className="flex items-center justify-center rounded-md bg-primary text-primary-foreground w-9 h-9 mr-3"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FileIcon className="h-5 w-5" />
          </motion.div>
          
          {/* Document Title */}
          {isEditing ? (
            <div className="flex items-center gap-1">
              <Input
                value={documentName}
                onChange={(e) => setLocalDocumentName(e.target.value)}
                className="h-8 max-w-[200px]"
                autoFocus
                onBlur={handleTitleSave}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleTitleSave();
                  if (e.key === 'Escape') setIsEditing(false);
                }}
              />
            </div>
          ) : (
            <div
              className="text-lg font-medium cursor-pointer hover:underline"
              onClick={handleEditStart}
            >
              {title || "Untitled Design"}
            </div>
          )}
          
          {/* Connection status badge */}
          <Badge 
            variant={connected ? "outline" : "destructive"} 
            className="ml-3 text-xs"
          >
            {connected ? "Connected" : "Offline"}
          </Badge>
        </div>
        
        <Separator orientation="vertical" className="h-6" />
        
        {/* Quick actions */}
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleSave}
            className="h-9 w-9"
          >
            <Save className="h-4 w-4" />
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onExport}
            className="h-9 w-9"
          >
            <ArrowDownToLine className="h-4 w-4" />
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleShare}
            className="h-9 w-9"
          >
            <Share className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        {/* Active users */}
        {connected && users.length > 0 && (
          <div className="flex items-center mr-2">
            <div className="flex -space-x-2">
              {users.slice(0, 3).map((user, index) => (
                <Avatar key={user.id} className="h-7 w-7 border-2 border-background">
                  <AvatarFallback style={{ backgroundColor: user.color }}>
                    {user.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              ))}
              {users.length > 3 && (
                <div className="flex items-center justify-center h-7 w-7 rounded-full bg-muted border-2 border-background text-xs font-medium">
                  +{users.length - 3}
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Toggle panels */}
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <PanelLeft className="h-4 w-4" />
        </Button>
        
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <PanelRight className="h-4 w-4" />
        </Button>
        
        {/* Theme toggle */}
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggleDarkMode}
          className="h-9 w-9"
        >
          {isDarkMode ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </Button>
        
        {/* More options */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Options</DropdownMenuLabel>
            <DropdownMenuItem onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Save Project
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onExport}>
              <ArrowDownToLine className="h-4 w-4 mr-2" />
              Export Design
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Github className="h-4 w-4 mr-2" />
              View on GitHub
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Users className="h-4 w-4 mr-2" />
              Invite Collaborators
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={toggleDarkMode}>
              {isDarkMode ? (
                <>
                  <Sun className="h-4 w-4 mr-2" />
                  Light Mode
                </>
              ) : (
                <>
                  <Moon className="h-4 w-4 mr-2" />
                  Dark Mode
                </>
              )}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {/* Share Dialog */}
      <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share Design</DialogTitle>
            <DialogDescription>
              Share your design with collaborators or get a public link
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex items-center space-x-2 mt-4">
            <div className="grid flex-1 gap-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Share Link
              </label>
              <Input
                value="https://design.example.com/shared/design-123"
                readOnly
                className="font-mono text-sm"
              />
            </div>
            <Button 
              type="submit" 
              size="sm" 
              className="px-3"
              onClick={handleCopyLink}
            >
              <span className="sr-only">Copy</span>
              Copy
            </Button>
          </div>
          
          <div className="mt-4">
            <h4 className="text-sm font-medium mb-2">Collaborators</h4>
            <div className="space-y-2">
              {users.map((user) => (
                <div key={user.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-7 w-7">
                      <AvatarFallback style={{ backgroundColor: user.color }}>
                        {user.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{user.username}</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {user.id === 'user-1' ? 'Owner' : 'Editor'}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
          
          <DialogFooter className="sm:justify-start mt-4">
            <Button
              variant="secondary"
              onClick={() => {
                toast({
                  title: "Invitation Sent",
                  description: "Collaborators have been invited to your design.",
                });
                setIsShareDialogOpen(false);
              }}
            >
              <Users className="h-4 w-4 mr-2" />
              Invite More
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  );
}