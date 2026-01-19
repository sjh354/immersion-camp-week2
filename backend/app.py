# 내가 좋아요한 포스트 목록 조회
@app.route('/my/likes', methods=['GET'])
@require_auth
def get_my_likes():
    user = User.query.get(g.user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    from models import Like, Post
    likes = Like.query.filter_by(user_id=g.user_id).order_by(Like.created_at.desc()).all()
    post_ids = [like.post_id for like in likes]
    posts = Post.query.filter(Post.id.in_(post_ids)).all()

    # 최신순으로 정렬 (Like.created_at 기준)
    post_dict = {str(post.id): post for post in posts}
    results = []
    for like in likes:
        post = post_dict.get(str(like.post_id))
        if not post:
            continue
        author = User.query.get(post.user_id)
        # Fetch messages in the post
        post_msgs = []
        if post.msgs:
            for m_id in post.msgs:
                msg = Message.query.get(m_id)
                if msg:
                    post_msgs.append({
                        "id": str(msg.id),
                        "sender": "user" if msg.role == "user" else "bot",
                        "content": msg.content,
                        "timestamp": msg.created_at.isoformat() if msg.created_at else None
                    })
        from models import Like as LikeModel
        like_count = db.session.query(LikeModel).filter_by(post_id=post.id).count()
        results.append({
            "id": str(post.id),
            "chatId": "",
            "messageIds": [str(m_id) for m_id in post.msgs] if post.msgs else [],
            "messages": post_msgs,
            "author": author.display_name if author else "Unknown",
            "authorEmail": author.email if author else "",
            "createdAt": post.created_at.isoformat() if post.created_at else None,
            "reactions": [
                {"type": "empathy", "count": like_count, "users": []}
            ],
            "comments": [] # Comments are now fetched via /community/comment
        })
    return jsonify(results)
import os
import jwt
import requests
import datetime
from flask import Flask, jsonify, request, g
from functools import wraps
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from dotenv import load_dotenv
from sqlalchemy import text
import threading

# Load environment variables
load_dotenv()

# Import models
from models import db, User, Conversation, Message, Post, Comment, style_enum

app = Flask(__name__)

# Config
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'default-secret-key') # Change this in production
GOOGLE_CLIENT_ID = os.getenv('GOOGLE_CLIENT_ID')
JWT_SECRET = app.config['SECRET_KEY']
JWT_ACCESS_EXP = 60 * 15 # 15 minutes
JWT_REFRESH_EXP = 60 * 60 * 24 * 7 # 7 days

CORS(app)

# Initialize DB
db.init_app(app)

with app.app_context():
    # Ensure pgvector extension is enabled
    db.session.execute(text('CREATE EXTENSION IF NOT EXISTS vector'))
    db.session.commit()
    db.create_all()

# --- Auth Utilities ---

def verify_google_token(token):
    try:
        # Verify the token with Google's API
        url = f"https://oauth2.googleapis.com/tokeninfo?id_token={token}"
        response = requests.get(url)
        
        if response.status_code != 200:
            return None
        
        data = response.json()
        
        # Verify audience (optional but recommended)
        # if data['aud'] != GOOGLE_CLIENT_ID:
        #     return None
            
        return data
    except Exception as e:
        print(f"Google Token Verification Error: {e}")
        return None

def create_tokens(user_id):
    access_payload = {
        'user_id': str(user_id),
        'exp': datetime.datetime.utcnow() + datetime.timedelta(seconds=JWT_ACCESS_EXP),
        'type': 'access'
    }
    refresh_payload = {
        'user_id': str(user_id),
        'exp': datetime.datetime.utcnow() + datetime.timedelta(seconds=JWT_REFRESH_EXP),
        'type': 'refresh'
    }
    
    access_token = jwt.encode(access_payload, JWT_SECRET, algorithm='HS256')
    refresh_token = jwt.encode(refresh_payload, JWT_SECRET, algorithm='HS256')
    
    return access_token, refresh_token

def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({"error": "Authorization header is missing or invalid"}), 401
        
        token = auth_header.split(" ")[1]
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
            if payload.get('type') != 'access':
                 return jsonify({"error": "Invalid token type"}), 401
            
            # User requested specific exception handling for this assignment
            try:
                g.user_id = payload['user_id']
            except Exception as e:
                print(f"Error setting g.user_id: {e}")
                return jsonify({"error": "Failed to set user context"}), 500
                
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token has expired"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Invalid token"}), 401
        
        return f(*args, **kwargs)
    return decorated

# --- Auth ---

@app.route('/auth/google', methods=['POST'])
def google_auth():
    data = request.get_json()
    token = data.get('token')
    
    if not token:
        return jsonify({"error": "Token is missing"}), 400
    
    google_user = verify_google_token(token)
    if not google_user:
        return jsonify({"error": "Invalid Google Token"}), 401
    
    # Extract info
    email = google_user.get('email')
    google_sub = google_user.get('sub')
    name = google_user.get('name')
    # picture = google_user.get('picture') # If needed
    
    # Check if user exists
    user = User.query.filter_by(google_sub=google_sub).first()
    
    if not user:
        # Create new user
        # Check if email exists (maybe registered via other method?) - for now assume google unique
        user = User(
            email=email,
            google_sub=google_sub,
            display_name=name,
        )
        db.session.add(user)
        db.session.commit()
    else:
        # Update last login
        user.last_login_at = datetime.datetime.utcnow()
        db.session.commit()
    
    # Generate tokens
    access_token, refresh_token = create_tokens(user.id)
    
    return jsonify({
        "accessToken": access_token,
        "refreshToken": refresh_token,
        "user": {
            "id": str(user.id),
            "email": user.email,
            "name": user.display_name,
            "mbti": user.setting_mbti,
            "intensity": user.setting_intensity,
            "style": user.style,
            "postCnt": user.post_cnt,
            "commentCnt": user.comment_cnt
        }
    })

@app.route('/my', methods=['GET', 'PATCH'])
@require_auth
def manage_user_profile():
    user = User.query.get(g.user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    if request.method == 'GET':
        return jsonify({
            "user": {
                "id": str(user.id),
                "email": user.email,
                "name": user.display_name,
                "mbti": user.setting_mbti,
                "intensity": user.setting_intensity,
                "style": user.style,
                "postCnt": user.post_cnt,
                "commentCnt": user.comment_cnt
            }
        })
    
    # PATCH logic
    data = request.json
    if not data:
        return jsonify({"error": "No data provided"}), 400
        
    if 'name' in data:
        user.display_name = data['name']
    if 'mbti' in data:
        user.setting_mbti = data['mbti']
    if 'intensity' in data:
        user.setting_intensity = data['intensity']
    if 'style' in data:
        user.style = data['style']
    db.session.commit()
    return jsonify({"message": "Settings updated successfully"})

@app.route('/my/posts', methods=['GET'])
@require_auth
def get_my_posts():
    user = User.query.get(g.user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
        
    posts = Post.query.filter_by(user_id=g.user_id).all()
    results = []
    
    for p in posts:
        # Fetch messages in the post
        post_msgs = []
        if p.msgs:
            for m_id in p.msgs:
                msg = Message.query.get(m_id)
                if msg:
                    post_msgs.append({
                        "id": str(msg.id),
                        "sender": "user" if msg.role == "user" else "bot",
                        "content": msg.content,
                        "timestamp": msg.created_at.isoformat() if msg.created_at else None
                    })
        
        # Comments for this post (optional, but CommunityPage logic expects it)
        # However, for MyPage we just need the post itself
        results.append({
            "id": str(p.id),
            "chatId": "", # Not strictly needed for MyPage but kept for interface consistency
            "messageIds": [str(m_id) for m_id in p.msgs] if p.msgs else [],
            "messages": post_msgs,
            "author": user.display_name,
            "authorEmail": user.email,
            "originalAuthorEmail": user.email,
            "createdAt": p.created_at.isoformat() if p.created_at else None,
            "reactions": [
                {"type": "empathy", "count": p.hearts, "users": []} # Simplified
            ],
            "comments": [] 
        })
    
    return jsonify(results)

@app.route('/my/comments', methods=['GET'])
@require_auth
def get_my_comments():
    user = User.query.get(g.user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
        
    comments = Comment.query.filter_by(user_id=g.user_id).all()
    results = []
    
    for c in comments:
        post = Post.query.get(c.post_id)
        post_content = ""
        if post and post.msgs:
            first_msg = Message.query.get(post.msgs[0])
            if first_msg:
                post_content = first_msg.content[:50] + "..." if len(first_msg.content) > 50 else first_msg.content

        results.append({
            "id": str(c.id),
            "postId": str(c.post_id),
            "postContent": post_content,
            "author": "익명" if c.anonymous else user.display_name,
            "authorEmail": user.email,
            "originalAuthorEmail": user.email,
            "content": c.content,
            "timestamp": c.created_at.isoformat() if c.created_at else None
        })
        
    return jsonify(results)

@app.route('/auth/refresh', methods=['POST'])
def refresh_token():
    data = request.get_json()
    refresh_token = data.get('refreshToken')
    
    if not refresh_token:
        return jsonify({"error": "Refresh token missing"}), 400
    
    try:
        payload = jwt.decode(refresh_token, JWT_SECRET, algorithms=['HS256'])
        if payload['type'] != 'refresh':
            raise jwt.InvalidTokenError
        
        user_id = payload['user_id']
        # Generate new access token
        new_access_payload = {
            'user_id': user_id,
            'exp': datetime.datetime.utcnow() + datetime.timedelta(seconds=JWT_ACCESS_EXP),
            'type': 'access'
        }
        access_token = jwt.encode(new_access_payload, JWT_SECRET, algorithm='HS256')
        
        return jsonify({"accessToken": access_token})
        
    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Refresh token expired"}), 401
    except jwt.InvalidTokenError:
        return jsonify({"error": "Invalid refresh token"}), 401
    except Exception as e:
        print(f"Token refresh error: {e}")
        return jsonify({"error": "Token refresh failed"}), 500

@app.route('/auth/logout', methods=['POST'])
def logout():
    # In stateless JWT, we usually just let the client discard the token.
    # Optionally, blacklisting can be implemented here with Redis/DB.
    return jsonify({"message": "Logged out successfully"})

# --- Chat ---

# 채팅방 이름 변경 API
@app.route('/chat', methods=['PATCH'])
@require_auth
def update_chat_room_title():
    data = request.get_json() or {}
    conversation_id = data.get('conversation_id')
    new_title = data.get('title')
    if not conversation_id or not new_title:
        return jsonify({"error": "conversation_id와 title이 필요합니다."}), 400
    conv = Conversation.query.filter_by(id=conversation_id, user_id=g.user_id).first()
    if not conv:
        return jsonify({"error": "Conversation not found or access denied"}), 404
    conv.title = new_title
    conv.updated_at = datetime.datetime.utcnow()
    db.session.commit()
    return jsonify({"message": "채팅방 이름이 변경되었습니다.", "id": str(conv.id), "title": conv.title})

@app.route('/chat', methods=['GET'])
@require_auth
def get_chat_room():
    user = User.query.get(g.user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
        
    conversations = Conversation.query.filter_by(user_id=g.user_id, deleted=False).order_by(Conversation.updated_at.desc()).all()
    
    results = []
    for conv in conversations:
        # Get last message
        last_msg = Message.query.filter_by(conversation_id=conv.id).order_by(Message.created_at.desc()).first()
        
        # Get all messages for the room
        msgs = Message.query.filter_by(conversation_id=conv.id).order_by(Message.created_at.asc()).all()
        formatted_msgs = []
        for m in msgs:
            formatted_msgs.append({
                "id": str(m.id),
                "sender": "user" if m.role == "user" else "bot",
                "content": m.content,
                "timestamp": m.created_at.isoformat() if m.created_at else None
            })

        results.append({
            "id": str(conv.id),
            "title": conv.title or "새 채팅",
            "lastMessage": last_msg.content if last_msg else "",
            "messages": formatted_msgs,
            "createdAt": conv.created_at.isoformat() if conv.created_at else None,
            "updatedAt": conv.updated_at.isoformat() if conv.updated_at else None,
            "authorEmail": user.email
        })
    
    return jsonify(results)

@app.route('/chat', methods=['DELETE'])
@require_auth
def delete_chat_room():
    conversation_id = request.args.get('conversation_id')
    if not conversation_id:
        return jsonify({"error": "conversation_id is required"}), 400
        
    conv = Conversation.query.filter_by(id=conversation_id, user_id=g.user_id).first()
    if not conv:
        return jsonify({"error": "Conversation not found or access denied"}), 404
        
    db.session.delete(conv)
    db.session.commit()
    
    return jsonify({"message": "Conversation deleted"}), 200

@app.route('/chat', methods=['POST'])
@require_auth
def create_chat_room():
    user = User.query.get(g.user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
        
    data = request.get_json() or {}
    title = data.get('title', '새 채팅')
    
    new_conv = Conversation(
        user_id=g.user_id,
        title=title
    )
    db.session.add(new_conv)
    db.session.commit()
    
    # Return formatted new conversation
    return jsonify({
        "id": str(new_conv.id),
        "title": new_conv.title,
        "lastMessage": "",
        "messages": [],
        "createdAt": new_conv.created_at.isoformat() if new_conv.created_at else None,
        "updatedAt": new_conv.updated_at.isoformat() if new_conv.updated_at else None,
        "authorEmail": user.email
    }), 201

@app.route('/chat/messages', methods=['GET'])
@require_auth
def get_chat_messages():
    conversation_id = request.args.get('conversation_id')
    # Check if the conversation belongs to the user
    conv = Conversation.query.filter_by(id=conversation_id, user_id=g.user_id).first()
    if not conv:
        return jsonify({"error": "Conversation not found or access denied"}), 404
    
    messages = Message.query.filter_by(conversation_id=conversation_id).order_by(Message.created_at.asc()).all()
    formatted_msgs = []
    for m in messages:
        formatted_msgs.append({
            "id": str(m.id),
            "sender": "user" if m.role == "user" else "bot",
            "content": m.content,
            "timestamp": m.created_at.isoformat() if m.created_at else None
        })
    
    return jsonify(formatted_msgs)

@app.route('/chat/messages', methods=['POST'])
@require_auth
def add_chat_message():
    conversation_id = request.args.get('conversation_id')
    # Check if the conversation belongs to the user
    conv = Conversation.query.filter_by(id=conversation_id, user_id=g.user_id).first()
    if not conv:
        return jsonify({"error": "Conversation not found or access denied"}), 404
    
    data = request.get_json() or {}
    content = data.get('content')
    role = data.get('role', 'user')
    
    if not content:
        return jsonify({"error": "Content is missing"}), 400
        
    new_msg = Message(
        conversation_id=conversation_id,
        user_id=g.user_id,
        role=role,
        content=content
    )
    db.session.add(new_msg)
    
    # Update conversation updated_at
    conv.updated_at = datetime.datetime.utcnow()
    
    db.session.commit()
    
    # Trigger chatbot response in background if it's a user message
    if role == 'user':
        # Get user settings for persona
        thread = threading.Thread(target=trigger_chatbot_response, args=(app.config['SQLALCHEMY_DATABASE_URI'], conversation_id, g.user_id))
        thread.start()
        
    return jsonify({
        "id": str(new_msg.id),
        "sender": "user" if new_msg.role == "user" else "bot",
        "content": new_msg.content,
        "timestamp": new_msg.created_at.isoformat() if new_msg.created_at else None
    }), 201

def trigger_chatbot_response(db_url, conversation_id, user_id):
    # Use a new app context for the thread
    from models import db, User, Conversation, Message
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    
    engine = create_engine(db_url)
    Session = sessionmaker(bind=engine)
    session = Session()
    
    try:
        user = session.query(User).get(user_id)
        if not user:
            return

        # Fetch conversation history
        messages = session.query(Message).filter_by(conversation_id=conversation_id).order_by(Message.created_at.asc()).all()
        
        # Prepare messages for LLM
        formatted_history = []
        
        # Add system prompt (Persona)
        system_content = f"너는 사용자의 말에 무조건 공감하고 편들어주는 '찐친' AI야. 사용자의 MBTI는 {user.setting_mbti}이고, 공감 강도는 {user.setting_intensity} 수준이야. 말투 스타일은 {user.style}이야."
        system_content += "\n1. '죄송합니다', '하지만', '그렇지만', '도움이 필요하다면' 같은 가르치는 말투나 사과를 절대 쓰지 마.\n2. 해결책을 제시하지 마. 그냥 감정을 같이 느껴줘.\n3. 문장은 짧고 구어체(반말)로 해.\n4. 무조건 한국어로만 대답해."
        
        formatted_history.append({"role": "system", "content": system_content})
        
        for m in messages:
            role = "user" if m.role == "user" else "assistant"
            formatted_history.append({"role": role, "content": m.content})
            
        # Call Inference Server running on the host
        try:
            # Use host.docker.internal to reach the host machine from inside the container
            inference_url = "http://host.docker.internal:5000/generate"
            resp = requests.post(inference_url, json={"messages": formatted_history}, timeout=120)
            if resp.status_code == 200:
                bot_content = resp.json().get('response', '')
                if bot_content:
                    # Save bot message
                    bot_msg = Message(
                        conversation_id=conversation_id,
                        user_id=user_id,
                        role='bot',
                        content=bot_content
                    )
                    session.add(bot_msg)
                    # Update conversation
                    conv = session.query(Conversation).get(conversation_id)
                    conv.updated_at = datetime.datetime.utcnow()
                    session.commit()
            else:
                print(f"LLM Server returned error: {resp.status_code} - {resp.text}")
        except Exception as e:
            print(f"Error calling LLM inference: {e}")
            
    except Exception as e:
        print(f"Error in trigger_chatbot_response: {e}")
    finally:
        session.close()

# --- Community ---

@app.route('/community', methods=['POST'])
@require_auth
def create_community_post():
    data = request.get_json() or {}
    chat_id = data.get('chatId')
    message_ids = data.get('messageIds', [])
    
    # Create new post
    new_post = Post(
        user_id=g.user_id,
        msgs=message_ids, # ARRAY(UUID)
        hearts=0
    )
    db.session.add(new_post)
    
    # Update user stats
    user = User.query.get(g.user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
        
    user.post_cnt = (user.post_cnt or 0) + 1
    # Use post_history column, not posts relationship
    current_history = list(user.post_history) if user.post_history else []
    current_history.append(new_post.id)
    user.post_history = current_history
    
    db.session.commit()
    
    author = user
    post_msgs = []
    if new_post.msgs:
        for m_id in new_post.msgs:
            msg = Message.query.get(m_id)
            if msg:
                post_msgs.append({
                    "id": str(msg.id),
                    "sender": "user" if msg.role == "user" else "bot",
                    "content": msg.content,
                    "timestamp": msg.created_at.isoformat() if msg.created_at else None
                })

    return jsonify({
        "id": str(new_post.id),
        "chatId": chat_id,
        "messageIds": [str(m_id) for m_id in new_post.msgs] if new_post.msgs else [],
        "messages": post_msgs,
        "author": author.display_name if author else "Unknown",
        "authorEmail": author.email if author else "",
        "createdAt": new_post.created_at.isoformat() if new_post.created_at else None,
        "reactions": [
            {"type": "empathy", "count": new_post.hearts, "users": []}
        ],
        "comments": []
    }), 201

@app.route('/community', methods=['GET'])
@require_auth
def get_community_posts():
    # 최신순(생성일 내림차순)으로 정렬
    posts = Post.query.order_by(Post.created_at.desc()).all()

    results = []
    for p in posts:
        author = User.query.get(p.user_id)

        # Fetch messages in the post
        post_msgs = []
        if p.msgs:
            for m_id in p.msgs:
                msg = Message.query.get(m_id)
                if msg:
                    post_msgs.append({
                        "id": str(msg.id),
                        "sender": "user" if msg.role == "user" else "bot",
                        "content": msg.content,
                        "timestamp": msg.created_at.isoformat() if msg.created_at else None
                    })

        from models import Like
        like_count = db.session.query(Like).filter_by(post_id=p.id).count()

        results.append({
            "id": str(p.id),
            "chatId": "", 
            "messageIds": [str(m_id) for m_id in p.msgs] if p.msgs else [],
            "messages": post_msgs,
            "author": author.display_name if author else "Unknown",
            "authorEmail": author.email if author else "",
            "createdAt": p.created_at.isoformat() if p.created_at else None,
            "reactions": [
                {"type": "empathy", "count": like_count, "users": []}
            ],
            "comments": [] # Comments are now fetched via /community/comment
        })

    # 최신순 정렬된 결과를 그대로 반환 (최신글이 배열 첫 번째에 오도록)
    return jsonify(results)

@app.route('/community/<post_id>', methods=['DELETE'])
@require_auth
def delete_community_post(post_id):
    post = Post.query.get(post_id)
    if not post:
        return jsonify({"error": "Post not found"}), 404
    
    if str(post.user_id) != str(g.user_id):
        return jsonify({"error": "Unauthorized"}), 403
        
    # Delete related comments first
    Comment.query.filter_by(post_id=post_id).delete()
    
    db.session.delete(post)
    
    # Update user stats
    user = User.query.get(g.user_id)
    if user:
        user.post_cnt = max(0, (user.post_cnt or 1) - 1)
        if user.post_history and post_id in [str(pid) for pid in user.post_history]:
            new_history = [pid for pid in user.post_history if str(pid) != str(post_id)]
            user.post_history = new_history
            
    db.session.commit()
    return jsonify({"message": "Post deleted"}), 200

@app.route('/community/comment', methods=['POST'])
@require_auth
def create_community_comment():
    post_id = request.args.get('post_id')
    if not post_id:
        return jsonify({"error": "post_id is required"}), 400
        
    data = request.get_json() or {}
    content = data.get('content')
    anonymous = data.get('anonymous', False)
    
    if not content:
        return jsonify({"error": "Content is missing"}), 400
        
    new_comment = Comment(
        user_id=g.user_id,
        post_id=post_id,
        content=content,
        anonymous=anonymous
    )
    db.session.add(new_comment)
    
    # Update user stats
    user = User.query.get(g.user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
        
    user.comment_cnt = (user.comment_cnt or 0) + 1
    # Use comment_history column, not comments relationship
    current_history = list(user.comment_history) if user.comment_history else []
    current_history.append(new_comment.id)
    user.comment_history = current_history
    
    db.session.commit()
    
    return jsonify({
        "id": str(new_comment.id),
        "author": "익명" if new_comment.anonymous else user.display_name,
        "authorEmail": user.email,
        "content": new_comment.content,
        "timestamp": new_comment.created_at.isoformat() if new_comment.created_at else None
    }), 201

@app.route('/community/comment', methods=['GET'])
@require_auth
def get_community_comments():
    post_id = request.args.get('post_id')
    if not post_id:
        return jsonify({"error": "post_id is required"}), 400
    
    comments = Comment.query.filter_by(post_id=post_id).all()
    formatted_comments = []
    for c in comments:
        c_author = User.query.get(c.user_id)
        formatted_comments.append({
            "id": str(c.id),
            "author": "익명" if c.anonymous else (c_author.display_name if c_author else "Unknown"),
            "authorEmail": c_author.email if c_author else "",
            "content": c.content,
            "timestamp": c.created_at.isoformat() if c.created_at else None
        })
    
    return jsonify(formatted_comments)
@app.route('/community/comment/<comment_id>', methods=['DELETE'])
@require_auth
def delete_community_comment(comment_id):
    comment = Comment.query.get(comment_id)
    if not comment:
        return jsonify({"error": "Comment not found"}), 404
        
    if str(comment.user_id) != str(g.user_id):
        return jsonify({"error": "Unauthorized"}), 403
        
    db.session.delete(comment)
    
    # Update user stats
    user = User.query.get(g.user_id)
    if user:
        user.comment_cnt = max(0, (user.comment_cnt or 1) - 1)
        if user.comment_history and comment_id in [str(cid) for cid in user.comment_history]:
            new_history = [cid for cid in user.comment_history if str(cid) != str(comment_id)]
            user.comment_history = new_history
            
    db.session.commit()
    return jsonify({"message": "Comment deleted"}), 200


@app.route('/test')
def test_connection():
    return jsonify({
        "status": "success",
        "message": "백엔드 연결 성공!"
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000)