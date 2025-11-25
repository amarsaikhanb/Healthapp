# Pathway RAG Service for Patient Medical Data

This is a real-time RAG (Retrieval-Augmented Generation) chatbot that indexes patient medical data and provides contextual answers to doctors' queries.

## Features

- **Real-time Indexing**: Automatically detects and indexes new patient data
- **Patient-Specific Queries**: Filter queries by patient ID to get relevant information
- **Comprehensive Context**: Includes session transcripts, clinical inferences, medications, and form responses
- **OpenAI Integration**: Uses GPT-4o-mini for cost-effective, intelligent responses

## Setup

### 1. Install Dependencies

```bash
cd pathway_rag
pip install -r requirements.txt
```

### 2. Configure Environment Variables

Create a `.env` file in the `pathway_rag` directory:

```env
OPENAI_API_KEY=sk-...
```

### 3. Create Data Directory

```bash
mkdir -p patient_data
```

The `patient_data` directory will store patient documents. Each patient's data is stored in a file named `{patient_id}.txt`.

### 4. Start the Service

```bash
python main.py
```

The service will start on `http://0.0.0.0:8011` and begin monitoring the `patient_data/` directory for changes.

## How It Works

### Data Flow

1. **Data Sync**: When a patient's session or form is updated, the Next.js app automatically calls `syncPatientDataToRAG()` which writes the patient's comprehensive medical data to `pathway_rag/patient_data/{patient_id}.txt`

2. **Real-time Indexing**: Pathway automatically detects the file change and re-indexes the patient's data

3. **Query Processing**: When a doctor sends a query through the chatbot:
   - The query is sent to the Pathway RAG service with the patient ID
   - Pathway retrieves the top 3 most relevant document chunks for that patient
   - The context is combined with the query and sent to OpenAI GPT-4o-mini
   - The AI generates a contextual answer based on the patient's medical records

### Document Structure

Each patient document includes:
- Patient profile (name, email, phone, DOB)
- Session history with transcripts, summaries, inferences, and medications
- Form responses with questions and answers

## API Usage

### Query Endpoint

```bash
POST http://localhost:8011
Content-Type: application/json

{
  "messages": "What medications has this patient been prescribed?",
  "patientId": "uuid-here"
}
```

### Response

```json
{
  "result": "Based on the patient's medical records, they have been prescribed..."
}
```

## Integration with Next.js App

### Server Actions

- `syncPatientDataToRAG(patientId)`: Sync patient data to filesystem for indexing
- `queryPatientRAG(patientId, message)`: Query the RAG system
- `autoSyncPatientData(patientId)`: Auto-sync (called after session/form updates)

### UI Component

The `PatientRAGChatbot` component appears on each patient's detail page and provides:
- Chat interface for asking questions about the patient
- Manual sync button to update data
- Real-time responses from the AI

## Environment Variables (Next.js)

Add to your Next.js `.env.local`:

```env
PATHWAY_RAG_URL=http://localhost:8011
```

In production, update this to your deployed Pathway service URL.

## Deployment

### Option 1: Separate Server

Deploy the Pathway service on a separate server and update `PATHWAY_RAG_URL` to point to it.

### Option 2: Docker

Create a `Dockerfile` in the `pathway_rag` directory:

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY main.py .

RUN mkdir -p patient_data

CMD ["python", "main.py"]
```

Build and run:

```bash
docker build -t pathway-rag .
docker run -p 8011:8011 -v $(pwd)/patient_data:/app/patient_data -e OPENAI_API_KEY=sk-... pathway-rag
```

## Troubleshooting

### Service won't start

- Ensure OpenAI API key is set
- Check that port 8011 is available
- Verify all dependencies are installed

### No responses from chatbot

- Check that the Pathway service is running
- Verify `PATHWAY_RAG_URL` is correct in Next.js
- Try clicking the sync button to refresh patient data

### Outdated information

- Click the sync button in the chatbot
- Patient data is automatically synced after session/form updates
- You can manually call `syncPatientDataToRAG(patientId)` to force a sync

## Cost Optimization

The service uses GPT-4o-mini, OpenAI's cheapest model, for cost-effective operations. For high-volume usage, consider:

- Implementing rate limiting
- Caching common queries
- Using a smaller embedding model
- Adjusting the number of retrieved documents (k parameter)

