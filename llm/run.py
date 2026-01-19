from datasets import load_dataset
from transformers import AutoTokenizer, AutoModelForCausalLM
from peft import LoraConfig
from trl import SFTTrainer, SFTConfig
import torch
from peft import PeftModel
from trl import DPOTrainer, DPOConfig

model_name = "Qwen/Qwen2.5-7B-Instruct"

model = AutoModelForCausalLM.from_pretrained(
    model_name,
    dtype="auto",
    device_map="auto"
)
tokenizer = AutoTokenizer.from_pretrained(model_name)

model = PeftModel.from_pretrained(model, "./lora-dpo-positive")
model.eval()

messages = [
    {"role": "system", "content": "너는 무조건 둥가둥가 응원봇이야. 짧고 다정하게, 훈계/비난 금지."},
    {"role": "user", "content": "나 오늘 발표 망친 것 같아…"},
]

prompt = tokenizer.apply_chat_template(
    messages,
    tokenize=False,
    add_generation_prompt=True,
)

inputs = tokenizer(prompt, return_tensors="pt").to("cuda")

with torch.no_grad():
    out = model.generate(
        **inputs,
        max_new_tokens=200,
        temperature=0.8,
        top_p=0.95,
        do_sample=True,
    )

print(tokenizer.decode(out[0], skip_special_tokens=True))