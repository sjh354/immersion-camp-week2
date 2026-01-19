from datasets import load_dataset
from transformers import AutoTokenizer, AutoModelForCausalLM, BitsAndBytesConfig
from peft import LoraConfig
from trl import DPOTrainer, DPOConfig

# model_id = "Qwen/Qwen2.5-7B-Instruct"
model_id = "LGAI-EXAONE/EXAONE-3.0-7.8B-Instruct"

tokenizer = AutoTokenizer.from_pretrained(model_id, use_fast=True)

# 4-bit 양자화 설정 추가
quantization_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_compute_dtype="float16",
    bnb_4bit_use_double_quant=True,
    bnb_4bit_quant_type="nf4"
)

model = AutoModelForCausalLM.from_pretrained(
    model_id, 
    device_map="auto", 
    quantization_config=quantization_config
)

lora = LoraConfig(
    r=16, lora_alpha=32, lora_dropout=0.05,
    bias="none", task_type="CAUSAL_LM",
    target_modules=["q_proj","k_proj","v_proj","o_proj"]
)

# dpo.jsonl: {"prompt": "...", "chosen": "...", "rejected": "..."}
ds = load_dataset("json", data_files={"train": "data/dpo.jsonl"})

cfg = DPOConfig(
    output_dir="./lora-dpo-EXAONE",
    per_device_train_batch_size=1,
    gradient_accumulation_steps=8,
    learning_rate=5e-5,
    num_train_epochs=1,
    max_length=1024,
    fp16=True,
)

trainer = DPOTrainer(
    model=model,
    ref_model=None,          # TRL 버전에 따라 필요할 수 있음
    args=cfg,
    train_dataset=ds["train"],
    processing_class=tokenizer,
    peft_config=lora,
)

trainer.train()
trainer.save_model()
