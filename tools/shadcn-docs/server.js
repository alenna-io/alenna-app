#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import axios from "axios";
import * as cheerio from "cheerio";

const server = new Server(
  {
    name: "shadcn-docs",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "get_shadcn_doc",
        description: "Fetches documentation for a given shadcn/ui component.",
        inputSchema: {
          type: "object",
          properties: {
            component: {
              type: "string",
              description: "Name of the shadcn/ui component, e.g. 'button' or 'dialog'",
            },
          },
          required: ["component"],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "get_shadcn_doc") {
    const { component } = request.params.arguments;
    const url = `https://ui.shadcn.com/docs/components/${component}`;

    try {
      const response = await axios.get(url);
      const $ = cheerio.load(response.data);
      const content = $("main").text().trim().slice(0, 5000);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              component,
              url,
              content,
            }, null, 2),
          },
        ],
      };
    } catch (err) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to fetch docs for ${component}: ${err.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  throw new Error(`Unknown tool: ${request.params.name}`);
});

// Start the MCP server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("shadcn-docs MCP server running on stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
