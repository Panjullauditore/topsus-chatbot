# rag-bot/upload_handler.py
"""
Endpoint for admin PDF upload.
Receives a PDF, saves it to data/, then re-runs the embedding pipeline.
"""
import os
import shutil
from fastapi import UploadFile


UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "data")
os.makedirs(UPLOAD_DIR, exist_ok=True)


def _reindex():
    """Re-run the embedding pipeline to rebuild the vector DB."""
    from embeddings import load_documents, split_documents, add_to_chroma
    documents = load_documents()
    chunks = split_documents(documents)
    add_to_chroma(chunks)


def handle_pdf_upload(file: UploadFile) -> dict:
    """Save uploaded PDF and re-index the vector database."""
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        return {"ok": False, "error": "Only PDF files are accepted."}

    dest_path = os.path.join(UPLOAD_DIR, file.filename)

    # Save file
    with open(dest_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    # Re-index: rebuild the Chroma database from all PDFs in data/
    try:
        _reindex()
        return {
            "ok": True,
            "filename": file.filename,
            "message": f"File '{file.filename}' uploaded and vector DB re-indexed successfully.",
        }
    except Exception as e:
        return {
            "ok": False,
            "filename": file.filename,
            "error": f"File saved but re-indexing failed: {str(e)}",
        }


def list_documents() -> list[dict]:
    """List all PDFs currently in the data directory."""
    docs = []
    for f in sorted(os.listdir(UPLOAD_DIR)):
        if f.lower().endswith(".pdf"):
            path = os.path.join(UPLOAD_DIR, f)
            docs.append({
                "filename": f,
                "size_kb": round(os.path.getsize(path) / 1024, 1),
            })
    return docs


def delete_document(filename: str) -> dict:
    """Delete a PDF and re-index."""
    path = os.path.join(UPLOAD_DIR, filename)
    if not os.path.exists(path):
        return {"ok": False, "error": "File not found."}

    os.remove(path)
    try:
        _reindex()
        return {"ok": True, "message": f"'{filename}' deleted and re-indexed."}
    except Exception as e:
        return {"ok": False, "error": f"File deleted but re-indexing failed: {str(e)}"}
