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
  listening: "uploads/sit.png",
  thinking: "uploads/talk.png",
  speaking: "uploads/important.png",
  faq_generating: "uploads/talk.png",
  faq_done: "uploads/important.png",
};

function AvatarPhoto({ photoKey }) {
  const src = PHOTO_MAP[photoKey] || PHOTO_MAP.idle;
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
      <img
        key={src}
        src={src}
        alt=""
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "50% 18%",
          display: "block",
          mixBlendMode: "multiply",
          animation: "bubbleIn 300ms ease both",
        }}
      />

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

function DocumentView({ doc, onCopy, onShorter, onSpeak, justCopied }) {
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

      <div style={{ display: "flex", flexWrap: "wrap", gap: 24, marginTop: 36 }}>
        <TextButton onClick={onCopy}>
          {justCopied ? "Скопійовано" : "Скопіювати текст"}
        </TextButton>
        <TextButton onClick={onShorter}>Зробити коротше</TextButton>
        <TextButton onClick={onSpeak}>Озвучити</TextButton>
      </div>
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
function Composer({ value, onChange, onSubmit, onMic, onSpeakLast, status, hasResult }) {
  const taRef = useRef(null);

  useEffect(() => {
    if (taRef.current) {
      taRef.current.style.height = "auto";
      taRef.current.style.height = Math.min(taRef.current.scrollHeight, 200) + "px";
    }
  }, [value]);

  const canSubmit = value.trim().length > 0 && status !== "thinking";

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
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
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
  const [open, setOpen] = useState(false);

  const pick = (ex) => {
    setOpen(false);
    onPick && onPick(ex);
  };

  return (
    <div style={{ marginTop: 36, paddingTop: 24, borderTop: "1px solid #d4c8e8" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          background: "transparent",
          border: "none",
          padding: 0,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 10,
          fontFamily: "inherit",
          fontSize: 15,
          color: "#5d4d80",
          fontWeight: 500,
          marginBottom: 12,
        }}
      >
        <span>Часті запитання</span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 20 20"
          fill="none"
          stroke={ACCENT}
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 200ms ease",
          }}
          aria-hidden="true"
        >
          <polyline points="5 8 10 13 15 8" />
        </svg>
      </button>

      {open && (
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #d4c8e8",
            borderRadius: 14,
            overflow: "hidden",
            marginBottom: 14,
          }}
        >
          {EXAMPLES.map((ex, i) => (
            <button
              key={i}
              onClick={() => pick(ex)}
              style={{
                width: "100%",
                background: ex.q === activeQ ? "#f5f0fa" : "transparent",
                border: "none",
                borderBottom: i < EXAMPLES.length - 1 ? "1px solid #ede8f5" : "none",
                padding: "12px 16px",
                cursor: "pointer",
                fontFamily: "inherit",
                textAlign: "left",
                fontSize: 14,
                color: "#2d2548",
                lineHeight: 1.4,
                transition: "background 120ms ease",
              }}
            >
              {ex.q}
            </button>
          ))}
        </div>
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
  const [input, setInput] = useState("");
  const [doc, setDoc] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | listening | thinking | speaking
  const [history, setHistory] = useState(loadHistory);
  const [justCopied, setJustCopied] = useState(false);
  const [toast, setToast] = useState(null);
  const [faqItem, setFaqItem] = useState(null);
  const [faqText, setFaqText] = useState("");
  const [faqGenerating, setFaqGenerating] = useState(false);
  const recognitionRef = useRef(null);
  const faqTimerRef = useRef(null);

  const photoKey = useMemo(() => {
    if (status === "thinking") return "thinking";
    if (status === "listening") return "listening";
    if (status === "speaking") return "speaking";
    if (faqGenerating) return "faq_generating";
    if (faqItem) return "faq_done";
    return "idle";
  }, [status, faqGenerating, faqItem]);

  const handleFaqPick = (item) => {
    if (faqTimerRef.current) clearInterval(faqTimerRef.current);
    setFaqItem(item);
    setFaqText("");
    setFaqGenerating(true);
    setDoc(null);

    let i = 0;
    const text = item.a;
    faqTimerRef.current = setInterval(() => {
      i++;
      setFaqText(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(faqTimerRef.current);
        setFaqGenerating(false);
      }
    }, 12);
  };

  const handleSubmit = async () => {
    const prompt = input.trim();
    if (!prompt) return;
    if (faqTimerRef.current) clearInterval(faqTimerRef.current);
    setFaqItem(null);
    setFaqText("");
    setFaqGenerating(false);
    setStatus("thinking");
    setDoc(null);
    try {
      const result = await mockAssistant(prompt);
      setDoc(result);
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
    // TODO: Replace with production TTS
    if (!doc?.short_voice_answer) return;
    if (!("speechSynthesis" in window)) {
      setToast("Озвучення недоступне у цьому браузері.");
      setTimeout(() => setToast(null), 3000);
      return;
    }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(doc.short_voice_answer);
    u.lang = "uk-UA";
    u.rate = 1.0;
    u.onstart = () => setStatus("speaking");
    u.onend = () => setStatus("idle");
    u.onerror = () => setStatus("idle");
    window.speechSynthesis.speak(u);
  };

  const handleCopy = async () => {
    if (!doc) return;
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
    if (!doc) return;
    setStatus("thinking");
    await new Promise((r) => setTimeout(r, 700));
    setDoc({
      ...doc,
      summary: doc.summary,
      sections: doc.sections.map((s) => ({
        ...s,
        items: s.items.slice(0, Math.max(2, Math.ceil(s.items.length / 2))),
      })),
      teacher_tips: doc.teacher_tips?.slice(0, 1) || [],
    });
    setStatus("idle");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: BG,
        color: "#1f1638",
        fontFamily: "'Inter', system-ui, sans-serif",
        display: "flex",
        flexDirection: "column",
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
        }}
        className="layout"
      >
        <AvatarPanel
          status={status}
          photoKey={photoKey}
          faq={!doc && status !== "thinking" ? (
            <ExampleDropdown onPick={handleFaqPick} activeQ={faqItem?.q} />
          ) : null}
        />

        <section
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            paddingTop: 56,
            minWidth: 0,
          }}
        >
          <div style={{ flex: 1 }}>
            {status === "thinking" && !doc && <ThinkingState />}
            {!doc && status !== "thinking" && !faqItem && <EmptyState />}
            {!doc && status !== "thinking" && faqItem && (
              <FaqAnswerBubble item={faqItem} displayedText={faqText} generating={faqGenerating} />
            )}
            {doc && (
              <DocumentView
                doc={doc}
                onCopy={handleCopy}
                onShorter={handleShorter}
                onSpeak={handleSpeak}
                justCopied={justCopied}
              />
            )}
          </div>

          <Composer
            value={input}
            onChange={setInput}
            onSubmit={handleSubmit}
            onMic={handleMic}
            onSpeakLast={handleSpeak}
            status={status}
            hasResult={!!doc}
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
