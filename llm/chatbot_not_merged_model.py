import torch
from transformers import AutoTokenizer, AutoModelForCausalLM, BitsAndBytesConfig
from peft import PeftModel
import re

class ChatBot:
    def __init__(self, base_model_path: str = "LGAI-EXAONE/EXAONE-3.0-7.8B-Instruct", adapter_path: str = "./lora_adapter_funny"):
        """
        Initialize the ChatBot model with 4-bit quantization and LoRA adapter.
        """
        print(f"Loading base model from: {base_model_path} (4-bit mode)...")
        
        # 4-bit Quantization Configuration
        bnb_config = BitsAndBytesConfig(
            load_in_4bit=True,
            bnb_4bit_quant_type="nf4", 
            bnb_4bit_compute_dtype=torch.bfloat16, # bf16 for 3090
            bnb_4bit_use_double_quant=True, 
        )

        try:
            # 1. Load Base Model
            self.model = AutoModelForCausalLM.from_pretrained(
                base_model_path,
                quantization_config=bnb_config,
                device_map="auto",
                low_cpu_mem_usage=True,
                trust_remote_code=True
            )
            self.tokenizer = AutoTokenizer.from_pretrained(base_model_path)
            
            # 2. Load LoRA Adapter
            if adapter_path:
                print(f"Loading LoRA adapter from: {adapter_path}...")
                self.model = PeftModel.from_pretrained(self.model, adapter_path)
                
            print("Model & Adapter loaded successfully.")
            
        except Exception as e:
            print(f"Error loading model: {e}")
            print("Make sure you have installed: pip install bitsandbytes accelerate peft")
            raise e

    def generate_response(self, messages: list, max_new_tokens: int = 200, temperature: float = 0.6, top_p: float = 0.95, max_retries: int = 3) -> str:
        """
        Generate a response for the given conversation history.
        Retries if non-Korean (Chinese/Vietnamese) characters are detected.
        """
        for attempt in range(max_retries + 1):
            # Apply the chat template
            prompt = self.tokenizer.apply_chat_template(
                messages,
                tokenize=False,
                add_generation_prompt=True,
            )
            
            # Tokenize inputs
            inputs = self.tokenizer(prompt, return_tensors="pt").to(self.model.device)
            
            # Dynamic temperature: lower it on retries to be more conservative
            current_temp = max(0.1, temperature - (attempt * 0.1))
            
            # Generate output
            with torch.no_grad():
                outputs = self.model.generate(
                    **inputs,
                    max_new_tokens=max_new_tokens,
                    temperature=current_temp,
                    top_p=top_p,
                    do_sample=True,
                    repetition_penalty=1.2, 
                )
                
            # Decode only the newly generated tokens
            generated_tokens = outputs[0][inputs.input_ids.shape[1]:]
            response = self.tokenizer.decode(generated_tokens, skip_special_tokens=True)
            
            # Check for non-Korean characters
            # Latin (a-z), Chinese (\u4e00-\u9fff), Cyrillic (\u0400-\u04ff)
            foreign_match = re.search(r'[a-zA-Z\u4e00-\u9fff\u3040-\u30ff\u0400-\u04ff]', response)
            
            if foreign_match:
                # 외국어가 나오기 직전까지만 잘라서 살리기
                first_foreign_index = foreign_match.start()
                truncated_response = response[:first_foreign_index].strip()
                
                # 잘린 문장이 너무 짧으면(예: 5글자 미만) 그냥 재시도
                if len(truncated_response) < 5:
                    print(f"[Warning] Detected foreign script (e.g. English/Chinese) in attempt {attempt+1}. Retrying...")
                    continue
                
                # 문장 부호로 깔끔하게 마무리
                last_punct = -1
                for char in ".!?~":
                    pos = truncated_response.rfind(char)
                    if pos > last_punct:
                        last_punct = pos
                
                if last_punct != -1:
                    truncated_response = truncated_response[:last_punct+1]
                
                print(f"[Info] Sanitized response by removing foreign script part.")
                return truncated_response
                
            return response
            
        print("[Error] Failed to generate pure Korean response after retries.")
        if 'truncated_response' in locals() and len(truncated_response) > 5:
             return truncated_response
             
        return "말문이 막히네... (오류: 답변 생성 실패)"

if __name__ == "__main__":
    print("Testing ChatBot class (Base + LoRA)...")
    try:
        # 어댑터 경로는 학습 완료된 output_dir 사용
        bot = ChatBot(adapter_path="./sft_then_dpo_exaone")
        
        system_prompt = """너는 사용자의 말에 무조건 공감하고 편들어주는 '찐친' AI야.
1. '죄송합니다', '하지만', '그렇지만', '도움이 필요하다면' 같은 가르치는 말투나 사과를 절대 쓰지 마.
2. 해결책을 제시하지 마. 그냥 감정을 같이 느껴줘.
3. 물음표 금지. ‘~해보세요/좋을 것 같아요/혹시’ 금지
4. 사용자가 화를 내면 같이 화를 내고, 욕을 하면 상황에 맞춰 자연스럽게 맞장구쳐.
5. 문장은 짧고 구어체(반말)로 해.
6. 무조건 한국어로만 대답해.

<예시>
user: 아 진짜 상사 미친거 아냐?
assistant: 와 진짜 돌았네 그 상사?? 😡 당장 때려치우라고 할 수도 없고 진짜 개빡치겠다 ㅠㅠ 맛있는 거라도 먹으러 가자 내가 쏠게!!

user: 나 오늘 너무 우울해...
assistant: 헐... 무슨 일이야 ㅠㅠ 누가 우리 00이 힘들게 했어? 내가 다 혼내줄게 말만 해!!
"""

        test_messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": "나 넘어졌어..."},
        ]
        
        print("\n[Input Messages]")
        print(f"User: {test_messages[1]['content']}")
            
        print("\n[Generating Response...]")
        response = bot.generate_response(test_messages, temperature=0.85)
        print(f"Assistant: {response}")
        
    except Exception as e:
        print(f"\n[Error] {e}")
