// Methodical assistant — Ukrainian teaching helper prototype
// Strict minimalism: lavender bg, one accent, no frames

const { useState, useEffect, useRef, useMemo } = React;

const ACCENT = "#7c5cbf";
const BG = "#ede8f5";
const PHOTO_BG = "#b39ddb";

// ---------- Mock assistant (Ukrainian responses) ----------
// TODO: Replace with real LLM API call
const TEMPLATES = {
  "План уроку": "Підготуй план уроку з теми: ",
  "Тест": "Створи тест з 10 питань на тему: ",
  "Пояснити простіше": "Поясни простими словами для учнів 5 класу: ",
  "Домашнє": "Сформулюй домашнє завдання з теми: ",
  "Батькам": "Напиши коротке повідомлення для батьків про: ",
};

function detectKind(text) {
  const t = text.toLowerCase();
  if (t.includes("план уроку") || t.includes("підготуй план")) return "lesson";
  if (t.includes("тест") || t.includes("питань") || t.includes("питання")) return "test";
  if (t.includes("простіше") || t.includes("поясни")) return "explain";
  if (t.includes("домашн")) return "homework";
  if (t.includes("батьк") || t.includes("повідомлення")) return "parents";
  return "lesson";
}

function extractTopic(text) {
  // crude: take everything after a colon or last few meaningful words
  const colon = text.split(":");
  if (colon.length > 1 && colon[1].trim()) return colon[1].trim().replace(/\.$/, "");
  return text.replace(/^(підготуй|створи|поясни|сформулюй|напиши)/i, "").trim() || "обрану тему";
}

const RESPONSES = {
  lesson: (topic) => ({
    title: `План уроку: ${topic}`,
    summary: `Урок на 45 хвилин для середньої школи. Поєднує пояснення вчителя, групову роботу та закріплення матеріалу через практичні завдання.`,
    sections: [
      {
        title: "Мета уроку",
        items: [
          `Сформувати уявлення про основні поняття теми «${topic}».`,
          "Розвивати критичне мислення та вміння працювати в групі.",
          "Закріпити знання через практичні приклади з життя.",
        ],
      },
      {
        title: "Хід уроку",
        items: [
          "Організаційний момент — 3 хв. Привітання, перевірка готовності.",
          "Актуалізація знань — 7 хв. Бесіда, фронтальне опитування.",
          "Пояснення нового матеріалу — 15 хв. Розповідь з прикладами на дошці.",
          "Закріплення — 12 хв. Робота в парах над завданням.",
          "Підсумки та домашнє завдання — 8 хв.",
        ],
      },
      {
        title: "Матеріали",
        items: [
          "Підручник, сторінки 42–47.",
          "Робочий зошит, завдання 1–4.",
          "Презентація з ключовими тезами.",
        ],
      },
    ],
    teacher_tips: [
      "Якщо клас втомлений — почніть з короткої руханки на 1 хвилину.",
      "Сильним учням запропонуйте додаткове завдання підвищеної складності.",
      "Не забудьте записати домашнє завдання на дошці до кінця уроку.",
    ],
    short_voice_answer: `Готовий план уроку на тему ${topic}. Урок на сорок п'ять хвилин, з поясненням, груповою роботою та закріпленням.`,
  }),
  test: (topic) => ({
    title: `Тест: ${topic}`,
    summary: `10 питань змішаного типу — закриті та з короткою відповіддю. Орієнтовний час виконання — 20 хвилин.`,
    sections: [
      {
        title: "Питання з вибором відповіді",
        items: [
          `1. Що з переліченого найкраще описує поняття «${topic}»?`,
          "2. Який з прикладів НЕ належить до цієї категорії?",
          "3. Оберіть правильну послідовність етапів.",
          "4. Хто є автором цієї концепції?",
          "5. У якому році відбулася ключова подія?",
        ],
      },
      {
        title: "Питання з короткою відповіддю",
        items: [
          "6. Дайте визначення основного поняття (1–2 речення).",
          "7. Наведіть два приклади з власного досвіду.",
          "8. Поясніть різницю між двома близькими поняттями.",
          "9. Запропонуйте розв'язання ситуації, описаної у завданні.",
          "10. Сформулюйте власну думку щодо проблеми.",
        ],
      },
      {
        title: "Критерії оцінювання",
        items: [
          "Питання 1–5: по 1 балу за кожне.",
          "Питання 6–10: по 2 бали за кожне.",
          "Максимум — 15 балів. Прохідний — 9 балів.",
        ],
      },
    ],
    teacher_tips: [
      "Дайте учням 2 хвилини на ознайомлення з тестом перед початком.",
      "Останні питання варто обговорити усно після здачі робіт.",
    ],
    short_voice_answer: `Готовий тест на тему ${topic}. Десять питань, орієнтовно двадцять хвилин на виконання.`,
  }),
  explain: (topic) => ({
    title: `Пояснення простіше: ${topic}`,
    summary: `Версія для учнів молодших класів. Без складних термінів, з прикладами зі щоденного життя.`,
    sections: [
      {
        title: "Уявімо це так",
        items: [
          `Тема «${topic}» схожа на щось, що ти бачиш кожного дня вдома або на вулиці.`,
          "Спробуй уявити просту картинку — це допоможе запам'ятати головне.",
        ],
      },
      {
        title: "Три головні думки",
        items: [
          "Перша думка — це основа, з якої все починається.",
          "Друга думка показує, як це працює на практиці.",
          "Третя думка пояснює, навіщо це нам потрібно.",
        ],
      },
      {
        title: "Приклад з життя",
        items: [
          "Коли ти готуєш бутерброд — кожен крок має значення. Так само і тут.",
          "Спробуй розповісти це другові своїми словами — і ти точно зрозумієш.",
        ],
      },
    ],
    teacher_tips: [
      "Запитайте дітей, чи можуть вони навести власний приклад.",
      "Якщо хтось не зрозумів — попросіть пояснити сусіда по парті.",
    ],
    short_voice_answer: `Простими словами: тема ${topic} стає зрозумілою через приклади зі щоденного життя.`,
  }),
  homework: (topic) => ({
    title: `Домашнє завдання: ${topic}`,
    summary: `Завдання розраховане на 30–40 хвилин самостійної роботи. Поєднує читання, письмо та творчу частину.`,
    sections: [
      {
        title: "Обов'язкова частина",
        items: [
          "Прочитати параграф у підручнику, виділити три головні тези.",
          `Виконати письмові вправи — 2, 4, 5 на тему «${topic}».`,
          "Підготувати усну відповідь на запитання в кінці параграфа.",
        ],
      },
      {
        title: "Творче завдання (за бажанням)",
        items: [
          "Скласти власне коротке оповідання або міні-схему за темою.",
          "Знайти один приклад з новин або з життя — записати в зошит.",
        ],
      },
    ],
    teacher_tips: [
      "Нагадайте учням, що творча частина не оцінюється негативно.",
      "Передбачте можливість показати роботу на наступному уроці.",
    ],
    short_voice_answer: `Домашнє завдання з теми ${topic}: параграф, дві-три вправи та творча частина за бажанням.`,
  }),
  parents: (topic) => ({
    title: `Повідомлення батькам: ${topic}`,
    summary: `Коротке, тепле та конкретне повідомлення. Без зайвих формальностей, з чіткою інформацією.`,
    sections: [
      {
        title: "Текст повідомлення",
        items: [
          "Доброго дня, шановні батьки!",
          `Хочу поділитися інформацією щодо «${topic}».`,
          "Будь ласка, зверніть увагу на дати та необхідні матеріали — це допоможе дитині бути готовою.",
          "Якщо виникнуть запитання — звертайтеся, я завжди на зв'язку.",
          "З повагою, класний керівник.",
        ],
      },
      {
        title: "Що варто додати",
        items: [
          "Конкретну дату та час події, якщо це актуально.",
          "Список матеріалів, форму одягу або суму внеску — за потреби.",
          "Контакт для зворотного зв'язку.",
        ],
      },
    ],
    teacher_tips: [
      "Краще надсилати повідомлення зранку — батьки уважніше читають.",
      "Уникайте складних слів — пишіть так, як говорите особисто.",
    ],
    short_voice_answer: `Готове повідомлення для батьків на тему ${topic}. Тепле, коротке і конкретне.`,
  }),
};

async function mockAssistant(prompt) {
  const res = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, subject: "Загальний предмет" }),
  });
  
  const data = await res.json();
  if (data.error) {
    throw new Error(data.error);
  }
  
  return data;
}

// ---------- Persistence ----------
const STORAGE_KEY = "methodist_history_v1";

function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveHistory(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, 5)));
}

// ---------- Avatar placeholder ----------
const PHOTO_MAP = {
  idle: "uploads/sit.png",
  listening: "uploads/sit_talk.png",
  thinking: "uploads/important_talk.png",
  speaking: "uploads/important.png",
  faq_generating: "uploads/important_talk.png",
  faq_done: "uploads/sit.png",
};

function AvatarPhoto({ photoKey }) {
  const src = PHOTO_MAP[photoKey] || PHOTO_MAP.idle;
  const [slots, setSlots] = useState({ a: src, b: src, active: "a" });

  useEffect(() => {
    setSlots((s) => {
      if (s[s.active] === src) return s;
      const next = s.active === "a" ? "b" : "a";
      return { ...s, [next]: src, active: next };
    });
  }, [src]);

  const imgStyle = {
    position: "absolute",
    width: "100%",
    height: "100%",
    objectFit: "cover",
    objectPosition: "50% 18%",
    mixBlendMode: "multiply",
    transition: "opacity 350ms ease",
  };

  return (
    <div
      style={{
        width: "100%",
        aspectRatio: "3 / 4",
        position: "relative",
        WebkitMaskImage:
          "linear-gradient(to bottom, black 0%, black 60%, rgba(0,0,0,0.5) 82%, transparent 100%)",
        maskImage:
          "linear-gradient(to bottom, black 0%, black 60%, rgba(0,0,0,0.5) 82%, transparent 100%)",
      }}
    >
      <img src={slots.a} alt="" style={{ ...imgStyle, opacity: slots.active === "a" ? 1 : 0 }} />
      <img src={slots.b} alt="" style={{ ...imgStyle, opacity: slots.active === "b" ? 1 : 0 }} />

      {photoKey === "listening" && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(circle at 50% 35%, rgba(124,92,191,0.18), transparent 60%)",
            animation: "pulse 1.6s ease-in-out infinite",
            pointerEvents: "none",
          }}
        />
      )}
    </div>
  );
}

function AvatarPanel({ status, photoKey, faq }) {
  const statusText = {
    idle: "Готовий допомогти",
    listening: "Слухаю...",
    thinking: "Готую...",
    speaking: "Озвучую...",
    faq_generating: "Відповідаю...",
    faq_done: "Готовий допомогти",
  }[photoKey] || "Готовий допомогти";

  return (
    <aside
      style={{
        width: 340,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        paddingTop: 48,
      }}
    >
      <AvatarPhoto photoKey={photoKey} />
      <div style={{ paddingLeft: 8, paddingRight: 8, marginTop: -8 }}>
        <div
          style={{
            fontFamily: "'Lora', Georgia, serif",
            fontSize: 20,
            fontWeight: 500,
            color: "#2a1f4a",
            lineHeight: 1.25,
          }}
        >
          Помічник Вчителя
        </div>
        <div
          style={{
            marginTop: 14,
            fontSize: 16,
            color: "#5d4d80",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: photoKey === "idle" || photoKey === "faq_done" ? "#4a9d6f" : ACCENT,
              animation: photoKey !== "idle" && photoKey !== "faq_done" ? "blink 1.2s ease-in-out infinite" : "none",
            }}
          />
          {statusText}
        </div>
      </div>
      {faq}
    </aside>
  );
}

// ---------- User bubble ----------
function UserBubble({ text }) {
  return (
    <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 24 }}>
      <div style={{
        background: ACCENT,
        color: "#fff",
        borderRadius: "18px 18px 4px 18px",
        padding: "14px 20px",
        maxWidth: 520,
        fontSize: 16,
        lineHeight: 1.55,
        fontFamily: "inherit",
      }}>
        {text}
      </div>
    </div>
  );
}

// ---------- Document renderer ----------
function EmptyState() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "flex-start",
        minHeight: 280,
        paddingTop: 56,
      }}
    >
      <SpeechBubble large>
        <div
          style={{
            fontFamily: "'Lora', Georgia, serif",
            fontSize: 44,
            fontWeight: 400,
            color: "#2a1f4a",
            lineHeight: 1.2,
            letterSpacing: -0.3,
            maxWidth: 560,
          }}
        >
          Вітаю!<br />З чим можу допомогти?
        </div>
      </SpeechBubble>
    </div>
  );
}

function ThinkingState() {
  return (
    <div style={{ paddingTop: 80, fontSize: 22, color: "#5d4d80", display: "flex", gap: 6, alignItems: "center" }}>
      <span>Готую матеріал</span>
      <span className="dots" style={{ display: "inline-flex", gap: 3 }}>
        <span style={{ animation: "dot 1.2s infinite", animationDelay: "0s" }}>·</span>
        <span style={{ animation: "dot 1.2s infinite", animationDelay: "0.2s" }}>·</span>
        <span style={{ animation: "dot 1.2s infinite", animationDelay: "0.4s" }}>·</span>
      </span>
    </div>
  );
}

function DocumentView({ doc }) {
  return (
    <article style={{ paddingTop: 24, paddingBottom: 40, maxWidth: 760 }}>
      <h1
        style={{
          fontFamily: "'Lora', Georgia, serif",
          fontSize: 42,
          fontWeight: 500,
          color: "#1f1638",
          lineHeight: 1.2,
          margin: 0,
          marginBottom: 18,
        }}
      >
        {doc.title}
      </h1>
      <p
        style={{
          fontSize: 19,
          lineHeight: 1.6,
          color: "#3d3458",
          margin: 0,
          marginBottom: 36,
          maxWidth: 660,
        }}
      >
        {doc.summary}
      </p>

      {doc.sections.map((s, i) => (
        <section key={i} style={{ marginBottom: 32 }}>
          <h2
            style={{
              fontFamily: "'Lora', Georgia, serif",
              fontSize: 24,
              fontWeight: 500,
              color: "#1f1638",
              margin: 0,
              marginBottom: 12,
            }}
          >
            {s.title}
          </h2>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {s.items.map((item, j) => (
              <li
                key={j}
                style={{
                  position: "relative",
                  paddingLeft: 22,
                  marginBottom: 10,
                  fontSize: 17,
                  lineHeight: 1.6,
                  color: "#2d2548",
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 12,
                    width: 8,
                    height: 1,
                    background: ACCENT,
                  }}
                />
                {item}
              </li>
            ))}
          </ul>
        </section>
      ))}

      {doc.teacher_tips && doc.teacher_tips.length > 0 && (
        <section style={{ marginTop: 40, marginBottom: 8 }}>
          <h2
            style={{
              fontFamily: "'Lora', Georgia, serif",
              fontSize: 24,
              fontWeight: 500,
              color: "#1f1638",
              margin: 0,
              marginBottom: 12,
              fontStyle: "italic",
            }}
          >
            Поради для вчителя
          </h2>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {doc.teacher_tips.map((t, i) => (
              <li
                key={i}
                style={{
                  paddingLeft: 22,
                  position: "relative",
                  marginBottom: 10,
                  fontSize: 17,
                  lineHeight: 1.6,
                  color: "#3d3458",
                  fontStyle: "italic",
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 12,
                    width: 8,
                    height: 1,
                    background: ACCENT,
                    opacity: 0.5,
                  }}
                />
                {t}
              </li>
            ))}
          </ul>
        </section>
      )}

    </article>
  );
}

function TextButton({ onClick, children, primary, disabled }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      disabled={disabled}
      style={{
        background: "transparent",
        border: "none",
        padding: 0,
        cursor: disabled ? "default" : "pointer",
        fontSize: 16,
        fontFamily: "inherit",
        color: primary ? ACCENT : "#3d3458",
        fontWeight: primary ? 500 : 400,
        opacity: disabled ? 0.4 : hover ? 1 : 0.8,
        textDecoration: hover && !disabled ? "underline" : "none",
        textUnderlineOffset: 4,
        textDecorationColor: primary ? ACCENT : "#9c8eb8",
        textDecorationThickness: "1px",
        transition: "opacity 120ms ease",
      }}
    >
      {children}
    </button>
  );
}

function PrimaryButton({ onClick, children, disabled }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      disabled={disabled}
      style={{
        background: disabled ? "#c9bce0" : hover ? "#6a4ba8" : ACCENT,
        color: "#ffffff",
        border: "none",
        borderRadius: 14,
        padding: "16px 36px",
        cursor: disabled ? "default" : "pointer",
        fontSize: 17,
        fontFamily: "inherit",
        fontWeight: 600,
        letterSpacing: 0.2,
        transition: "background 140ms ease",
      }}
    >
      {children}
    </button>
  );
}

// ---------- Bottom bar ----------
function Composer({ value, onChange, onSubmit, onMic, onSpeakLast, status, hasResult, locked }) {
  const taRef = useRef(null);

  useEffect(() => {
    if (taRef.current) {
      taRef.current.style.height = "auto";
      taRef.current.style.height = Math.min(taRef.current.scrollHeight, 200) + "px";
    }
  }, [value]);

  const canSubmit = value.trim().length > 0 && status !== "thinking" && !locked;

  return (
    <div style={{ paddingTop: 28, paddingBottom: 24 }}>
      {/* White input card with clear border — the focal point */}
      <div
        style={{
          background: "#ffffff",
          border: "2px solid #d4c8e8",
          borderRadius: 16,
          padding: "22px 24px 20px 24px",
          display: "flex",
          gap: 24,
          alignItems: "flex-end",
          transition: "border-color 160ms ease",
        }}
        onFocus={(e) => (e.currentTarget.style.borderColor = ACCENT)}
        onBlur={(e) => (e.currentTarget.style.borderColor = "#d4c8e8")}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <textarea
            ref={taRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (canSubmit) onSubmit();
              }
            }}
            placeholder="Напишіть, що потрібно підготувати..."
            rows={2}
            style={{
              width: "100%",
              background: "transparent",
              border: "none",
              outline: "none",
              resize: "none",
              fontSize: 19,
              fontFamily: "inherit",
              color: "#1f1638",
              lineHeight: 1.55,
              padding: 0,
              minHeight: 64,
            }}
          />

          <div style={{ display: "flex", gap: 24, alignItems: "center", marginTop: 18, flexWrap: "wrap" }}>
            <PrimaryButton onClick={onSubmit} disabled={!canSubmit}>
              {status === "thinking" ? "Готую..." : "Створити"}
            </PrimaryButton>
            <TextButton onClick={onSpeakLast} disabled={!hasResult || status === "thinking"}>
              {status === "speaking" ? "Озвучую..." : "Озвучити"}
            </TextButton>
          </div>
        </div>

        {/* Prominent voice button with caption */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, paddingBottom: 4 }}>
          <MicButton onClick={onMic} status={status} />
          <span style={{ fontSize: 14, color: "#5d4d80", fontWeight: 500 }}>
            {status === "listening" ? "Слухаю..." : "Говорити"}
          </span>
        </div>
      </div>
    </div>
  );
}

function MicButton({ onClick, status }) {
  const [hover, setHover] = useState(false);
  const listening = status === "listening";
  const disabled = status === "thinking";
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      disabled={disabled}
      aria-label="Сказати голосом"
      title="Сказати голосом"
      style={{
        flexShrink: 0,
        width: 64,
        height: 64,
        borderRadius: "50%",
        border: "none",
        background: listening ? "#5d3fa0" : ACCENT,
        color: "#ffffff",
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.4 : 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        transition: "background 160ms ease, transform 160ms ease",
        transform: hover && !disabled ? "scale(1.04)" : "scale(1)",
      }}
    >
      {listening && (
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: -6,
            borderRadius: "50%",
            border: "2px solid " + ACCENT,
            opacity: 0.4,
            animation: "ring 1.6s ease-out infinite",
          }}
        />
      )}
      {/* Mic glyph */}
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="9" y="3" width="6" height="12" rx="3" />
        <path d="M5 11a7 7 0 0 0 14 0" />
        <line x1="12" y1="18" x2="12" y2="22" />
      </svg>
    </button>
  );
}

function Chip({ onClick, children }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: hover ? ACCENT : "#ffffff",
        border: "1.5px solid " + (hover ? ACCENT : "#c9bce0"),
        borderRadius: 999,
        padding: "10px 18px",
        cursor: "pointer",
        fontSize: 16,
        fontFamily: "inherit",
        color: hover ? "#ffffff" : "#3d3458",
        fontWeight: 500,
        transition: "all 140ms ease",
      }}
    >
      {children}
    </button>
  );
}

// ---------- Example dropdown ----------
const EXAMPLES = [
  {
    q: "Чому цей помічник кращий за ChatGPT?",
    a: "Помічник створений саме для українських учителів. Він знає програму, говорить українською без помилок, орієнтується у методиці й типології уроків. На відміну від загальних чатів, він не вигадує фактів про програму та не плутає предмети. Дані не використовуються для тренування моделей — ваші плани й звернення лишаються вашими. І найголовніше: він допомагає, а не підмінює — остаточне слово завжди за вчителем.",
  },
  {
    q: "Чи безпечно ділитись даними учнів з помічником?",
    a: "Ні, не варто вказувати прізвища, адреси, телефони, оцінки чи будь-яку особисту інформацію учнів. Помічник створює загальні методичні матеріали — для них персональні дані не потрібні. Якщо хочете описати ситуацію в класі, використовуйте узагальнення: «учень 7 класу», «дитина з труднощами в читанні». Усе спілкування з помічником зашифроване, але правило «менше — краще» працює завжди, коли йдеться про дітей.",
  },
  {
    q: "Як правильно розмовляти з помічником, щоб отримати кращу відповідь?",
    a: "Пишіть як колезі: коротко, по суті, з контекстом. Вкажіть клас («7 клас»), предмет, тему й мету («підготувати тест на 20 хвилин», «пояснити простими словами»). Якщо результат не підходить — натисніть «Зробити коротше» або напишіть, що саме змінити: «додай більше прикладів», «спрости мову», «прибери теорію». Можна вести діалог уточненнями — помічник не ображається на правки.",
  },
];

function ExampleDropdown({ onPick, activeQ }) {
  const [showMore, setShowMore] = useState(false);
  const VISIBLE = 2;
  const visible = EXAMPLES.slice(0, VISIBLE);
  const hidden = EXAMPLES.slice(VISIBLE);

  const pick = (ex) => {
    onPick && onPick(ex);
  };

  const QuestionButton = ({ ex, isLast }) => {
    const [hover, setHover] = useState(false);
    return (
      <button
        onClick={() => pick(ex)}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          width: "100%",
          background: ex.q === activeQ ? "#f5f0fa" : hover ? "#faf8ff" : "transparent",
          border: "none",
          borderBottom: !isLast ? "1px solid #ede8f5" : "none",
          padding: "12px 16px",
          cursor: "pointer",
          fontFamily: "inherit",
          textAlign: "left",
          fontSize: 14,
          color: ex.q === activeQ ? ACCENT : "#2d2548",
          lineHeight: 1.4,
          transition: "background 120ms ease, color 120ms ease",
        }}
      >
        {ex.q}
      </button>
    );
  };

  return (
    <div style={{ marginTop: 36, paddingTop: 24, borderTop: "1px solid #d4c8e8" }}>
      <div
        style={{
          fontSize: 15,
          color: "#5d4d80",
          fontWeight: 500,
          marginBottom: 12,
        }}
      >
        Рекомендовані питання
      </div>

      <div
        style={{
          background: "#ffffff",
          border: "1px solid #d4c8e8",
          borderRadius: 14,
          overflow: "hidden",
          marginBottom: 8,
        }}
      >
        {visible.map((ex, i) => (
          <QuestionButton key={i} ex={ex} isLast={i === visible.length - 1 && !showMore && hidden.length === 0} />
        ))}
        {showMore && hidden.map((ex, i) => (
          <QuestionButton key={VISIBLE + i} ex={ex} isLast={i === hidden.length - 1} />
        ))}
      </div>

      {hidden.length > 0 && (
        <button
          onClick={() => setShowMore(!showMore)}
          style={{
            background: "transparent",
            border: "none",
            padding: "4px 0",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontFamily: "inherit",
            fontSize: 13,
            color: "#9c8eb8",
            fontWeight: 500,
          }}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 20 20"
            fill="none"
            stroke="#9c8eb8"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              transform: showMore ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 200ms ease",
            }}
            aria-hidden="true"
          >
            <polyline points="5 8 10 13 15 8" />
          </svg>
          {showMore ? "Сховати" : `Ще ${hidden.length}`}
        </button>
      )}
    </div>
  );
}

function SpeechBubble({ children, large }) {
  const radius = large ? 28 : 24;
  const padding = large ? "28px 32px" : "22px 26px";
  return (
    <div
      style={{
        position: "relative",
        background: "#ffffff",
        borderRadius: radius,
        padding,
        marginLeft: 28,
        animation: "bubbleIn 280ms cubic-bezier(0.2, 0.7, 0.3, 1) both",
      }}
    >
      {/* Tail — small circles (avatar's whisper) */}
      <span
        aria-hidden="true"
        style={{
          position: "absolute",
          left: -22,
          top: 18,
          width: 14,
          height: 14,
          borderRadius: "50%",
          background: "#ffffff",
        }}
      />
      <span
        aria-hidden="true"
        style={{
          position: "absolute",
          left: -36,
          top: 8,
          width: 7,
          height: 7,
          borderRadius: "50%",
          background: "#ffffff",
        }}
      />
      {children}
    </div>
  );
}

// ---------- FAQ answer in main area with typewriter ----------
function FaqAnswerBubble({ item, displayedText, generating }) {
  return (
    <div style={{ paddingTop: 56 }}>
      <SpeechBubble large>
        <div
          style={{
            fontFamily: "'Lora', Georgia, serif",
            fontSize: 18,
            fontWeight: 600,
            color: "#2a1f4a",
            marginBottom: 16,
            lineHeight: 1.35,
            maxWidth: 580,
          }}
        >
          {item.q}
        </div>
        <div
          style={{
            fontSize: 17,
            lineHeight: 1.7,
            color: "#3d3458",
            maxWidth: 580,
          }}
        >
          {displayedText}
          {generating && (
            <span
              style={{
                display: "inline-block",
                width: 2,
                height: "1.1em",
                background: ACCENT,
                marginLeft: 2,
                verticalAlign: "text-bottom",
                animation: "blink 0.7s ease-in-out infinite",
              }}
            />
          )}
        </div>
      </SpeechBubble>
    </div>
  );
}

// ---------- Shared typewriter hook ----------
function useTypewriter(onRunningChange) {
  const [text, setText] = useState("");
  const [running, setRunning] = useState(false);
  const timerRef = useRef(null);

  const setRunningState = (val) => {
    setRunning(val);
    onRunningChange && onRunningChange(val);
  };

  const start = (fullText, speed = 6) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setText("");
    setRunningState(true);
    let i = 0;
    timerRef.current = setInterval(() => {
      i++;
      setText(fullText.slice(0, i));
      if (i >= fullText.length) {
        clearInterval(timerRef.current);
        setRunningState(false);
      }
    }, speed);
  };

  const stop = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setText("");
    setRunningState(false);
  };

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  return { text, running, start, stop };
}

const CURSOR = (
  <span style={{
    display: "inline-block", width: 2, height: "1.1em",
    background: ACCENT, marginLeft: 2, verticalAlign: "text-bottom",
    animation: "blink 0.7s ease-in-out infinite",
  }} />
);

// ---------- Onboarding ----------
const ONBOARDING_KEY = "teacher_onboarded_v1";

const ONBOARDING_FLOW = {
  start_node: "step_1_initial",
  nodes: {
    step_1_initial: {
      message: "Вітаю Вас, шановний колего! Я — Ваш цифровий помічник Олександр Авраменко. Разом ми зробимо Ваші уроки ще цікавішими, а підготовку до них — легшою. Скажіть, будь ласка, чи мали Ви вже досвід спілкування з подібними програмами раніше?",
      options: [
        { text: "Так, маю досвід", next_step: "end_experienced" },
        { text: "Ні, це мій перший раз", next_step: "step_2_intro" },
      ],
    },
    step_2_intro: {
      message: "Не хвилюйтеся, це дуже просто і цілком безпечно! Уявіть, що я — Ваш молодий асистент. Я не просто шукаю інформацію в інтернеті, я допомагаю її створювати, щоб зекономити Ваш час. З чого б Ви хотіли почати наше знайомство?",
      options: [
        { text: "Давайте спробуємо щось створити", next_step: "step_3_action_path" },
        { text: "Розкажіть детальніше, що Ви вмієте", next_step: "step_3_explanation_path" },
      ],
    },
    step_3_action_path: {
      message: "Чудовий, дієвий настрій! Найкраще вчитися на практиці. Я можу допомогти Вам з планом уроку, придумати тест або цікаве завдання. Щоб я міг показати приклад, скажіть, який предмет Ви викладаєте?",
      options: [
        { text: "Українська мова та література", next_step: "step_4_language" },
        { text: "Математика або природничі науки", next_step: "step_4_science" },
        { text: "Інший предмет / Початкові класи", next_step: "step_4_general" },
      ],
    },
    step_3_explanation_path: {
      message: "З радістю розповім! Я вмію писати зрозумілі тексти для учнів, складати контрольні роботи, переробляти складні правила на прості та навіть створювати сценарії для шкільних свят. Усе це — за кілька секунд. Давайте перевіримо? Який предмет Ви викладаєте?",
      options: [
        { text: "Українська мова та література", next_step: "step_4_language" },
        { text: "Математика або природничі науки", next_step: "step_4_science" },
        { text: "Інший предмет / Початкові класи", next_step: "step_4_general" },
      ],
    },
    step_4_language: {
      message: "О, це мені дуже близьке! Дбаймо про чистоту нашої мови разом. Натисніть кнопку нижче, і я покажу, як я можу миттєво підготувати для Вас текст диктанту про весну з трьома запитаннями для учнів.",
      options: [{ text: "Підготувати диктант", next_step: "step_5_completion" }],
    },
    step_4_science: {
      message: "Чудово! Точні науки потребують уважності. Натисніть кнопку нижче, і я згенерую для Вас три цікаві логічні задачі, які розворушать учнів на початку уроку. Їх можна буде одразу зберегти як документ.",
      options: [{ text: "Створити цікаві задачі", next_step: "step_5_completion" }],
    },
    step_4_general: {
      message: "Прекрасно! Для будь-якого предмета можна знайти цікавинку. Натисніть кнопку нижче, і я створю для Вас універсальну ідею для короткої розминки на початку уроку, щоб швидко залучити дітей до роботи.",
      options: [{ text: "Створити розминку", next_step: "step_5_completion" }],
    },
    step_5_completion: {
      message: "Ось Ваш матеріал! Ви можете зберегти його як звичайний документ і одразу використовувати. Бачите, як усе просто? Наше невеличке навчання завершено. Відтепер просто пишіть Ваші побажання у цей чат, ніби пишете повідомлення мені. Чим я можу допомогти Вам сьогодні?",
      options: [],
      action: "unlock_text_input",
    },
    end_experienced: {
      message: "Радий вітати досвідченого користувача! Тоді не будемо гаяти часу. Напишіть мені Ваше завдання у чат, і я одразу допоможу підготувати матеріал до уроку.",
      options: [],
      action: "unlock_text_input",
    },
  },
};

function OnboardingView({ onComplete, onTypingChange }) {
  const [nodeKey, setNodeKey] = useState(ONBOARDING_FLOW.start_node);
  const { text, running, start } = useTypewriter(onTypingChange);

  useEffect(() => {
    start(ONBOARDING_FLOW.nodes[nodeKey].message, 6);
  }, [nodeKey]);

  const node = ONBOARDING_FLOW.nodes[nodeKey];

  return (
    <div style={{ paddingTop: 56 }}>
      <SpeechBubble large>
        <div style={{ fontSize: 17, lineHeight: 1.7, color: "#3d3458", maxWidth: 580 }}>
          {text}{running && CURSOR}
        </div>
        {!running && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 20 }}>
            {node.options.map((opt, i) => (
              <Chip key={i} onClick={() => setNodeKey(opt.next_step)}>{opt.text}</Chip>
            ))}
            {node.options.length === 0 && <Chip onClick={onComplete}>Розпочати роботу →</Chip>}
          </div>
        )}
      </SpeechBubble>
    </div>
  );
}

// ---------- History sidebar (clear list with doc icon + date) ----------
function formatDate(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  const today = new Date();
  const sameDay = d.toDateString() === today.toDateString();
  if (sameDay) {
    return "Сьогодні, " + d.toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString("uk-UA", { day: "numeric", month: "long" });
}

function DocIcon() {
  return (
    <svg width="20" height="22" viewBox="0 0 20 22" fill="none" stroke="#7c5cbf" strokeWidth="1.5" aria-hidden="true">
      <path d="M3 1.5h9l5 5v14H3z" />
      <path d="M12 1.5v5h5" />
      <line x1="6" y1="11" x2="14" y2="11" />
      <line x1="6" y1="15" x2="14" y2="15" />
    </svg>
  );
}

function HistoryStrip({ items, onPick }) {
  if (!items.length) return null;
  return (
    <div style={{ marginTop: 48, paddingTop: 32, borderTop: "1px solid #d4c8e8" }}>
      <div style={{ fontSize: 16, color: "#3d3458", marginBottom: 16, fontWeight: 500 }}>
        Нещодавні матеріали
      </div>
      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 4 }}>
        {items.map((it, i) => (
          <li key={i}>
            <button
              onClick={() => onPick(it)}
              style={{
                background: "transparent",
                border: "none",
                padding: "12px 0",
                cursor: "pointer",
                fontFamily: "inherit",
                textAlign: "left",
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 14,
                color: "#2d2548",
                transition: "color 120ms",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = ACCENT)}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#2d2548")}
            >
              <DocIcon />
              <span style={{ fontSize: 16, flex: 1, lineHeight: 1.4 }}>{it.title}</span>
              <span style={{ fontSize: 14, color: "#9c8eb8", fontWeight: 400 }}>{formatDate(it._ts)}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---------- Main App ----------
function App() {
  useEffect(() => {
    Object.values(PHOTO_MAP).forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  const [onboardingNodeKey, setOnboardingNodeKey] = useState(ONBOARDING_FLOW.start_node);

  const completeOnboarding = () => setOnboardingNodeKey(null);

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [status, setStatus] = useState("idle");
  const [history, setHistory] = useState(loadHistory);
  const [justCopied, setJustCopied] = useState(false);
  const [toast, setToast] = useState(null);
  const recognitionRef = useRef(null);
  const messagesEndRef = useRef(null);
  const faqTypewriter = useTypewriter();
  const docTypewriter = useTypewriter();

  const lastMsg = messages[messages.length - 1];
  const lastDoc = lastMsg?.doc ?? null;

  useEffect(() => {
    const firstNode = ONBOARDING_FLOW.nodes[ONBOARDING_FLOW.start_node];
    setMessages([{ id: Date.now(), role: "assistant", text: firstNode.message }]);
    docTypewriter.start(firstNode.message, 6);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, status]);

  const photoKey = useMemo(() => {
    if (status === "thinking") return "thinking";
    if (status === "listening") return "listening";
    if (status === "speaking") return "speaking";
    if (docTypewriter.running || faqTypewriter.running) return "faq_generating";
    if (messages.length > 0) return "faq_done";
    return "idle";
  }, [status, docTypewriter.running, faqTypewriter.running, messages.length]);

  const handleOnboardingOption = (option) => {
    const nextKey = option.next_step;
    const nextNode = ONBOARDING_FLOW.nodes[nextKey];
    setMessages(msgs => [
      ...msgs,
      { id: Date.now(), role: "user", text: option.text },
      { id: Date.now() + 1, role: "assistant", text: nextNode.message },
    ]);
    setOnboardingNodeKey(nextKey);
    docTypewriter.start(nextNode.message, 6);
  };

  const handleFaqPick = (item) => {
    docTypewriter.stop();
    setMessages(msgs => [...msgs, { id: Date.now(), role: "assistant", faqItem: item }]);
    faqTypewriter.start(item.a, 12);
  };

  const handleSubmit = async () => {
    const prompt = input.trim();
    if (!prompt) return;
    faqTypewriter.stop();
    docTypewriter.stop();
    setMessages(msgs => [...msgs, { id: Date.now(), role: "user", text: prompt }]);
    setInput("");
    setStatus("thinking");
    try {
      const result = await mockAssistant(prompt);
      setMessages(msgs => [...msgs, { id: Date.now() + 1, role: "assistant", doc: result }]);
      docTypewriter.start(result.short_voice_answer, 6);
      const next = [{ ...result, _prompt: prompt, _ts: Date.now() }, ...history].slice(0, 5);
      setHistory(next);
      saveHistory(next);
    } finally {
      setStatus("idle");
    }
  };

  const handleMic = () => {
    // TODO: Replace with production STT
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setToast("Голосове введення недоступне. Можна написати вручну.");
      setTimeout(() => setToast(null), 3500);
      return;
    }
    if (status === "listening") {
      recognitionRef.current?.stop();
      return;
    }
    const rec = new SR();
    rec.lang = "uk-UA";
    rec.interimResults = true;
    rec.continuous = false;
    let finalText = "";
    rec.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) finalText += e.results[i][0].transcript;
        else interim += e.results[i][0].transcript;
      }
      setInput((finalText + interim).trimStart());
    };
    rec.onerror = () => {
      setStatus("idle");
      setToast("Не вдалося розпізнати мову. Спробуйте ще раз.");
      setTimeout(() => setToast(null), 3000);
    };
    rec.onend = () => setStatus("idle");
    rec.onstart = () => setStatus("listening");
    recognitionRef.current = rec;
    rec.start();
  };

  const handleSpeak = () => {
    if (!lastDoc?.short_voice_answer) return;
    if (!("speechSynthesis" in window)) {
      setToast("Озвучення недоступне у цьому браузері.");
      setTimeout(() => setToast(null), 3000);
      return;
    }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(lastDoc.short_voice_answer);
    u.lang = "uk-UA";
    u.rate = 1.0;
    u.onstart = () => setStatus("speaking");
    u.onend = () => setStatus("idle");
    u.onerror = () => setStatus("idle");
    window.speechSynthesis.speak(u);
  };

  const handleCopy = async () => {
    if (!lastDoc) return;
    const doc = lastDoc;
    const text = [
      doc.title,
      "",
      doc.summary,
      "",
      ...doc.sections.flatMap((s) => [s.title, ...s.items.map((i) => "— " + i), ""]),
      doc.teacher_tips?.length ? "Поради для вчителя" : "",
      ...(doc.teacher_tips || []).map((t) => "— " + t),
    ].join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setJustCopied(true);
      setTimeout(() => setJustCopied(false), 1800);
    } catch {
      setToast("Не вдалося скопіювати.");
      setTimeout(() => setToast(null), 2000);
    }
  };

  const handleShorter = async () => {
    if (!lastDoc) return;
    setStatus("thinking");
    await new Promise((r) => setTimeout(r, 700));
    const shorter = {
      ...lastDoc,
      sections: lastDoc.sections.map((s) => ({
        ...s,
        items: s.items.slice(0, Math.max(2, Math.ceil(s.items.length / 2))),
      })),
      teacher_tips: lastDoc.teacher_tips?.slice(0, 1) || [],
    };
    setMessages(msgs => msgs.map((m, i) =>
      i === msgs.length - 1 && m.doc ? { ...m, doc: shorter } : m
    ));
    setStatus("idle");
  };

  return (
    <div
      style={{
        height: "100vh",
        background: BG,
        color: "#1f1638",
        fontFamily: "'Inter', system-ui, sans-serif",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <main
        style={{
          flex: 1,
          display: "flex",
          gap: 96,
          maxWidth: 1320,
          width: "100%",
          margin: "0 auto",
          padding: "0 56px",
          minHeight: 0,
        }}
        className="layout"
      >
        <AvatarPanel
          status={status}
          photoKey={photoKey}
          faq={!onboardingNodeKey && status !== "thinking" ? (
            <ExampleDropdown onPick={handleFaqPick} activeQ={lastMsg?.faqItem?.q} />
          ) : null}
        />

        <section
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            paddingTop: 56,
            minWidth: 0,
            minHeight: 0,
          }}
        >
          <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", minHeight: 0 }}>
            {messages.map((msg, i) => {
              const isLast = i === messages.length - 1;
              if (msg.role === "user") return <UserBubble key={msg.id} text={msg.text} />;

              const isTyping = isLast && (msg.doc ? docTypewriter.running : msg.text ? docTypewriter.running : faqTypewriter.running);
              const typedText = isLast ? (msg.faqItem ? faqTypewriter.text : docTypewriter.text) : null;

              const currentNode = onboardingNodeKey ? ONBOARDING_FLOW.nodes[onboardingNodeKey] : null;

              return (
                <div key={msg.id} style={{ marginBottom: 24 }}>
                  <SpeechBubble large>
                    {isTyping ? (
                      <div style={{ fontSize: 17, lineHeight: 1.7, color: "#3d3458", maxWidth: 580 }}>
                        {typedText}{CURSOR}
                      </div>
                    ) : msg.doc ? (
                      <DocumentView doc={msg.doc} />
                    ) : msg.faqItem ? (
                      <div>
                        <div style={{ fontFamily: "'Lora', Georgia, serif", fontSize: 18, fontWeight: 600, color: "#2a1f4a", marginBottom: 16, lineHeight: 1.35, maxWidth: 580 }}>
                          {msg.faqItem.q}
                        </div>
                        <div style={{ fontSize: 17, lineHeight: 1.7, color: "#3d3458", maxWidth: 580 }}>
                          {msg.faqItem.a}
                        </div>
                      </div>
                    ) : (
                      <div style={{ fontSize: 17, lineHeight: 1.7, color: "#3d3458", maxWidth: 580 }}>
                        {msg.text}
                      </div>
                    )}
                  </SpeechBubble>

                  {isLast && !isTyping && msg.doc && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 24, marginTop: 12, paddingLeft: 40 }}>
                      <TextButton onClick={handleCopy}>{justCopied ? "Скопійовано" : "Скопіювати текст"}</TextButton>
                      <TextButton onClick={handleShorter}>Зробити коротше</TextButton>
                      <TextButton onClick={handleSpeak}>Озвучити</TextButton>
                    </div>
                  )}

                  {isLast && !isTyping && onboardingNodeKey && currentNode && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 12, paddingLeft: 40 }}>
                      {currentNode.options.map((opt, j) => (
                        <Chip key={j} onClick={() => handleOnboardingOption(opt)}>{opt.text}</Chip>
                      ))}
                      {currentNode.options.length === 0 && (
                        <Chip onClick={completeOnboarding}>Розпочати роботу →</Chip>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            {status === "thinking" && <ThinkingState />}
            <div ref={messagesEndRef} />
          </div>

          <Composer
            value={input}
            onChange={setInput}
            onSubmit={handleSubmit}
            onMic={handleMic}
            onSpeakLast={handleSpeak}
            status={status}
            hasResult={!!lastDoc}
          />

          <footer
            style={{
              fontSize: 14,
              color: "#7d6ea0",
              fontStyle: "italic",
              paddingTop: 24,
              paddingBottom: 32,
              maxWidth: 760,
            }}
          >
            Асистент допомагає з рутиною, але остаточне рішення завжди за вами.
          </footer>
        </section>
      </main>

      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: 32,
            left: "50%",
            transform: "translateX(-50%)",
            background: "#2a1f4a",
            color: "#ede8f5",
            padding: "10px 18px",
            fontSize: 14,
            borderRadius: 10,
            animation: "fadeIn 200ms ease",
          }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
