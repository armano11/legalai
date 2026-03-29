import logging
import chromadb
from config import CHROMA_DIR, CHROMA_COLLECTION

logger = logging.getLogger(__name__)

_client = None
_collection = None


def get_collection():
    """Get or create the ChromaDB collection."""
    global _client, _collection
    if _collection is None:
        _client = chromadb.PersistentClient(path=CHROMA_DIR)
        _collection = _client.get_or_create_collection(
            name=CHROMA_COLLECTION,
            metadata={"hnsw:space": "cosine"}
        )
        logger.info(f"ChromaDB collection '{CHROMA_COLLECTION}' ready. Total docs: {_collection.count()}")
    return _collection


def add_documents(chunks: list, embeddings: list, metadatas: list, ids: list):
    """Add document chunks with their embeddings and metadata to the vector store."""
    collection = get_collection()
    collection.add(
        documents=chunks,
        embeddings=embeddings,
        metadatas=metadatas,
        ids=ids
    )
    logger.info(f"Added {len(chunks)} chunks to vector store.")


def search(query_embedding: list, top_k: int = 5) -> dict:
    """Search the vector store for the most similar documents."""
    collection = get_collection()

    if collection.count() == 0:
        logger.warning("Vector store is empty. No documents to search.")
        return {"documents": [[]], "metadatas": [[]], "distances": [[]]}

    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=min(top_k, collection.count()),
        include=["documents", "metadatas", "distances"]
    )
    return results


def get_document_count() -> int:
    """Return the number of documents in the vector store."""
    collection = get_collection()
    return collection.count()
