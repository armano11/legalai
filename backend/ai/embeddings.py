import logging
from sentence_transformers import SentenceTransformer
from config import EMBEDDING_MODEL

logger = logging.getLogger(__name__)

_model = None


def get_model():
    """Lazy-load the embedding model."""
    global _model
    if _model is None:
        logger.info(f"Loading embedding model: {EMBEDDING_MODEL}")
        _model = SentenceTransformer(EMBEDDING_MODEL)
        logger.info("Embedding model loaded successfully.")
    return _model


def embed_text(text: str) -> list:
    """Embed a single text string."""
    model = get_model()
    return model.encode(text).tolist()


def embed_batch(texts: list) -> list:
    """Embed a batch of text strings."""
    model = get_model()
    return model.encode(texts).tolist()
