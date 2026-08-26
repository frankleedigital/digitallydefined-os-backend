# DigitallyDefined Buzz + Hermes Architecture
## Orchestration System for Multi-Agent Workflows

### Vision
Hermes orchestrates specialized agents in a self-hosted Buzz relay. Agents collaborate on DigitallyDefined.online projects through persistent channels, shared memory, and real-time communication.

---

## Architecture Components

### 1. Hermes (Orchestrator)
- **Role**: Central coordinator, decision-making, task delegation
- **Tools**: delegate_task, MCP servers, built-in tools
- **Current**: ✅ Running with Tavily, MonkeyCode, Composio MCPs

### 2. Buzz Relay (Communication Layer)
- **Protocol**: Nostr-based, self-hosted via Docker Compose
- **Features**: Channels, DMs, persistent memory (NIP-AE), workflows
- **Deploy**: Local or cloud server with PostgreSQL + Redis

### 3. Buzz Agents (Specialized Workers)
Each agent runs as a separate entity in a Buzz channel:
- **Copywriter Agent** — Content, UX writing, brand voice
- **Research Agent** — Market analysis, competitor intel
- **SEO Agent** — Keyword research, on-page optimization
- **Analytics Agent** — Metrics tracking, reporting
- **Development Agent** — Code review, PR creation (via MonkeyCode integration)

### 4. MonkeyCode (Code Execution)
- **Integration**: Already added as MCP server
- **Role**: Handles coding tasks delegated by Hermes
- **Tools**: `mcp_monkeycode_codex`, `mcp_monkeycode_codex_reply`

---

## Implementation Steps

### Step 1: Deploy Buzz Relay

```bash
# Clone Buzz repository
git clone https://github.com/block/buzz.git
cd buzz/deploy/compose

# Configure environment
cp .env.example .env
# Edit .env with your settings

# Start services
docker compose up -d
```

**Requirements:**
- Docker & Docker Compose
- PostgreSQL (auto-provisioned)
- Redis (auto-provisioned)
- MinIO/S3 for media storage

### Step 2: Generate Nostr Identity

```bash
# Generate keypair for Hermes agent
python3 -c "
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.backends import default_backend
priv = ec.generate_private_key(ec.SECP256K1, default_backend())
private_key = priv.private_numbers().private_value.to_bytes(32, 'big').hex()
public_key = priv.public_key().public_numbers().x.to_bytes(32, 'big').hex() + \
             priv.public_key().public_numbers().y.to_bytes(32, 'big').hex()
print(f'BUZZ_PRIVATE_KEY={private_key}')
print(f'BUZZ_PUBKEY={public_key[:64]}')
"
```

### Step 3: Configure Hermes Gateway

Add to `~/.hermes/config.yaml`:

```yaml
gateway:
  platforms:
    buzz:
      enabled: true
      extra:
        relay_url: http://localhost:3000
        channels: []  # Empty = all joined channels
        home_channel: <your-hq-channel-uuid>
        poll_interval: 4
        cli_path: ""  # Auto-discover
        credentials_file: ""
        allowed_users: []
        require_mention: false  # Or true for @mentions only
        allow_all_users: true   # Community mode
```

### Step 4: Create Agent Personas in Buzz

**Channel: #hermes-orchestrator**
- Hermes' home base
- Coordinates all agent work
- Receives reports from agents

**Channel: #buzz-copywriter**
- Copywriting agent
- Handles UX copy, onboarding text, tool descriptions
- Access to brand voice guidelines

**Channel: #buzz-research**
- Market research agent
- Competitor analysis
- Trend monitoring

**Channel: #buzz-seo**
- SEO specialist
- Keyword research
- On-page optimization

**Channel: #buzz-analytics**
- Performance tracking
- Metrics dashboard updates
- Report generation

### Step 5: Connect MonkeyCode to Buzz

Agents can delegate coding tasks to MonkeyCode via Hermes:

```python
# Example: Copywriter agent needs landing page
# Hermes receives request from Buzz → delegates to MonkeyCode
@delegate_task(
    goal="Build a lead capture landing page for Digital Wealth Calculator",
    context="Agent: buzz-copywriter in #buzz-copywriter channel"
)
```

---

## Workflow Examples

### Example 1: Content Creation Pipeline
1. **Research Agent** monitors trends in Buzz channel
2. **Hermes** receives summary, identifies opportunity
3. **Hermes** delegates to **Copywriter Agent** for content
4. **Copywriter Agent** posts draft in #buzz-copywriter
5. **Hermes** reviews, approves, publishes to site

### Example 2: Feature Development
1. **MonkeyCode** builds feature in cloud dev env
2. **Hermes** coordinates testing via delegate_task
3. **Buzz Analytics Agent** tracks adoption metrics
4. **Hermes** reports results in #hermes-orchestrator

### Example 3: Weekly Review Automation
1. **Cron job** triggers weekly review
2. **Hermes** aggregates data from all channels
3. **Buzz Agents** provide insights from their domains
4. **Hermes** synthesizes report, posts to channel

---

## MCP Tools Available (Current)

| Tool | Purpose | Status |
|------|---------|--------|
| `mcp_tavily_*` | Web search, extraction | ✅ Connected |
| `mcp_monkeycode_codex` | Coding sessions | ✅ Connected |
| `mcp_monkeycode_codex_reply` | Continue conversations | ✅ Connected |
| `mcp_composio_*` | 1000+ app integrations | ⚠ Needs OAuth |

---

## Buzz Integration (Future)

Once relay is deployed:

| Capability | How It Works |
|------------|--------------|
| Channel messaging | Hermes posts to #hermes-orchestrator |
| Agent delegation | delegate_task → Buzz agent channels |
| Persistent memory | NIP-AE engram protocol |
| Real-time updates | WebSocket subscriptions |
| Cross-agent collaboration | Shared channels + DMs |

---

## Deployment Checklist

- [ ] Install Docker & Docker Compose
- [ ] Clone Buzz repository
- [ ] Configure .env for relay
- [ ] Generate Nostr keypair
- [ ] Start relay services
- [ ] Add Hermes as member
- [ ] Configure Hermes gateway
- [ ] Create agent channels
- [ ] Deploy agent personas
- [ ] Test inter-agent communication

---

## Next Actions

1. **Confirm server availability** — Do you have a server (VPS, local machine, Railway) for the Buzz relay?
2. **Choose deployment** — Local Docker vs. cloud (Railway, AWS, etc.)
3. **Set up Nostr identity** — Generate keypair for Hermes
4. **Create channels** — Define which agents you want first

Let me know your infrastructure setup and I'll guide you through the implementation.
