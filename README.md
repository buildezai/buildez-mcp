# Buildez MCP Server

Build complete websites using AI through any MCP-compatible tool.

## What is this?

This MCP server connects AI assistants to [Buildez.ai](https://buildez.ai), allowing you to create full websites just by describing what you want.

**Example:**
> "Build me a website for Tony's Pizzeria - a family Italian restaurant in Brooklyn with online ordering"

And it will create a complete, live website for you.

## Supported Tools

| Tool | Status |
|------|--------|
| [VS Code (Copilot)](https://code.visualstudio.com/) | ✅ Supported |
| [Cursor IDE](https://cursor.com/) | ✅ Supported |
| [Claude Desktop](https://claude.ai/download) | ✅ Supported |
| [Claude Code (CLI)](https://docs.anthropic.com/en/docs/claude-code) | ✅ Supported |
| [Cline (VS Code)](https://github.com/cline/cline) | ✅ Supported |
| [Windsurf](https://codeium.com/windsurf) | ✅ Supported |

---

## Installation

### Step 1: Install Node.js (Required)

#### Windows
1. Go to [nodejs.org/en/download](https://nodejs.org/en/download)
2. Click the **"Windows Installer (.msi)"** button
3. Run the downloaded file
4. Click Next → Next → Next → Install
5. **Restart your computer** (or at least close and reopen Command Prompt)

#### Mac
```bash
brew install node
```
Or download from [nodejs.org](https://nodejs.org/)

#### Linux
```bash
sudo apt install nodejs npm
```

### Step 2: Install Buildez MCP

Open **Command Prompt** (Windows) or **Terminal** (Mac/Linux) and run:

```bash
npm install -g buildez-mcp
```

**Windows tip:** Press `Win + R`, type `cmd`, press Enter to open Command Prompt.

### Step 3: Verify Installation

```bash
buildez-mcp --help
```

If you see output (not an error), it's installed correctly.

---

## Setup by Tool

### VS Code (GitHub Copilot)

VS Code now supports MCP servers with GitHub Copilot. 

#### Option 1: User Settings (All Projects)

1. Open VS Code
2. Press `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (Mac)
3. Type **"Preferences: Open User Settings (JSON)"** and press Enter
4. Add this to your settings:

```json
{
  "mcp": {
    "servers": {
      "buildez": {
        "command": "npx",
        "args": ["buildez-mcp"],
        "env": {
          "BUILDEZ_API_URL": "https://buildez.ai"
        }
      }
    }
  }
}
```

#### Option 2: Workspace Settings (Single Project)

Create a file `.vscode/mcp.json` in your project:

```json
{
  "servers": {
    "buildez": {
      "command": "npx",
      "args": ["buildez-mcp"],
      "env": {
        "BUILDEZ_API_URL": "https://buildez.ai"
      }
    }
  }
}
```

5. Restart VS Code
6. Open Copilot Chat and ask: "Build a website for my coffee shop"

> **Note:** Requires GitHub Copilot subscription and VS Code 1.99+

---

### Cursor IDE

#### Windows
Edit file: `C:\Users\YOUR_USERNAME\.cursor\mcp.json`

```json
{
  "mcpServers": {
    "buildez": {
      "command": "npx",
      "args": ["buildez-mcp"],
      "env": {
        "BUILDEZ_API_URL": "https://buildez.ai"
      }
    }
  }
}
```

#### Mac / Linux
Edit file: `~/.cursor/mcp.json`

```json
{
  "mcpServers": {
    "buildez": {
      "command": "npx",
      "args": ["buildez-mcp"],
      "env": {
        "BUILDEZ_API_URL": "https://buildez.ai"
      }
    }
  }
}
```

Then restart Cursor.

---

### Claude Desktop

#### Windows
Edit file: `C:\Users\YOUR_USERNAME\AppData\Roaming\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "buildez": {
      "command": "npx",
      "args": ["buildez-mcp"],
      "env": {
        "BUILDEZ_API_URL": "https://buildez.ai"
      }
    }
  }
}
```

#### Mac
Edit file: `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "buildez": {
      "command": "npx",
      "args": ["buildez-mcp"],
      "env": {
        "BUILDEZ_API_URL": "https://buildez.ai"
      }
    }
  }
}
```

Then restart Claude Desktop.

---

### Claude Code (CLI)

Claude Code has built-in MCP support. Just run this command:

```bash
claude mcp add buildez-mcp -- npx buildez-mcp
```

**Verify it was added:**
```bash
claude mcp list
```

**To use it**, just start Claude Code and ask:
```
"Build a website for my coffee shop called Bean Dreams"
```

---

### Cline (VS Code Extension)

1. Install [Cline extension](https://marketplace.visualstudio.com/items?itemName=saoudrizwan.claude-dev) in VS Code
2. Open Cline settings
3. Go to MCP Servers section
4. Add:

```json
{
  "buildez": {
    "command": "npx",
    "args": ["buildez-mcp"],
    "env": {
      "BUILDEZ_API_URL": "https://buildez.ai"
    }
  }
}
```

---

### Windsurf

Edit your Windsurf MCP config and add:

```json
{
  "mcpServers": {
    "buildez": {
      "command": "npx",
      "args": ["buildez-mcp"],
      "env": {
        "BUILDEZ_API_URL": "https://buildez.ai"
      }
    }
  }
}
```

---

## Usage

After setup, just ask the AI to build a website:

**Examples:**
- "Build a website for a coffee shop called Morning Brew in Seattle"
- "Create a portfolio website for a photographer named Sarah"
- "Build an e-commerce site for a jewelry store"
- "Make a website for a law firm specializing in family law"

The AI will:
1. Analyze your requirements
2. Select the best components (170+ available)
3. Generate custom content for your business
4. Deploy the website
5. Give you the live URL

## Available Tool

| Tool | Description |
|------|-------------|
| `build_website` | Create a complete website from a business name and description |

## Example Output

```
✅ Website "Tony's Pizzeria" created successfully!

Live URL: https://webid.is/tonys-pizzeria-x7k2m9
Editor: https://buildez.ai/editor/tonys-pizzeria-x7k2m9

Components used:
- Hero section with restaurant branding
- Menu display
- Contact information
- Online ordering
- Testimonials
- Footer with location map
```

## Troubleshooting

### Windows: "npm is not recognized"
- Node.js is not installed or not in PATH
- Reinstall Node.js from [nodejs.org/en/download](https://nodejs.org/en/download)
- Make sure to **restart Command Prompt** after installing

### Windows: "buildez-mcp is not recognized"
- Run `npm install -g buildez-mcp` again
- Try using full path: `%APPDATA%\npm\buildez-mcp`

### MCP shows "Error" or red dot
- Restart your IDE/app
- Check that BUILDEZ_API_URL is set to `https://buildez.ai`

### Website not generating
- Check internet connection
- Try a simpler description first

## Links

- Website: [buildez.ai](https://buildez.ai)
- Documentation: [buildez.ai/docs](https://buildez.ai/docs)
- Support: [support@buildez.ai](mailto:support@buildez.ai)

## License

MIT
