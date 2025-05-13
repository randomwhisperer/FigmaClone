import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { apiRequest } from "@/lib/queryClient";
import { log } from "./vite";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get designs
  app.get('/api/designs', async (req, res) => {
    try {
      const designs = await storage.getDesigns();
      res.json(designs);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Get a specific design
  app.get('/api/designs/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const design = await storage.getDesign(id);
      
      if (!design) {
        return res.status(404).json({ message: 'Design not found' });
      }
      
      res.json(design);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Create a new design
  app.post('/api/designs', async (req, res) => {
    try {
      const design = await storage.createDesign(req.body);
      res.status(201).json(design);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Update a design
  app.put('/api/designs/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const design = await storage.updateDesign(id, req.body);
      
      if (!design) {
        return res.status(404).json({ message: 'Design not found' });
      }
      
      res.json(design);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Delete a design
  app.delete('/api/designs/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteDesign(id);
      
      if (!success) {
        return res.status(404).json({ message: 'Design not found' });
      }
      
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Get elements for a design
  app.get('/api/designs/:id/elements', async (req, res) => {
    try {
      const designId = parseInt(req.params.id);
      const elements = await storage.getElementsByDesignId(designId);
      res.json(elements);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Create a new element in a design
  app.post('/api/designs/:id/elements', async (req, res) => {
    try {
      const designId = parseInt(req.params.id);
      const element = await storage.createElement({ ...req.body, designId });
      res.status(201).json(element);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Update an element
  app.put('/api/elements/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const element = await storage.updateElement(id, req.body);
      
      if (!element) {
        return res.status(404).json({ message: 'Element not found' });
      }
      
      res.json(element);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Delete an element
  app.delete('/api/elements/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteElement(id);
      
      if (!success) {
        return res.status(404).json({ message: 'Element not found' });
      }
      
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);
  
  // Add endpoint to get active users for a design
  app.get('/api/designs/:id/users', (req, res) => {
    // This will be used in conjunction with the WebSocket server to show active users
    // For the demo, we'll return a sample list of users
    res.json([
      { id: 'system', username: 'System', color: '#6366F1' }
    ]);
  });
  
  // For now, we'll skip the WebSocket implementation
  // until we resolve the type issues
  log('WebSocket server will be implemented later', 'express');
  
  return httpServer;
}
