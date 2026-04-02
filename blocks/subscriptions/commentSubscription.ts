import { AppBlock, events } from "@slflows/sdk/v1";

/**
 * Comment Event Subscription Block
 *
 * Subscribes to Notion comment webhook events including:
 * - comment.created
 * - comment.updated
 * - comment.deleted
 *
 * @see https://developers.notion.com/reference/webhooks-events-delivery
 */
export const commentSubscription: AppBlock = {
  name: "Comment Events Subscription",
  description:
    "Subscribes to Notion comment webhook events (created, updated, deleted)",
  category: "Webhooks",
  entrypoint: true,

  config: {
    eventTypes: {
      name: "Event Types",
      description:
        "Select which comment event types to listen for. Leave empty to receive all comment events.",
      type: {
        type: "array",
        items: {
          type: "string",
          enum: ["comment.created", "comment.updated", "comment.deleted"],
        },
      },
      required: false,
    },
    pageId: {
      name: "Page ID (Optional)",
      description:
        "If specified, only comment events for this specific page will be received. Leave empty to receive comment events for all pages.",
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
      name: "On Comment Event",
      description:
        "Emitted when a comment event occurs. Contains the complete Notion webhook event payload.",
      type: {
        type: "object",
        description:
          "Notion comment webhook event payload. See https://developers.notion.com/reference/webhooks-events-delivery for details.",
        properties: {
          id: {
            type: "string",
            description: "Unique identifier for this webhook event",
          },
          type: {
            type: "string",
            enum: ["comment.created", "comment.updated", "comment.deleted"],
            description: "The type of comment event",
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
            description: "Information about the entity (comment) that changed",
            properties: {
              id: {
                type: "string",
                description: "Comment ID",
              },
            },
          },
          data: {
            type: "object",
            description:
              "Event-specific data payload containing the comment object or changes",
          },
        },
        required: ["id", "type", "timestamp", "workspace_id", "entity"],
      },
    },
  },
};
