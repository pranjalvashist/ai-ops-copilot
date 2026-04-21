from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from openai import OpenAI
from dotenv import load_dotenv
from database import SessionLocal, Message
from pathlib import Path
import os

# Load environment variables
load_dotenv(dotenv_path=Path(__file__).parent / ".env")

# Debug (remove later)
print("API KEY:", os.getenv("OPENAI_API_KEY"))

if not os.getenv("OPENAI_API_KEY"):
    raise ValueError("❌ OPENAI_API_KEY not found.")

app = FastAPI()

# Allow frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

class AskRequest(BaseModel):
    question: str

@app.get("/")
def root():
    return {"message": "Backend is running"}

# 🔥 MAIN AI ENDPOINT (CLEAN VERSION)
@app.post("/ask")
def ask_ai(request: AskRequest):
    db = SessionLocal()

    try:
        # 🔹 Load past messages from DB
        messages = db.query(Message).all()

        conversation_history = [
            {"role": m.role, "content": m.content}
            for m in messages
        ]

        # 🔹 Add current user message
        conversation_history.append({
            "role": "user",
            "content": request.question
        })

        # Save user message to DB
        db.add(Message(role="user", content=request.question))
        db.commit()

        # 🧠 PLANNER
        plan = client.chat.completions.create(
            model="gpt-4.1-mini",
            messages=[
                {"role": "system", "content": "You are a planning agent."},
                *conversation_history
            ],
        )

        plan_text = plan.choices[0].message.content

        # ⚙️ EXECUTOR
        execution = client.chat.completions.create(
            model="gpt-4.1-mini",
            messages=[
                {"role": "system", "content": "You are an expert assistant. Follow the plan carefully."},
                {"role": "user", "content": f"Plan:\n{plan_text}"}
            ],
        )

        final_answer = execution.choices[0].message.content

        # Save AI response to DB
        db.add(Message(role="assistant", content=final_answer))
        db.commit()

        return {
            "answer": final_answer,
            "plan": plan_text
        }

    except Exception as e:
        return {"error": str(e)}

    finally:
        db.close()

# 🔁 GET CHAT HISTORY
@app.get("/history")
def get_history():
    db = SessionLocal()
    messages = db.query(Message).all()
    db.close()

    return [
        {"role": msg.role, "content": msg.content}
        for msg in messages
    ]
@app.delete("/clear")
def clear_chat():
    db = SessionLocal()

    try:
        db.query(Message).delete()
        db.commit()
        return {"message": "Chat cleared"}
    except Exception as e:
        return {"error": str(e)}
    finally:
        db.close()