# Infrastructure Architecture - Genie AI Marketing Content Generator

## 🏗️ Infrastructure Overview

This document details the cloud infrastructure, deployment strategy, and operational considerations for the Genie platform.

## 🌐 Cloud Provider Architecture

### Multi-Cloud Strategy

```
┌──────────────────────────────────────────────────────────────────┐
│                        Production Stack                           │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌────────────────────────────────────────────────────────┐     │
│  │                    Vercel (Edge Network)                │     │
│  │  • Next.js Frontend Hosting                            │     │
│  │  • Edge Functions (API Routes)                         │     │
│  │  • Global CDN (300+ locations)                         │     │
│  │  • Automatic SSL/TLS                                   │     │
│  └────────────────────────────────────────────────────────┘     │
│                                                                   │
│  ┌────────────────────────────────────────────────────────┐     │
│  │                    AWS Services                         │     │
│  │                                                         │     │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐  │     │
│  │  │  Lambda      │  │  DynamoDB    │  │   S3        │  │     │
│  │  │  (Compute)   │  │  (Database)  │  │  (Storage)  │  │     │
│  │  └──────────────┘  └──────────────┘  └─────────────┘  │     │
│  │                                                         │     │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐  │     │
│  │  │ CloudFront   │  │     SQS      │  │ EventBridge │  │     │
│  │  │    (CDN)     │  │   (Queue)    │  │   (Events)  │  │     │
│  │  └──────────────┘  └──────────────┘  └─────────────┘  │     │
│  └────────────────────────────────────────────────────────┘     │
│                                                                   │
│  ┌────────────────────────────────────────────────────────┐     │
│  │                Cloudflare Services                      │     │
│  │  • R2 Storage (S3-compatible backup)                   │     │
│  │  • WAF (Web Application Firewall)                      │     │
│  │  • DDoS Protection                                     │     │
│  │  • Analytics                                           │     │
│  └────────────────────────────────────────────────────────┘     │
└──────────────────────────────────────────────────────────────────┘
```

## 📦 Deployment Architecture

### Vercel Deployment

```yaml
# vercel.json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "installCommand": "npm install",
  "regions": ["iad1", "sfo1", "lhr1", "hnd1"],
  "functions": {
    "api/**/*.ts": {
      "runtime": "nodejs20.x",
      "memory": 1024,
      "maxDuration": 60
    }
  },
  "env": {
    "NEXT_PUBLIC_API_URL": "https://api.genie.ai",
    "AWS_REGION": "us-east-1"
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Access-Control-Allow-Origin", "value": "*" },
        { "key": "Cache-Control", "value": "no-store" }
      ]
    },
    {
      "source": "/assets/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    }
  ]
}
```

### Frontend Structure

```
/app (Next.js 14 App Router)
├── layout.tsx              # Root layout
├── page.tsx                # Homepage
├── (auth)/
│   ├── login/page.tsx
│   └── signup/page.tsx
├── dashboard/
│   ├── page.tsx           # Dashboard home
│   ├── jobs/
│   │   ├── page.tsx       # Jobs list
│   │   └── [id]/page.tsx  # Job details
│   └── settings/page.tsx
└── api/                   # Edge API routes
    └── v1/
        ├── upload/
        │   └── presigned/route.ts
        ├── jobs/
        │   ├── route.ts           # GET /api/v1/jobs, POST /api/v1/jobs
        │   └── [id]/route.ts      # GET /api/v1/jobs/:id
        └── assets/
            └── [id]/route.ts
```

## 🚀 AWS Lambda Functions

### Function Architecture

```
lambda/
├── analyze-image/
│   ├── handler.ts         # Main handler
│   ├── claude.ts          # Claude API integration
│   ├── s3.ts              # S3 operations
│   └── package.json
├── generate-content/
│   ├── handler.ts
│   ├── prompts/
│   │   ├── ecommerce.ts
│   │   ├── social.ts
│   │   └── ads.ts
│   └── package.json
├── generate-images/
│   ├── handler.ts
│   ├── dalle.ts           # DALL-E integration
│   ├── stability.ts       # Stability AI integration
│   └── package.json
└── webhook-dispatcher/
    ├── handler.ts
    └── package.json
```

### Lambda Configuration

```typescript
// serverless.yml
service: genie-backend

provider:
  name: aws
  runtime: nodejs20.x
  region: us-east-1
  stage: ${opt:stage, 'dev'}
  memorySize: 1024
  timeout: 60
  environment:
    DYNAMODB_TABLE: ${self:service}-${self:provider.stage}-jobs
    S3_BUCKET: genie-assets-${self:provider.stage}
    CLAUDE_API_KEY: ${env:CLAUDE_API_KEY}
    OPENAI_API_KEY: ${env:OPENAI_API_KEY}
  iam:
    role:
      statements:
        - Effect: Allow
          Action:
            - dynamodb:Query
            - dynamodb:Scan
            - dynamodb:GetItem
            - dynamodb:PutItem
            - dynamodb:UpdateItem
          Resource: "arn:aws:dynamodb:${self:provider.region}:*:table/${self:provider.environment.DYNAMODB_TABLE}"
        - Effect: Allow
          Action:
            - s3:GetObject
            - s3:PutObject
          Resource: "arn:aws:s3:::${self:provider.environment.S3_BUCKET}/*"

functions:
  analyzeImage:
    handler: lambda/analyze-image/handler.handler
    events:
      - s3:
          bucket: ${self:provider.environment.S3_BUCKET}
          event: s3:ObjectCreated:*
          rules:
            - prefix: uploads/
    reservedConcurrency: 10
    timeout: 120

  generateContent:
    handler: lambda/generate-content/handler.handler
    events:
      - eventBridge:
          pattern:
            source:
              - genie.jobs
            detail-type:
              - JobAnalysisCompleted
    reservedConcurrency: 20

  generateImages:
    handler: lambda/generate-images/handler.handler
    events:
      - eventBridge:
          pattern:
            source:
              - genie.jobs
            detail-type:
              - ContentGenerationCompleted
    reservedConcurrency: 5
    timeout: 300

resources:
  Resources:
    JobsTable:
      Type: AWS::DynamoDB::Table
      Properties:
        TableName: ${self:provider.environment.DYNAMODB_TABLE}
        BillingMode: PAY_PER_REQUEST
        AttributeDefinitions:
          - AttributeName: PK
            AttributeType: S
          - AttributeName: SK
            AttributeType: S
          - AttributeName: GSI1PK
            AttributeType: S
          - AttributeName: GSI1SK
            AttributeType: S
        KeySchema:
          - AttributeName: PK
            KeyType: HASH
          - AttributeName: SK
            KeyType: RANGE
        GlobalSecondaryIndexes:
          - IndexName: GSI1
            KeySchema:
              - AttributeName: GSI1PK
                KeyType: HASH
              - AttributeName: GSI1SK
                KeyType: RANGE
            Projection:
              ProjectionType: ALL
        StreamSpecification:
          StreamViewType: NEW_AND_OLD_IMAGES
```

## 💾 Database Architecture

### DynamoDB Table Design

```
Table: genie-jobs-prod
├── Partition Key (PK): String
├── Sort Key (SK): String
├── GSI1PK: String (Global Secondary Index 1 - Partition Key)
├── GSI1SK: String (Global Secondary Index 1 - Sort Key)
└── Attributes: Map

Access Patterns:
1. Get job by ID
   PK = "JOB#<jobId>", SK = "META"

2. Get user's jobs
   GSI1PK = "USER#<userId>", GSI1SK begins_with "JOB#"

3. Get job assets
   PK = "JOB#<jobId>", SK begins_with "ASSET#"

4. Get jobs by status
   GSI1PK = "STATUS#<status>", GSI1SK = "<timestamp>"

5. Get recent jobs
   GSI1PK = "RECENT", GSI1SK = "<timestamp>"
```

#### Sample Records

```json
// Job metadata
{
  "PK": "JOB#job_abc123",
  "SK": "META",
  "GSI1PK": "USER#user_xyz789",
  "GSI1SK": "JOB#2025-12-13T10:30:00Z",
  "userId": "user_xyz789",
  "status": "completed",
  "originalImage": "https://cdn.genie.ai/uploads/...",
  "createdAt": "2025-12-13T10:30:00Z",
  "updatedAt": "2025-12-13T10:30:45Z",
  "ttl": 1735747800  // Auto-delete after 30 days
}

// Job asset
{
  "PK": "JOB#job_abc123",
  "SK": "ASSET#pkg_001",
  "type": "package",
  "url": "https://cdn.genie.ai/generated/...",
  "metadata": {
    "width": 1080,
    "height": 1080,
    "style": "modern"
  }
}
```

### Cache Layer (Redis)

```yaml
# Redis Configuration (AWS ElastiCache)
cluster:
  name: genie-cache-prod
  node_type: cache.r6g.large
  num_cache_nodes: 2
  engine: redis
  engine_version: 7.0
  port: 6379

# Cache Keys Structure
keys:
  - "job:{jobId}:status" (TTL: 60s)
  - "job:{jobId}:analysis" (TTL: 3600s)
  - "user:{userId}:quota" (TTL: 86400s)
  - "api:ratelimit:{userId}:{endpoint}" (TTL: 60s)
```

## 📁 Storage Architecture

### S3 Bucket Structure

```
genie-assets-prod/
├── uploads/                    # User-uploaded images
│   └── {userId}/
│       └── {timestamp}-{filename}
│
├── generated/                  # AI-generated assets
│   └── {jobId}/
│       ├── analysis.json
│       ├── content.json
│       ├── packages/
│       │   ├── modern-v1.png
│       │   ├── bold-v2.png
│       │   └── elegant-v3.png
│       └── ads/
│           ├── facebook-1080x1080.png
│           ├── instagram-1080x1080.png
│           └── google-1200x628.png
│
└── thumbnails/                 # Auto-generated thumbnails
    └── {jobId}/
        └── {assetId}-thumb.webp
```

### S3 Lifecycle Policies

```typescript
const lifecycleRules = [
  {
    id: 'delete-old-uploads',
    prefix: 'uploads/',
    status: 'Enabled',
    expiration: { days: 7 },
  },
  {
    id: 'archive-old-generated',
    prefix: 'generated/',
    status: 'Enabled',
    transitions: [
      { days: 30, storageClass: 'STANDARD_IA' },
      { days: 90, storageClass: 'GLACIER' },
    ],
    expiration: { days: 365 },
  },
  {
    id: 'delete-thumbnails',
    prefix: 'thumbnails/',
    status: 'Enabled',
    expiration: { days: 30 },
  },
];
```

### CloudFront CDN Configuration

```typescript
const cloudfrontConfig = {
  distributionConfig: {
    enabled: true,
    origins: [
      {
        id: 'S3-genie-assets',
        domainName: 'genie-assets-prod.s3.amazonaws.com',
        s3OriginConfig: {
          originAccessIdentity: 'origin-access-identity/cloudfront/XXX',
        },
      },
    ],
    defaultCacheBehavior: {
      targetOriginId: 'S3-genie-assets',
      viewerProtocolPolicy: 'redirect-to-https',
      allowedMethods: ['GET', 'HEAD', 'OPTIONS'],
      cachedMethods: ['GET', 'HEAD'],
      compress: true,
      forwardedValues: {
        queryString: false,
        cookies: { forward: 'none' },
      },
      minTTL: 0,
      defaultTTL: 86400,     // 1 day
      maxTTL: 31536000,      // 1 year
    },
    cacheBehaviors: [
      {
        pathPattern: 'uploads/*',
        targetOriginId: 'S3-genie-assets',
        viewerProtocolPolicy: 'redirect-to-https',
        defaultTTL: 3600,    // 1 hour
      },
      {
        pathPattern: 'generated/*',
        targetOriginId: 'S3-genie-assets',
        viewerProtocolPolicy: 'redirect-to-https',
        defaultTTL: 2592000, // 30 days
      },
    ],
    customErrorResponses: [
      { errorCode: 403, responseCode: 404, responsePage: '/404.html' },
      { errorCode: 404, responseCode: 404, responsePage: '/404.html' },
    ],
    priceClass: 'PriceClass_100', // US, Europe, Asia
  },
};
```

## 🔐 Security Infrastructure

### Network Security

```
┌─────────────────────────────────────────────────────────┐
│              Cloudflare Security Layer                   │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐        │
│  │    WAF     │  │  DDoS Pro  │  │ Bot Mgmt   │        │
│  └────────────┘  └────────────┘  └────────────┘        │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
            ┌───────────────────────┐
            │   Vercel Edge Network │
            │   (TLS 1.3)           │
            └───────────┬───────────┘
                        │
            ┌───────────▼───────────┐
            │   API Gateway         │
            │   • Auth Middleware   │
            │   • Rate Limiting     │
            │   • Input Validation  │
            └───────────┬───────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
        ▼               ▼               ▼
   ┌────────┐    ┌──────────┐    ┌─────────┐
   │ Lambda │    │ DynamoDB │    │   S3    │
   │  VPC   │    │ (Encrypt)│    │ (AES256)│
   └────────┘    └──────────┘    └─────────┘
```

### IAM Policies

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "LambdaExecutionPolicy",
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:*"
    },
    {
      "Sid": "DynamoDBAccess",
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:Query"
      ],
      "Resource": "arn:aws:dynamodb:us-east-1:*:table/genie-jobs-*"
    },
    {
      "Sid": "S3ReadWrite",
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:PutObjectAcl"
      ],
      "Resource": "arn:aws:s3:::genie-assets-*/*",
      "Condition": {
        "StringEquals": {
          "s3:x-amz-server-side-encryption": "AES256"
        }
      }
    }
  ]
}
```

### Secrets Management

```typescript
// AWS Secrets Manager
const secrets = {
  'genie/prod/claude-api-key': {
    type: 'string',
    rotationEnabled: false,
    kmsKeyId: 'arn:aws:kms:us-east-1:xxx:key/xxx',
  },
  'genie/prod/openai-api-key': {
    type: 'string',
    rotationEnabled: false,
  },
  'genie/prod/database': {
    type: 'json',
    value: {
      host: 'xxx.rds.amazonaws.com',
      username: 'admin',
      password: 'xxx',
    },
  },
};
```

## 📊 Monitoring & Observability

### CloudWatch Dashboards

```typescript
const dashboards = {
  'Genie-Production-Overview': {
    widgets: [
      {
        type: 'metric',
        properties: {
          metrics: [
            ['AWS/Lambda', 'Invocations', { stat: 'Sum' }],
            ['.', 'Errors', { stat: 'Sum' }],
            ['.', 'Duration', { stat: 'Average' }],
          ],
          period: 300,
          title: 'Lambda Metrics',
        },
      },
      {
        type: 'metric',
        properties: {
          metrics: [
            ['AWS/DynamoDB', 'ConsumedReadCapacityUnits', { stat: 'Sum' }],
            ['.', 'ConsumedWriteCapacityUnits', { stat: 'Sum' }],
          ],
          title: 'DynamoDB Capacity',
        },
      },
    ],
  },
};
```

### Application Logging

```typescript
// Structured logging with Winston
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'genie-backend' },
  transports: [
    new winston.transports.Console(),
    new winston.transports.CloudWatch({
      logGroupName: '/aws/lambda/genie-prod',
      logStreamName: () => {
        const date = new Date().toISOString().split('T')[0];
        return `${date}-${process.env.AWS_LAMBDA_LOG_STREAM_NAME}`;
      },
    }),
  ],
});

// Usage
logger.info('Job created', {
  jobId: 'job_abc123',
  userId: 'user_xyz789',
  correlationId: 'req_abc123',
});
```

### Distributed Tracing (AWS X-Ray)

```typescript
import AWSXRay from 'aws-xray-sdk-core';
const AWS = AWSXRay.captureAWS(require('aws-sdk'));

export async function handler(event: any) {
  const segment = AWSXRay.getSegment();

  const subsegment = segment.addNewSubsegment('analyze-image');
  try {
    const result = await analyzeImage(event);
    subsegment.close();
    return result;
  } catch (error) {
    subsegment.addError(error);
    subsegment.close();
    throw error;
  }
}
```

### Alerting (CloudWatch Alarms)

```typescript
const alarms = [
  {
    alarmName: 'Genie-Lambda-Errors-High',
    metricName: 'Errors',
    namespace: 'AWS/Lambda',
    statistic: 'Sum',
    period: 300,
    evaluationPeriods: 2,
    threshold: 10,
    comparisonOperator: 'GreaterThanThreshold',
    actionsEnabled: true,
    alarmActions: ['arn:aws:sns:us-east-1:xxx:genie-alerts'],
  },
  {
    alarmName: 'Genie-API-Latency-High',
    metricName: 'Duration',
    namespace: 'AWS/Lambda',
    statistic: 'Average',
    period: 60,
    evaluationPeriods: 3,
    threshold: 5000, // 5 seconds
    comparisonOperator: 'GreaterThanThreshold',
  },
];
```

## 💰 Cost Optimization

### Resource Sizing

```yaml
Cost Breakdown (Estimated Monthly):
  Vercel Pro: $20
  AWS Lambda:
    - Compute: $10-30 (variable)
    - Requests: $5-15
  DynamoDB:
    - On-Demand: $10-25
  S3:
    - Storage: $5-20
    - Transfer: $5-15
  CloudFront: $10-30
  ElastiCache: $50-100
  Total: $115-255/month

Optimization Strategies:
  1. Lambda reserved concurrency to prevent runaway costs
  2. DynamoDB on-demand pricing (no provisioning)
  3. S3 lifecycle policies for automatic archival
  4. CloudFront caching to reduce origin requests
  5. Spot instances for batch processing (future)
```

### Cost Monitoring

```typescript
// AWS Cost Explorer API
async function getDailyCosts() {
  const ce = new AWS.CostExplorer();

  const params = {
    TimePeriod: {
      Start: '2025-12-01',
      End: '2025-12-31',
    },
    Granularity: 'DAILY',
    Metrics: ['UnblendedCost'],
    GroupBy: [
      { Type: 'SERVICE', Key: undefined },
    ],
  };

  const costs = await ce.getCostAndUsage(params).promise();
  return costs.ResultsByTime;
}
```

## 🔄 Disaster Recovery

### Backup Strategy

```yaml
RPO (Recovery Point Objective): 1 hour
RTO (Recovery Time Objective): 4 hours

Backup Components:
  1. DynamoDB:
     - Point-in-time recovery (PITR) enabled
     - Daily automated backups retained for 35 days

  2. S3:
     - Versioning enabled
     - Cross-region replication to us-west-2
     - Object lock for critical assets

  3. Secrets:
     - AWS Secrets Manager automatic rotation
     - Manual backups encrypted in separate account

  4. Infrastructure:
     - Terraform state in S3 with versioning
     - Git repository for all IaC code
```

### Multi-Region Failover

```
Primary Region: us-east-1
Failover Region: us-west-2

Failover Strategy:
  1. Route53 health checks monitor primary
  2. Automated DNS failover to secondary region
  3. S3 replication keeps assets in sync
  4. DynamoDB global tables for multi-region writes
  5. Manual Lambda deployment to failover region
```

---

**Last Updated**: 2025-12-13
**Version**: 1.0
**Owner**: DevOps Team
