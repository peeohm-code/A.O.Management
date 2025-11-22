import { eq, asc, inArray } from "drizzle-orm";
import {
  checklistTemplates,
  checklistTemplateItems,
} from "../../drizzle/schema";
import { BaseRepository } from "./base.repository";

/**
 * Template Repository
 * 
 * Handles all checklist template-related database operations including:
 * - Checklist template CRUD operations
 * - Template items management
 * - Template categories and stages
 */
export class TemplateRepository extends BaseRepository {
  /**
   * Create checklist template
   */
  async createChecklistTemplate(data: {
    name: string;
    category?: string;
    stage: "pre_execution" | "in_progress" | "post_execution";
    description?: string;
    allowGeneralComments?: boolean;
    allowPhotos?: boolean;
    createdBy: number;
  }) {
    this.ensureDatabaseAvailable();
    if (!this.db) throw new Error("Database not available");

    const [result] = await this.db.insert(checklistTemplates).values({
      name: data.name,
      category: data.category,
      stage: data.stage,
      description: data.description,
      allowGeneralComments: data.allowGeneralComments ? 1 : 0,
      allowPhotos: data.allowPhotos ? 1 : 0,
      createdBy: data.createdBy,
    });

    // Handle BigInt conversion properly
    const insertId = parseInt(String(result.insertId));
    
    if (isNaN(insertId) || insertId === 0) {
      throw new Error(`Invalid insertId: ${result.insertId}`);
    }
    
    return { insertId };
  }

  /**
   * Update checklist template
   */
  async updateChecklistTemplate(
    id: number,
    data: {
      name?: string;
      category?: string;
      stage?: "pre_execution" | "in_progress" | "post_execution";
      description?: string;
      allowGeneralComments?: boolean;
      allowPhotos?: boolean;
    }
  ) {
    this.ensureDatabaseAvailable();
    if (!this.db) throw new Error("Database not available");

    const updateData: any = { ...data };
    if (data.allowGeneralComments !== undefined) {
      updateData.allowGeneralComments = data.allowGeneralComments ? 1 : 0;
    }
    if (data.allowPhotos !== undefined) {
      updateData.allowPhotos = data.allowPhotos ? 1 : 0;
    }

    return await this.db.update(checklistTemplates).set(updateData).where(eq(checklistTemplates.id, id));
  }

  /**
   * Delete checklist template items
   */
  async deleteChecklistTemplateItems(templateId: number) {
    this.ensureDatabaseAvailable();
    if (!this.db) throw new Error("Database not available");

    return await this.db.delete(checklistTemplateItems).where(eq(checklistTemplateItems.templateId, templateId));
  }

  /**
   * Delete checklist template
   */
  async deleteChecklistTemplate(id: number) {
    this.ensureDatabaseAvailable();
    if (!this.db) throw new Error("Database not available");

    // First delete all items associated with this template
    await this.deleteChecklistTemplateItems(id);
    
    // Then delete the template itself
    return await this.db.delete(checklistTemplates).where(eq(checklistTemplates.id, id));
  }

  /**
   * Get checklist template by ID
   */
  async getChecklistTemplateById(id: number) {
    if (!this.db) return undefined;

    const result = await this.db
      .select()
      .from(checklistTemplates)
      .where(eq(checklistTemplates.id, id))
      .limit(1);
    return result.length > 0 ? result[0] : undefined;
  }

  /**
   * Get all checklist templates
   */
  async getAllChecklistTemplates() {
    if (!this.db) return [];

    return await this.db.select().from(checklistTemplates).orderBy(checklistTemplates.name);
  }

  /**
   * Get checklist templates by stage
   */
  async getChecklistTemplatesByStage(stage: "pre_execution" | "in_progress" | "post_execution") {
    if (!this.db) return [];

    const templates = await this.db
      .select()
      .from(checklistTemplates)
      .where(eq(checklistTemplates.stage, stage));

    // Fetch items for each template
    const templatesWithItems = await Promise.all(
      templates.map(async (template: any) => {
        const items = await this.db!
          .select()
          .from(checklistTemplateItems)
          .where(eq(checklistTemplateItems.templateId, template.id))
          .orderBy(checklistTemplateItems.order);
        return { ...template, items };
      })
    );

    return templatesWithItems;
  }

  /**
   * Add checklist template item
   */
  async addChecklistTemplateItem(data: {
    templateId: number;
    itemText: string;
    order: number;
  }) {
    this.ensureDatabaseAvailable();
    if (!this.db) throw new Error("Database not available");

    return await this.db.insert(checklistTemplateItems).values({
      templateId: data.templateId,
      itemText: data.itemText,
      order: data.order,
    });
  }

  /**
   * Get checklist template items
   */
  async getChecklistTemplateItems(templateId: number) {
    if (!this.db) return [];

    return await this.db
      .select()
      .from(checklistTemplateItems)
      .where(eq(checklistTemplateItems.templateId, templateId))
      .orderBy(asc(checklistTemplateItems.order));
  }

  /**
   * Batch get checklist template items for multiple templates
   */
  async getBatchChecklistTemplateItems(templateIds: number[]) {
    if (!this.db || templateIds.length === 0) return new Map();

    // Get all items for these templates in one query
    const allItems = await this.db
      .select()
      .from(checklistTemplateItems)
      .where(inArray(checklistTemplateItems.templateId, templateIds))
      .orderBy(asc(checklistTemplateItems.order));

    // Group items by template ID
    const itemsByTemplate = new Map<number, any[]>();
    for (const item of allItems) {
      const items = itemsByTemplate.get(item.templateId) || [];
      items.push(item);
      itemsByTemplate.set(item.templateId, items);
    }

    return itemsByTemplate;
  }
}
