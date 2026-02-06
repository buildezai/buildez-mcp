#!/usr/bin/env node
/**
 * Buildez MCP Server
 *
 * This MCP server allows AI assistants (like Claude in Cursor) to build
 * websites using the Buildez.ai platform.
 *
 * Supports two modes:
 * 1. STDIO mode (default): For local execution
 * 2. HTTP/SSE mode: For remote server deployment
 *
 * Primary Tool: build_website
 * - Takes a business name and description
 * - Uses AI to select appropriate plugins
 * - Generates a complete website with AI-customized content
 * - Returns the live URL and editor URL
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { CallToolRequestSchema, ListToolsRequestSchema, ListPromptsRequestSchema, GetPromptRequestSchema, ErrorCode, McpError, } from '@modelcontextprotocol/sdk/types.js';
import http from 'http';
// Configuration
const BUILDEZ_API_URL = process.env.BUILDEZ_API_URL || 'http://localhost:3000';
const MCP_PORT = parseInt(process.env.MCP_PORT || '3001');
const MCP_MODE = process.env.MCP_MODE || 'stdio'; // 'stdio' or 'http'
const API_TIMEOUT = 300000; // 5 minutes for full website generation with AI editing
// Helper: Make API request with timeout
async function apiRequest(endpoint, method = 'GET', body, timeout = API_TIMEOUT) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    try {
        const response = await fetch(`${BUILDEZ_API_URL}${endpoint}`, {
            method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: body ? JSON.stringify(body) : undefined,
            signal: controller.signal,
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API error (${response.status}): ${errorText}`);
        }
        return await response.json();
    }
    finally {
        clearTimeout(timeoutId);
    }
}
// Helper: Generate a clean web ID (no random suffix like the web builder)
function generateCleanWebId(businessName) {
    return businessName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .substring(0, 50); // Allow longer names
}
// Helper: Check if webId is available and get a unique one
async function getAvailableWebId(baseWebId) {
    try {
        // Check if base webId is available
        const checkResponse = await apiRequest(`/api/check-webid?webId=${baseWebId}`, 'GET', undefined, 10000 // 10 second timeout for check
        );
        if (checkResponse.available) {
            return baseWebId;
        }
        // If not available, try adding numbers
        for (let i = 2; i <= 99; i++) {
            const numberedWebId = `${baseWebId}-${i}`;
            const retryCheck = await apiRequest(`/api/check-webid?webId=${numberedWebId}`, 'GET', undefined, 10000);
            if (retryCheck.available) {
                return numberedWebId;
            }
        }
        // Fallback: add timestamp
        const timestamp = Date.now().toString().slice(-6);
        return `${baseWebId}-${timestamp}`;
    }
    catch (error) {
        // If check fails, use base webId with timestamp
        console.error('[Buildez MCP] WebId check failed, using fallback');
        const timestamp = Date.now().toString().slice(-6);
        return `${baseWebId}-${timestamp}`;
    }
}
// Create MCP Server
const server = new Server({
    name: 'buildez-mcp-server',
    version: '1.0.0',
}, {
    capabilities: {
        tools: {},
        prompts: {},
    },
});
// List available prompts (with form fields)
server.setRequestHandler(ListPromptsRequestSchema, async () => {
    return {
        prompts: [
            {
                name: 'create_website',
                title: 'Create Website',
                description: 'Build a complete website for your business',
                arguments: [
                    {
                        name: 'businessName',
                        description: 'Your business name',
                        required: true,
                    },
                    {
                        name: 'description',
                        description: 'What does your business do? (services, location, target audience)',
                        required: true,
                    },
                ],
            },
        ],
    };
});
// Handle prompt requests
server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    if (name === 'create_website') {
        const businessName = args?.businessName || '';
        const description = args?.description || '';
        return {
            description: 'Create a website for ' + businessName,
            messages: [
                {
                    role: 'user',
                    content: {
                        type: 'text',
                        text: `Build a website for "${businessName}". Business description: ${description}`,
                    },
                },
            ],
        };
    }
    throw new McpError(ErrorCode.InvalidParams, `Unknown prompt: ${name}`);
});
// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: 'build_website',
                description: `Build and deploy a complete website instantly. When user wants a website, ask ONLY two questions: 1) Business name? 2) Brief description of the business? Then immediately call this tool. Do not ask about colors, style, framework, or technology - the AI handles everything automatically.`,
                inputSchema: {
                    type: 'object',
                    properties: {
                        businessName: {
                            type: 'string',
                            description: 'Business name',
                        },
                        description: {
                            type: 'string',
                            description: 'Brief description of what the business does',
                        },
                    },
                    required: ['businessName', 'description'],
                },
            },
        ],
    };
});
// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    try {
        switch (name) {
            case 'build_website': {
                const { businessName, description } = (args || {});
                if (!businessName || !description) {
                    throw new McpError(ErrorCode.InvalidParams, 'Both businessName and description are required');
                }
                console.error(`[Buildez MCP] Building website for: ${businessName}`);
                // Step 1: Call AI Builder to select plugins
                console.error('[Buildez MCP] Step 1: Analyzing requirements and selecting plugins...');
                const aiBuilderResponse = await apiRequest('/api/ai-builder', 'POST', {
                    prompt: `${businessName}: ${description}`,
                    businessName,
                });
                if (!aiBuilderResponse.selectedPlugins) {
                    throw new Error(aiBuilderResponse.error || 'Failed to analyze requirements - no plugins returned');
                }
                console.error(`[Buildez MCP] Selected ${aiBuilderResponse.selectedPlugins.length} plugins`);
                console.error(`[Buildez MCP] Website type: ${aiBuilderResponse.websiteType}`);
                // Step 2: Generate clean web ID (like web-based builder)
                const baseWebId = generateCleanWebId(businessName);
                console.error(`[Buildez MCP] Base web ID: ${baseWebId}`);
                // Check availability and get unique webId
                const webId = await getAvailableWebId(baseWebId);
                console.error(`[Buildez MCP] Final web ID: ${webId}`);
                // Step 3: Build the website (includes AI customization of colors/fonts)
                console.error('[Buildez MCP] Step 2: Building website with AI customization...');
                const buildResponse = await apiRequest('/api/build-website', 'POST', {
                    selectedPlugins: aiBuilderResponse.selectedPlugins,
                    websiteType: aiBuilderResponse.websiteType,
                    explanation: aiBuilderResponse.enhancedPrompt || aiBuilderResponse.explanation || description,
                    projectName: businessName,
                    customWebId: webId,
                    customColors: aiBuilderResponse.colorFontSuggestions ? {
                        primary: aiBuilderResponse.colorFontSuggestions.primary,
                        secondary: aiBuilderResponse.colorFontSuggestions.secondary,
                        accent: aiBuilderResponse.colorFontSuggestions.accent,
                    } : undefined,
                    customFonts: aiBuilderResponse.colorFontSuggestions ? {
                        headingFont: aiBuilderResponse.colorFontSuggestions.headingFont,
                        bodyFont: aiBuilderResponse.colorFontSuggestions.bodyFont,
                    } : undefined,
                });
                if (!buildResponse.success) {
                    throw new Error(buildResponse.error || 'Failed to build website');
                }
                console.error(`[Buildez MCP] Website built successfully!`);
                // Generate URLs - Editor is the only URL shown (will auto-run AI edit)
                const editorUrl = `https://buildez.ai/editor/${webId}`;
                console.error(`[Buildez MCP] Editor URL: ${editorUrl}`);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify({
                                success: true,
                                message: `Website "${businessName}" created successfully!`,
                                editorUrl: editorUrl,
                                projectId: webId,
                                websiteType: aiBuilderResponse.websiteType,
                                pluginsUsed: aiBuilderResponse.selectedPlugins?.length || 0,
                                plugins: aiBuilderResponse.selectedPlugins?.map(p => p.plugin),
                                instructions: [
                                    "1. Open the Editor URL above",
                                    "2. Wait 1-2 minutes for AI to customize all content",
                                    "3. Review and edit text, images, colors as needed",
                                    "4. Click 'Publish' when ready"
                                ],
                            }, null, 2),
                        },
                    ],
                };
            }
            default:
                throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
        }
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`[Buildez MCP] Error: ${errorMessage}`);
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        success: false,
                        error: errorMessage,
                    }, null, 2),
                },
            ],
            isError: true,
        };
    }
});
// Start the server
async function main() {
    if (MCP_MODE === 'http') {
        console.log(`[Buildez MCP] Starting HTTP server on port ${MCP_PORT}...`);
        const httpServer = http.createServer(async (req, res) => {
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
            if (req.method === 'OPTIONS') {
                res.writeHead(200);
                res.end();
                return;
            }
            if (req.url === '/health') {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'ok', server: 'buildez-mcp' }));
                return;
            }
            if (req.url === '/sse' || req.url === '/mcp') {
                console.log('[Buildez MCP] New SSE connection');
                const transport = new SSEServerTransport('/messages', res);
                await server.connect(transport);
                return;
            }
            if (req.url === '/messages' && req.method === 'POST') {
                return;
            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                name: 'Buildez MCP Server',
                version: '1.0.0',
                endpoints: {
                    health: '/health',
                    sse: '/sse',
                },
                documentation: 'https://buildez.ai/docs/mcp',
            }));
        });
        httpServer.listen(MCP_PORT, () => {
            console.log(`[Buildez MCP] HTTP server listening on http://localhost:${MCP_PORT}`);
            console.log(`[Buildez MCP] SSE endpoint: http://localhost:${MCP_PORT}/sse`);
        });
    }
    else {
        console.error('[Buildez MCP] Starting in STDIO mode...');
        const transport = new StdioServerTransport();
        await server.connect(transport);
        console.error('[Buildez MCP] Server started and ready to accept connections');
    }
}
main().catch((error) => {
    console.error('[Buildez MCP] Fatal error:', error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map