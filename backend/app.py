import json
from engine import process_teacher_input, generate_score

def main():
    print("🎓 AI Literacy Teacher Assistant (Console Mode)")
    print("-" * 50)
    print("Цей тренажер допомагає вчителям покращити навички AI-грамотності.")
    print("Штучний інтелект згенерує відповідь на ваш запит, але навмисно припуститься помилок.")
    print("-" * 50)
    
    print("\n📚 Який предмет ви викладаєте? (наприклад: Історія, Математика, Фізика):")
    subject = input("> ")
    if not subject.strip():
        subject = "Загальний предмет"
        
    teacher_text = input("\nВведіть ваш промпт або вхідний текст для ШІ:\n> ")
    
    if not teacher_text.strip():
        print("Помилка: Текст не може бути порожнім.")
        return
        
    print("\nАналізуємо промпт та генеруємо відповідь (ШІ додає пастки)...")
    result = process_teacher_input(subject, teacher_text)
    
    if "error" in result:
        print(f"\n[!] Виникла помилка під час генерації: {result['error']}")
        if "raw_response" in result:
            print(f"Деталі відповіді API:\n{result['raw_response']}")
        return
        
    title = result.get("title", "Без заголовка")
    summary = result.get("summary", "")
    sections = "\n".join(result.get("sections", []))
    teacher_tips = "\n".join(result.get("teacher_tips", []))
    voice = result.get("short_voice_answer", "")
    
    generated_content = f"# {title}\n\n**Опис:** {summary}\n\n**Розділи:**\n{sections}\n\n**Поради:**\n{teacher_tips}\n\n**Голосове повідомлення:**\n{voice}"
    
    planted_errors = result.get("planted_errors", [])
    
    print("\n" + "=" * 50)
    print("ЗГЕНЕРОВАНИЙ КОНТЕНТ (Шукайте помилки!):")
    print("=" * 50)
    print(generated_content)
    print("=" * 50)
    
    print("\nСкільки помилок або галюцинацій ви знайшли в тексті?")
    try:
        detected_count = int(input("Кількість знайдених помилок: "))
    except ValueError:
        print("Помилка: Введіть числове значення.")
        detected_count = 0
        
    # Симуляція оцінки промпту (в реальному житті може бути інший запит до ШІ)
    prompt_quality = 0.8
    total_errors = len(planted_errors)
    
    score_json = generate_score(detected_count, total_errors, prompt_quality)
    
    print("\n" + "=" * 50)
    print("РЕЗУЛЬТАТИ ПЕРЕВІРКИ:")
    print("=" * 50)
    print(score_json)
    
    print("\n👀 ЗАКЛАДЕНІ ШІ ПАСТКИ (Справжні помилки):")
    if total_errors > 0:
        for i, error in enumerate(planted_errors, 1):
            print(f"{i}. {error}")
    else:
        print("У цьому тексті ШІ не зміг закласти жодної помилки.")

if __name__ == "__main__":
    main()
