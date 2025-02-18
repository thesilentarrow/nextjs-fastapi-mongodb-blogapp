# main.py
from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from datetime import datetime
from pydantic import BaseModel
from typing import Optional
from jwt.exceptions import InvalidTokenError  
import jwt
from bson.objectid import ObjectId 

app = FastAPI()

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Database connection
MONGODB_URL = "mongodb://localhost:27017"
client = AsyncIOMotorClient(MONGODB_URL)
db = client.blog_db

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Models
class UserCreate(BaseModel):
    name: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class BlogPost(BaseModel):
    title: str
    content: str
    author_id: Optional[str] = None
    created_at: Optional[datetime] = datetime.now()

# Authentication
SECRET_KEY = "your-secret-key"
ALGORITHM = "HS256"

async def get_current_user(authorization: str = Header(None)):
    if not authorization or not authorization.startswith('Bearer '):
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    
    token = authorization.split(' ')[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload["sub"]
        # Convert string ID to ObjectId for MongoDB query
        user = await db.users.find_one({"_id": ObjectId(user_id)})
        if user:
            # Convert ObjectId to string for response
            user["_id"] = str(user["_id"])
            return user
        raise HTTPException(status_code=401, detail="User not found")
    except (InvalidTokenError, Exception) as e:
        raise HTTPException(status_code=401, detail="Invalid token or user")

# Auth routes
@app.post("/auth/register")
async def register(user: UserCreate):
    if await db.users.find_one({"email": user.email}):
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = pwd_context.hash(user.password)
    user_dict = user.dict()
    user_dict["password"] = hashed_password
    
    result = await db.users.insert_one(user_dict)
    
    return {"message": "User created successfully"}

@app.post("/auth/login")
async def login(user: UserLogin):
    db_user = await db.users.find_one({"email": user.email})
    if not db_user:
        raise HTTPException(status_code=400, detail="User not found")
    
    if not pwd_context.verify(user.password, db_user["password"]):
        raise HTTPException(status_code=400, detail="Incorrect password")
    
    token = jwt.encode(
        {"sub": str(db_user["_id"])},
        SECRET_KEY,
        algorithm=ALGORITHM
    )
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": str(db_user["_id"]),
            "name": db_user["name"],
            "email": db_user["email"]
        }
    }

# # Blog routes
# @app.post("/blog/posts")
# async def create_post(post: dict, current_user = Depends(get_current_user)):
#     post["author_id"] = current_user.id
#     post["created_at"] = datetime.utcnow()
#     result = await db.posts.insert_one(post)
#     created_post = await db.posts.find_one({"_id": result.inserted_id})
#     created_post["_id"] = str(created_post["_id"])
#     return created_post

@app.post("/blog/posts")
async def create_post(post: dict, current_user = Depends(get_current_user)):
    post["author_id"] = str(current_user["_id"])  # Use the _id from the user document
    post["created_at"] = datetime.utcnow()
    result = await db.posts.insert_one(post)
    created_post = await db.posts.find_one({"_id": result.inserted_id})
    created_post["_id"] = str(created_post["_id"])
    return created_post

@app.get("/blog/posts")
async def get_posts():
    posts = []
    cursor = db.posts.find().sort("created_at", -1)  # -1 for descending order
    async for post in cursor:
        post["_id"] = str(post["_id"])
        posts.append(post)
    return posts

@app.get("/blog/posts/{post_id}")
async def get_post(post_id: str):
    post = await db.posts.find_one({"_id": post_id})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    post["_id"] = str(post["_id"])
    return post

@app.put("/blog/posts/{post_id}")
async def update_post(post_id: str, post: dict, current_user = Depends(get_current_user)):
    # Check if post exists and user owns it
    existing_post = await db.posts.find_one({"_id": ObjectId(post_id)})
    if not existing_post:
        raise HTTPException(status_code=404, detail="Post not found")
    if str(existing_post["author_id"]) != str(current_user["_id"]):
        raise HTTPException(status_code=403, detail="Not authorized to edit this post")
    
    # Update the post
    await db.posts.update_one(
        {"_id": ObjectId(post_id)},
        {"$set": {
            "title": post["title"],
            "content": post["content"]
        }}
    )
    
    updated_post = await db.posts.find_one({"_id": ObjectId(post_id)})
    updated_post["_id"] = str(updated_post["_id"])
    return updated_post

@app.delete("/blog/posts/{post_id}")
async def delete_post(post_id: str, current_user = Depends(get_current_user)):
    # Check if post exists and user owns it
    existing_post = await db.posts.find_one({"_id": ObjectId(post_id)})
    if not existing_post:
        raise HTTPException(status_code=404, detail="Post not found")
    if str(existing_post["author_id"]) != str(current_user["_id"]):
        raise HTTPException(status_code=403, detail="Not authorized to delete this post")
    
    await db.posts.delete_one({"_id": ObjectId(post_id)})
    return {"message": "Post deleted successfully"}