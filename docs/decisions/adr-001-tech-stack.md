# ADR 001: Technology Stack Selection

## Status
**Accepted** - 2025-12-13

## Context

Genie is an AI-powered marketing content generation platform that transforms product images into comprehensive marketing materials. We need to select a technology stack that balances:

1. **Development Speed**: Rapid MVP delivery and iteration
2. **AI Integration**: Seamless integration with Claude, DALL-E, and other AI APIs
3. **Scalability**: Handle growth from 100 to 100,000+ users
4. **Cost Efficiency**: Minimize infrastructure costs during early stages
5. **Developer Experience**: Modern tooling and strong ecosystem
6. **Performance**: Fast response times for global users

## Decision Drivers

### Business Requirements
- **Time to Market**: Launch MVP in 6-8 weeks
- **Budget Constraints**: Limited seed funding, need cost-effective solution
- **Target Audience**: Global users (US, Europe, Asia)
- **Performance SLA**: p95 response time < 1 second
- **Reliability**: 99.9% uptime target

### Technical Requirements
- **AI API Integration**: Claude Sonnet/Opus, DALL-E 3, Stable Diffusion
- **Real-time Updates**: WebSocket support for job status
- **File Handling**: Upload/download large images (up to 10MB)
- **Concurrent Processing**: Multiple AI jobs in parallel
- **Data Privacy**: GDPR compliant, secure file storage

## Considered Options

### Frontend Framework

| Option | Pros | Cons | Decision |
|--------|------|------|----------|
| **Next.js 14** | - React-based, familiar ecosystem<br>- App Router for modern patterns<br>- Built-in API routes<br>- Vercel deployment synergy<br>- Excellent TypeScript support<br>- Server components reduce bundle size | - Learning curve for App Router<br>- Some ecosystem libraries not compatible yet | ✅ **SELECTED** |
| **Remix** | - Nested routing<br>- Progressive enhancement<br>- Strong data loading patterns | - Smaller ecosystem<br>- Less mature deployment options<br>- Team unfamiliar with framework | ❌ Rejected |
| **SvelteKit** | - Smaller bundle sizes<br>- Excellent performance<br>- Simple syntax | - Smaller talent pool<br>- Fewer AI SDK integrations<br>- Less enterprise adoption | ❌ Rejected |
| **Vue 3 + Nuxt** | - Approachable syntax<br>- Good performance<br>- Strong Chinese market | - Smaller ecosystem than React<br>- Team unfamiliar with Vue | ❌ Rejected |

**Rationale for Next.js**:
- Team expertise in React ecosystem
- Vercel deployment provides instant global CDN
- Anthropic's SDK has first-class Next.js support
- Server components reduce client-side JavaScript
- Built-in image optimization for product photos

### Backend Architecture

| Option | Pros | Cons | Decision |
|--------|------|------|----------|
| **Serverless (AWS Lambda)** | - Zero infrastructure management<br>- Auto-scaling to zero<br>- Pay-per-execution pricing<br>- Fast cold start times (Node.js)<br>- Event-driven architecture | - Cold start latency<br>- 15-minute execution limit<br>- Complex local debugging | ✅ **SELECTED** |
| **Node.js + Express (EC2)** | - Full control<br>- No cold starts<br>- Unlimited execution time | - Manual scaling required<br>- Always-on costs<br>- Server maintenance overhead | ❌ Rejected |
| **Containerized (ECS/Fargate)** | - Better for long-running tasks<br>- Docker ecosystem | - More complex deployment<br>- Higher baseline costs<br>- Overkill for API workload | ❌ Rejected |
| **Go + Fiber** | - Excellent performance<br>- Low memory footprint | - Team unfamiliarity<br>- Smaller AI library ecosystem | ❌ Rejected |

**Rationale for Serverless**:
- Perfect fit for AI workload (sporadic, unpredictable)
- AWS Lambda scales automatically (0 to 1000 concurrent)
- Cost-effective: Only pay for actual generation jobs
- EventBridge integration for workflow orchestration
- SQS for queue-based processing

### Language Choice

| Option | Pros | Cons | Decision |
|--------|------|------|----------|
| **TypeScript** | - Type safety reduces bugs<br>- Excellent IDE support<br>- Shared types between frontend/backend<br>- Large ecosystem<br>- AI SDKs available | - Slightly slower than compiled languages<br>- Type complexity can grow | ✅ **SELECTED** |
| **Python** | - ML/AI ecosystem strength<br>- Simple syntax<br>- Great for data processing | - Slower cold starts in Lambda<br>- Type hints less mature than TypeScript<br>- Team primarily JavaScript | ❌ Rejected |
| **Rust** | - Extreme performance<br>- Memory safety<br>- Fast cold starts | - Steep learning curve<br>- Limited AI SDK support<br>- Slower development | ❌ Rejected |

**Rationale for TypeScript**:
- Single language across stack (frontend + backend)
- Anthropic SDK, OpenAI SDK both have TS support
- Strong AWS SDK v3 typing
- Team expertise in JavaScript/TypeScript

### Database

| Option | Pros | Cons | Decision |
|--------|------|------|----------|
| **DynamoDB** | - Serverless, zero ops<br>- Single-digit ms latency<br>- Auto-scaling<br>- Pay-per-request pricing<br>- Built-in streams for events | - NoSQL requires data modeling skill<br>- Limited query flexibility<br>- No joins | ✅ **SELECTED** |
| **PostgreSQL (RDS)** | - SQL familiar to team<br>- ACID guarantees<br>- Rich query language | - Requires provisioning<br>- Always-on costs<br>- Manual scaling<br>- Backup management | ❌ Rejected |
| **MongoDB Atlas** | - Flexible schema<br>- Strong query language<br>- Change streams | - Additional vendor lock-in<br>- More expensive than DynamoDB<br>- Team less familiar | ❌ Rejected |

**Rationale for DynamoDB**:
- Perfect for key-value access patterns (get job by ID)
- On-demand pricing eliminates capacity planning
- DynamoDB Streams integrate with Lambda
- AWS ecosystem synergy
- Global tables for multi-region (future)

### File Storage

| Option | Pros | Cons | Decision |
|--------|------|------|----------|
| **AWS S3** | - Industry standard<br>- 99.999999999% durability<br>- Lifecycle policies<br>- Event triggers<br>- CloudFront integration | - Transfer costs<br>- API rate limits | ✅ **SELECTED** (Primary) |
| **Cloudflare R2** | - Zero egress fees<br>- S3-compatible API<br>- Global performance | - Newer service<br>- Smaller feature set | ✅ **SELECTED** (Backup) |
| **Google Cloud Storage** | - Competitive pricing<br>- Good performance | - Less ecosystem integration<br>- Team unfamiliar | ❌ Rejected |

**Rationale for S3 + R2**:
- S3 primary for AWS ecosystem integration
- R2 as backup/CDN to reduce egress costs
- S3 event triggers for Lambda processing
- CloudFront caching for global delivery

### AI APIs

| Provider | Model | Use Case | Decision |
|----------|-------|----------|----------|
| **Anthropic** | Claude Sonnet 4 | Image analysis, content generation | ✅ **SELECTED** |
| **Anthropic** | Claude Opus 4.5 | Complex marketing strategy (future) | ✅ **SELECTED** |
| **OpenAI** | DALL-E 3 | Package design generation | ✅ **SELECTED** |
| **Stability AI** | SDXL | Alternative image generation | ✅ **SELECTED** |
| **OpenAI** | GPT-4 Turbo | - | ❌ Rejected (Claude preferred for reasoning) |

**Rationale**:
- **Claude Sonnet 4**: Best cost/performance for analysis & copywriting
- **Claude Opus 4.5**: Future premium tier, complex reasoning
- **DALL-E 3**: Highest quality commercial image generation
- **Stability AI**: Cost-effective alternative, more control

### Deployment Platform

| Option | Pros | Cons | Decision |
|--------|------|------|----------|
| **Vercel** | - Zero-config Next.js deployment<br>- Global edge network (300+ locations)<br>- Instant rollbacks<br>- Preview deployments<br>- Automatic HTTPS | - Higher cost at scale<br>- Vendor lock-in for frontend | ✅ **SELECTED** (Frontend) |
| **AWS Amplify** | - AWS ecosystem integration<br>- Good Next.js support | - Less mature than Vercel<br>- Slower edge network | ❌ Rejected |
| **Netlify** | - Similar to Vercel<br>- Good developer experience | - Slower edge functions<br>- Weaker Next.js optimization | ❌ Rejected |

**Rationale for Vercel**:
- Best-in-class Next.js support (same company)
- Edge runtime for global API performance
- Generous free tier for MVP
- Preview URLs for testing

### Infrastructure as Code

| Option | Pros | Cons | Decision |
|--------|------|------|----------|
| **Serverless Framework** | - Lambda-focused<br>- Simple YAML configuration<br>- Active community | - AWS-specific features can lag<br>- Limited state management | ✅ **SELECTED** |
| **Terraform** | - Multi-cloud support<br>- HCL language<br>- Strong state management | - More complex for Lambda<br>- Steeper learning curve | ⏸️ **FUTURE** |
| **AWS CDK** | - TypeScript code vs config<br>- Type-safe infrastructure | - AWS-only<br>- More verbose than Serverless | ❌ Rejected |

**Rationale**:
- Serverless Framework for MVP speed
- Migrate to Terraform when multi-cloud needed

## Final Tech Stack

```
┌─────────────────────────────────────────────────────────┐
│                    TECH STACK                            │
├─────────────────────────────────────────────────────────┤
│ Frontend:    Next.js 14 + TypeScript + Tailwind CSS     │
│ Backend:     AWS Lambda + Node.js 20 + TypeScript       │
│ Database:    DynamoDB (on-demand)                       │
│ Cache:       Redis (ElastiCache) - future               │
│ Storage:     AWS S3 (primary) + Cloudflare R2 (backup)  │
│ CDN:         CloudFront + Vercel Edge                   │
│ Queue:       AWS SQS + EventBridge                      │
│ AI APIs:     Claude Sonnet 4, DALL-E 3, Stable Diff     │
│ Deploy:      Vercel (frontend) + Serverless (backend)   │
│ IaC:         Serverless Framework                       │
│ Monitoring:  CloudWatch + Datadog                       │
│ Security:    Cloudflare WAF + AWS IAM                   │
└─────────────────────────────────────────────────────────┘
```

## Consequences

### Positive
✅ **Fast Development**: Familiar stack, rich ecosystem
✅ **Cost Effective**: Serverless = pay per use
✅ **Scalable**: Auto-scaling from 0 to millions
✅ **Global Performance**: Edge deployment worldwide
✅ **Type Safety**: TypeScript across entire stack
✅ **AI Integration**: First-class SDK support

### Negative
⚠️ **Vendor Lock-in**: Heavy AWS dependence
⚠️ **Cold Starts**: Lambda latency (mitigated with provisioned concurrency)
⚠️ **Learning Curve**: Next.js App Router is new paradigm
⚠️ **DynamoDB Complexity**: NoSQL requires careful data modeling
⚠️ **Cost Uncertainty**: Serverless costs can spike unexpectedly

### Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| AWS costs spiral | - Set CloudWatch billing alarms<br>- Reserved concurrency limits<br>- Monthly cost reviews |
| Cold start latency | - Provisioned concurrency for critical functions<br>- Keep functions warm with scheduled pings<br>- Use smaller bundles |
| DynamoDB data model issues | - Design access patterns upfront<br>- Use single-table design<br>- Prototype with sample data |
| Vercel lock-in | - Keep business logic in separate packages<br>- Design for portability<br>- Document migration path |

## Alternatives Considered

### Why Not Supabase?
- Supabase (PostgreSQL + Auth + Storage) would simplify architecture
- **Rejected because**:
  - Additional vendor dependency
  - Less mature than AWS services
  - Team wants to learn AWS ecosystem
  - Harder to optimize costs at scale

### Why Not Firebase?
- Firebase would provide real-time updates, auth, storage in one package
- **Rejected because**:
  - NoSQL limitations (Firestore less flexible than DynamoDB)
  - Less control over infrastructure
  - Pricing less predictable
  - Weaker TypeScript support

### Why Not Monolithic Python Backend?
- Python has stronger ML/AI ecosystem
- **Rejected because**:
  - Team expertise in TypeScript
  - Slower Lambda cold starts
  - We're not doing ML training, just API calls
  - TypeScript SDK support is excellent

## Implementation Plan

### Phase 1: MVP (Weeks 1-6)
```
✓ Setup Next.js 14 frontend (Vercel)
✓ Create Serverless backend (AWS Lambda)
✓ Integrate Claude Vision API
✓ Integrate DALL-E 3 API
✓ Setup S3 for file storage
✓ Setup DynamoDB for job tracking
✓ Basic authentication (Clerk)
```

### Phase 2: Beta (Weeks 7-10)
```
○ Add SQS for job queuing
○ Implement webhook notifications
○ Add Redis caching layer
○ Setup CloudFront CDN
○ Implement rate limiting
○ Add Datadog monitoring
```

### Phase 3: Production (Weeks 11-12)
```
○ Load testing and optimization
○ Security audit
○ Setup CI/CD pipeline
○ Documentation
○ Launch to 100 beta users
```

## Review Schedule

- **Next Review**: After 1000 users (estimated Q2 2025)
- **Triggers for Re-evaluation**:
  - AWS costs exceed $500/month
  - p95 latency exceeds 2 seconds
  - DynamoDB access patterns become problematic
  - Team growth necessitates different architecture

## References

- [Next.js Documentation](https://nextjs.org/docs)
- [AWS Lambda Best Practices](https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html)
- [DynamoDB Best Practices](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/best-practices.html)
- [Serverless Framework Docs](https://www.serverless.com/framework/docs)
- [Anthropic Claude API](https://docs.anthropic.com/claude/reference)
- [OpenAI DALL-E API](https://platform.openai.com/docs/guides/images)

## Decision Makers

- **Engineering Lead**: [Name]
- **CTO**: [Name]
- **Product Manager**: [Name]

## Approval

- [x] Engineering Team
- [x] Product Team
- [x] Executive Sponsor

---

**Document Owner**: Engineering Team
**Last Updated**: 2025-12-13
**Version**: 1.0
**ADR Status**: Accepted
