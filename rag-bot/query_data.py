import argparse
import os
import time
import csv
from dotenv import load_dotenv
from langchain_chroma import Chroma
from langchain.prompts import ChatPromptTemplate
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_huggingface import HuggingFaceEmbeddings

load_dotenv()

CHROMA_PATH = "chroma"
EMBEDDING_MODEL_PATH = "./indo_finetuned_embedding"
CSV_PATH = "results.csv"


PROMPT_TEMPLATE = """
Halo! 👋 Saya **SIMA-BOT**, asisten layanan mahasiswa Fakultas Sains dan Matematika Universitas Diponegoro 🎓  
Saya siap membantu kamu mencari informasi akademik berdasarkan dokumen resmi kampus. 📚  

Gunakan gaya bahasa yang sopan, ramah, dan mudah dipahami — seperti staf akademik yang senang membantu mahasiswa 😊  
Jika informasi yang kamu tanyakan belum tersedia di konteks, sampaikan dengan jujur bahwa informasi tersebut belum ada ya 🙏  

Konteks:
{context}

---

Pertanyaan: {question}

💬 **Jawaban SIMA-BOT:**
"""




def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("query_text", type=str, help="The query text.")
    args = parser.parse_args()
    query_text = args.query_text
    query_rag(query_text)


def query_rag(query_text: str):
    embedding_function = HuggingFaceEmbeddings(model_name=EMBEDDING_MODEL_PATH)

    db = Chroma(persist_directory=CHROMA_PATH, embedding_function=embedding_function)

    results = db.similarity_search_with_score(query_text, k=3)
    best_doc, best_score = results[0]

    print(f"best_score : {best_score}")
    threshold = 0.50

    if best_score < threshold:
        answer = (
        "Mohon maaf, saya belum menemukan jawaban yang sesuai di dokumen resmi akademik FSM.\n\n"
        "Untuk bantuan lebih lanjut, silakan hubungi:\n"
        "📧 akademikfsm@live.undip.ac.id (Layanan Akademik)\n"
        "📧 mawafsm@live.undip.ac.id (Layanan Kemahasiswaan)\n"
        "📍 Gedung Acintya Prasada Lt.1, FSM UNDIP\n"
        "📞 Telp: 024-7474754"
        )
        coverage = 0
        sources = []
        response_time = 0.0
        print("\nJawaban:\n", answer)
        save_to_csv(query_text, answer, sources, response_time, coverage)
        return answer

    context_text = "\n\n---\n\n".join([doc.page_content for doc, _ in results])

    prompt_template = ChatPromptTemplate.from_template(PROMPT_TEMPLATE)
    prompt = prompt_template.format(context=context_text, question=query_text)

    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        raise ValueError("❌ GOOGLE_API_KEY belum diisi di file .env!")

    model = ChatGoogleGenerativeAI(
        model="gemini-1.5-flash",  
        api_key=api_key,
        temperature=0.3
    )

    start_time = time.time()
    response = model.invoke(prompt)
    end_time = time.time()
    response_time = end_time - start_time
    response_text = response.content  
    coverage = 1

    sources = [doc.metadata.get("id", None) for doc, _ in results]

    print(response_text)
    print(f"\nAnswered in : {response_time:.2f} sec")

    save_to_csv(query_text, response_text, sources, response_time, coverage)

    return response_text


def save_to_csv(question: str, answer: str, sources: list, response_time: float, coverage: int):
    """Simpan hasil query ke file CSV"""
    file_exists = os.path.isfile(CSV_PATH)

    with open(CSV_PATH, mode="a", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)

        if not file_exists:
            writer.writerow(["Pertanyaan", "Jawaban", "Sumber", "Response Time (sec)", "Coverage"])

        writer.writerow([question, answer, "; ".join(sources), f"{response_time:.2f}", coverage])


if __name__ == "__main__":
    main()


# import argparse
# import os
# import time
# import csv
# from dotenv import load_dotenv
# from langchain_chroma import Chroma
# from langchain.prompts import ChatPromptTemplate
# from langchain_openai import ChatOpenAI
# from langchain_huggingface import HuggingFaceEmbeddings
# from langchain_community.retrievers import BM25Retriever
# from langchain.retrievers import EnsembleRetriever
# from langchain.schema import Document
# from pypdf import PdfReader
# from typing import List, Tuple, Optional

# load_dotenv()

# CHROMA_PATH = "chroma"
# EMBEDDING_MODEL_PATH = "./indo_finetuned_embedding"
# CSV_PATH = "results.csv"
# DOCUMENTS_PATH = "./data"

# PROMPT_TEMPLATE = """
# Anda adalah asisten layanan mahasiswa Fakultas Sains dan Matematika Universitas Diponegoro 
# yang membantu menjawab pertanyaan berdasarkan dokumen resmi kampus.
# Jawablah dengan bahasa Indonesia yang jelas, singkat, dan sopan. 
# Jika jawaban tidak ada dalam konteks, katakan dengan jujur 
# bahwa informasi tersebut tidak tersedia. JANGAN gunakan bahasa inggris dalam memberi respon.

# Konteks:
# {context}

# ---

# Pertanyaan: {question}

# Jawaban sebagai asisten layanan mahasiswa:
# """


# def load_documents_for_bm25() -> List[Document]:
#     documents = []
    
#     if not os.path.exists(DOCUMENTS_PATH):
#         print(f"Warning: Documents path '{DOCUMENTS_PATH}' not found. Using ChromaDB documents only.")
#         return documents
    
#     for file_name in os.listdir(DOCUMENTS_PATH):
#         file_path = os.path.join(DOCUMENTS_PATH, file_name)
        
#         if os.path.isdir(file_path):
#             continue
            
#         if file_name.lower().endswith('.pdf'):
#             try:
#                 print(f"Processing PDF: {file_name}")
#                 reader = PdfReader(file_path)
#                 content = ""
                
#                 for page_num, page in enumerate(reader.pages):
#                     page_text = page.extract_text()
#                     if page_text:
#                         content += page_text + "\n\n"
#                 if content.strip():
#                     documents.append(Document(
#                         page_content=content,
#                         metadata={"source": file_name, "type": "pdf", "pages": len(reader.pages)}
#                     ))
#                     print(f"Successfully loaded PDF: {file_name} ({len(reader.pages)} pages)")
#                 else:
#                     print(f"No text content extracted from PDF: {file_name}")
                
#             except Exception as e:
#                 print(f"Error loading PDF file {file_name}: {e}")
#                 continue
    
#     print(f"Loaded {len(documents)} PDF documents for BM25 retriever")
#     return documents


# def initialize_retrievers() -> Tuple[Optional[BM25Retriever], any]:
#     documents = load_documents_for_bm25()
    
#     if documents:
#         bm25_retriever = BM25Retriever.from_documents(documents)
#         bm25_retriever.k = 3
#     else:
#         bm25_retriever = None
#         print("No documents found for BM25. Using vector search only.")
    
#     embedding_function = HuggingFaceEmbeddings(model_name=EMBEDDING_MODEL_PATH)
#     db = Chroma(persist_directory=CHROMA_PATH, embedding_function=embedding_function)
#     vector_retriever = db.as_retriever(search_kwargs={"k": 3})
    
#     return bm25_retriever, vector_retriever


# def hybrid_search(query_text: str, bm25_retriever: Optional[BM25Retriever], vector_retriever) -> List[Document]:
    
#     try:
#         retriever = (
#             EnsembleRetriever(
#                 retrievers=[bm25_retriever, vector_retriever],
#                 weights=[0.4, 0.6]
#             )
#             if bm25_retriever else vector_retriever
#         )
#         results = retriever.invoke(query_text)
#         return results
        
#     except Exception as e:
#         print(f"Error in hybrid search: {e}")
#         return vector_retriever.invoke(query_text)


# def calculate_confidence_score(results: List[Document], query_text: str) -> float:
#     if not results:
#         return 0.0
#     return min(len(results) / 3.0, 1.0)


# def main():
#     parser = argparse.ArgumentParser()
#     parser.add_argument("query_text", type=str, help="The query text.")
#     args = parser.parse_args()
#     query_text = args.query_text
#     query_rag(query_text)


# def query_rag(query_text: str):
#     start_time = time.time()
#     bm25_retriever, vector_retriever = initialize_retrievers()
    
#     retrieval_start = time.time()
#     results = hybrid_search(query_text, bm25_retriever, vector_retriever)
#     retrieval_time = time.time() - retrieval_start
    
#     confidence = calculate_confidence_score(results, query_text)
#     threshold = 0.3
    
#     if confidence < threshold or not results:
#         answer = "Maaf, saya tidak menemukan jawaban pada dokumen yang tersedia."
#         coverage = 0
#         sources = []
#         total_time = time.time() - start_time
        
#         print("\nJawaban:\n", answer)
#         print(f"\nConfidence Score: {confidence:.2f}")
#         print(f"Total Response Time: {total_time:.2f} sec")
        
#         save_to_csv(query_text, answer, sources, total_time, coverage, confidence)
#         return answer
    
#     context_text = "\n\n---\n\n".join([doc.page_content for doc in results])
#     prompt_template = ChatPromptTemplate.from_template(PROMPT_TEMPLATE)
#     prompt = prompt_template.format(context=context_text, question=query_text)
    
#     model = ChatOpenAI(
#         model="gpt-4o",
#         api_key=os.environ["GITHUB_TOKEN"],
#         base_url="https://models.inference.ai.azure.com"
#     )
    
#     llm_start = time.time()
#     response = model.invoke(prompt)
#     llm_time = time.time() - llm_start
    
#     response_text = response.content  
#     coverage = 1
#     total_time = time.time() - start_time
    
#     sources = []
#     for doc in results:
#         source = doc.metadata.get("source", doc.metadata.get("id", "Unknown"))
#         if source not in sources:
#             sources.append(source)
    
#     print("\n=== HYBRID SEARCH RESULTS ===")
#     print("\nJawaban:\n", response_text)
#     print("\nSumber:", sources)
#     print(f"\nConfidence Score: {confidence:.2f}")
#     print(f"Retrieval Time: {retrieval_time:.2f} sec")
#     print(f"LLM Processing Time: {llm_time:.2f} sec")
#     print(f"Total Response Time: {total_time:.2f} sec")
#     print("Method: Hybrid Search (BM25 + Vector)")
    
#     save_to_csv(query_text, response_text, sources, total_time, coverage, confidence)
#     return response_text


# def save_to_csv(question: str, answer: str, sources: list, response_time: float, coverage: int, confidence: float = 0.0):
#     file_exists = os.path.isfile(CSV_PATH)
    
#     with open(CSV_PATH, mode="a", newline="", encoding="utf-8") as f:
#         writer = csv.writer(f)
        
#         if not file_exists:
#             writer.writerow(["Pertanyaan", "Jawaban", "Sumber", "Response Time (sec)", "Coverage", "Confidence"])
        
#         writer.writerow([
#             question, 
#             answer, 
#             "; ".join(sources) if sources else "None", 
#             f"{response_time:.2f}", 
#             coverage,
#             f"{confidence:.2f}"
#         ])


# if __name__ == "__main__":
#     main()