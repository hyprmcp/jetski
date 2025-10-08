[![GitHub Repo stars](https://img.shields.io/github/stars/hyprmcp/jetski?style=flat)](https://github.com/hyprmcp/jetski)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Docs](https://img.shields.io/badge/docs-hyprmcp.com%2Fdocs-blue)](https://hyprmcp.com/docs/getting-started/?utm_source=github)
[![PRs](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![Discord](https://dcbadge.vercel.app/api/server/hyprmcp?style=flat)](https://discord.gg/CgZ775fcsy)
[![Downloads](https://img.shields.io/github/downloads/hyprmcp/jetski/total)](https://github.com/hyprmcp/jetski/releases)
[![Go Reference](https://pkg.go.dev/badge/github.com/hyprmcp/jetski)](https://pkg.go.dev/github.com/hyprmcp/jetski)
[![Go Report Card](https://goreportcard.com/badge/github.com/hyprmcp/jetski)](https://goreportcard.com/report/github.com/hyprmcp/jetski)

<br>
<div align="center">
  <a href="https://hyprmcp.com?utm_source=github">
    <img src="./.readme/hyprmcp.png" alt="HyprMCP Logo" height="160">
  </a>

<h3 align="center">🚤 MCP Analytics and Authentication Platform 🔐</h3>

  <p align="center">
    <a href="https://app.hyprmcp.com/?utm_source=github"><strong>Get started with HyprMCP Cloud »</strong></a>
    <br> <br>
    <a href="https://hyprmcp.com/?utm_source=github"><strong>Explore our website »</strong></a>
    <br>
    <br>
    <a href="https://github.com/hyprmcp" target="_blank">GitHub</a>
    .
    <a href="https://www.linkedin.com/company/glasskube/" target="_blank">LinkedIn</a>
    .
     <a href="https://x.com/intent/follow?screen_name=glasskube" target="_blank">Twitter / X</a>
  </p>
</div>

<hr>

## 🚤 What is Jetski?

Jetski is an **Open Source MCP Analytics and Authentication Platform** - part of HyprMCP.
It solves the three biggest problems teams face when developing MCP servers with **zero code changes**:

1. **Installation & Setup**: Most users never make it past setup. They can't find client instructions or try to open your MCP URL in a browser and churn immediately.
2. **Authentication**: Identifying users and giving them the right tools and responses is still painful to implement.
3. **Logs, Analytics & Visibility**: No insight into how your MCP is used, which prompts trigger which tools, or why errors happen.

Our platform manages and deploys instances of our [`mcp-gateway`](https://github.com/hyprmcp/mcp-gateway)  that **sits in front of your MCP server** and handles the complexity.
It also collects and aggregates all analytics and metrics data captured by the gateway.

## 🗄️ Table Of Contents

- [Features](https://github.com/hyprmcp/#-features)
- [Quick Start](https://github.com/hyprmcp/#-quick-start)
- [Demo Video](https://github.com/hyprmcp/jetski#-hyprmcp-demo-video)
- [Supported Features](https://github.com/hyprmcp/jetski#-supported-features)
- [Architecture Diagram](https://github.com/hyprmcp/jetski#architecture-diagram)
- [Need help?](https://github.com/hyprmcp/jetski#-need-help-or-want-to-provide-feedback)
- [Related projects](https://github.com/hyprmcp/jetski#-related-projects)
- [How to Contribute](https://github.com/hyprmcp/jetski#-how-to-contribute-to-hyprmcp)
- [Supported by](https://github.com/hyprmcp/jetski#-thanks-to-all-our-contributors)
- [Activity](https://github.com/hyprmcp/jetski#-activity)
- [License](https://github.com/hyprmcp/jetski#-license)

## ✨ Features
|                                                                                                                                                                                                                                                                  |                                                                                               |
|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------|
| **Comprehensive Prompt Analytics** <br> See which prompts triggered which tools, from which clients, and what happened. Gain complete visibility into your MCP server usage patterns and understand how users interact with your tools in real-time.                             | <img src=".readme/mcp-prompt-analytics.webp" alt="Prompt Analytics" style="min-width: 600px"> |
| **Auto-Generated Setup Instructions** <br> Help users connect to the client effortlessly. We automatically generate clear, step-by-step instructions for every supported MCP client, eliminating the #1 reason users churn during onboarding.              | <img src=".readme/mcp-instructions.webp" alt="Setup Instructions" style="min-width: 600px">   |
| **Zero-Code Authentication** <br> Identify and manage users securely without writing a single line of code. Our proxy handles all authentication logic, allowing you to provide personalized tools and responses based on user identity. | <img src=".readme/mcp-authentication.webp" alt="Authentication" style="min-width: 600px">     |
| **Real-Time Debug Logs** <br> Instantly debug issues and understand server behavior in real-time. See detailed logs of every request, response, and error, making it easy to identify and fix problems quickly.                                                                          | <img src=".readme/mcp-logs.png" alt="Debug Logs" style="min-width: 600px">                    |


## 🚀 Quick Start - Get Started in Minutes

Getting started with HyprMCP is incredibly simple:

### 1. Sign Up

Create your free account at [app.hyprmcp.com](https://app.hyprmcp.com/?utm_source=github) and create your organization.


### 2. Connect Your MCP Server

Add your existing MCP server URL to HyprMCP - no code changes required:

### 3. Start Using Your Enhanced MCP

That's it! Your MCP server now has:
- ✅ Auto-generated setup instructions for all clients
- ✅ Comprehensive analytics and logging
- ✅ MCP Server Authentication

Visit your dashboard at [`https://app.hyprmcp.com`](https://app.hyprmcp.com) to see your MCP in action.

For detailed setup instructions, check out our [documentation](https://hyprmcp.com/docs/getting-started/).

## 🎬 HyprMCP Demo Video

[![HyprMCP Demo Video](https://i.ytimg.com/vi/m2-YyfjXap4/hq720.jpg)](https://www.youtube.com/watch?v=m2-YyfjXap4)

## 🎯 HyprMCP Components

The HyprMCP platform is built on several open-source components that work together to provide a comprehensive MCP management solution:

### Core Components

- **[mcp-gateway](https://github.com/hyprmcp/mcp-gateway)** - MCP OAuth Proxy with dynamic client registration (DCR), MCP prompt analytics. This proxy sits in front of your MCP server.

- **[mcp-install-instructions-generator](https://github.com/hyprmcp/mcp-install-instructions-generator)** - Generate MCP Server Installation Instructions for Cursor, Visual Studio Code, Claude Code, and other MCP clients. Automatically creates user-friendly setup guides.

You can find all our components and contribute to them on [github.com/hyprmcp](https://github.com/hyprmcp).

## Architecture Diagram

```mermaid
graph LR
  Client([🤖 <b>MCP Client</b><br/>Claude, ChatGPT...<br/>.<br/>])

  subgraph K8s["☸️ HyprMCP"]
    direction TB
    Platform[🚤 <b>Jetski Platform</b><br/>Kubernetes Client, Dashboards, etc.<br/>.<br/>]
    Gateway[🔄 <b>MCP Gateway</b><br/>Auth, proxy, analytics & logging<br/>.<br/>]
    Platform-.deploys & manages.->Gateway
    Gateway-.sends metrics & logs.->Platform
  end

  MCP[🚀 <b>Your MCP Server</b><br/>Runs unchanged, anywhere]

  Client <--> K8s
  K8s <--> MCP

  classDef client fill:#fff9c4,stroke:#f57f17,stroke-width:2px
  classDef cluster fill:#e3f2fd,stroke:#1565c0,stroke-width:2px
  classDef platform fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
  classDef server fill:#e8f5e8,stroke:#2e7d32,stroke-width:2px

  class Client client
  class K8s cluster
  class Platform,Gateway platform
  class MCP server
```

**How it works:**
1. **MCP Client** (Claude Desktop, Cline, etc.) sends requests to HyprMCP instead of directly to your server
2. **HyprMCP Proxy** authenticates the user and validates permissions
3. **Request forwarding** to your unchanged MCP server
4. **Response handling** with automatic logging, analytics capture, and monitoring
5. **Real-time dashboard** provides visibility into all operations

## ☝️ Need Help or Want to Provide Feedback?

If you encounter any problems, we will be happy to support you wherever we can on our [Discord](https://discord.gg/CgZ775fcsy).
For bugs, issues or feature requests feel free to [open an issue](https://github.com/hyprmcp/jetski/issues/new/choose).
We are happy to assist you with anything related to the project.

## 📎 Related Projects

- Model Context Protocol [`modelcontextprotocol/specification`](https://github.com/modelcontextprotocol/specification)
- Claude Desktop [`anthropics/claude-desktop`](https://claude.ai/download)
- MCP Servers Directory [`modelcontextprotocol/servers`](https://github.com/modelcontextprotocol/servers)

## 🤝 How to Contribute to HyprMCP

Your feedback is invaluable to us as we continue to improve HyprMCP and Jetski. If you'd like to contribute, consider trying out the platform, reporting any issues, and sharing your suggestions. See [the contributing guide](CONTRIBUTING.md) for detailed instructions on how you can contribute.

Whether you want to:
- Report bugs or request features
- Contribute code improvements
- Improve documentation
- Share your MCP server use cases
- Help other users in the community

We welcome all contributions!

## 🤩 Thanks to all our Contributors

Thanks to everyone that is supporting this project. We are thankful for every contribution, no matter its size!

<a href="https://github.com/hyprmcp/jetski/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=hyprmcp/jetski" />
</a>

## 👾 Activity

![HyprMCP Activity](https://repobeats.axiom.co/api/embed/bb99848dce085afb2ed699790547856069d369cc.svg "HyprMCP activity image")

## 📘 License

Jetski is licensed under the MIT license. For more information check the [LICENSE](https://github.com/hyprmcp/jetski/blob/main/LICENSE) file for details.
