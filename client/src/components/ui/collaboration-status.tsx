import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useWebSocket } from "@/contexts/WebSocketContext";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { 
  Badge, 
  ButtonProps 
} from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Signal,
  Users,
  UserCheck,
  UserPlus,
  UserMinus,
  AlertCircle,
  CheckCircle2,
  Wifi,
  WifiOff,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CollaborationStatusProps {
  compact?: boolean;
  variant?: ButtonProps["variant"];
}

export function CollaborationStatus({ 
  compact = false, 
  variant = "outline" 
}: CollaborationStatusProps) {
  const [showDetails, setShowDetails] = useState(false);
  const { connected, users, clientId } = useWebSocket();

  // Calculate number of active users
  const activeUsers = connected ? users.length : 0;
  
  // Find current user
  const currentUser = users.find(user => user.id === clientId);
  
  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant={variant} 
              size={compact ? "sm" : "default"} 
              className={cn(
                "gap-1.5 relative",
                !connected && "text-destructive"
              )}
              onClick={() => setShowDetails(true)}
            >
              {connected ? (
                <>
                  <Signal className={compact ? "h-4 w-4" : "h-5 w-5"} />
                  {!compact && (
                    <span>Live</span>
                  )}
                  <Badge 
                    variant="secondary"
                    className="h-5 px-1 inline-flex items-center text-xs font-semibold"
                  >
                    {activeUsers}
                  </Badge>
                  
                  {/* Pulsing effect */}
                  <span className="absolute right-0 top-0 flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
                  </span>
                </>
              ) : (
                <>
                  <WifiOff className={compact ? "h-4 w-4" : "h-5 w-5"} />
                  {!compact && (
                    <span>Offline</span>
                  )}
                </>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {connected ? (
              <div className="text-xs">
                <p className="font-medium">Connected to Collaboration Server</p>
                <p className="text-muted-foreground">{activeUsers} active collaborators</p>
              </div>
            ) : (
              <div className="text-xs">
                <p className="font-medium">Offline Mode</p>
                <p className="text-muted-foreground">Reconnecting to server...</p>
              </div>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Collaboration Status
            </DialogTitle>
            <DialogDescription>
              {connected 
                ? "Real-time collaboration is active with other users"
                : "Currently in offline mode. Reconnecting..."}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="flex items-center gap-2 mb-4">
              <div className={cn(
                "h-8 w-8 rounded-full flex items-center justify-center",
                connected ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
              )}>
                {connected ? (
                  <Wifi className="h-4 w-4" />
                ) : (
                  <WifiOff className="h-4 w-4" />
                )}
              </div>
              <div>
                <div className="font-medium">
                  {connected ? "Connected" : "Disconnected"}
                </div>
                <div className="text-sm text-muted-foreground">
                  {connected 
                    ? "Real-time updates are enabled" 
                    : "Attempting to reconnect..."}
                </div>
              </div>
            </div>
            
            <div className="border rounded-md">
              <div className="p-3 border-b">
                <h3 className="font-medium text-sm">Connected Users ({activeUsers})</h3>
              </div>
              
              <div className="p-2 max-h-[200px] overflow-y-auto">
                {connected ? (
                  users.length > 0 ? (
                    <div className="space-y-2">
                      {users.map(user => (
                        <div 
                          key={user.id}
                          className={cn(
                            "flex items-center justify-between p-2 rounded-md",
                            user.id === clientId && "bg-muted"
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <Avatar className="h-7 w-7">
                              <AvatarFallback style={{ backgroundColor: user.color }}>
                                {user.username.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium">
                              {user.username} {user.id === clientId && "(You)"}
                            </span>
                          </div>
                          
                          <div className="flex items-center">
                            <Badge variant="outline" className="text-xs">
                              <div className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5" />
                              Active
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-4 text-center">
                      <Users className="h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">No users connected</p>
                    </div>
                  )
                ) : (
                  <div className="flex flex-col items-center justify-center py-4 text-center">
                    <AlertCircle className="h-8 w-8 text-amber-500 mb-2" />
                    <p className="text-sm text-muted-foreground">Unable to retrieve users</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex flex-col gap-2 mt-4">
              <h3 className="font-medium text-sm">Recent Activity</h3>
              
              <AnimatePresence>
                {connected && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-2"
                  >
                    <div className="flex items-start gap-2 text-xs">
                      <div className="bg-muted rounded-full h-5 w-5 flex items-center justify-center mt-0.5">
                        <UserCheck className="h-3 w-3" />
                      </div>
                      <div>
                        <div className="font-medium">You joined the design</div>
                        <div className="text-muted-foreground">Just now</div>
                      </div>
                    </div>
                    
                    {users.length > 1 && (
                      <div className="flex items-start gap-2 text-xs">
                        <div className="bg-muted rounded-full h-5 w-5 flex items-center justify-center mt-0.5">
                          <UserPlus className="h-3 w-3" />
                        </div>
                        <div>
                          <div className="font-medium">
                            {users.filter(u => u.id !== clientId)[0].username} joined
                          </div>
                          <div className="text-muted-foreground">2 minutes ago</div>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-start gap-2 text-xs">
                      <div className="bg-muted rounded-full h-5 w-5 flex items-center justify-center mt-0.5">
                        <UserMinus className="h-3 w-3" />
                      </div>
                      <div>
                        <div className="font-medium">Alex left the design</div>
                        <div className="text-muted-foreground">15 minutes ago</div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              
              {!connected && (
                <div className="p-3 border rounded-md flex items-center justify-center">
                  <p className="text-sm text-muted-foreground">Activity log unavailable</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setShowDetails(false)}>
              Close
            </Button>
            
            {currentUser && (
              <Button 
                variant="default"
                onClick={() => {
                  setShowDetails(false);
                }}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                I'm Still Here
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}