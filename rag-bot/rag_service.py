# rag_service.py
import os, time, csv
from dotenv import load_dotenv
from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate


load_dotenv()

MODEL = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    api_key=os.getenv("GEMINI_API_KEY"),
    temperature=0.3,
)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CHROMA_PATH = os.path.join(BASE_DIR, "chroma")
EMB_PATH = os.path.join(BASE_DIR, "indo_finetuned_embedding")
CSV_PATH = os.path.join(BASE_DIR, "results.csv")

# --- inisialisasi sekali (lebih cepat & konsisten)
EMB = HuggingFaceEmbeddings(model_name=EMB_PATH)
DB = Chroma(persist_directory=CHROMA_PATH, embedding_function=EMB)

THRESHOLD_DISTANCE = 0.82 # longgarkan dulu untuk test; bisa turunkan nanti
PROMPT_TEMPLATE = """
Halo! 👋 Saya **SIMA-BOT**, asisten layanan mahasiswa Fakultas Sains dan Matematika Universitas Diponegoro 🎓  
Saya siap membantu kamu mencari informasi akademik berdasarkan dokumen resmi kampus. 📚  

Gunakan gaya bahasa yang sopan, ramah, dan mudah dipahami — seperti staf akademik yang senang membantu mahasiswa 😊  

**PENTING:** 
- Jika dokumen berisi langkah-langkah, prosedur, atau poin-poin detail, sampaikan semuanya secara lengkap dan berurutan agar mahasiswa paham.
- Sampaikan juga persyaratan (seperti dokumen yang harus dibawa) dan estimasi waktu proses (SLA) jika ada di konteks.
- Jika informasi yang kamu tanyakan belum tersedia di konteks, sampaikan dengan jujur bahwa informasi tersebut belum ada ya 🙏  

Konteks:
{context}

---

Pertanyaan: {question}

💬 **Jawaban SIMA-BOT:**
"""
def _fallback(answer_text: str, top_distance: float, similarity: float, topk_debug):
    return {
        "answer": answer_text,
        "top_distance": float(top_distance),
        "top_similarity": float(similarity),
        "is_match": False,
        "k": topk_debug
    }

def rag_answer(query_text: str) -> dict:
    start = time.time()

      # 🧠 Tambahkan ini dulu
    SLANG = {
        "nyalin": "legalisir",
        "dicap": "legalisir",
        "ijazahnya": "ijazah",
        "uktnya": "ukt",
        "krsan": "krs",
        "irsan": "irs",
        "yudis": "yudisium",
    }
    CONTACT_INFO = (
        "Mohon maaf, saya belum menemukan jawaban yang sesuai di dokumen resmi akademik FSM.\n\n"
        "Untuk bantuan lebih lanjut, silakan hubungi:\n"
        "📧 akademikfsm@live.undip.ac.id (Layanan Akademik)\n"
        "📧 mawafsm@live.undip.ac.id (Layanan Kemahasiswaan)\n"
        "📍 Gedung Acintya Prasada Lt.1, FSM UNDIP\n"
        "📞 Telp: 024-7474754"
    )

    def normalize(q: str) -> str:
        t = q.lower().strip()
        for a, b in SLANG.items():
            t = t.replace(a, b)
        return " ".join(t.split())

    query_text = normalize(query_text)

    # 1) retrieve top-k
    results = DB.similarity_search_with_score(query_text, k=4)
    if not results:
        return _fallback(CONTACT_INFO, 1.0, 0.0, [])

    distances = [float(d) for _, d in results]
    best_distance = min(distances)
    similarity = 1.0 - best_distance
    is_match = best_distance <= THRESHOLD_DISTANCE

    topk_debug = [{
        "distance": float(d),
        "similarity": 1.0 - float(d),
        "snippet": doc.page_content[:160]
    } for doc, d in results]

    if not is_match:
        return _fallback(CONTACT_INFO,
                         best_distance, similarity, topk_debug)

    # 2) LLM only if match
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return {
            "answer": "⚠️ Konfigurasi belum lengkap: GOOGLE_API_KEY belum diisi.",
            "top_distance": best_distance,
            "top_similarity": similarity,
            "is_match": True,
            "k": topk_debug
        }

    context_text = "\n\n---\n\n".join([doc.page_content for doc, _ in results])

    prompt = ChatPromptTemplate.from_template(PROMPT_TEMPLATE).format(
        context=context_text,
        question=query_text,
    )

    resp = MODEL.invoke(prompt)
    response_text = (resp.content or "").strip()
    duration = time.time() - start

    # 3) log ringan
    try:
        file_exists = os.path.isfile(CSV_PATH)
        with open(CSV_PATH, "a", newline="", encoding="utf-8") as f:
            w = csv.writer(f)
            if not file_exists:
                w.writerow(["Pertanyaan", "Jawaban", "RespTime(s)", "TopDist", "TopSim"])
            w.writerow([query_text, response_text, f"{duration:.2f}", f"{best_distance:.3f}", f"{similarity:.3f}"])
    except Exception:
        pass

    # 4) guard kalau LLM kosong
    if not response_text:
        return _fallback(CONTACT_INFO,
                         best_distance, similarity, topk_debug)

    return {
        "answer": f"{response_text}\n\n⏱️ *Waktu respons: {duration:.2f} detik*",
        "top_distance": best_distance,
        "top_similarity": similarity,
        "is_match": True,
        "k": topk_debug
    }