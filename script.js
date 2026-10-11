
"use strict";

// ==========================================
// SENTIMENTAI - FRONTEND APPLICATION
// ==========================================

const $ = (id) => document.getElementById(id);

const elements = {
    text: $("textInput"),
    analyze: $("analyzeButton"),
    clearInput: $("clearInput"),
    count: $("characterCount"),
    result: $("resultCard"),
    icon: $("resultIcon"),
    resultText: $("resultText"),
    description: $("resultDescription"),
    score: $("scoreValue"),
    error: $("errorMessage"),
    history: $("historyTable"),
    empty: $("emptyState"),
    search: $("searchInput"),
    filter: $("filterSelect"),
    theme: $("themeToggle"),
    themeIcon: $("themeIcon"),
    themeLabel: $("themeLabel"),
    sidebar: $("sidebar"),
    menu: $("menuToggle")
};

// Word lists are intentionally simple and editable.
// This is rule-based sentiment scoring, not trained ML.
const positiveWords = new Set([
    "good", "great", "amazing", "excellent", "awesome",
    "love", "loved", "lovely", "like", "liked", "happy",
    "wonderful", "fantastic", "best", "beautiful", "perfect",
    "nice", "enjoy", "enjoyed", "brilliant", "interesting",
    "impressive", "helpful", "delightful", "recommend", "superb",
    "enjoyable", "cool", "fun", "favorite", "favourite",
    "outstanding", "incredible", "easy", "smooth", "satisfied",
    "success", "successful", "fast", "friendly", "thankful",
    "thank", "thanks", "excited", "pleasant", "reliable"
]);

const negativeWords = new Set([
    "bad", "terrible", "horrible", "awful", "hate", "hated",
    "boring", "worst", "poor", "sad", "disappointing",
    "disappointed", "ugly", "waste", "annoying", "slow",
    "problem", "problems", "useless", "dislike", "broken",
    "fail", "failed", "failure", "difficult", "confusing",
    "expensive", "rude", "angry", "frustrating", "frustrated",
    "defective", "damage", "damaged", "painful", "weak",
    "unhappy", "unpleasant", "horrible", "mess", "regret",
    "disaster", "disgusting", "unreliable", "late", "dirty",
    "inferior", "annoyed", "dislike", "disliked"
]);

const negators = new Set([
    "not", "no", "never", "neither", "hardly", "barely",
    "isn't", "wasn't", "weren't", "don't", "doesn't",
    "didn't", "can't", "couldn't", "won't", "wouldn't",
    "shouldn't", "cannot", "without"
]);

const intensifiers = new Set([
    "very", "really", "extremely", "absolutely",
    "incredibly", "so", "truly", "highly"
]);

const diminishers = new Set([
    "slightly", "somewhat", "little", "fairly", "rather"
]);

// Load saved data safely.
function loadAnalyses() {
    try {
        const saved = JSON.parse(
            localStorage.getItem("sentimentAnalyses") || "[]"
        );

        if (!Array.isArray(saved)) return [];

        return saved.filter(item =>
            item &&
            typeof item.text === "string" &&
            ["Positive", "Negative", "Neutral"].includes(item.sentiment)
        );
    } catch {
        return [];
    }
}

let analyses = loadAnalyses();

function saveAnalyses() {
    try {
        localStorage.setItem(
            "sentimentAnalyses",
            JSON.stringify(analyses)
        );
        return true;
    } catch {
        alert("Browser storage is unavailable. Your results may not persist after refresh.");
        return false;
    }
}

// ==========================================
// SENTIMENT ANALYSIS
// ==========================================

function analyzeSentiment(text) {
    // Keep contractions together; normalize punctuation.
    const words = text.toLowerCase().match(/[a-z]+(?:'[a-z]+)?/g) || [];

    let score = 0;
    let positiveMatches = 0;
    let negativeMatches = 0;

    for (let i = 0; i < words.length; i++) {
        const word = words[i];

        let value = positiveWords.has(word) ? 1 :
                    negativeWords.has(word) ? -1 : 0;

        if (value === 0) continue;

        // A simple rule for nearby negation, e.g. "not good".
        const previous = words.slice(Math.max(0, i - 3), i);
        const negated = previous.some(w => negators.has(w));

        if (negated) value *= -1;

        // Nearby intensity words affect the score slightly.
        const intensified = previous.some(w => intensifiers.has(w));
        const diminished = previous.some(w => diminishers.has(w));

        if (intensified) value *= 1.5;
        if (diminished) value *= 0.5;

        score += value;

        if (value > 0) positiveMatches++;
        if (value < 0) negativeMatches++;
    }

    let sentiment = "Neutral";

    if (score > 0) sentiment = "Positive";
    if (score < 0) sentiment = "Negative";

    // No matched words means the result is neutral by default.
    // This is not a statistical confidence probability.
    return {
        sentiment,
        score: Math.round(score * 10) / 10,
        positiveMatches,
        negativeMatches
    };
}

// ==========================================
// RESULT DISPLAY
// ==========================================

function displayResult(result) {
    elements.result.classList.remove("hidden");

    const settings = {
        Positive: {
            icon: "😊",
            title: "Positive sentiment",
            description: "The text contains more positive than negative word matches."
        },
        Negative: {
            icon: "☹️",
            title: "Negative sentiment",
            description: "The text contains more negative than positive word matches."
        },
        Neutral: {
            icon: "😐",
            title: "Neutral sentiment",
            description: "No clear positive or negative direction was found by the rules."
        }
    };

    const info = settings[result.sentiment];

    elements.icon.textContent = info.icon;
    elements.resultText.textContent = info.title;
    elements.description.textContent = info.description;

    elements.score.textContent =
        result.score > 0 ? `+${result.score}` : String(result.score);

    elements.score.style.color =
        result.sentiment === "Positive" ? "var(--green)" :
        result.sentiment === "Negative" ? "var(--red)" :
        "var(--text)";
}

// ==========================================
// ANALYZE BUTTON
// ==========================================

function analyzeText() {
    const text = elements.text.value.trim();

    if (!text) {
        elements.error.textContent = "Please enter some text first.";
        elements.error.classList.remove("hidden");
        elements.text.focus();
        return;
    }

    elements.error.classList.add("hidden");

    const result = analyzeSentiment(text);

    displayResult(result);

    const record = {
        id: Date.now() + "-" + Math.random().toString(36).slice(2, 8),
        text,
        sentiment: result.sentiment,
        score: result.score,
        time: new Date().toISOString()
    };

    analyses.unshift(record);

    // Keep browser storage manageable.
    analyses = analyses.slice(0, 500);

    saveAnalyses();
    updateDashboard();

    // Give visual feedback without a disruptive popup.
    elements.analyze.innerHTML = "Analyzed ✓";
    setTimeout(() => {
        elements.analyze.innerHTML = 'Analyze sentiment <span>→</span>';
    }, 900);
}

elements.analyze.addEventListener("click", analyzeText);

elements.text.addEventListener("keydown", event => {
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
        analyzeText();
    }
});

// Character counter.
elements.text.addEventListener("input", () => {
    elements.count.textContent =
        `${elements.text.value.length} / 5000 characters`;
    elements.error.classList.add("hidden");
});

// Clear input.
elements.clearInput.addEventListener("click", () => {
    elements.text.value = "";
    elements.count.textContent = "0 / 5000 characters";
    elements.error.classList.add("hidden");
    elements.text.focus();
});

// Sample text buttons.
document.querySelectorAll("[data-sample]").forEach(button => {
    button.addEventListener("click", () => {
        elements.text.value = button.dataset.sample;
        elements.count.textContent =
            `${elements.text.value.length} / 5000 characters`;
        elements.error.classList.add("hidden");
        elements.text.focus();
    });
});

// ==========================================
// DASHBOARD STATISTICS AND CHARTS
// ==========================================

function updateDashboard() {
    const counts = {
        Positive: 0,
        Negative: 0,
        Neutral: 0
    };

    analyses.forEach(item => {
        counts[item.sentiment]++;
    });

    const total = analyses.length;

    $("totalCount").textContent = total;
    $("positiveCount").textContent = counts.Positive;
    $("negativeCount").textContent = counts.Negative;
    $("neutralCount").textContent = counts.Neutral;
    $("chartTotal").textContent = total;

    const percentage = value =>
        total ? Math.round(value / total * 100) : 0;

    $("positivePercentage").textContent = percentage(counts.Positive) + "%";
    $("negativePercentage").textContent = percentage(counts.Negative) + "%";
    $("neutralPercentage").textContent = percentage(counts.Neutral) + "%";

    const positiveShare = total ? counts.Positive / total * 100 : 0;
    const negativeEnd = total
        ? (counts.Positive + counts.Negative) / total * 100
        : 0;

    const donut = $("donutChart");

    donut.style.setProperty("--positive-share", `${positiveShare}%`);
    donut.style.setProperty("--negative-end", `${negativeEnd}%`);
    donut.setAttribute(
        "aria-label",
        `Positive ${counts.Positive}, negative ${counts.Negative}, neutral ${counts.Neutral}`
    );

    const maxCount = Math.max(
        counts.Positive,
        counts.Negative,
        counts.Neutral,
        1
    );

    [
        ["Positive", counts.Positive, "positiveBar", "positiveBarValue"],
        ["Negative", counts.Negative, "negativeBar", "negativeBarValue"],
        ["Neutral", counts.Neutral, "neutralBar", "neutralBarValue"]
    ].forEach(([, value, barId, valueId]) => {
        $(valueId).textContent = value;
        $(barId).style.width = `${value / maxCount * 100}%`;
    });

    renderHistory();
}

// ==========================================
// HISTORY TABLE
// ==========================================

function formatDate(isoDate) {
    const date = new Date(isoDate);

    if (Number.isNaN(date.getTime())) return "Unknown date";

    return date.toLocaleString([], {
        dateStyle: "medium",
        timeStyle: "short"
    });
}

function shortenText(text, maxLength = 85) {
    return text.length > maxLength
        ? text.slice(0, maxLength) + "…"
        : text;
}

function renderHistory() {
    const query = elements.search.value.trim().toLowerCase();
    const filter = elements.filter.value;

    const filtered = analyses.filter(item => {
        const matchesText = item.text.toLowerCase().includes(query);
        const matchesSentiment = filter === "All" || item.sentiment === filter;
        return matchesText && matchesSentiment;
    });

    elements.history.replaceChildren();

    filtered.slice(0, 100).forEach(item => {
        const row = document.createElement("tr");

        const textCell = document.createElement("td");
        textCell.textContent = shortenText(item.text);
        textCell.title = item.text;

        const sentimentCell = document.createElement("td");
        const badge = document.createElement("span");
        badge.className = `sentiment-badge badge-${item.sentiment.toLowerCase()}`;

        const icon = {
            Positive: "😊",
            Negative: "☹️",
            Neutral: "😐"
        }[item.sentiment];

        badge.textContent = `${icon} ${item.sentiment}`;
        sentimentCell.appendChild(badge);

        const scoreCell = document.createElement("td");
        const score = Number(item.score) || 0;
        scoreCell.textContent = score > 0 ? `+${score}` : String(score);

        const dateCell = document.createElement("td");
        dateCell.textContent = formatDate(item.time);

        row.append(textCell, sentimentCell, scoreCell, dateCell);
        elements.history.appendChild(row);
    });

    elements.empty.classList.toggle("hidden", filtered.length !== 0);

    if (filtered.length === 0) {
        const p = elements.empty.querySelector("p");
        const strong = elements.empty.querySelector("strong");

        if (analyses.length > 0) {
            strong.textContent = "No matching results";
            p.textContent = "Try another search or sentiment filter.";
        } else {
            strong.textContent = "No analyses yet";
            p.textContent = "Analyze your first text to see your history here.";
        }
    }
}

elements.search.addEventListener("input", renderHistory);
elements.filter.addEventListener("change", renderHistory);

// ==========================================
// CLEAR HISTORY
// ==========================================

$("clearHistory").addEventListener("click", () => {
    if (!analyses.length) {
        alert("Your history is already empty.");
        return;
    }

    if (!confirm("Delete all saved analyses from this browser?")) return;

    analyses = [];
    saveAnalyses();
    elements.result.classList.add("hidden");
    updateDashboard();
});

// ==========================================
// EXPORT HISTORY TO CSV
// ==========================================

$("exportButton").addEventListener("click", () => {
    if (!analyses.length) {
        alert("Analyze some text before exporting your history.");
        return;
    }

    const quote = value =>
        '"' + String(value ?? "").replace(/"/g, '""') + '"';

    const rows = [
        ["Text", "Sentiment", "Score", "Date"],
        ...analyses.map(item => [
            item.text,
            item.sentiment,
            item.score,
            formatDate(item.time)
        ])
    ];

    const csv = "\uFEFF" + rows
        .map(row => row.map(quote).join(","))
        .join("\r\n");

    const blob = new Blob([csv], {
        type: "text/csv;charset=utf-8;"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "sentiment-analysis-history.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
});

// ==========================================
// DARK MODE
// ==========================================

function setTheme(isDark) {
    document.body.classList.toggle("dark", isDark);
    elements.themeIcon.textContent = isDark ? "☀" : "☾";
    elements.themeLabel.textContent = isDark ? "Light appearance" : "Dark appearance";

    try {
        localStorage.setItem("sentimentTheme", isDark ? "dark" : "light");
    } catch {
        // Theme still works for the current page.
    }
}

try {
    setTheme(localStorage.getItem("sentimentTheme") === "dark");
} catch {
    setTheme(false);
}

elements.theme.addEventListener("click", () => {
    setTheme(!document.body.classList.contains("dark"));
});

// ==========================================
// MOBILE NAVIGATION
// ==========================================

elements.menu.addEventListener("click", () => {
    const isOpen = elements.sidebar.classList.toggle("open");
    elements.menu.setAttribute("aria-expanded", String(isOpen));
});

document.querySelectorAll(".nav-link, .brand, .help-card a").forEach(link => {
    link.addEventListener("click", () => {
        elements.sidebar.classList.remove("open");
        elements.menu.setAttribute("aria-expanded", "false");
    });
});

// Highlight the active navigation link.
document.querySelectorAll(".nav-link").forEach(link => {
    link.addEventListener("click", () => {
        document.querySelectorAll(".nav-link").forEach(item => {
            item.classList.remove("active");
        });

        link.classList.add("active");
    });
});

// Restore the dashboard on page load.
updateDashboard();
