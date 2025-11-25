"""
Pathway RAG Service for Patient Medical Data
Real-time RAG chatbot that indexes patient data and provides contextual answers
"""

import pathway as pw
from pathway.stdlib.indexing.nearest_neighbors import BruteForceKnnFactory
from pathway.xpacks.llm import llms
from pathway.xpacks.llm.document_store import DocumentStore
from pathway.xpacks.llm.embedders import OpenAIEmbedder
from pathway.xpacks.llm.parsers import UnstructuredParser
from pathway.xpacks.llm.splitters import TokenCountSplitter
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# Document Indexing
# Monitor a directory where patient documents will be stored
# Each patient's data should be in ./patient_data/{patient_id}.txt
documents = pw.io.fs.read("./patient_data/", format="binary", with_metadata=True)

# Text Splitter - splits documents into manageable chunks
text_splitter = TokenCountSplitter(
    min_tokens=100, max_tokens=500, encoding_name="cl100k_base"
)

# Embedder - converts text into embeddings using OpenAI
embedder = OpenAIEmbedder(api_key=os.environ["OPENAI_API_KEY"])

# Retriever Factory - finds relevant documents using embeddings
retriever_factory = BruteForceKnnFactory(
    embedder=embedder,
)

# Parser - extracts and structures text from documents
parser = UnstructuredParser(
    chunking_mode="by_title",
    chunking_kwargs={
        "max_characters": 3000,
        "new_after_n_chars": 2000,
    },
)

# Create Document Store
document_store = DocumentStore(
    docs=documents,
    retriever_factory=retriever_factory,
    parser=parser,
    splitter=text_splitter,
)

# User Queries Setup
# Configure HTTP server
webserver = pw.io.http.PathwayWebserver(host="0.0.0.0", port=8011)

# Define query schema
class QuerySchema(pw.Schema):
    messages: str
    patientId: str  # Filter queries by patient ID

# Create REST connector
queries, writer = pw.io.http.rest_connector(
    webserver=webserver,
    schema=QuerySchema,
    autocommit_duration_ms=50,
    delete_completed_queries=False,
)

# Format queries for document store
# Filter documents by patient ID using filepath pattern
queries = queries.select(
    query=pw.this.messages,
    k=3,  # Retrieve top 3 most relevant documents
    metadata_filter=None,
    filepath_globpattern=pw.apply(
        lambda patient_id: f"*/{patient_id}.txt",
        pw.this.patientId
    ),
)

# Document Retrieval
retrieved_documents = document_store.retrieve_query(queries)
retrieved_documents = retrieved_documents.select(docs=pw.this.result)

# Combine queries with retrieved documents
queries_context = queries + retrieved_documents

# Answer Generation
def get_context(documents):
    """Extract text content from retrieved documents"""
    content_list = []
    for doc in documents:
        content_list.append(str(doc["text"]))
    return " ".join(content_list)

@pw.udf
def build_prompts_udf(documents, query) -> str:
    """Build prompts with context from retrieved documents"""
    context = get_context(documents)
    prompt = f"""You are a medical assistant helping a doctor review patient information.

Context from patient records:
{context}

Doctor's question: {query}

Please provide a helpful, accurate answer based on the patient's medical records. If the information is not available in the records, please state that clearly. Focus on:
- Session transcripts and summaries
- Clinical inferences and observations
- Medications discussed
- Form responses and health assessments

Answer:"""
    return prompt

prompts = queries_context + queries_context.select(
    prompts=build_prompts_udf(pw.this.docs, pw.this.query)
)

# Define the LLM model
model = llms.OpenAIChat(
    model="gpt-4o-mini",  # Cheapest OpenAI model
    api_key=os.environ["OPENAI_API_KEY"],
)

# Generate answers
responses = prompts.select(
    *pw.this.without(pw.this.query, pw.this.prompts, pw.this.docs),
    result=model(
        llms.prompt_chat_single_qa(pw.this.prompts),
    ),
)

# Return answers via HTTP
writer(responses)

# Run the pipeline
if __name__ == "__main__":
    print("Starting Pathway RAG service on http://0.0.0.0:8011")
    print("Monitoring patient_data/ directory for changes...")
    pw.run()

