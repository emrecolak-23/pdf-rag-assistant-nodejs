# PDF.ai

A RAG (Retrieval Augmented Generation) application for chatting with PDF documents. Built with LangChain, Pinecone, and multi-LLM support.

## Features

- **PDF Upload & Processing** — Upload PDF files; they are automatically parsed and vectorized
- **RAG Chat** — Question-answering based on document content
- **Streaming Responses** — Real-time response streaming
- **Multi-LLM Support** — OpenAI (gpt-4o, gpt-4o-mini, gpt-4.1 series) and Anthropic Claude
- **Score-Based Selection** — LLM, memory, and retriever components are weighted randomly based on user ratings
- **Authentication** — Sign up and sign in

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Client    │────▶│ pdf-server  │────▶│ pdf-worker  │
│  (Svelte)   │     │  (Express)  │     │  (RabbitMQ) │
└─────────────┘     └──────┬──────┘     └──────┬──────┘
                           │                   │
                    ┌──────┴──────┐      ┌──────┴──────┐
                    │ MongoDB     │      │ Pinecone   │
                    │ Redis       │      │ OpenAI     │
                    │ RabbitMQ    │      │ Embeddings │
                    └────────────┘      └────────────┘
```

### Packages

| Package | Description |
|---------|-------------|
| **client** | SvelteKit + Tailwind CSS frontend |
| **pdf-server** | Express API, chat, auth, file management |
| **pdf-worker** | PDF processing, embedding, Pinecone indexing (RabbitMQ consumer) |

## Requirements

- Node.js 18+
- pnpm
- MongoDB
- Redis
- RabbitMQ
- OpenAI API Key
- Pinecone API Key (and index)

## Installation

### 1. Install dependencies

```bash
pnpm install
# or for each package separately:
cd client && pnpm install
cd pdf-server && pnpm install
cd pdf-worker && pnpm install
```

### 2. Start infrastructure (Docker)

```bash
docker-compose up -d
```

This starts MongoDB, Redis, and RabbitMQ.

### 3. Environment variables

Create `.env` files for `pdf-server` and `pdf-worker`:

**pdf-server/.env**
```env
PORT=8000
SECRET_KEY=your-secret-key
MONGODB_URI=mongodb://localhost:27017/pdf_ai
REDIS_HOST=redis://localhost:6379
RABBITMQ_ENDPOINT=amqp://pdf:api@localhost:5672
OPENAI_API_KEY=sk-...
PINECONE_API_KEY=...
PINECONE_ENV_NAME=...
PINECONE_INDEX_NAME=...
INTERNAL_API_KEY=...
```

**pdf-worker/.env**
```env
MONGODB_URI=mongodb://localhost:27017/pdf_ai
REDIS_HOST=redis://localhost:6379
RABBITMQ_ENDPOINT=amqp://pdf:api@localhost:5672
OPENAI_API_KEY=sk-...
PINECONE_API_KEY=...
PINECONE_ENV_NAME=...
PINECONE_INDEX_NAME=...
INTERNAL_API_KEY=...
```

### 4. Run the application

In three separate terminals:

```bash
# 1. API Server
cd pdf-server && pnpm dev

# 2. Worker (PDF processing)
cd pdf-worker && pnpm dev

# 3. Client
cd client && pnpm dev
```

- **Client**: http://localhost:5173
- **API**: http://localhost:8000
- **RabbitMQ Management**: http://localhost:15672 (pdf/api)

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Sign up |
| POST | `/api/auth/signin` | Sign in |
| GET | `/api/pdfs` | List PDFs |
| POST | `/api/pdfs` | Upload PDF |
| GET | `/api/conversations` | List conversations |
| POST | `/api/conversations` | Create conversation |
| POST | `/api/conversations/:id/messages` | Send message (streaming supported) |
| PUT | `/api/scores` | Rate conversation |
| GET | `/api/scores` | Score summary |

## Score System

Users can rate conversations (between -1 and 1). Scores are stored in Redis and when creating new conversations:

- **LLM**, **memory**, and **retriever** components are selected via weighted random
- Components with higher average scores are selected more often
- If no scores exist in Redis, default strategy scores are used

## Technologies

- **Frontend**: SvelteKit, Tailwind CSS, Axios
- **Backend**: Express, TypeScript, tsyringe (DI)
- **AI**: LangChain, OpenAI, Anthropic, Pinecone
- **Database**: MongoDB, Redis
- **Queue**: RabbitMQ

## License

ISC
