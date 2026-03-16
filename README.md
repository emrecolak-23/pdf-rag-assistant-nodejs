# PDF.ai

PDF dokümanlarıyla sohbet edebileceğiniz RAG (Retrieval Augmented Generation) tabanlı bir uygulama. LangChain, Pinecone ve çoklu LLM desteği ile geliştirilmiştir.

## Özellikler

- **PDF Yükleme & İşleme** — PDF dosyalarını yükleyin, otomatik olarak parse edilip vektörleştirilir
- **RAG Sohbet** — Doküman içeriğine dayalı soru-cevap
- **Streaming Yanıtlar** — Gerçek zamanlı yanıt akışı
- **Çoklu LLM Desteği** — OpenAI (gpt-4o, gpt-4o-mini, gpt-4.1 serisi) ve Anthropic Claude
- **Skor Tabanlı Seçim** — Kullanıcı puanlarına göre LLM, memory ve retriever bileşenleri ağırlıklı rastgele seçilir
- **Kimlik Doğrulama** — Kayıt ve giriş

## Mimari

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

### Paketler

| Paket | Açıklama |
|-------|----------|
| **client** | SvelteKit + Tailwind CSS frontend |
| **pdf-server** | Express API, chat, auth, dosya yönetimi |
| **pdf-worker** | PDF işleme, embedding, Pinecone indeksleme (RabbitMQ consumer) |

## Gereksinimler

- Node.js 18+
- pnpm
- MongoDB
- Redis
- RabbitMQ
- OpenAI API Key
- Pinecone API Key (ve index)

## Kurulum

### 1. Bağımlılıkları yükleyin

```bash
pnpm install
# veya her paket için ayrı ayrı:
cd client && pnpm install
cd pdf-server && pnpm install
cd pdf-worker && pnpm install
```

### 2. Altyapıyı başlatın (Docker)

```bash
docker-compose up -d
```

Bu komut MongoDB, Redis ve RabbitMQ'yu başlatır.

### 3. Ortam değişkenleri

`pdf-server` ve `pdf-worker` için `.env` dosyaları oluşturun:

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

### 4. Uygulamayı çalıştırın

Üç terminalde sırasıyla:

```bash
# 1. API Server
cd pdf-server && pnpm dev

# 2. Worker (PDF işleme)
cd pdf-worker && pnpm dev

# 3. Client
cd client && pnpm dev
```

- **Client**: http://localhost:5173
- **API**: http://localhost:8000
- **RabbitMQ Management**: http://localhost:15672 (pdf/api)

## API Endpoints

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| POST | `/api/auth/signup` | Kayıt |
| POST | `/api/auth/signin` | Giriş |
| GET | `/api/pdfs` | PDF listesi |
| POST | `/api/pdfs` | PDF yükleme |
| GET | `/api/conversations` | Konuşma listesi |
| POST | `/api/conversations` | Yeni konuşma |
| POST | `/api/conversations/:id/messages` | Mesaj gönder (stream destekli) |
| PUT | `/api/scores` | Konuşma puanlama |
| GET | `/api/scores` | Skor özeti |

## Skor Sistemi

Kullanıcılar konuşmaları puanlayabilir (-1 ile 1 arası). Bu puanlar Redis'te saklanır ve yeni konuşma oluşturulurken:

- **LLM**, **memory** ve **retriever** bileşenleri ağırlıklı rastgele seçilir
- Ortalama skoru yüksek bileşenler daha sık seçilir
- Redis'te skor yoksa stratejilerin varsayılan skorları kullanılır

## Teknolojiler

- **Frontend**: SvelteKit, Tailwind CSS, Axios
- **Backend**: Express, TypeScript, tsyringe (DI)
- **AI**: LangChain, OpenAI, Anthropic, Pinecone
- **Veritabanı**: MongoDB, Redis
- **Kuyruk**: RabbitMQ

## Lisans

ISC
