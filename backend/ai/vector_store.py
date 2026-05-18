import logging
import chromadb
from config import CHROMA_DIR, CHROMA_COLLECTION

logger = logging.getLogger(__name__)

_client = None
_collection = None
_vector_store_disabled = False
_vector_store_error = None


def _empty_result() -> dict:
    return {"documents": [[]], "metadatas": [[]], "distances": [[]]}


def _disable_vector_store(exc: Exception) -> None:
    global _vector_store_disabled, _vector_store_error, _client, _collection
    _vector_store_disabled = True
    _vector_store_error = str(exc)
    _client = None
    _collection = None
    logger.info("Vector store unavailable; falling back to knowledge-base-only mode. %s", exc)


def get_collection():
    """Get or create the ChromaDB collection."""
    global _client, _collection
    if _vector_store_disabled:
        return None
    if _collection is None:
        try:
            _client = chromadb.PersistentClient(path=CHROMA_DIR)
            _collection = _client.get_or_create_collection(
                name=CHROMA_COLLECTION,
                metadata={"hnsw:space": "cosine"}
            )
            logger.info(f"ChromaDB collection '{CHROMA_COLLECTION}' ready. Total docs: {_collection.count()}")
        except Exception as exc:
            _disable_vector_store(exc)
            return None
    return _collection


def add_documents(chunks: list, embeddings: list, metadatas: list, ids: list):
    """Add document chunks with their embeddings and metadata to the vector store."""
    collection = get_collection()
    if collection is None:
        return
    try:
        collection.add(
            documents=chunks,
            embeddings=embeddings,
            metadatas=metadatas,
            ids=ids
        )
        logger.info(f"Added {len(chunks)} chunks to vector store.")
    except Exception as exc:
        _disable_vector_store(exc)


def search(query_embedding: list, top_k: int = 5) -> dict:
    """Search the vector store for the most similar documents."""
    collection = get_collection()
    if collection is None:
        return _empty_result()

    try:
        count = collection.count()
    except Exception as exc:
        _disable_vector_store(exc)
        return _empty_result()

    if count == 0:
        logger.info("Vector store is empty. No documents to search.")
        return _empty_result()

    try:
        results = collection.query(
            query_embeddings=[query_embedding],
            n_results=min(top_k, count),
            include=["documents", "metadatas", "distances"]
        )
        return results
    except Exception as exc:
        _disable_vector_store(exc)
        return _empty_result()


def get_document_count() -> int:
    """Return the number of documents in the vector store."""
    collection = get_collection()
    if collection is None:
        return 0
    try:
        return collection.count()
    except Exception as exc:
        _disable_vector_store(exc)
        return 0
