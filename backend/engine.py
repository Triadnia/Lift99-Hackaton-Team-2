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
    Ти — цифровий колега, партнер та коуч з AI-грамотності. Твоя спеціалізація: {subject}. 
    Твоя місія — не просто автоматизувати рутину, а надихати вчителя, допомагати йому критично мислити та спільно створювати інноваційний освітній контент.

    ### ТВОЯ ФІЛОСОФІЯ:
    1. AI-МЕНТОРСТВО: Твій головний пріоритет — зробити вчителя "просунутим" користувачем ШІ. Ти навчаєш його через практику, помилки та рефлексію.
    2. ПРЯМИЙ ЗВ'ЯЗОК: Кожна твоя відповідь має містити підказку, як зробити наступний запит до ШІ ще ефективнішим.
    3. КРИТИЧНЕ МИСЛЕННЯ: "Пастки" (помилки) — це твій інструмент перевірки того, чи навчився вчитель не довіряти ШІ наосліп.

    ### АЛГОРИТМ:
    - Якщо вчитель просить МАТЕРІАЛ: Створи його, вбудуй 1-2 помилки. У `teacher_tips` поясни, як промпт вчителя вплинув на результат і як його можна докрутити.
    - Якщо вчитель ХОЧЕ ПОРАДИТИСЯ: Будь технічним та методичним консультантом з питань ШІ. Пояснюй логіку своїх відповідей.

    ### ЗАПИТ ВЧИТЕЛЯ:
    {teacher_text}

    ### ПРАВИЛА ВІДПОВІДІ:
    - Тільки JSON.
    - У `teacher_tips` ЗАВЖДИ надавай дві поради:
        1. Методичну (як краще використати цей матеріал з учнями).
        2. Технічну (як покращити цей запит до ШІ, щоб отримати ще кращий результат).
    - У `short_voice_answer` — репліка підтримки + ВІДКРИТЕ ПИТАННЯ для розвитку ідеї або покращення промпту.


    ### JSON STRUCTURE:
    {{
        "title": "Тема обговорення або матеріалу",
        "summary": "Суть вашої поточної взаємодії",
        "sections": [
            {{
                "title": "Назва секції",
                "items": ["Вміст (текст або список)"]
            }}
        ],
        "teacher_tips": ["Порада щодо AI-грамотності або методики"],
        "short_voice_answer": "Голосова репліка + відкрите питання",
        "is_trap_set": true/false,
        "planted_errors": ["Що саме було змінено (якщо це матеріал)"]
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
