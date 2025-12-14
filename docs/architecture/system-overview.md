# System Overview - Genie AI Marketing Content Generator

## 📋 System Purpose

Genie is an AI-powered system that transforms a single product image into comprehensive marketing materials including:
- Package design variations
- Advertising creative assets
- E-commerce product descriptions
- Multi-platform marketing copy

## 🏗️ High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           Client Applications                            │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐      │
│  │   Web Dashboard  │  │   Mobile App     │  │   API Clients    │      │
│  │   (Next.js)      │  │   (React Native) │  │   (SDK)          │      │
│  └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘      │
└───────────┼─────────────────────┼─────────────────────┼─────────────────┘
            │                     │                     │
            └─────────────────────┼─────────────────────┘
                                  │
                        ┌─────────▼──────────┐
                        │   API Gateway      │
                        │   (Vercel Edge)    │
                        └─────────┬──────────┘
                                  │
            ┌─────────────────────┼─────────────────────┐
            │                     │                     │
   ┌────────▼─────────┐  ┌────────▼─────────┐  ┌──────▼──────────┐
   │  Image Analysis  │  │  Content Gen     │  │  Asset Storage  │
   │  Service         │  │  Service         │  │  Service        │
   │  (AWS Lambda)    │  │  (AWS Lambda)    │  │  (S3/R2)        │
   └────────┬─────────┘  └────────┬─────────┘  └──────┬──────────┘
            │                     │                    │
            │                     │                    │
   ┌────────▼─────────────────────▼────────────────────▼──────────┐
   │                    External AI Services                       │
   │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
   │  │  Claude API  │  │  DALL-E 3    │  │  Stable Diff │       │
   │  │  (Analysis)  │  │  (Gen Image) │  │  (Gen Image) │       │
   │  └──────────────┘  └──────────────┘  └──────────────┘       │
   └──────────────────────────────────────────────────────────────┘
```

## 🔧 Core Components

### 1. Frontend Layer (Next.js)
**Location**: `/src/app`
**Responsibilities**:
- User authentication and session management
- Image upload interface with drag-and-drop
- Real-time generation progress display
- Gallery view for generated assets
- Export and download functionality

**Key Features**:
- Server-side rendering for SEO
- Edge runtime for global performance
- Optimistic UI updates
- WebSocket support for real-time updates

### 2. API Gateway (Vercel Edge Functions)
**Location**: `/src/app/api`
**Responsibilities**:
- Request routing and validation
- Rate limiting and authentication
- Response caching
- Error handling and logging

**Endpoints**:
```
POST   /api/v1/analyze        - Upload and analyze product image
POST   /api/v1/generate       - Generate marketing content
GET    /api/v1/jobs/:id       - Get generation job status
GET    /api/v1/assets/:id     - Retrieve generated assets
DELETE /api/v1/assets/:id     - Delete assets
```

### 3. Image Analysis Service
**Technology**: AWS Lambda + Claude Vision API
**Responsibilities**:
- Image preprocessing and validation
- Product categorization
- Visual feature extraction
- Brand color palette detection
- Target audience inference

**Input**: Product image (JPEG/PNG, max 10MB)
**Output**: Structured analysis JSON
```json
{
  "product_type": "beverage",
  "colors": ["#FF6B6B", "#4ECDC4"],
  "style": "modern-minimalist",
  "target_audience": "health-conscious millennials",
  "key_features": ["organic", "sustainable packaging"],
  "confidence": 0.92
}
```

### 4. Content Generation Service
**Technology**: AWS Lambda + Claude Sonnet/Opus API
**Responsibilities**:
- Marketing copy generation (multiple languages)
- Product description creation
- SEO-optimized content
- A/B testing variants
- Tone and style customization

**Input**: Analysis result + user preferences
**Output**: Multi-format content bundle
```json
{
  "ec_description": {
    "short": "150 char headline",
    "medium": "500 char product description",
    "long": "Full product story with features"
  },
  "ad_copy": {
    "facebook": "Engaging social media copy",
    "instagram": "Visual-first caption",
    "google_ads": "Performance-focused headline"
  },
  "seo_keywords": ["organic juice", "healthy beverage"]
}
```

### 5. Image Generation Service
**Technology**: AWS Lambda + DALL-E 3 / Stable Diffusion
**Responsibilities**:
- Package design variations
- Ad creative generation
- Background replacement
- Product mockups
- Multi-platform sizing

**Supported Formats**:
- Package: 1080x1080 (square), 1200x1600 (portrait)
- Social Media: Instagram (1080x1080), Facebook (1200x630)
- E-commerce: Product shots (2000x2000, white background)

### 6. Asset Storage Service
**Technology**: AWS S3 + Cloudflare R2
**Responsibilities**:
- Secure file storage with encryption
- CDN distribution via CloudFront
- Automatic image optimization
- Version control for assets
- Expiration and cleanup

**Storage Strategy**:
```
/uploads/{user_id}/{timestamp}/original.jpg
/generated/{job_id}/package-v1.png
/generated/{job_id}/package-v2.png
/generated/{job_id}/ad-facebook.png
/generated/{job_id}/content.json
```

## 🔄 Processing Flow

### Standard Generation Flow
```
1. User uploads image
   └─> Frontend validates (size, format)

2. Image sent to Analysis Service
   └─> Claude Vision extracts product data
   └─> Results cached in Redis

3. User reviews analysis + sets preferences
   └─> Language selection
   └─> Style preferences
   └─> Target platforms

4. Content Generation Service triggered
   └─> Parallel execution:
       ├─> Text generation (Claude API)
       ├─> Package design (DALL-E 3)
       └─> Ad creatives (Stable Diffusion)

5. Assets uploaded to S3/R2
   └─> CDN URLs generated

6. Frontend displays results
   └─> User can refine and regenerate
```

### Batch Processing Flow
For bulk operations (10+ products):
```
1. CSV/Excel upload with image URLs
2. Queue jobs in SQS
3. Lambda processes in parallel (concurrency: 10)
4. Results aggregated in DynamoDB
5. Notification sent via email/webhook
```

## 📊 Data Models

### Job Schema
```typescript
interface Job {
  id: string;                    // UUID
  userId: string;
  status: 'pending' | 'analyzing' | 'generating' | 'completed' | 'failed';
  originalImage: string;         // S3 URL
  analysis: ProductAnalysis;
  preferences: GenerationPreferences;
  results: GeneratedAssets;
  createdAt: Date;
  completedAt?: Date;
  error?: string;
}
```

### Product Analysis Schema
```typescript
interface ProductAnalysis {
  category: string;              // "food", "beverage", "cosmetics", etc.
  subcategory: string;
  colors: ColorPalette;
  style: DesignStyle;
  targetAudience: Audience;
  features: string[];
  brandPersonality: string[];
  confidence: number;
}
```

### Generated Assets Schema
```typescript
interface GeneratedAssets {
  packages: ImageAsset[];        // Design variations
  ads: {
    facebook: ImageAsset;
    instagram: ImageAsset;
    googleAds: ImageAsset;
  };
  content: {
    ecDescription: MultiLengthText;
    adCopy: PlatformCopy;
    seoKeywords: string[];
    hashtags: string[];
  };
}
```

## 🔐 Security Architecture

### Authentication & Authorization
- **Auth Provider**: Clerk / Auth0
- **Session Management**: JWT tokens (httpOnly cookies)
- **API Security**: API keys for external integrations
- **RBAC**: Admin, Pro User, Free User roles

### Data Protection
- **Encryption at Rest**: AES-256 for S3 objects
- **Encryption in Transit**: TLS 1.3 for all API calls
- **PII Handling**: User data anonymized in logs
- **GDPR Compliance**: Right to delete, data export

### Rate Limiting
```
Free Tier:  10 generations/day
Pro Tier:   100 generations/day
Enterprise: Unlimited with quotas
```

## 📈 Scalability & Performance

### Horizontal Scaling
- **Frontend**: Auto-scaling via Vercel Edge Network
- **Backend**: Lambda auto-scales to 1000 concurrent executions
- **Database**: DynamoDB on-demand capacity
- **Cache**: Redis Cluster with read replicas

### Performance Targets
- Image analysis: < 5 seconds
- Content generation: < 10 seconds
- Full job completion: < 30 seconds (p95)
- API response time: < 200ms (p95)

### Caching Strategy
```
L1: Browser cache (static assets: 1 year)
L2: CDN cache (images: 30 days)
L3: Redis cache (API responses: 1 hour)
L4: Database query cache (5 minutes)
```

## 🔍 Monitoring & Observability

### Metrics (Datadog / CloudWatch)
- Request count, latency, error rate
- Lambda invocation metrics
- AI API usage and costs
- User engagement analytics

### Logging (CloudWatch Logs)
- Structured JSON logs
- Request tracing with correlation IDs
- Error stack traces
- Performance profiling

### Alerting
- Error rate > 1%: PagerDuty alert
- Latency p95 > 1s: Slack notification
- AI API failure: Email notification
- Daily cost report: Email dashboard

## 💰 Cost Estimation

### AI API Costs (per 1000 jobs)
- Claude Vision (analysis): $5
- Claude Sonnet (text): $15
- DALL-E 3 (images): $120
- **Total AI cost**: ~$140/1000 jobs

### Infrastructure Costs (monthly)
- Vercel Pro: $20
- AWS Lambda: $10-50 (variable)
- S3 Storage: $5-20 (variable)
- CloudFront: $10-30 (variable)
- **Total infra**: $45-120/month

### Break-even Analysis
- Free tier (ad-supported): 100 users
- Pro tier ($29/month): 50 subscribers
- Enterprise tier (custom): 5 customers

## 🚀 Deployment Architecture

### Environments
1. **Development**: Local + Vercel Preview
2. **Staging**: staging.genie.ai
3. **Production**: app.genie.ai

### CI/CD Pipeline (GitHub Actions)
```
Push to main
  └─> Run tests (Jest + Playwright)
      └─> Build Next.js app
          └─> Deploy to Vercel
              └─> Run smoke tests
                  └─> Notify team (Slack)
```

### Infrastructure as Code
- **Tool**: Terraform
- **State**: S3 backend with DynamoDB locking
- **Modules**: VPC, Lambda, S3, CloudFront, DynamoDB

## 🔮 Future Enhancements

### Phase 2 (Q2 2025)
- Video content generation
- Multi-language support (10+ languages)
- Custom brand style guides
- API marketplace for integrations

### Phase 3 (Q3 2025)
- Real-time collaboration features
- Version control for campaigns
- A/B testing automation
- Analytics dashboard

### Phase 4 (Q4 2025)
- White-label solution
- Enterprise SSO integration
- Custom AI model fine-tuning
- Mobile app (iOS + Android)

---

**Last Updated**: 2025-12-13
**Version**: 1.0
**Owner**: Engineering Team
