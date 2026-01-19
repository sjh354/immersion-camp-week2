from flask import Flask, request, jsonify
import sys
import os

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
    temperature = data.get('temperature', 0.85)

    print(f"user : {messages}")
    print("generating response..")
    
    try:
        response = bot_funny.generate_response(messages, temperature=temperature)
        # response = "아 정말?? 너무 힘들겠다ㅠㅠ"
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
