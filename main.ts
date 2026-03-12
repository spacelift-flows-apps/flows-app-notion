import { defineApp, http, kv, lifecycle } from "@slflows/sdk/v1";
import { blocks } from "./blocks/index";
import {
  verifyNotionWebhook,
  handleWebhookEndpoint,
} from "./utils/httpHandlerHelpers";

const WEBHOOK_TOKEN_KV_KEY = "webhook_verification_token";

export const app = defineApp({
  name: "Notion",
  installationInstructions: `Connect your Notion workspace to automate page creation, database management, and content operations.

To install:
1. Create a Notion integration at https://www.notion.so/my-integrations
2. Copy the Internal Integration Token
3. Add the integration token below
4. Share the integration with pages/databases you want to access
5. (Optional) To enable webhooks:
   - Create a webhook subscription in Notion using <copyable>[this app's webhook URL]({appEndpointUrl})</copyable>
   - Notion will send a verification token to this app
   - Copy the verification token from the app signals and paste it into Notion's verification UI
6. Start using Notion blocks in your flows`,

  blocks,

  config: {
    notionApiKey: {
      name: "Notion Integration Token",
      description:
        "Internal Integration Token from your Notion integration (starts with 'secret_')",
      type: "string",
      required: true,
      sensitive: true,
    },
  },

  signals: {
    webhookVerificationToken: {
      name: "Webhook Verification Token",
      sensitive: true,
      sensitivity: "hide_by_default",
      description:
        "The verification token received from Notion. Copy this and paste it into Notion's webhook verification UI.",
    },
  },

  async onSync(input) {
    const { notionApiKey } = input.app.config;

    // Validate the Notion API connection
    try {
      const response = await fetch("https://api.notion.com/v1/users/me", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${notionApiKey}`,
          "Notion-Version": "2022-06-28",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Notion API error:", errorData);
        return {
          newStatus: "failed",
          customStatusDescription: "API error, see logs",
        };
      }

      await response.json(); // Validate response is valid JSON

      // Check if we have a webhook verification token in KV
      const kvData = await kv.app.get(WEBHOOK_TOKEN_KV_KEY);
      const storedToken = kvData?.value as string | undefined;

      // Prepare signal updates
      const signalUpdates: Record<string, any> = {};

      // Sync webhook token to signal if present
      if (storedToken) {
        const currentSignalToken = input.app.signals.webhookVerificationToken;
        if (currentSignalToken !== storedToken) {
          signalUpdates.webhookVerificationToken = storedToken;
        }
      }

      return {
        newStatus: "ready",
        ...(Object.keys(signalUpdates).length > 0 && { signalUpdates }),
      };
    } catch (error: any) {
      console.error("Notion API error:", error);
      return {
        newStatus: "failed",
        customStatusDescription: "Connection failed: see logs",
      };
    }
  },

  http: {
    async onRequest(input) {
      // Parse the webhook payload
      let payload: any;
      try {
        payload = JSON.parse(input.request.rawBody);
      } catch (error: any) {
        console.error("Error parsing webhook payload:", error);
        await http.respond(input.request.requestId, {
          statusCode: 400,
          body: { error: "Invalid JSON payload" },
        });
        return;
      }

      // Handle webhook verification request from Notion
      if (payload.verification_token) {
        console.log("Received webhook verification token from Notion");

        // Store the verification token in KV (onSync will update the signal)
        await kv.app.set({
          key: WEBHOOK_TOKEN_KV_KEY,
          value: payload.verification_token,
        });

        await http.respond(input.request.requestId, {
          statusCode: 200,
          body: { verification_token: payload.verification_token },
        });

        await lifecycle.sync();

        return;
      }

      // For regular webhook events, verify the signature if we have a token
      const storedToken = input.app.signals.webhookVerificationToken;

      if (storedToken) {
        const isValid = await verifyNotionWebhook(
          input.request,
          storedToken as string,
        );

        if (!isValid) {
          console.warn(
            "Invalid webhook signature for request:",
            input.request.requestId,
          );
          await http.respond(input.request.requestId, {
            statusCode: 403,
            body: { error: "Invalid webhook signature" },
          });
          return;
        }
      }

      // Handle the webhook event
      const response = await handleWebhookEndpoint(payload);
      await http.respond(input.request.requestId, response);
    },
  },
});
