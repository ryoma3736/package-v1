# Genie AI Marketing Content Generator - Documentation

## 📚 Documentation Overview

This directory contains comprehensive architecture and design documentation for the Genie platform.

## 📂 Document Structure

```
docs/
├── README.md                           # This file
├── architecture/                       # System architecture documentation
│   ├── system-overview.md             # High-level architecture (380 lines)
│   ├── data-flow.md                   # Data flow and processing (653 lines)
│   ├── api-spec.yaml                  # OpenAPI 3.1 specification (900 lines)
│   └── infrastructure.md              # Cloud infrastructure (756 lines)
└── decisions/                         # Architecture Decision Records
    └── adr-001-tech-stack.md          # Technology stack selection (292 lines)
```

**Total Documentation**: 2,981 lines of comprehensive technical documentation

## 🗺️ Quick Navigation

### For Product Managers
- Start with: [System Overview](./architecture/system-overview.md)
- Read: [ADR-001: Tech Stack](./decisions/adr-001-tech-stack.md) - Business context

### For Engineers
- Architecture: [System Overview](./architecture/system-overview.md)
- Implementation: [Data Flow](./architecture/data-flow.md)
- API Reference: [API Spec](./architecture/api-spec.yaml)
- Infrastructure: [Infrastructure](./architecture/infrastructure.md)

### For DevOps
- Start with: [Infrastructure](./architecture/infrastructure.md)
- Reference: [API Spec](./architecture/api-spec.yaml) for monitoring

### For Stakeholders
- Executive Summary: [System Overview](./architecture/system-overview.md) - First 3 sections
- Technology Decisions: [ADR-001](./decisions/adr-001-tech-stack.md)

## 📖 Document Summaries

### 1. System Overview (system-overview.md)
**Purpose**: Comprehensive overview of the entire Genie platform

**Key Sections**:
- System purpose and features
- High-level architecture diagram
- Core components (Frontend, API, Services)
- Processing flow
- Data models
- Security architecture
- Scalability & performance
- Monitoring & observability
- Cost estimation
- Deployment architecture
- Future roadmap

**Audience**: All team members, stakeholders

### 2. Data Flow (data-flow.md)
**Purpose**: Detailed data flow through the system

**Key Sections**:
- Upload flow (client-side and server-side)
- Image analysis pipeline (Claude Vision API)
- Content generation flow (text and images)
- Storage architecture (S3 structure)
- Real-time updates (WebSocket)
- Database operations (DynamoDB queries)
- Error handling & retry strategies

**Includes**:
- Mermaid sequence diagrams
- Code examples for each flow
- WebSocket message formats
- DynamoDB access patterns

**Audience**: Backend engineers, full-stack developers

### 3. API Specification (api-spec.yaml)
**Purpose**: Complete OpenAPI 3.1 REST API specification

**Endpoints**:
```
POST   /upload/presigned     - Get presigned S3 upload URL
POST   /jobs                 - Create generation job
GET    /jobs                 - List user's jobs
GET    /jobs/{id}            - Get job details
DELETE /jobs/{id}            - Cancel/delete job
POST   /jobs/{id}/regenerate - Regenerate content
GET    /analysis/{id}        - Get product analysis
GET    /assets/{id}          - Get generated assets
POST   /assets/{id}/download - Download as ZIP
POST   /webhooks             - Register webhook
```

**Features**:
- Complete request/response schemas
- TypeScript-compatible types
- Error response examples
- Rate limiting documentation
- Authentication specification
- Webhook event types

**Usage**:
```bash
# Generate TypeScript client
npx openapi-typescript api-spec.yaml -o types/api.ts

# Validate API spec
npx @apidevtools/swagger-cli validate api-spec.yaml

# Generate documentation
npx redoc-cli bundle api-spec.yaml -o api-docs.html
```

**Audience**: Frontend developers, API consumers, QA engineers

### 4. Infrastructure (infrastructure.md)
**Purpose**: Complete cloud infrastructure documentation

**Key Sections**:
- Multi-cloud strategy (AWS + Vercel + Cloudflare)
- Deployment architecture
- AWS Lambda configuration (Serverless Framework)
- DynamoDB schema and access patterns
- S3 storage structure and lifecycle policies
- CloudFront CDN configuration
- Security infrastructure (IAM, encryption, WAF)
- Monitoring & observability (CloudWatch, X-Ray)
- Cost optimization strategies
- Disaster recovery & backup

**Includes**:
- Serverless Framework YAML config
- IAM policy examples
- CloudWatch dashboards
- Cost breakdown
- Multi-region failover strategy

**Audience**: DevOps engineers, cloud architects, SRE team

### 5. ADR-001: Tech Stack (adr-001-tech-stack.md)
**Purpose**: Architecture Decision Record for technology selection

**Key Sections**:
- Decision context and drivers
- Comparison tables for all technology choices:
  - Frontend framework (Next.js vs Remix vs SvelteKit)
  - Backend architecture (Serverless vs EC2 vs Containers)
  - Language (TypeScript vs Python vs Rust)
  - Database (DynamoDB vs PostgreSQL vs MongoDB)
  - File storage (S3 vs R2 vs GCS)
  - AI APIs (Claude vs GPT-4)
  - Deployment (Vercel vs Amplify vs Netlify)
- Final tech stack summary
- Consequences (positive & negative)
- Risks & mitigations
- Alternatives considered
- Implementation roadmap
- Review schedule

**Format**: Standard ADR template

**Audience**: Technical leadership, engineering team, future maintainers

## 🔧 Tools & Standards

### Documentation Standards
- **Format**: Markdown (GitHub Flavored)
- **Diagrams**: Mermaid (inline in Markdown)
- **API Spec**: OpenAPI 3.1.0
- **Code Examples**: TypeScript (with syntax highlighting)
- **Line Length**: 100 characters (for readability)

### Diagram Tools
- **Mermaid**: Sequence diagrams, flowcharts
- **ASCII Art**: Architecture diagrams (for universal compatibility)

### API Documentation
- **OpenAPI/Swagger**: Machine-readable API spec
- **Redoc**: Generate beautiful API documentation
- **openapi-typescript**: Generate TypeScript types

## 🔄 Maintenance

### Update Frequency
- **System Overview**: Monthly or after major features
- **Data Flow**: When processing logic changes
- **API Spec**: With every API change (versioned)
- **Infrastructure**: When infrastructure changes
- **ADRs**: New ADR for each major decision

### Ownership
| Document | Owner | Reviewers |
|----------|-------|-----------|
| system-overview.md | Engineering Lead | Product Manager, CTO |
| data-flow.md | Backend Lead | Full-stack Team |
| api-spec.yaml | API Team | Frontend Team, QA |
| infrastructure.md | DevOps Lead | SRE Team, CTO |
| ADRs | Technical Leadership | Engineering Team |

### Review Process
1. Create PR with documentation changes
2. Request review from document owner
3. Update version number and "Last Updated" date
4. Merge after approval
5. Notify team in Slack #engineering

## 📊 Metrics

### Documentation Health
- **Coverage**: 100% (all required docs present)
- **Freshness**: Updated within 30 days
- **Completeness**: 2,981 lines across 5 documents
- **Code Examples**: 50+ TypeScript examples
- **Diagrams**: 10+ Mermaid diagrams

### Quality Checklist
- [x] All sections complete
- [x] Code examples tested
- [x] Diagrams render correctly
- [x] API spec validates
- [x] Links working
- [x] Consistent formatting
- [x] Version numbers updated

## 🎯 Next Steps

### For New Team Members
1. Read [System Overview](./architecture/system-overview.md) (30 min)
2. Review [ADR-001: Tech Stack](./decisions/adr-001-tech-stack.md) (20 min)
3. Study [API Spec](./architecture/api-spec.yaml) (30 min)
4. Deep dive into your domain:
   - Frontend: System Overview + API Spec
   - Backend: Data Flow + Infrastructure
   - DevOps: Infrastructure + ADRs

### For Implementation
1. Reference [Data Flow](./architecture/data-flow.md) for implementation patterns
2. Use [API Spec](./architecture/api-spec.yaml) to generate client/server code
3. Follow [Infrastructure](./architecture/infrastructure.md) for deployment
4. Create new ADRs for major decisions

## 📞 Questions?

- **Architecture**: @engineering-lead
- **API Design**: @backend-lead
- **Infrastructure**: @devops-lead
- **Documentation**: @tech-writer

## 🔗 Related Resources

### External Links
- [Next.js Documentation](https://nextjs.org/docs)
- [AWS Lambda Best Practices](https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html)
- [Anthropic Claude API](https://docs.anthropic.com/claude/reference)
- [OpenAI DALL-E API](https://platform.openai.com/docs/guides/images)

### Internal Links
- [Project README](../README.md)
- [Contributing Guidelines](../.github/CONTRIBUTING.md)
- [Code Style Guide](../.github/CODE_STYLE.md)

---

**Last Updated**: 2025-12-13
**Documentation Version**: 1.0
**Maintainer**: Engineering Team
