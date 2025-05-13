import React from "react";
import { useWebSocket } from "@/contexts/WebSocketContext";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Wifi, WifiOff, Users, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CollaborationStatusProps {
  className?: string;
  showShareButton?: boolean;
  compact?: boolean;
}

export function CollaborationStatus({ 
  className, 
  showShareButton = true,
  compact = false
}: CollaborationStatusProps) {
  const { connected, users, clientId, joinDesign } = useWebSocket();

  // Filter out the current user
  const otherUsers = users.filter(user => user.id !== clientId);
  
  // Generate a shareable link (in a real app, this would create a unique link)
  const handleShare = () => {
    // In a production app, this would create a unique shareable link
    const shareLink = `${window.location.origin}${window.location.pathname}?design=1`;
    
    // Copy to clipboard
    navigator.clipboard.writeText(shareLink);
    
    // You would typically show a toast notification here
    console.log("Shareable link copied to clipboard:", shareLink);
  };

  return (
    <div className={cn("flex items-center gap-2 p-2", className)}>
      {/* Connection status */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center">
              {connected ? (
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  className="text-green-500"
                >
                  <Wifi className="h-4 w-4" />
                </motion.div>
              ) : (
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  className="text-red-500"
                >
                  <WifiOff className="h-4 w-4" />
                </motion.div>
              )}
              
              {!compact && (
                <span className="ml-1.5 text-xs font-medium">
                  {connected ? "Connected" : "Disconnected"}
                </span>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>{connected ? "Connected to collaboration server" : "Not connected to collaboration server"}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Divider */}
      <div className="h-4 w-px bg-border"></div>

      {/* Users count */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center">
              <Users className="h-4 w-4 text-muted-foreground" />
              {!compact && (
                <span className="ml-1.5 text-xs font-medium">{users.length} user{users.length !== 1 ? "s" : ""}</span>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>
              {users.length === 1
                ? "You are the only user in this design"
                : `${users.length} users collaborating on this design`}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* User avatars */}
      {otherUsers.length > 0 && (
        <div className="flex -space-x-2">
          {otherUsers.slice(0, 3).map((user) => (
            <TooltipProvider key={user.id}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Avatar className="h-6 w-6 border-2 border-background">
                    <AvatarFallback style={{ backgroundColor: user.color }}>
                      {user.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>{user.username}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}

          {otherUsers.length > 3 && (
            <Avatar className="h-6 w-6 border-2 border-background">
              <AvatarFallback>+{otherUsers.length - 3}</AvatarFallback>
            </Avatar>
          )}
        </div>
      )}

      {/* Share button */}
      {showShareButton && (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs ml-1"
          onClick={handleShare}
        >
          <UserPlus className="h-3.5 w-3.5 mr-1" />
          Share
        </Button>
      )}
    </div>
  );
}