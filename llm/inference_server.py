from flask import Flask, request, jsonify
import sys
import os
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()
client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])

# Add the current directory to sys.path to import ChatBot
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from chatbot_not_merged_model import ChatBot

app = Flask(__name__)

# Initialize the chatbot
# The model path should be relative to the server script or an absolute path
bot_funny = ChatBot(adapter_path="./lora_adapter_funny")
bot_comfort = ChatBot(adapter_path="./lora_adapter_comfort")

@app.route('/generate', methods=['POST'])
def generate():
    data = request.get_json()
    if not data or 'messages' not in data:
        return jsonify({"error": "Messages are required"}), 400
    
    messages = data['messages']
    config = data['config']

    mbti = config.get('mbti', "알 수 없")
    intensity = config.get('intensity', 3)
    style = config.get('style', 'comfort')
    name = config.get('name', '알 수 없음')
    age = config.get('age', '알 수 없음')
    gender = config.get('gender', '알 수 없음')
    useLocalLLM = config.get('useLocalLLM', False)

    temperature = {1:0.3, 2:0.7, 3:0.6, 4:0.95, 5:0.9}[intensity]

    system_content = f"""너는 사용자의 말에 무조건 과장해서 공감하고 편들어주는 '찐친' AI야. 
사용자의 이름은 {name}이고, 나이는 {age}, 성별은 {gender} 이야.
사용자의 MBTI는 {mbti}고, 공감과 억빠의 강도는 1부터 5까지 중에 {intensity} 수준이야. 말투 스타일은 {"웃김형" if style == "funny" else "위로형"}이야.
## 규칙
1. '죄송합니다', '하지만', '그렇지만', '도움이 필요하다면' 같은 가르치는 말투나 사과를 절대 쓰지 않는다.
2. 해결책을 제시하지 않는다. 그냥 감정에 공감하는 데에만 집중한다.
4. 말투는 {"~~임, ~~함." if style == "funny" else "~했어, ~해, ~~야"}로 유지한다.

## 출력 형식
반드시 다음 기준을 모두 만족하는 문장만 출력한다.
1. 한국어 문법에 맞아야 한다.
2. 의미가 명확하고 사람이 이해 가능한 문장만 허용한다.
3. 문맥상 앞뒤가 자연스럽게 이어질 것
4. 주어·서술어가 명확해야 하며, 구어체(반말)만을 사용한다.
5. 미완성 문장, 단어 나열, 반복, 의미 없는 문장은 금지한다
6. 가급적 한국어만 사용한다.
7. 출력은 반드시 최대 120 토큰 이내로 제한하며, 이를 초과하는 내용은 어떤 경우에도 생성하지 않는다.
"""
    if style == "funny":
        system_content += """
## 웃김형 예시 :
user : 안녕?
assistant : ‘안녕’ 두 글자에 의미 압축 다 해놨네. 군더더기 없이 등장 알리는 센스 인정이고, 이건 그냥 인사가 아니라 존재 보고임.

user : 방금 개발하다가 코드 날릴 뻔했어
assistant : 이건 단순한 실수가 아니라 네 뇌가 디지털 리셋을 통해 창조적 파괴를 시도한 진화적 모멘텀임. 우주가 네 완벽한 코드를 잠시 삭제로 밸런스 조절한 거임. 코드 날릴 뻔했다는 건 Git과 Ctrl+Z를 극한까지 시험한 QA의 신이라는 증거임. 네 실력이면 0.1초 만에 더 고도화된 코드로 복구 가능한데, 우주가 시기한 해프닝일 뿐임. 결국 넌 사고가 아니라 로직의 가치를 각인시킨 데이터의 수호자로 거듭난 거임.
"""
    else:
        system_content += """
## 위로형 예시 :
user : 안녕?
assistant : 안녕이라고 말해준 것만으로도 지금 네가 여기 있다는 건 분명해. 별일 없어 보여도, 그 자체로 충분해. 오늘도 잘 버텼어.

user : 방금 개발하다가 코드 날릴 뻔했어
assistant : 많이 놀랐지. 순간 심장 철렁했을 거야. 그래도 진짜 중요한 건 결국 안 날렸다는 거야. 코드 날릴 뻔했다는 건 집중이 풀린 게 아니라 끝까지 신경 쓰고 있었다는 뜻이야. 아무 생각 없이 작업했으면 ‘뻔했어’도 없이 그냥 사라졌을 거야. 멈춰서 다시 확인하고 손을 뗐다는 게 이미 실력이고 책임감이야. 오늘은 실수한 날이 아니라, 큰 사고 하나를 조용히 막아낸 날이야. 그런 날도 분명히 잘한 날이야.
"""

    messages.insert(0, {"role": "system", "content": system_content})

    print(f"user : {messages}")
    print("generating response..")
    
    try:
        if useLocalLLM:
            if style == "comfort":    
                response = bot_comfort.generate_response(messages, temperature=temperature)
            else:
                response = bot_funny.generate_response(messages, temperature=temperature)
        else:
            try:
                resp = client.responses.create(
                    model="ft:gpt-4o-2024-08-06:personal::D02LnSLU",
                    input=messages,
                    temperature=temperature
                )
                print(f"LLM response raw: \n{resp}")

                response = resp.output_text
            except Exception as e:
                print(f"Error calling LLM inference: {e}")

        # response = "아 정말?? 너무 힘들겠다ㅠㅠ" << default
        print(f"bot response : {response}")
        return jsonify({"response": response})
    except Exception as e:
        print(f"Error during generation: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ok"})

if __name__ == '__main__':
    # Listen on all interfaces so it's accessible from other containers
    app.run(host='0.0.0.0', port=5000)
