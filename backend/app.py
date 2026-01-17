from flask import Flask, jsonify
from flask_cors import CORS # 프론트엔드와 통신을 허용해주는 필수 도구

app = Flask(__name__)
CORS(app) # 3000번 포트(프론트)에서 오는 요청을 허락함


@app.route('/test')
def test_connection():
    # 프론트엔드가 이 주소로 요청을 보내면 아래 데이터를 보내줍니다.
    return jsonify({
        "status": "success",
        "message": "백엔드 연결 성공! 억빠 준비 완료!"
    })


if __name__ == '__main__':
    # 0.0.0.0으로 설정해야 외부(K-Cloud 주소)에서도 접속이 가능합니다.
    app.run(host='0.0.0.0', port=8000)