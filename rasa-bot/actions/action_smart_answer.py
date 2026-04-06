from typing import Any, Dict, Text, List
from rasa_sdk import Action, Tracker
from rasa_sdk.executor import CollectingDispatcher
from rasa_sdk.events import SlotSet
import requests, time
from datetime import datetime

# INTENT_CONF_HIGH = 0.60
RAG_API = "http://127.0.0.1:8001/rag/query"

SLANG_MAP = {"uktnya":"ukt","krsan":"krs","irsan":"irs","yudis":"yudisium","rek beasiswa":"rekomendasi beasiswa", "gmn": "gimana", "gmna": "gimana",
    "gmn ya": "gimana ya", "gpp": "gapapa",
    "pls": "tolong", "plis": "tolong",
    "tdk": "tidak", "ga": "gak", "ngga": "gak", "nggak": "gak",}
SYNONYM_MAP = {"cuti kuliah":"cuti akademik","rencana studi":"irs"}

def looks_slang(q: str) -> bool:
    import re
    ql = q.lower()
    return any(re.search(r'\b' + re.escape(k) + r'\b', ql) for k in SLANG_MAP.keys())

def normalize_query(q: str) -> str:
    t = q.lower().strip()
    for a,b in SLANG_MAP.items():   t = t.replace(a,b)
    for a,b in SYNONYM_MAP.items(): t = t.replace(a,b)
    return " ".join(t.split())


import requests

def call_rag(query: str) -> dict:
    try:
        r = requests.post(
            RAG_API,  # pastikan: RAG_API = "http://127.0.0.1:8001/rag/query"
            json={"question": query},
            headers={"Content-Type": "application/json"},
            timeout=90,  # gemini-2.5-flash (thinking model) butuh 30-60 detik
        )
        r.raise_for_status()
        return r.json()
    except requests.Timeout:
        print(f"[HYBRID][RAG-ERROR] Timeout saat panggil RAG")
        return {"is_match": False, "answer": None}
    except requests.RequestException as e:
        print(f"[HYBRID][RAG-ERROR] {e}")
        return {"is_match": False, "answer": None}




INTENT_TO_UTTER = {
    "tanya_cuti_akademik": "utter_jawab_cuti_akademik",
    "tanya_legalisir": "utter_jawab_legalisir",
    "tanya_proposal_organisasi": "utter_jawab_proposal_organisasi",
    "tanya_rekomendasi_beasiswa": "utter_jawab_rekomendasi_beasiswa",
    "tanya_irs": "utter_jawab_irs",
    "tanya_izin_aktif_setelah_cuti": "utter_jawab_izin_aktif_kuliah_setelah_cuti",
    "tanya_izin_terlambat_bayar_ukt": "utter_jawab_izin_terlambat_bayar_ukt",
    "tanya_link_form": "utter_jawab_link_form",
    "tanya_waktu_proses": "utter_jawab_waktu_proses",
    "tanya_layanan_akademik": "utter_layanan_akademik",
    "tanya_kontak": "utter_kontak",
    "tanya_jadwal": "utter_jadwal",
}

SAFE_ERROR_TEXT = "Maaf, lagi ada kendala teknis. Coba ulang sebentar ya. 🙏"

class ActionSmartAnswer(Action):
    def name(self) -> Text:
        return "action_smart_answer"

    def run(
        self,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: Dict[Text, Any],
    ) -> List[Dict[Text, Any]]:

        t0 = time.time()
        latest = tracker.latest_message or {}
        user_text: Text = latest.get("text") or ""
        intent = (latest.get("intent") or {}).get("name") or ""
        conf = float((latest.get("intent") or {}).get("confidence") or 0.0)

        norm = normalize_query(user_text)
        slangy = looks_slang(user_text)

        is_match, top_distance, answer = False, None, None
        try:
            print(f"[DEBUG] intent={intent} | conf={conf:.3f} | slangy={slangy}")

            # --- 1) Cek dulu apakah ada template Rasa untuk intent ini ---
            rasa_key = INTENT_TO_UTTER.get(intent)

            if rasa_key:
                # Intent dikenal → pakai template domain.yml langsung
                route = "rasa"
                dispatcher.utter_message(response=rasa_key)
                print(f"[HYBRID][RASA-TEMPLATE] intent={intent} key={rasa_key}")
                return [
                    SlotSet("last_answer_source", "rasa"),
                    SlotSet("last_answer_distance", None),
                    SlotSet("last_normalized_query", norm),
                    SlotSet("last_is_match", "True"),
                ]

            # --- 2) Tidak ada template Rasa → coba RAG ---
            rag = call_rag(norm)
            top_distance = rag.get("top_distance")
            is_match = bool(rag.get("is_match"))
            answer = rag.get("answer") or rag.get("result")

            if is_match and answer:
                route = "rag"
                dispatcher.utter_message(text=f"📚 **[JAWABAN RAG]**\n\n{str(answer)}")
                print(f"[HYBRID][RAG-MATCH] intent={intent} dist={top_distance:.3f}")
                return [
                    SlotSet("last_answer_source", "rag"),
                    SlotSet("last_answer_distance", top_distance),
                    SlotSet("last_normalized_query", norm),
                    SlotSet("last_is_match", str(is_match)),
                ]

            # --- 3) Tidak ada match → utter_diluar_scope ---
            route = "rasa"
            print(f"[HYBRID][NO-MATCH] intent={intent} → utter_diluar_scope")
            has_fallback = "utter_diluar_scope" in (domain.get("responses") or {})
            if has_fallback:
                dispatcher.utter_message(response="utter_diluar_scope")
            else:
                dispatcher.utter_message(
                    text="Maaf, aku belum nemu jawaban pastinya. Coba tanya dengan kata kunci lain ya 🙏"
                )

        # try:
        #     print(f"[DEBUG] route={route} | is_match={is_match} | answer={bool(answer)} | conf={conf}")

        #     if route == "rag":
        #         rag = call_rag(norm)  # pastikan fungsi ini TIDAK nge-hang
        #         top_distance = rag.get("top_distance")
        #         is_match = bool(rag.get("is_match"))
        #         answer = rag.get("answer") or rag.get("result")

        #         # --- WAJIB: kirim jawaban kalau RAG match ---
        #         if is_match and answer:
        #             dispatcher.utter_message(text=str(answer))
        #             route = "rag"
        #         else:
        #             # fallback ke RASA template
        #             route = "rasa"

        #     if route == "rasa":
        #         # pilih template; kalau nggak ada, fallback ke teks biasa
        #         fallback_key = None
        #         try:
        #             has_fallback = "utter_diluar_scope" in (domain.get("responses") or {})
        #             fallback_key = "utter_diluar_scope" if has_fallback else None
        #         except Exception:
        #             fallback_key = None

        #         key = INTENT_TO_UTTER.get(intent) or fallback_key
        #         if key:
        #             dispatcher.utter_message(response=key)
        #             print(f"[HYBRID][FAQ] intent={intent} conf={conf:.3f} slang={slangy} text={user_text} key={key}")
        #         else:
        #             dispatcher.utter_message(
        #                 text="Maaf, aku belum nemu jawaban pastinya. Coba jelasin lagi ya 🙏"
        #             )
        #             print(f"[HYBRID][FAQ-NOMAP] intent={intent} conf={conf:.3f} slang={slangy} text={user_text}")

        except Exception as e:
            dispatcher.utter_message(text=SAFE_ERROR_TEXT)
            print(f"[HYBRID][ERROR] {e}")

        duration = round(time.time() - t0, 3)
        try:
            from pathlib import Path
            import csv
            p = Path("logs"); p.mkdir(exist_ok=True)
            with (p / "qa_logs.csv").open("a", newline="", encoding="utf-8") as f:
                csv.writer(f).writerow([
                    datetime.now().isoformat(), user_text, norm, intent,
                    f"{conf:.3f}", route, str(is_match),
                    "" if top_distance is None else f"{float(top_distance):.3f}", f"{duration:.3f}"
                ])
        except Exception:
            pass

        return [
            SlotSet("last_answer_source", "rag" if route == "rag" else ("rasa" if route == "rasa" else "error")),
            SlotSet("last_answer_distance", top_distance),
            SlotSet("last_normalized_query", norm),
            SlotSet("last_is_match", str(is_match)),
        ]
