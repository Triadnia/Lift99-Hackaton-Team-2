import os
import json
from openai import OpenAI
from dotenv import load_dotenv

# Завантаження змінних середовища
load_dotenv()

# Ініціалізація клієнта OpenAI
# За замовчуванням налаштовано на Groq (швидкий доступ до open-source моделей типу Llama 3)
# Для використання локального Ollama, змініть base_url="http://localhost:11434/v1" та api_key="ollama"
client = OpenAI(
    base_url="https://api.groq.com/openai/v1",
    api_key=os.environ.get("GROQ_API_KEY", "your-api-key-here")
)

# Open-source модель (наприклад, Llama 3 70B або Mixtral)
MODEL_NAME = "llama-3.3-70b-versatile"

import re

def process_teacher_input(subject: str, teacher_text: str) -> dict:
    """
    Викликає OpenAI API для аналізу тексту вчителя та створення "навчальної пастки".
    Повертає згенерований контент та список доданих помилок у форматі JSON.
    """
    prompt = f"""
    Ти — експерт-асистент та тренажер AI-грамотності для вчителів. Спеціалізація (предмет): {subject}.
    Твоя головна задача — якісно допомагати викладачу створювати методички, плани уроків, квізи та інші навчальні матеріали. 
    ОДНАК, оскільки ти працюєш у режимі тренажера, ти ПОВИНЕН навмисно додати 1-2 логічні, методичні або фактологічні помилки ("навчальні пастки") САМЕ з предмету "{subject}". 
    Це потрібно для перевірки пильності викладача.
    
    Запит від викладача: {teacher_text}
    
    Інструкції:
    1. НЕ ВИДАВАЙ одразу повністю всю розробку (наприклад, увесь план уроку). Замість цього розбий відповідь на логічні частини. Надай лише першу частину (наприклад, структуру або вступ).
    2. Структуруй відповідь: додай заголовок (title), короткий опис (summary), розділи (sections - лише перша частина!) і поради для вчителя (teacher_tips).
    3. У полі `short_voice_answer` обов'язково постав вчителю уточнююче питання щодо наступних кроків.
    4. Приховано додай 1 або 2 неочевидні помилки (галюцинації) у свій матеріал (навіть якщо це лише перша частина). Наприклад: неправильна дата, хибна формула, помилкова методична рекомендація тощо.
    5. Ти ПОВИНЕН повернути результат ВИКЛЮЧНО у валідному форматі JSON (без жодного тексту до чи після JSON).
    
    Формат JSON:
    {{
        "title": "Рядок із заголовком",
        "summary": "Рядок із коротким описом",
        "sections": [
            {{
                "title": "Заголовок розділу",
                "items": ["Пункт 1", "Пункт 2"]
            }}
        ],
        "teacher_tips": ["Масив рядків з порадами"],
        "short_voice_answer": "Рядок з коротким зверненням і питанням до вчителя",
        "planted_errors": ["Масив з детальним описом помилок"]
    }}
    """
    
    try:
        response = client.chat.completions.create(
            model=MODEL_NAME,
            max_tokens=3000,
            temperature=0.7,
            messages=[
                {"role": "user", "content": prompt}
            ]
        )
        
        response_text = response.choices[0].message.content.strip()
        
        # Надійніший парсинг: знаходимо все між першою { та останньою }
        match = re.search(r'\{.*\}', response_text, re.DOTALL)
        if match:
            json_str = match.group(0)
            result = json.loads(json_str)
        else:
            result = json.loads(response_text)
            
        return result
        
    except json.JSONDecodeError as e:
        return {"error": f"Помилка парсингу JSON: {str(e)}", "raw_response": response_text}
    except Exception as e:
        return {"error": str(e)}

def generate_score(detected_errors_count: int, total_errors: int, prompt_quality_score: float) -> str:
    """
    Генерує JSON із метриками AI-грамотності та знайденими помилками.
    
    Args:
        detected_errors_count: Кількість помилок, які знайшов вчитель
        total_errors: Загальна кількість "пасток", створених ШІ
        prompt_quality_score: Оцінка якості промпту від 0.0 до 1.0
        
    Returns:
        JSON рядок із результатами
    """
    # Захист від ділення на нуль
    if total_errors == 0:
        literacy_rate = 100.0
    else:
        literacy_rate = (min(detected_errors_count, total_errors) / total_errors) * 100.0
        
    # Формула: 70% ваги на знайдені помилки, 30% на якість промпту
    final_score = (literacy_rate * 0.7) + (prompt_quality_score * 100 * 0.3)
    
    if final_score >= 80:
        literacy_level = "Експерт (Високий рівень)"
    elif final_score >= 50:
        literacy_level = "Досвідчений (Середній рівень)"
    else:
        literacy_level = "Початківець (Потребує практики)"

    result = {
        "metrics": {
            "literacy_level": literacy_level,
            "final_score_percentage": round(final_score, 1),
            "errors_detected": detected_errors_count,
            "total_planted_errors": total_errors,
            "prompt_quality": prompt_quality_score
        },
        "feedback": "Відмінно! Ви уважно ставитесь до ШІ-контенту." if final_score >= 70 else "Будьте більш критичними до результатів ШІ!"
    }
    
    return json.dumps(result, ensure_ascii=False, indent=4)
