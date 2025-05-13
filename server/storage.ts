import { designs, elements, users, type User, type InsertUser, type Design, type InsertDesign, type Element, type InsertElement } from "@shared/schema";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Design methods
  getDesigns(): Promise<Design[]>;
  getDesign(id: number): Promise<Design | undefined>;
  createDesign(design: InsertDesign): Promise<Design>;
  updateDesign(id: number, design: Partial<Design>): Promise<Design | undefined>;
  deleteDesign(id: number): Promise<boolean>;
  
  // Element methods
  getElement(id: number): Promise<Element | undefined>;
  getElementsByDesignId(designId: number): Promise<Element[]>;
  createElement(element: InsertElement): Promise<Element>;
  updateElement(id: number, element: Partial<Element>): Promise<Element | undefined>;
  deleteElement(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private designs: Map<number, Design>;
  private elements: Map<number, Element>;
  
  private userId: number;
  private designId: number;
  private elementId: number;

  constructor() {
    this.users = new Map();
    this.designs = new Map();
    this.elements = new Map();
    
    this.userId = 1;
    this.designId = 1;
    this.elementId = 1;
    
    // Create a default user
    this.createUser({
      username: 'demo',
      password: 'password'
    });
    
    // Create a default design
    this.createDesign({
      userId: 1,
      name: 'Untitled Design',
      width: 800,
      height: 600,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Design methods
  async getDesigns(): Promise<Design[]> {
    return Array.from(this.designs.values());
  }
  
  async getDesign(id: number): Promise<Design | undefined> {
    return this.designs.get(id);
  }
  
  async createDesign(insertDesign: InsertDesign): Promise<Design> {
    const id = this.designId++;
    const design: Design = { ...insertDesign, id };
    this.designs.set(id, design);
    return design;
  }
  
  async updateDesign(id: number, updates: Partial<Design>): Promise<Design | undefined> {
    const design = this.designs.get(id);
    if (!design) return undefined;
    
    const updatedDesign = { ...design, ...updates, updatedAt: new Date().toISOString() };
    this.designs.set(id, updatedDesign);
    return updatedDesign;
  }
  
  async deleteDesign(id: number): Promise<boolean> {
    // Delete all associated elements first
    const elements = await this.getElementsByDesignId(id);
    elements.forEach(element => {
      this.elements.delete(element.id);
    });
    
    return this.designs.delete(id);
  }
  
  // Element methods
  async getElement(id: number): Promise<Element | undefined> {
    return this.elements.get(id);
  }
  
  async getElementsByDesignId(designId: number): Promise<Element[]> {
    return Array.from(this.elements.values()).filter(
      (element) => element.designId === designId
    );
  }
  
  async createElement(insertElement: InsertElement): Promise<Element> {
    const id = this.elementId++;
    const element: Element = { ...insertElement, id };
    this.elements.set(id, element);
    return element;
  }
  
  async updateElement(id: number, updates: Partial<Element>): Promise<Element | undefined> {
    const element = this.elements.get(id);
    if (!element) return undefined;
    
    const updatedElement = { ...element, ...updates };
    this.elements.set(id, updatedElement);
    return updatedElement;
  }
  
  async deleteElement(id: number): Promise<boolean> {
    return this.elements.delete(id);
  }
}

export const storage = new MemStorage();
