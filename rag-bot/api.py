from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from rag_service import rag_answer
from upload_handler import handle_pdf_upload, list_documents, delete_document

app = FastAPI()
app.add_middleware(CORSMiddleware,
  allow_origins=["*"], allow_credentials=True,
  allow_methods=["*"], allow_headers=["*"])

class Query(BaseModel): question: str

@app.post("/rag/query")
def rag_query(q: Query):
    return rag_answer(q.question)


# ===== Knowledge Base Management =====

@app.get("/kb/documents")
def kb_list():
    """List all PDF documents in the knowledge base."""
    return {"documents": list_documents()}


@app.post("/kb/upload")
async def kb_upload(file: UploadFile = File(...)):
    """Upload a PDF to the knowledge base and re-index."""
    result = handle_pdf_upload(file)
    if not result.get("ok"):
        raise HTTPException(status_code=400, detail=result.get("error", "Upload failed"))
    return result


@app.delete("/kb/documents/{filename}")
def kb_delete(filename: str):
    """Delete a PDF from the knowledge base and re-index."""
    result = delete_document(filename)
    if not result.get("ok"):
        raise HTTPException(status_code=404, detail=result.get("error", "Delete failed"))
    return result
