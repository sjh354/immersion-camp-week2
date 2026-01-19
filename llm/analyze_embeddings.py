import json
import torch
import numpy as np
import matplotlib.pyplot as plt
from sklearn.manifold import TSNE
from sklearn.decomposition import PCA
from e5_embed import embed_texts, MODEL_ID
from transformers import AutoTokenizer, AutoModel

def load_data(filepath):
    chosen_texts = []
    rejected_texts = []
    with open(filepath, 'r', encoding='utf-8') as f:
        for line in f:
            data = json.loads(line)
            chosen_texts.append(data['chosen'][0]['content'])
            rejected_texts.append(data['rejected'][0]['content'])
    return chosen_texts, rejected_texts

def main():
    # 1. Load Data
    data_path = "data/dpo2-10000.jsonl"
    print(f"Loading data from {data_path}...")
    chosen_texts, rejected_texts = load_data(data_path)
    # 데이터가 너무 많아서 100개로 제한
    chosen_texts = chosen_texts[:100]
    rejected_texts = rejected_texts[:100]
    print(f"Loaded {len(chosen_texts)} pairs.")

    # 2. Prepare Model
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"Loading model {MODEL_ID} on {device}...")
    tokenizer = AutoTokenizer.from_pretrained(MODEL_ID)
    model = AutoModel.from_pretrained(MODEL_ID).to(device)
    model.eval()

    # 3. Compute Embeddings
    print("Computing embeddings...")
    # e5_embed.py에서 내부적으로 배치를 돌리고 결과는 CPU 텐서로 반환함
    all_chosen_emb = embed_texts(chosen_texts, tokenizer, model, device=device)
    all_rejected_emb = embed_texts(rejected_texts, tokenizer, model, device=device)
    
    # 분석 및 시각화를 위해 numpy로 변환 (이미 CPU 텐서임)
    chosen_np = all_chosen_emb.numpy()
    rejected_np = all_rejected_emb.numpy()
    
    # 4. Calculate Statistics (Cosine Similarity)
    # Since embeddings are normalized, dot product is cosine similarity
    
    # Average similarity between corresponding chosen and rejected pairs
    # (n, hidden) * (n, hidden) -> sum(dim=1) -> average
    pair_similarities = (chosen_np * rejected_np).sum(axis=1)
    avg_pair_sim = pair_similarities.mean()
    print(f"\nAverage Cosine Similarity between Chosen/Rejected pairs: {avg_pair_sim:.4f}")
    
    # 5. Visualization (t-SNE)
    print("Running t-SNE for visualization...")
    
    # Combine for t-SNE
    all_embs = np.vstack([chosen_np, rejected_np])
    labels = (['Chosen'] * len(chosen_texts)) + (['Rejected'] * len(rejected_texts))
    
    # Reduce to 2D
    # Perplexity should be less than number of samples. Safe default typically 30, but for small data 5-50.
    perplexity = min(30, len(all_embs) - 1)
    tsne = TSNE(n_components=2, random_state=42, perplexity=perplexity, init='pca', learning_rate='auto')
    embs_2d = tsne.fit_transform(all_embs)
    
    # Plot
    plt.figure(figsize=(10, 8))
    
    # Index split
    n = len(chosen_texts)
    plt.scatter(embs_2d[:n, 0], embs_2d[:n, 1], c='blue', label='Chosen', alpha=0.6)
    plt.scatter(embs_2d[n:, 0], embs_2d[n:, 1], c='red', label='Rejected', alpha=0.6)
    
    # Draw lines between pairs to see shift? (Optional, might be messy with 200 lines)
    # Let's draw lines for a few random samples to see the direction of change
    # for i in range(min(10, n)):
    #     plt.plot([embs_2d[i, 0], embs_2d[n+i, 0]], [embs_2d[i, 1], embs_2d[n+i, 1]], 'k-', alpha=0.2)
        
    plt.title("Distribution of Chosen vs Rejected Embeddings (t-SNE)")
    plt.legend()
    plt.grid(True, alpha=0.3)
    
    output_img = "embedding_distribution.png"
    plt.savefig(output_img)
    print(f"\nPlot saved to {output_img}")

if __name__ == "__main__":
    main()
