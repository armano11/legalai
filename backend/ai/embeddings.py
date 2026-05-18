import logging
from sentence_transformers import SentenceTransformer
from config import EMBEDDING_MODEL

logger = logging.getLogger(__name__)

_model = None
_model_failed = False


def get_model():
    """Lazy-load the embedding model."""
    global _model, _model_failed
    if _model_failed:
        raise RuntimeError("Embedding model is unavailable in the current local environment.")
    if _model is None:
        logger.info(f"Loading embedding model: {EMBEDDING_MODEL}")
        try:
            # Stay quiet and deterministic in local/offline environments.
            _model = SentenceTransformer(EMBEDDING_MODEL, local_files_only=True)
            logger.info("Embedding model loaded successfully from local cache.")
        except Exception as exc:
            _model_failed = True
            logger.warning(
                "Embedding model not available locally; vector retrieval will be skipped until the model is cached. %s",
                exc,
            )
            raise RuntimeError("Embedding model not available locally.") from exc
    return _model


def embed_text(text: str) -> list:
    """Embed a single text string."""
    model = get_model()
    return model.encode(text).tolist()


def embed_batch(texts: list) -> list:
    """Embed a batch of text strings."""
    model = get_model()
    return model.encode(texts).tolist()
