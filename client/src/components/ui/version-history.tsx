import React, { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { undoDesign, redoDesign } from "@/store/store";
import { format, formatDistanceToNow } from 'date-fns';
import { motion } from "framer-motion";
import {
  History,
  Clock,
  RotateCcw,
  RotateCw,
  Flag,
  Save,
  Clock3,
  Calendar,
  User,
  FileClock,
  ClockRewind,
  Download,
  GitCommit,
  Info,
  Code
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface Version {
  id: string;
  timestamp: Date;
  author: string;
  authorColor: string;
  changes: string[];
  isMajor: boolean;
  name: string | null;
}

interface VersionHistoryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Generate demo version history
const generateVersionHistory = (): Version[] => {
  const now = new Date();
  
  return [
    {
      id: "v1.0.0",
      timestamp: new Date(now.getTime() - 60 * 60 * 1000), // 1 hour ago
      author: "Current User",
      authorColor: "#3b82f6",
      changes: ["Added header section", "Updated color palette", "Fixed alignment issues"],
      isMajor: true,
      name: "Finalized homepage design"
    },
    {
      id: "v0.9.1",
      timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
      author: "Current User",
      authorColor: "#3b82f6",
      changes: ["Adjusted button colors", "Improved spacing in navigation menu"],
      isMajor: false,
      name: null
    },
    {
      id: "v0.9.0",
      timestamp: new Date(now.getTime() - 3 * 60 * 60 * 1000), // 3 hours ago
      author: "John Smith",
      authorColor: "#10b981",
      changes: ["Implemented new navigation layout", "Added user profile section"],
      isMajor: true,
      name: "Navigation redesign"
    },
    {
      id: "v0.8.2",
      timestamp: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      author: "Emma Wilson",
      authorColor: "#f97316",
      changes: ["Fixed mobile responsive issues", "Updated typography styles"],
      isMajor: false,
      name: null
    },
    {
      id: "v0.8.1",
      timestamp: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      author: "Alex Johnson",
      authorColor: "#8b5cf6",
      changes: ["Added footer section", "Implemented social media icons"],
      isMajor: false,
      name: null
    },
    {
      id: "v0.8.0",
      timestamp: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      author: "Current User",
      authorColor: "#3b82f6",
      changes: ["Initial design layout", "Set up color scheme", "Created basic components"],
      isMajor: true,
      name: "Initial design structure"
    }
  ];
};

// Action history entry
interface ActionHistoryEntry {
  id: string;
  action: string;
  timestamp: Date;
  type: 'add' | 'update' | 'delete' | 'undo' | 'redo';
  details?: string;
}

// Generate demo action history
const generateActionHistory = (): ActionHistoryEntry[] => {
  const now = new Date();
  const history: ActionHistoryEntry[] = [];
  
  // Generate the last 20 actions
  for (let i = 0; i < 20; i++) {
    const time = new Date(now.getTime() - i * 30 * 1000); // 30 second intervals
    
    let entry: ActionHistoryEntry;
    
    switch (i % 5) {
      case 0:
        entry = {
          id: `action-${20 - i}`,
          action: "Added rectangle element",
          timestamp: time,
          type: 'add',
          details: "Created new rectangle at x:150, y:200"
        };
        break;
      case 1:
        entry = {
          id: `action-${20 - i}`,
          action: "Updated element properties",
          timestamp: time,
          type: 'update',
          details: "Changed fill color to #3b82f6"
        };
        break;
      case 2:
        entry = {
          id: `action-${20 - i}`,
          action: "Deleted element",
          timestamp: time,
          type: 'delete',
          details: "Removed text element"
        };
        break;
      case 3:
        entry = {
          id: `action-${20 - i}`,
          action: "Undid last action",
          timestamp: time,
          type: 'undo'
        };
        break;
      case 4:
        entry = {
          id: `action-${20 - i}`,
          action: "Redid action",
          timestamp: time,
          type: 'redo'
        };
        break;
      default:
        entry = {
          id: `action-${20 - i}`,
          action: "Unknown action",
          timestamp: time,
          type: 'update'
        };
    }
    
    history.push(entry);
  }
  
  return history;
};

export function VersionHistory({ open, onOpenChange }: VersionHistoryProps) {
  const [activeTab, setActiveTab] = useState("versions");
  const [versions, setVersions] = useState<Version[]>(generateVersionHistory());
  const [actionHistory, setActionHistory] = useState<ActionHistoryEntry[]>(generateActionHistory());
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);
  const [isCreatingVersion, setIsCreatingVersion] = useState(false);
  const [versionName, setVersionName] = useState("");
  const [isMajorVersion, setIsMajorVersion] = useState(false);
  
  const { toast } = useToast();
  const dispatch = useAppDispatch();
  const canUndo = useAppSelector(state => state.design.past.length > 0);
  const canRedo = useAppSelector(state => state.design.future.length > 0);
  
  // Handle version creation
  const handleCreateVersion = () => {
    const newVersion: Version = {
      id: `v${versions[0].id.substring(1).split('.')[0]}.${parseInt(versions[0].id.substring(1).split('.')[1]) + 1}.0`,
      timestamp: new Date(),
      author: "Current User",
      authorColor: "#3b82f6",
      changes: ["Created new version"],
      isMajor: isMajorVersion,
      name: versionName.trim() || null
    };
    
    setVersions(prev => [newVersion, ...prev]);
    
    toast({
      title: "Version Created",
      description: `Version ${newVersion.id} has been created${newVersion.name ? `: ${newVersion.name}` : ''}.`,
    });
    
    setIsCreatingVersion(false);
    setVersionName("");
    setIsMajorVersion(false);
  };
  
  // Restore a specific version
  const handleRestoreVersion = () => {
    if (!selectedVersion) return;
    
    const version = versions.find(v => v.id === selectedVersion);
    if (!version) return;
    
    toast({
      title: "Version Restored",
      description: `Restored to version ${version.id}${version.name ? `: ${version.name}` : ''}.`,
    });
    
    setSelectedVersion(null);
    onOpenChange(false);
  };
  
  // Handle undo action
  const handleUndo = () => {
    if (canUndo) {
      dispatch(undoDesign());
      
      // Add to action history
      const newAction: ActionHistoryEntry = {
        id: `action-${Date.now()}`,
        action: "Undid last action",
        timestamp: new Date(),
        type: 'undo'
      };
      
      setActionHistory(prev => [newAction, ...prev]);
    }
  };
  
  // Handle redo action
  const handleRedo = () => {
    if (canRedo) {
      dispatch(redoDesign());
      
      // Add to action history
      const newAction: ActionHistoryEntry = {
        id: `action-${Date.now()}`,
        action: "Redid action",
        timestamp: new Date(),
        type: 'redo'
      };
      
      setActionHistory(prev => [newAction, ...prev]);
    }
  };
  
  // Get icon for action type
  const getActionIcon = (type: ActionHistoryEntry['type']) => {
    switch (type) {
      case 'add':
        return <Plus className="h-3.5 w-3.5" />;
      case 'update':
        return <GitCommit className="h-3.5 w-3.5" />;
      case 'delete':
        return <Trash2 className="h-3.5 w-3.5" />;
      case 'undo':
        return <RotateCcw className="h-3.5 w-3.5" />;
      case 'redo':
        return <RotateCw className="h-3.5 w-3.5" />;
      default:
        return <Info className="h-3.5 w-3.5" />;
    }
  };
  
  // Get color for action type
  const getActionColor = (type: ActionHistoryEntry['type']) => {
    switch (type) {
      case 'add':
        return "bg-green-500";
      case 'update':
        return "bg-blue-500";
      case 'delete':
        return "bg-red-500";
      case 'undo':
        return "bg-amber-500";
      case 'redo':
        return "bg-purple-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            Version History
          </DialogTitle>
          <DialogDescription>
            View and manage your design history and versions
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between mb-4">
          <Tabs defaultValue="versions" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-2">
              <TabsTrigger value="versions" className="flex gap-1.5 items-center">
                <Flag className="h-4 w-4" />
                <span>Saved Versions</span>
              </TabsTrigger>
              <TabsTrigger value="history" className="flex gap-1.5 items-center">
                <Clock className="h-4 w-4" />
                <span>Action History</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        {/* Versions Tab */}
        <TabsContent value="versions" className="flex-1 h-[400px] mt-0">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium flex items-center gap-1.5">
              <FileClock className="h-4 w-4 text-muted-foreground" />
              <span>All Versions</span>
            </h3>
            <Button 
              size="sm" 
              onClick={() => setIsCreatingVersion(true)}
              disabled={isCreatingVersion}
            >
              <Save className="h-4 w-4 mr-1.5" />
              Save Version
            </Button>
          </div>
          
          {isCreatingVersion ? (
            <div className="border rounded-lg p-4 mb-4 space-y-3">
              <h3 className="font-medium text-sm">Create New Version</h3>
              <div className="space-y-1.5">
                <label htmlFor="version-name" className="text-sm font-medium">
                  Version Name (optional)
                </label>
                <input
                  id="version-name"
                  type="text"
                  placeholder="e.g. Homepage Redesign"
                  value={versionName}
                  onChange={(e) => setVersionName(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border text-sm"
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  id="major-version"
                  type="checkbox"
                  checked={isMajorVersion}
                  onChange={(e) => setIsMajorVersion(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <label htmlFor="major-version" className="text-sm">
                  Mark as major version
                </label>
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    setIsCreatingVersion(false);
                    setVersionName("");
                    setIsMajorVersion(false);
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  size="sm" 
                  onClick={handleCreateVersion}
                >
                  Create Version
                </Button>
              </div>
            </div>
          ) : null}
          
          <ScrollArea className={cn(
            "pr-4",
            isCreatingVersion ? "h-[290px]" : "h-[350px]"
          )}>
            <div className="space-y-3">
              {versions.map((version) => (
                <div
                  key={version.id}
                  className={cn(
                    "border rounded-lg p-3 transition-colors",
                    selectedVersion === version.id
                      ? "border-primary bg-primary/5"
                      : "hover:border-primary/50"
                  )}
                  onClick={() => setSelectedVersion(version.id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={version.isMajor ? "default" : "outline"}>
                        {version.id}
                      </Badge>
                      {version.name && (
                        <span className="font-medium text-sm">{version.name}</span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      {format(version.timestamp, 'MMM d, h:mm a')}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1.5 mb-2">
                    <div
                      className="h-4 w-4 rounded-full flex items-center justify-center text-[10px] text-white font-medium"
                      style={{ backgroundColor: version.authorColor }}
                    >
                      {version.author.charAt(0)}
                    </div>
                    <span className="text-xs">{version.author}</span>
                  </div>
                  
                  <div className="space-y-1">
                    {version.changes.map((change, index) => (
                      <div key={index} className="flex items-start gap-1.5">
                        <div className="min-w-[16px] h-4 flex items-center justify-center">
                          <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1" />
                        </div>
                        <p className="text-xs">{change}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
          
          <div className="mt-3 flex justify-between">
            <div className="text-xs text-muted-foreground">
              {versions.length} versions • 
              {versions.filter(v => v.isMajor).length} major, 
              {versions.filter(v => !v.isMajor).length} minor
            </div>
            <Button
              size="sm"
              disabled={!selectedVersion}
              onClick={handleRestoreVersion}
            >
              <ClockRewind className="h-4 w-4 mr-1.5" />
              Restore Selected
            </Button>
          </div>
        </TabsContent>
        
        {/* History Tab */}
        <TabsContent value="history" className="flex-1 h-[400px] mt-0">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium flex items-center gap-1.5">
              <Clock3 className="h-4 w-4 text-muted-foreground" />
              <span>Recent Actions</span>
            </h3>
            <div className="flex items-center gap-2">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={handleUndo}
                disabled={!canUndo}
              >
                <RotateCcw className="h-4 w-4 mr-1.5" />
                Undo
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={handleRedo}
                disabled={!canRedo}
              >
                <RotateCw className="h-4 w-4 mr-1.5" />
                Redo
              </Button>
            </div>
          </div>
          
          <ScrollArea className="h-[350px] pr-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Time</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead className="text-right">Type</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {actionHistory.map((action) => (
                  <TableRow key={action.id}>
                    <TableCell className="text-xs text-muted-foreground">
                      {format(action.timestamp, 'h:mm:ss a')}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="text-sm font-medium">{action.action}</div>
                        {action.details && (
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {action.details}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant="outline"
                        className="h-6 ml-auto flex items-center gap-1"
                      >
                        <span 
                          className={cn(
                            "h-2 w-2 rounded-full",
                            getActionColor(action.type)
                          )} 
                        />
                        {action.type}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
          
          <div className="mt-3 flex justify-between">
            <div className="text-xs text-muted-foreground">
              Showing {actionHistory.length} recent actions
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const jsonHistory = JSON.stringify(actionHistory, null, 2);
                const blob = new Blob([jsonHistory], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'action-history.json';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                
                toast({
                  title: "History Exported",
                  description: "Action history has been exported as JSON.",
                });
              }}
            >
              <Download className="h-4 w-4 mr-1.5" />
              Export History
            </Button>
          </div>
        </TabsContent>
        
        <DialogFooter className="mt-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Code className="h-3.5 w-3.5" />
            Version control enabled
          </div>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}