import { AppBlock, events } from "@slflows/sdk/v1";

/**
 * Database Event Subscription Block
 *
 * Subscribes to Notion database webhook events including:
 * - database.created
 * - database.content_updated
 * - database.moved
 * - database.deleted
 * - database.undeleted
 * - database.schema_updated
 *
 * Note: Database events are deprecated in API version 2025-09-03.
 * Use Data Source events for newer integrations.
 *
 * @see https://developers.notion.com/reference/webhooks-events-delivery
 */
export const databaseSubscription: AppBlock = {
  name: "Database Events Subscription",
  description:
    "Subscribes to Notion database webhook events (created, updated, deleted, moved, schema changes, etc.). Note: Deprecated in API version 2025-09-03, use Data Source events instead.",
  category: "Webhooks",
  entrypoint: true,

  config: {
    eventTypes: {
      name: "Event Types",
      description:
        "Select which database event types to listen for. Leave empty to receive all database events.",
      type: {
        type: "array",
        items: {
          type: "string",
          enum: [
            "database.created",
            "database.content_updated",
            "database.moved",
            "database.deleted",
            "database.undeleted",
            "database.schema_updated",
          ],
        },
      },
      required: false,
    },
    databaseId: {
      name: "Database ID (Optional)",
      description:
        "If specified, only events for this specific database will be received. Leave empty to receive events for all databases.",
      type: "string",
      required: false,
    },
  },

  async onInternalMessage({ message }) {
    const webhookEvent = message.body;
    // Filtering is handled at the routing level in handleWebhookSubscriptions
    await events.emit(webhookEvent);
  },

  outputs: {
    default: {
      name: "On Database Event",
      description:
        "Emitted when a database event occurs. Contains the complete Notion webhook event payload.",
      type: {
        type: "object",
        description:
          "Notion database webhook event payload. See https://developers.notion.com/reference/webhooks-events-delivery for details.",
        properties: {
          id: {
            type: "string",
            description: "Unique identifier for this webhook event",
          },
          type: {
            type: "string",
            enum: [
              "database.created",
              "database.content_updated",
              "database.moved",
              "database.deleted",
              "database.undeleted",
              "database.schema_updated",
            ],
            description: "The type of database event",
          },
          timestamp: {
            type: "string",
            description: "ISO 8601 timestamp of when the event occurred",
          },
          workspace_id: {
            type: "string",
            description: "ID of the workspace where the event occurred",
          },
          authors: {
            type: "array",
            description: "Array of user IDs who triggered this event",
            items: {
              type: "object",
              properties: {
                id: {
                  type: "string",
                  description: "User ID",
                },
              },
            },
          },
          entity: {
            type: "object",
            description: "Information about the entity (database) that changed",
            properties: {
              id: {
                type: "string",
                description: "Database ID",
              },
            },
          },
          data: {
            type: "object",
            description:
              "Event-specific data payload containing the database object or changes",
          },
        },
        required: ["id", "type", "timestamp", "workspace_id", "entity"],
      },
    },
  },
};
