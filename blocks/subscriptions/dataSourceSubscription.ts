import { AppBlock, events } from "@slflows/sdk/v1";

/**
 * Data Source Event Subscription Block
 *
 * Subscribes to Notion data source webhook events including:
 * - data_source.content_updated
 * - data_source.created
 * - data_source.deleted
 * - data_source.moved
 * - data_source.schema_updated
 * - data_source.undeleted
 *
 * Note: Data source events replace database events in API version 2025-09-03.
 *
 * @see https://developers.notion.com/reference/webhooks-events-delivery
 */
export const dataSourceSubscription: AppBlock = {
  name: "Data Source Events Subscription",
  description:
    "Subscribes to Notion data source webhook events (created, updated, deleted, moved, schema changes, etc.). New in API version 2025-09-03.",
  category: "Webhooks",
  entrypoint: true,

  config: {
    eventTypes: {
      name: "Event Types",
      description:
        "Select which data source event types to listen for. Leave empty to receive all data source events.",
      type: {
        type: "array",
        items: {
          type: "string",
          enum: [
            "data_source.content_updated",
            "data_source.created",
            "data_source.deleted",
            "data_source.moved",
            "data_source.schema_updated",
            "data_source.undeleted",
          ],
        },
      },
      required: false,
    },
    dataSourceId: {
      name: "Data Source ID (Optional)",
      description:
        "If specified, only events for this specific data source will be received. Leave empty to receive events for all data sources.",
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
      name: "On Data Source Event",
      description:
        "Emitted when a data source event occurs. Contains the complete Notion webhook event payload.",
      type: {
        type: "object",
        description:
          "Notion data source webhook event payload. See https://developers.notion.com/reference/webhooks-events-delivery for details.",
        properties: {
          id: {
            type: "string",
            description: "Unique identifier for this webhook event",
          },
          type: {
            type: "string",
            enum: [
              "data_source.content_updated",
              "data_source.created",
              "data_source.deleted",
              "data_source.moved",
              "data_source.schema_updated",
              "data_source.undeleted",
            ],
            description: "The type of data source event",
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
            description:
              "Information about the entity (data source) that changed",
            properties: {
              id: {
                type: "string",
                description: "Data source ID",
              },
            },
          },
          data: {
            type: "object",
            description:
              "Event-specific data payload containing the data source object or changes",
          },
        },
        required: ["id", "type", "timestamp", "workspace_id", "entity"],
      },
    },
  },
};
