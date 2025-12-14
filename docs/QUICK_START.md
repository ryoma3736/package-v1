# Quick Start Guide - Genie Architecture

## 5-Minute Overview

### What is Genie?
AI-powered marketing content generator that transforms a single product image into:
- Package design variations
- Advertising creative assets
- E-commerce product descriptions

### Tech Stack at a Glance
```
Frontend:  Next.js 14 + TypeScript + Tailwind
Backend:   AWS Lambda (Serverless)
Database:  DynamoDB
Storage:   S3 + CloudFront
AI:        Claude Sonnet 4 + DALL-E 3
```

## Quick Links

| Document | What's Inside | Read Time |
|----------|---------------|-----------|
| [System Overview](./architecture/system-overview.md) | Complete architecture | 15 min |
| [Data Flow](./architecture/data-flow.md) | How data moves through system | 20 min |
| [API Spec](./architecture/api-spec.yaml) | REST API reference | 10 min |
| [Infrastructure](./architecture/infrastructure.md) | AWS setup & deployment | 25 min |
| [Tech Stack ADR](./decisions/adr-001-tech-stack.md) | Why we chose these technologies | 15 min |

## Architecture in 60 Seconds

```
User uploads image
    ↓
S3 + Lambda analyze with Claude Vision API
    ↓
Extract product info (colors, style, audience)
    ↓
Generate content with Claude + DALL-E 3
    ↓
Store in S3, serve via CloudFront CDN
    ↓
User downloads marketing assets
```

## Key Components

1. **Frontend** (Next.js on Vercel)
   - Image upload UI
   - Real-time progress tracking
   - Asset gallery and download

2. **API Gateway** (Vercel Edge Functions)
   - Authentication
   - Rate limiting
   - Request routing

3. **Processing Services** (AWS Lambda)
   - Image Analysis (Claude Vision)
   - Content Generation (Claude Sonnet 4)
   - Image Generation (DALL-E 3)

4. **Storage** (S3 + CloudFront)
   - Original images
   - Generated assets
   - Metadata

5. **Database** (DynamoDB)
   - Job tracking
   - User data
   - Asset metadata

## API Endpoints

```
POST   /api/v1/upload/presigned   - Get upload URL
POST   /api/v1/jobs                - Create generation job
GET    /api/v1/jobs/:id            - Get job status
GET    /api/v1/assets/:id          - Download assets
```

## Local Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Access at http://localhost:3000
```

## Deployment

```bash
# Frontend (Vercel)
git push origin main
# Auto-deploys to production

# Backend (AWS Lambda)
cd backend
npm run deploy
```

## Cost Estimate

- **AI API**: ~$140 per 1,000 jobs
- **Infrastructure**: ~$115-255/month (variable)

## Performance Targets

- Image analysis: < 5s
- Content generation: < 10s
- Total job time: < 30s (p95)
- API response: < 200ms (p95)

## Need Help?

- Architecture questions → [System Overview](./architecture/system-overview.md)
- Implementation details → [Data Flow](./architecture/data-flow.md)
- API integration → [API Spec](./architecture/api-spec.yaml)
- Deployment issues → [Infrastructure](./architecture/infrastructure.md)

## For New Developers

**Day 1**: Read [System Overview](./architecture/system-overview.md)
**Day 2**: Study [API Spec](./architecture/api-spec.yaml) and [Data Flow](./architecture/data-flow.md)
**Day 3**: Review [Infrastructure](./architecture/infrastructure.md)
**Day 4**: Start coding!

---

**Last Updated**: 2025-12-13
**Quick Start Version**: 1.0
