import { AppBlock, events } from "@slflows/sdk/v1";

/**
 * Page Event Subscription Block
 *
 * Subscribes to Notion page webhook events including:
 * - page.created
 * - page.properties_updated
 * - page.content_updated
 * - page.moved
 * - page.deleted
 * - page.undeleted
 * - page.locked
 * - page.unlocked
 *
 * @see https://developers.notion.com/reference/webhooks-events-delivery
 */
export const pageSubscription: AppBlock = {
  name: "Page Events Subscription",
  description:
    "Subscribes to Notion page webhook events (created, updated, deleted, moved, locked, unlocked, etc.)",
  category: "Webhooks",
  entrypoint: true,

  config: {
    eventTypes: {
      name: "Event Types",
      description:
        "Select which page event types to listen for. Leave empty to receive all page events.",
      type: {
        type: "array",
        items: {
          type: "string",
          enum: [
            "page.created",
            "page.properties_updated",
            "page.content_updated",
            "page.moved",
            "page.deleted",
            "page.undeleted",
            "page.locked",
            "page.unlocked",
          ],
        },
      },
      required: false,
    },
    pageId: {
      name: "Page ID (Optional)",
      description:
        "If specified, only events for this specific page will be received. Leave empty to receive events for all pages.",
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
      name: "On Page Event",
      description:
        "Emitted when a page event occurs. Contains the complete Notion webhook event payload.",
      type: {
        type: "object",
        description:
          "Notion page webhook event payload. See https://developers.notion.com/reference/webhooks-events-delivery for details.",
        properties: {
          id: {
            type: "string",
            description: "Unique identifier for this webhook event",
          },
          type: {
            type: "string",
            enum: [
              "page.created",
              "page.properties_updated",
              "page.content_updated",
              "page.moved",
              "page.deleted",
              "page.undeleted",
              "page.locked",
              "page.unlocked",
            ],
            description: "The type of page event",
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
            description: "Information about the entity (page) that changed",
            properties: {
              id: {
                type: "string",
                description: "Page ID",
              },
            },
          },
          data: {
            type: "object",
            description:
              "Event-specific data payload containing the page object or changes",
          },
        },
        required: ["id", "type", "timestamp", "workspace_id", "entity"],
      },
    },
  },
};
