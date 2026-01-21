# EOKPPA

AI 챗봇 + 커뮤니티 + 고민 작성/공유를 제공하는 웹 서비스입니다.  
프론트엔드(Next.js), 백엔드(Flask), LLM 서버(Python), PostgreSQL, Nginx 리버스 프록시, Cloudflared(Cloudflare Tunnel) 기반으로 구성됩니다.

목표: 사용자가 고민을 작성하면 AI가 “억빠(위로/웃김 톤)”로 답변하고, 결과를 저장·공유하며 커뮤니티에서 소통할 수 있는 서비스

---

## 주요 기능 (Features)

- AI 챗봇
  - 고민 입력 → LLM 응답 생성
  - 말투 / 강도 / 스타일 옵션 기반 생성
  - 결과 저장 및 다시 생성
- 채팅
  - 채팅 리스트 / 채팅룸
  - 메시지 히스토리 저장
- 커뮤니티
  - 채팅 메시지 선택 → 게시글 공유
  - 댓글 작성 및 삭제
  - 익명 게시 / 익명 댓글 지원
- 마이페이지
  - 내가 쓴 글 / 댓글 / 좋아요 집계
  - 즐겨찾기(북마크)
- 인증
  - OAuth 로그인 (예: Google)
  - 세션 / 토큰 기반 인증

---

## 아키텍처 (Architecture)

- Frontend (Next.js 14)  
  UI 렌더링, 사용자 인터랙션, API 호출, PWA 지원

- Backend (Flask REST API)  
  인증/권한, DB CRUD, 커뮤니티·채팅 데이터 처리, LLM 서버 연동

- LLM Server (Python)  
  프롬프트 구성, 모델 추론, 응답 후처리

- Database (PostgreSQL)  
  유저, 채팅, 메시지, 게시글, 댓글 등 데이터 영속 저장

- Nginx  
  리버스 프록시 및 라우팅

- Cloudflared  
  Cloudflare Tunnel을 통한 외부 접근 지원

---

## 기술 스택 (Tech Stack)

- Frontend: Next.js 14, React, TypeScript
- Backend: Flask, SQLAlchemy
- LLM: Python, transformers, peft
- Database: PostgreSQL
- Infra: Docker, Docker Compose, Nginx, Cloudflared

---

## 프로젝트 구조 (Project Structure)

## 프로젝트 구조 (Project Structure)

```bash
.
├── backend/
│   ├── app.py
│   ├── models.py
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/
│   ├── components/
│   ├── public/
│   ├── src/
│   ├── package.json
│   ├── Dockerfile
│   └── ...
│
├── llm/
│   ├── inference_server.py
│   ├── requirements.txt
│   └── ...
│
├── db/
│   ├── postgresql.conf
│   ├── pg_hba.conf
│   └── ...
│
├── nginx/
│   └── nginx.conf
│
├── cloudflared/
│   └── config.yaml
│
├── docker-compose.yml
├── schema.sql
└── README.md
```

---

## 사전 준비 (Prerequisites)

- Docker / Docker Compose
- (선택) Node.js 18+, Python 3.10+
- (선택) Cloudflare Tunnel 계정

---

## 환경 변수 (Environment Variables)

Frontend (frontend/.env.local)

NEXT_PUBLIC_API_BASE_URL=http://localhost:8000  
NEXT_PUBLIC_APP_URL=http://localhost:3000  
NEXT_PUBLIC_GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID  

Backend (backend/.env)

FLASK_ENV=development  
SECRET_KEY=YOUR_SECRET_KEY  
DATABASE_URL=postgresql://postgres:postgres@db:5432/eokppa  
LLM_BASE_URL=http://llm:5000  
GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID  

LLM Server (llm/.env)

MODEL_NAME=your-model-name  
DEVICE=cuda  
MAX_TOKENS=512  
TEMPERATURE=0.8  

---

## 빠른 시작 (Quick Start)

docker-compose up --build

접속 주소 (예시)

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- LLM Server: http://localhost:5000
- PostgreSQL: localhost:5432

---

## 로컬 개발 (Local Development)

Frontend

cd frontend  
npm install  
npm run dev  

Backend

cd backend  
python -m venv .venv  
source .venv/bin/activate  
pip install -r requirements.txt  
python app.py  

LLM Server

cd llm  
python -m venv .venv  
source .venv/bin/activate  
pip install -r requirements.txt  
python inference_server.py  

---

## 데이터베이스 (Database)

- 스키마 정의: schema.sql
- 초기화 예시:

docker exec -i <postgres_container> psql -U postgres -d eokppa < schema.sql

---

## 배포 (Deployment)

- Docker Compose 기반 배포
- Nginx를 통한 프록시 및 라우팅
- Cloudflared를 이용한 외부 접근 지원

---

## 트러블슈팅 (Troubleshooting)

- 컨테이너 간 통신 시 localhost 대신 서비스 이름 사용
- DB 데이터 유실 시 볼륨 설정 확인
- API 호출 실패 시 CORS 및 BASE_URL 확인
- LLM 응답 지연 시 모델/토큰 설정 확인

---

## TODO

- API 명세 문서화
- ERD 및 DB 구조 문서화
- 배포 가이드 정리
- 인증/권한 정책 정리
- LLM 프롬프트 및 스타일 파라미터 표준화
- 로깅 및 모니터링 도입

---

## 라이선스 (License)

TBD