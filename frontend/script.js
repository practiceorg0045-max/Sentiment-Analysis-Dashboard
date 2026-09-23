// ================================
// SENTIMENT ANALYSIS DASHBOARD
// ================================


// -------------------------------
// DOM ELEMENTS
// -------------------------------

const textInput = document.getElementById("textInput");
const analyzeButton = document.getElementById("analyzeButton");
const characterCount = document.getElementById("characterCount");

const resultCard = document.getElementById("resultCard");
const resultIcon = document.getElementById("resultIcon");
const resultText = document.getElementById("resultText");
const resultDescription = document.getElementById("resultDescription");

const confidenceValue = document.getElementById("confidenceValue");
const confidenceProgress = document.getElementById("confidenceProgress");

const totalCount = document.getElementById("totalCount");
const positiveCount = document.getElementById("positiveCount");
const negativeCount = document.getElementById("negativeCount");
const neutralCount = document.getElementById("neutralCount");

const chartTotal = document.getElementById("chartTotal");

const positivePercentage =
    document.getElementById("positivePercentage");

const negativePercentage =
    document.getElementById("negativePercentage");

const neutralPercentage =
    document.getElementById("neutralPercentage");

const historyTable =
    document.getElementById("historyTable");

const clearHistory =
    document.getElementById("clearHistory");

const themeToggle =
    document.getElementById("themeToggle");


// -------------------------------
// SENTIMENT WORD LIST
// -------------------------------

const positiveWords = [
    "good",
    "great",
    "amazing",
    "excellent",
    "awesome",
    "love",
    "loved",
    "like",
    "liked",
    "happy",
    "wonderful",
    "fantastic",
    "best",
    "beautiful",
    "perfect",
    "nice",
    "enjoy",
    "enjoyed",
    "brilliant",
    "interesting"
];


const negativeWords = [
    "bad",
    "terrible",
    "horrible",
    "awful",
    "hate",
    "hated",
    "boring",
    "worst",
    "poor",
    "sad",
    "disappointing",
    "disappointed",
    "ugly",
    "waste",
    "annoying",
    "slow",
    "problem",
    "problems",
    "useless",
    "dislike"
];


// -------------------------------
// LOAD DATA
// -------------------------------

let analyses =
    JSON.parse(localStorage.getItem("sentimentAnalyses")) || [];


// -------------------------------
// CHARACTER COUNT
// -------------------------------

textInput.addEventListener("input", () => {

    const length = textInput.value.length;

    characterCount.textContent =
        `${length} characters`;

});


// -------------------------------
// ANALYZE TEXT
// -------------------------------

analyzeButton.addEventListener("click", analyzeText);


function analyzeText() {

    const text = textInput.value.trim();

    if (text === "") {

        alert("Please enter some text first.");

        return;
    }


    const words = text
        .toLowerCase()
        .replace(/[^\w\s]/g, "")
        .split(/\s+/);


    let positiveScore = 0;
    let negativeScore = 0;


    words.forEach(word => {

        if (positiveWords.includes(word)) {
            positiveScore++;
        }

        if (negativeWords.includes(word)) {
            negativeScore++;
        }

    });


    let sentiment;
    let confidence;


    if (
        positiveScore === 0 &&
        negativeScore === 0
    ) {

        sentiment = "Neutral";
        confidence = 70;

    }

    else if (
        positiveScore > negativeScore
    ) {

        sentiment = "Positive";

        confidence =
            Math.min(
                95,
                70 + (positiveScore * 8)
            );

    }

    else if (
        negativeScore > positiveScore
    ) {

        sentiment = "Negative";

        confidence =
            Math.min(
                95,
                70 + (negativeScore * 8)
            );

    }

    else {

        sentiment = "Neutral";
        confidence = 65;

    }


    showResult(
        sentiment,
        confidence
    );


    saveAnalysis(
        text,
        sentiment,
        confidence
    );


    updateDashboard();

}


// -------------------------------
// SHOW RESULT
// -------------------------------

function showResult(
    sentiment,
    confidence
) {

    resultCard.classList.remove("hidden");

    confidenceValue.textContent =
        `${confidence}%`;

    confidenceProgress.style.width =
        `${confidence}%`;


    if (sentiment === "Positive") {

        resultIcon.textContent = "😊";

        resultText.textContent =
            "Positive";

        resultDescription.textContent =
            "Your text expresses a positive sentiment.";

        confidenceProgress.style.background =
            "#22c55e";

    }


    else if (sentiment === "Negative") {

        resultIcon.textContent = "😡";

        resultText.textContent =
            "Negative";

        resultDescription.textContent =
            "Your text expresses a negative sentiment.";

        confidenceProgress.style.background =
            "#ef4444";

    }


    else {

        resultIcon.textContent = "😐";

        resultText.textContent =
            "Neutral";

        resultDescription.textContent =
            "Your text appears to have a neutral sentiment.";

        confidenceProgress.style.background =
            "#f59e0b";

    }

}


// -------------------------------
// SAVE ANALYSIS
// -------------------------------

function saveAnalysis(
    text,
    sentiment,
    confidence
) {

    const analysis = {

        text: text,

        sentiment: sentiment,

        confidence: confidence,

        time: new Date().toLocaleString()

    };


    analyses.unshift(analysis);


    localStorage.setItem(
        "sentimentAnalyses",
        JSON.stringify(analyses)
    );

}


// -------------------------------
// UPDATE DASHBOARD
// -------------------------------

function updateDashboard() {

    const total =
        analyses.length;


    const positive =
        analyses.filter(
            item => item.sentiment === "Positive"
        ).length;


    const negative =
        analyses.filter(
            item => item.sentiment === "Negative"
        ).length;


    const neutral =
        analyses.filter(
            item => item.sentiment === "Neutral"
        ).length;


    totalCount.textContent =
        total;

    positiveCount.textContent =
        positive;

    negativeCount.textContent =
        negative;

    neutralCount.textContent =
        neutral;

    chartTotal.textContent =
        total;


    if (total > 0) {

        const positivePercent =
            Math.round(
                (positive / total) * 100
            );

        const negativePercent =
            Math.round(
                (negative / total) * 100
            );

        const neutralPercent =
            Math.round(
                (neutral / total) * 100
            );


        positivePercentage.textContent =
            `${positivePercent}%`;

        negativePercentage.textContent =
            `${negativePercent}%`;

        neutralPercentage.textContent =
            `${neutralPercent}%`;


        updateDonutChart(
            positivePercent,
            negativePercent,
            neutralPercent
        );

    }

    else {

        positivePercentage.textContent =
            "0%";

        negativePercentage.textContent =
            "0%";

        neutralPercentage.textContent =
            "0%";

        updateDonutChart(0, 0, 100);

    }


    updateHistory();

}


// -------------------------------
// UPDATE DONUT CHART
// -------------------------------

function updateDonutChart(
    positive,
    negative,
    neutral
) {

    const positiveEnd =
        positive;

    const negativeEnd =
        positive + negative;


    const donut =
        document.querySelector(".donut-chart");


    donut.style.background =
        `conic-gradient(
            #22c55e 0% ${positiveEnd}%,
            #ef4444 ${positiveEnd}% ${negativeEnd}%,
            #f59e0b ${negativeEnd}% 100%
        )`;

}


// -------------------------------
// UPDATE HISTORY
// -------------------------------

function updateHistory() {

    if (analyses.length === 0) {

        historyTable.innerHTML = `

            <tr class="empty-row">

                <td colspan="4">
                    No analysis yet.
                </td>

            </tr>

        `;

        return;
    }


    historyTable.innerHTML = "";


    analyses.slice(0, 10).forEach(
        analysis => {

            let emoji;


            if (
                analysis.sentiment === "Positive"
            ) {

                emoji = "😊";

            }

            else if (
                analysis.sentiment === "Negative"
            ) {

                emoji = "😡";

            }

            else {

                emoji = "😐";

            }


            const row =
                document.createElement("tr");


            row.innerHTML = `

                <td>
                    ${escapeHTML(
                        shortenText(
                            analysis.text,
                            55
                        )
                    )}
                </td>

                <td>
                    ${emoji} ${analysis.sentiment}
                </td>

                <td>
                    ${analysis.confidence}%
                </td>

                <td>
                    ${analysis.time}
                </td>

            `;


            historyTable.appendChild(row);

        }
    );

}


// -------------------------------
// SHORTEN TEXT
// -------------------------------

function shortenText(
    text,
    maxLength
) {

    if (text.length <= maxLength) {

        return text;

    }


    return (
        text.substring(0, maxLength)
        + "..."
    );

}


// -------------------------------
// SECURITY
// -------------------------------

function escapeHTML(text) {

    const div =
        document.createElement("div");

    div.textContent = text;

    return div.innerHTML;

}


// -------------------------------
// CLEAR HISTORY
// -------------------------------

clearHistory.addEventListener(
    "click",
    () => {

        if (analyses.length === 0) {

            return;

        }


        const confirmDelete =
            confirm(
                "Are you sure you want to clear all history?"
            );


        if (confirmDelete) {

            analyses = [];

            localStorage.removeItem(
                "sentimentAnalyses"
            );

            updateDashboard();

        }

    }
);


// -------------------------------
// DARK MODE
// -------------------------------

themeToggle.addEventListener(
    "click",
    () => {

        document.body.classList.toggle(
            "dark"
        );


        if (
            document.body.classList.contains("dark")
        ) {

            themeToggle.textContent =
                "☀️ Light Mode";

        }

        else {

            themeToggle.textContent =
                "🌙 Dark Mode";

        }

    }
);


// -------------------------------
// INITIAL LOAD
// -------------------------------

updateDashboard();