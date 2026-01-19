import torch
import torch.nn.functional as F
from transformers import AutoTokenizer, AutoModel

MODEL_ID = "intfloat/multilingual-e5-large"

def mean_pooling(last_hidden_state: torch.Tensor, attention_mask: torch.Tensor) -> torch.Tensor:
    # last_hidden_state: [B, T, H]
    # attention_mask:   [B, T]
    mask = attention_mask.unsqueeze(-1).type_as(last_hidden_state)  # [B, T, 1]
    summed = (last_hidden_state * mask).sum(dim=1)                  # [B, H]
    counts = mask.sum(dim=1).clamp(min=1e-9)                        # [B, 1]
    return summed / counts

@torch.inference_mode()
def embed_texts(texts, tokenizer, model, device="cpu", max_length=512, prefix="passage: ", batch_size=32):
    # E5 권장 프리픽스
    inputs = [prefix + t for t in texts]
    
    all_embeddings = []
    
    # 데이터를 batch_size씩 나누어 처리하여 OOM 방지
    for i in range(0, len(inputs), batch_size):
        batch_texts = inputs[i : i + batch_size]
        
        batch = tokenizer(
            batch_texts,
            max_length=max_length,
            truncation=True,
            padding=True,
            return_tensors="pt",
        ).to(device)

        outputs = model(**batch)
        emb = mean_pooling(outputs.last_hidden_state, batch["attention_mask"])
        emb = F.normalize(emb, p=2, dim=1)  # cosine similarity용 정규화
        
        # CPU로 옮겨서 리스트에 저장 (GPU 메모리 절약)
        all_embeddings.append(emb.cpu())
        
    return torch.cat(all_embeddings, dim=0)

def main():
    device = "cuda" if torch.cuda.is_available() else "cpu"
    tokenizer = AutoTokenizer.from_pretrained(MODEL_ID)
    model = AutoModel.from_pretrained(MODEL_ID).to(device)
    model.eval()

    texts = [
        "헉… 그런 상황이면 당연히 흔들리지. 너 진짜 잘하고 있어. 나는 네 편이야!",
        "아~ 네가 최고시네요? 진짜 대단~",  # 비꼼 예시
    ]

    emb = embed_texts(texts, tokenizer, model, device=device)
    print("embedding shape:", tuple(emb.shape))  # (2, 1024)
    print("first 5 dims of #0:", emb[0, :5].tolist())

    # 임베딩 간 cosine similarity 예시
    sim = float((emb[0] * emb[1]).sum())
    print("cosine similarity(0,1):", sim)

if __name__ == "__main__":
    main()
