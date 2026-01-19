import torch
from transformers import AutoModelForCausalLM, AutoTokenizer
from peft import PeftModel
import os

# 1. 설정
base_model_name = "Qwen/Qwen2.5-7B-Instruct"
adapter_path = "./lora-dpo-positive"
output_dir = "./merged-qwen-7b-dpo"

# 2. Base Model 로드 (FP16)
# 3090 24GB라면 FP16 로드가 가능합니다. (약 15GB VRAM 소요)
# 만약 터진다면 device_map="cpu" 로 변경하면 RAM을 사용하여 느리지만 안전하게 병합 가능합니다.
print(f"loading base model: {base_model_name}")
try:
    base_model = AutoModelForCausalLM.from_pretrained(
        base_model_name,
        torch_dtype=torch.float16,
        device_map="auto",
        low_cpu_mem_usage=True,
    )
except RuntimeError as e:
    print("VRAM OOM detected. Retrying with CPU offload...")
    base_model = AutoModelForCausalLM.from_pretrained(
        base_model_name,
        torch_dtype=torch.float16,
        device_map="cpu",
        low_cpu_mem_usage=True,
    )

# 3. LoRA 어댑터 로드
print(f"loading LoRA adapter: {adapter_path}")
model = PeftModel.from_pretrained(base_model, adapter_path)

# 4. 병합 (Merge and Unload)
print("Merging weights...")
model = model.merge_and_unload()

# 5. 저장
print(f"Saving merged model to {output_dir}...")
model.save_pretrained(
    output_dir, 
    safe_serialization=True, 
    max_shard_size="4GB" # 파일 쪼개서 저장
)

# 토크나이저도 함께 저장해야 나중에 편하게 쓸 수 있습니다.
print("Saving tokenizer...")
tokenizer = AutoTokenizer.from_pretrained(base_model_name)
tokenizer.save_pretrained(output_dir)

print("Merge Done! 🎉")
print(f"Now you can load the model from '{output_dir}'")
