from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
import os
from .engine import process_teacher_input

app = FastAPI(title="AI Literacy Teacher Assistant API")

# Налаштування CORS для дозволу запитів з будь-яких джерел
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

frontend_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend")

class GenerateRequest(BaseModel):
    prompt: str
    subject: str = "Загальний предмет"

@app.post("/api/generate")
async def generate(body: GenerateRequest):
    """
    Ендпоінт для генерації навчальних матеріалів із вбудованими "пастками".
    Очікує prompt та subject, повертає JSON у форматі для app.jsx:
    { title, summary, sections[], teacher_tips[], short_voice_answer, planted_errors[] }
    """
    # Викликаємо логіку з engine.py
    result = process_teacher_input(body.subject, body.prompt)
    
    # Якщо виникла помилка на рівні API або парсингу JSON
    if "error" in result:
        # Можна повернути 500 помилку, або просто повернути JSON з помилкою як зараз
        return {
            "title": "Помилка генерації",
            "summary": "Не вдалося згенерувати відповідь.",
            "sections": [result["error"]],
            "teacher_tips": [],
            "short_voice_answer": "Вибачте, сталася помилка.",
            "planted_errors": []
        }
    
    # Якщо engine.py повернув правильний формат, ми його просто віддаємо
    return result

# Монтуємо папку frontend для роздачі всіх файлів (включаючи index.html, app.jsx та папку uploads)
app.mount("/", StaticFiles(directory=frontend_path, html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    # Запуск сервера: uvicorn api:app --reload
    uvicorn.run("api:app", host="0.0.0.0", port=8000, reload=True)
