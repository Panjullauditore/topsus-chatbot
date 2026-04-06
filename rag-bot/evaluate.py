import pandas as pd
from nltk.translate.bleu_score import sentence_bleu, SmoothingFunction
from rouge_score import rouge_scorer
from bert_score import score

# --- Load CSV ---
df = pd.read_csv("responses_rag.csv", encoding="cp1252")

references = df['Groundtruth'].tolist()
candidates = df['Jawaban'].tolist()

# --- BLEU ---
smooth = SmoothingFunction().method1
bleu_scores = [sentence_bleu([ref.split()], cand.split(), smoothing_function=smooth) 
               for ref, cand in zip(references, candidates)]
df['BLEU'] = bleu_scores

# --- ROUGE ---
scorer = rouge_scorer.RougeScorer(['rouge1', 'rougeL'], use_stemmer=True)
rouge1_scores, rougeL_scores = [], []
for ref, cand in zip(references, candidates):
    scores = scorer.score(ref, cand)
    rouge1_scores.append(scores['rouge1'].fmeasure)
    rougeL_scores.append(scores['rougeL'].fmeasure)
df['ROUGE-1'] = rouge1_scores
df['ROUGE-L'] = rougeL_scores

# --- BERTScore ---
P, R, F1 = score(candidates, references, lang="id", verbose=True)
df['BERTScore'] = F1.tolist()

print(df[['Pertanyaan','BLEU','ROUGE-1','ROUGE-L','BERTScore']].head())
df.to_csv("evaluasi_chatbot.csv", index=False)
