(function () {

/* =========================================================
   21–30 SEPTEMBER STUDY WARRIORS CHALLENGE
   ========================================================= */


/* =========================================================
   SUPABASE
   ========================================================= */

const SUPABASE_URL =
    "https://yojtvziupqwgcuocheho.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_0DlyNWk3bTJshNF-zskexA_IsSK3BAF";

const challengeDB = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);


/* =========================================================
   CHALLENGE SETTINGS
   ========================================================= */

const CANDIDATES = [
    "Brajesh",
    "Bittu",
    "Anshu",
    "Priti",
    "Ribha",
   "Honey"
];

const START_DATE = "2026-09-21";
const END_DATE   = "2026-09-30";

const DAILY_TARGET = 12;
const TOTAL_TARGET = 120;

const CHALLENGE_DAYS = [
    "21",
    "22",
    "23",
    "24",
    "25",
    "26",
    "27",
    "28",
    "29",
    "30"
];


/* =========================================================
   SUMIRAN SETTINGS
   ========================================================= */

/*
   1st Sumiran:
   Daily target = 360
   10-day target = 3600

   2nd/3rd Sumiran:
   Daily target = 3000
   10-day target = 30000
*/

const SUMIRAN_TARGETS = {
    first: {
        name: "1st Sumiran",
        daily: 360,
        total: 3600
    },

    third: {
        name: "2nd/3rd Sumiran",
        daily: 3000,
        total: 30000
    }
};


/* =========================================================
   DATA STORAGE
   ========================================================= */

let studyData = {};
let sumiranData = {};


/* =========================================================
   CREATE EMPTY STUDY DATA
   ========================================================= */

function createEmptyStudyData() {

    const result = {};

    CANDIDATES.forEach(candidate => {

        result[candidate] = {};

        CHALLENGE_DAYS.forEach(day => {

            result[candidate][day] = 0;

        });

    });

    return result;
}


/* =========================================================
   CREATE EMPTY SUMIRAN DATA
   ========================================================= */

function createEmptySumiranData() {

    const result = {};

    CANDIDATES.forEach(candidate => {

        result[candidate] = {
            first: 0,
            third: 0
        };

    });

    return result;
}


/* =========================================================
   DATE HELPER
   ========================================================= */

function dateFromDay(day) {

    return `2026-09-${day}`;

}


/* =========================================================
   LOAD STUDY HOURS
   ========================================================= */

async function loadChallengeStudyData() {

    studyData = createEmptyStudyData();

    const { data, error } = await challengeDB
        .from("study_hours")
        .select("date, candidate, hour, completed")
        .gte("date", START_DATE)
        .lte("date", END_DATE);

    if (error) {

        console.error(
            "Challenge study data error:",
            error
        );

        return;

    }


    data.forEach(row => {

        if (!CANDIDATES.includes(row.candidate)) {
            return;
        }

        if (!row.completed) {
            return;
        }

        const date = String(row.date);

        const day = date.slice(-2);

        if (!CHALLENGE_DAYS.includes(day)) {
            return;
        }

        studyData[row.candidate][day]++;

    });

}


/* =========================================================
   LOAD SUMIRAN DATA
   ========================================================= */

async function loadChallengeSumiranData() {

    sumiranData = createEmptySumiranData();

    const { data, error } = await challengeDB
        .from("sumiran")
        .select("date, candidate, type, count")
        .gte("date", START_DATE)
        .lte("date", END_DATE);

    if (error) {

        console.error(
            "Challenge Sumiran data error:",
            error
        );

        return;

    }


    data.forEach(row => {

        if (!CANDIDATES.includes(row.candidate)) {
            return;
        }

        if (
            row.type !== "first" &&
            row.type !== "third"
        ) {
            return;
        }

        sumiranData[row.candidate][row.type] +=
            Number(row.count) || 0;

    });

}


/* =========================================================
   TOTAL HOURS OF ONE CANDIDATE
   ========================================================= */

function getCandidateTotal(candidate) {

    let total = 0;

    CHALLENGE_DAYS.forEach(day => {

        total += studyData[candidate][day];

    });

    return total;

}


/* =========================================================
   TOTAL ALL CANDIDATES
   ========================================================= */

function getAllStudyHours() {

    let total = 0;

    CANDIDATES.forEach(candidate => {

        total += getCandidateTotal(candidate);

    });

    return total;

}


/* =========================================================
   DAYS WITH DATA
   ========================================================= */

function getCompletedDays() {

    let count = 0;

    CHALLENGE_DAYS.forEach(day => {

        let hasData = false;

        CANDIDATES.forEach(candidate => {

            if (studyData[candidate][day] > 0) {
                hasData = true;
            }

        });

        if (hasData) {
            count++;
        }

    });

    return count;

}


/* =========================================================
   SUMMARY CARDS
   ========================================================= */

function renderSummary() {

    const daysElement =
        document.getElementById("daysCompleted");

    const hoursElement =
        document.getElementById("totalChallengeHours");


    if (daysElement) {

        daysElement.textContent =
            getCompletedDays();

    }


    if (hoursElement) {

        hoursElement.textContent =
            getAllStudyHours();

    }

}


/* =========================================================
   CHALLENGE RANKING
   ========================================================= */

function renderRanking() {

    const container =
        document.getElementById("challengeRanking");

    if (!container) return;


    const ranked = CANDIDATES
        .map(candidate => {

            return {
                candidate: candidate,
                hours: getCandidateTotal(candidate)
            };

        })
        .sort((a, b) => b.hours - a.hours);


    container.innerHTML = "";


    ranked.forEach((item, index) => {

        const percentage =
            Math.min(
                100,
                (item.hours / TOTAL_TARGET) * 100
            );


        const card =
            document.createElement("div");

        card.className = "ranking-card";


        let medal = index + 1;

        if (index === 0) medal = "🥇";
        if (index === 1) medal = "🥈";
        if (index === 2) medal = "🥉";


        card.innerHTML = `

            <div class="rank-number">
                ${medal}
            </div>

            <div class="rank-info">

                <div class="rank-name">
                    ${item.candidate}
                </div>

                <div class="rank-hours">
                    ${item.hours} / ${TOTAL_TARGET} hours
                </div>

            </div>

            <div class="rank-progress">

                <div
                    class="rank-progress-fill"
                    style="width:${percentage}%">
                </div>

            </div>

        `;


        container.appendChild(card);

    });

}


/* =========================================================
   TARGET PROGRESS
   ========================================================= */

function renderTargetProgress() {

    const container =
        document.getElementById("targetProgress");

    if (!container) return;


    container.innerHTML = "";


    CANDIDATES.forEach(candidate => {

        const hours =
            getCandidateTotal(candidate);


        const percentage =
            Math.min(
                100,
                (hours / TOTAL_TARGET) * 100
            );


        const card =
            document.createElement("div");

        card.className = "target-card";


        card.innerHTML = `

            <div class="target-top">

                <span class="target-name">
                    ${candidate}
                </span>

                <span class="target-percent">
                    ${percentage.toFixed(1)}%
                </span>

            </div>

            <div class="target-bar">

                <div
                    class="target-fill"
                    style="width:${percentage}%">
                </div>

            </div>

            <div class="target-hours">
                ${hours} / ${TOTAL_TARGET} hours
            </div>

        `;


        container.appendChild(card);

    });

}


/* =========================================================
   SUMIRAN TRACKER
   ========================================================= */

function renderSumiran() {

    const container =
        document.getElementById("sumiranTracker");

    if (!container) return;


    container.innerHTML = "";


    CANDIDATES
        .filter(candidate =>
            ["Brajesh", "Bittu", "Ribha"]
                .includes(candidate)
        )
        .forEach(candidate => {

            const first =
                sumiranData[candidate].first;

            const third =
                sumiranData[candidate].third;


            const firstPercent =
                Math.min(
                    100,
                    (first /
                        SUMIRAN_TARGETS.first.total) * 100
                );


            const thirdPercent =
                Math.min(
                    100,
                    (third /
                        SUMIRAN_TARGETS.third.total) * 100
                );


            const card =
                document.createElement("div");

            card.className =
                "sumiran-card";


            card.innerHTML = `

                <h3>🙏 ${candidate}</h3>

                <div style="margin-top:15px">

                    <strong>
                        1st Sumiran
                    </strong>

                    <div class="sumiran-count">
                        ${first}
                    </div>

                    <div class="sumiran-target">
                        Target: ${SUMIRAN_TARGETS.first.total}
                    </div>

                    <div class="target-bar"
                         style="margin-top:8px">

                        <div
                            class="target-fill"
                            style="width:${firstPercent}%">
                        </div>

                    </div>

                </div>


                <div style="margin-top:22px">

                    <strong>
                        2nd/3rd Sumiran
                    </strong>

                    <div class="sumiran-count">
                        ${third}
                    </div>

                    <div class="sumiran-target">
                        Target: ${SUMIRAN_TARGETS.third.total}
                    </div>

                    <div class="target-bar"
                         style="margin-top:8px">

                        <div
                            class="target-fill"
                            style="width:${thirdPercent}%">
                        </div>

                    </div>

                </div>

            `;


            container.appendChild(card);

        });

}


/* =========================================================
   DAILY CONSISTENCY TABLE
   ========================================================= */

function renderConsistency() {

    const container =
        document.getElementById("consistencyTable");

    if (!container) return;


    let html = `

        <table class="consistency-table">

            <thead>

                <tr>

                    <th>Candidate</th>
    `;


    CHALLENGE_DAYS.forEach(day => {

        html += `
            <th>${day}</th>
        `;

    });


    html += `
                </tr>

            </thead>

            <tbody>
    `;


    CANDIDATES.forEach(candidate => {

        html += `
            <tr>

                <td>
                    <strong>${candidate}</strong>
                </td>
        `;


        CHALLENGE_DAYS.forEach(day => {

            const hours =
                studyData[candidate][day];


            if (hours > 0) {

                html += `
                    <td>
                        <span class="consistency-yes">
                            ${hours}
                        </span>
                    </td>
                `;

            } else {

                html += `
                    <td>
                        <span class="consistency-no">
                            —
                        </span>
                    </td>
                `;

            }

        });


        html += `
            </tr>
        `;

    });


    html += `
            </tbody>

        </table>
    `;


    container.innerHTML = html;

}


/* =========================================================
   FINAL RESULT
   ========================================================= */

function renderFinalResult() {

    const container =
        document.getElementById("finalWinner");

    if (!container) return;


    const ranked = CANDIDATES
        .map(candidate => {

            return {
                candidate,
                hours: getCandidateTotal(candidate)
            };

        })
        .sort((a, b) => b.hours - a.hours);


    const leader = ranked[0];


    if (!leader || leader.hours === 0) {

        container.innerHTML = `

            <div class="winner-crown">
                👑
            </div>

            <div class="winner-name">
                Challenge Started!
            </div>

            <div class="winner-hours">
                21–30 September का result
                data आने के बाद दिखेगा.
            </div>

        `;

        return;

    }


    container.innerHTML = `

        <div class="winner-crown">
            👑
        </div>

        <div class="winner-name">
            ${leader.candidate}
        </div>

        <div class="winner-hours">
            ${leader.hours} / ${TOTAL_TARGET} Hours
        </div>

    `;

}


/* =========================================================
   CANVAS HELPER
   ========================================================= */

function prepareCanvas(canvas) {

    if (!canvas) return null;


    const rect =
        canvas.getBoundingClientRect();


    const width =
        Math.max(300, rect.width);


    const height =
        Math.max(250, rect.height);


    const dpr =
        window.devicePixelRatio || 1;


    canvas.width =
        width * dpr;


    canvas.height =
        height * dpr;


    const ctx =
        canvas.getContext("2d");


    ctx.setTransform(
        dpr,
        0,
        0,
        dpr,
        0,
        0
    );


    return {
        ctx,
        width,
        height
    };

}


/* =========================================================
   10-DAY PROGRESS GRAPH
   ========================================================= */

function drawChallengeProgressChart() {

    const canvas =
        document.getElementById(
            "challengeProgressChart"
        );


    const setup =
        prepareCanvas(canvas);


    if (!setup) return;


    const {
        ctx,
        width,
        height
    } = setup;


    ctx.clearRect(
        0,
        0,
        width,
        height
    );


    const left = 45;
    const right = 20;
    const top = 25;
    const bottom = 45;


    const chartW =
        width - left - right;


    const chartH =
        height - top - bottom;


    const max =
        Math.max(
            12,
            ...CANDIDATES.flatMap(
                candidate =>
                    CHALLENGE_DAYS.map(
                        day =>
                            studyData[candidate][day]
                    )
            )
        );


    /* Grid */

    ctx.font =
        "12px Arial";


    ctx.textAlign =
        "right";


    for (
        let value = 0;
        value <= max;
        value += 2
    ) {

        const y =
            top +
            chartH -
            (value / max) * chartH;


        ctx.strokeStyle =
            "#e5e7eb";


        ctx.beginPath();

        ctx.moveTo(
            left,
            y
        );

        ctx.lineTo(
            width - right,
            y
        );

        ctx.stroke();


        ctx.fillStyle =
            "#667085";


        ctx.fillText(
            value,
            left - 8,
            y + 4
        );

    }


    const colors = [
        "#ff0080",
        "#7c3aed",
        "#0072ff",
        "#00a884",
        "#ff9800"
    ];


    CANDIDATES.forEach(
        (candidate, index) => {

            ctx.strokeStyle =
                colors[index];

            ctx.lineWidth = 3;

            ctx.beginPath();


            CHALLENGE_DAYS.forEach(
                (day, dayIndex) => {

                    const x =
                        left +
                        (dayIndex /
                            (CHALLENGE_DAYS.length - 1))
                        * chartW;


                    const value =
                        studyData[
                            candidate
                        ][day];


                    const y =
                        top +
                        chartH -
                        (value / max) *
                        chartH;


                    if (dayIndex === 0) {

                        ctx.moveTo(
                            x,
                            y
                        );

                    } else {

                        ctx.lineTo(
                            x,
                            y
                        );

                    }

                }
            );


            ctx.stroke();


            /* Points */

            CHALLENGE_DAYS.forEach(
                (day, dayIndex) => {

                    const x =
                        left +
                        (dayIndex /
                            (CHALLENGE_DAYS.length - 1))
                        * chartW;


                    const value =
                        studyData[
                            candidate
                        ][day];


                    const y =
                        top +
                        chartH -
                        (value / max) *
                        chartH;


                    ctx.fillStyle =
                        colors[index];


                    ctx.beginPath();

                    ctx.arc(
                        x,
                        y,
                        4,
                        0,
                        Math.PI * 2
                    );

                    ctx.fill();

                }
            );

        }
    );


    /* X labels */

    ctx.textAlign =
        "center";

    ctx.fillStyle =
        "#667085";


    CHALLENGE_DAYS.forEach(
        (day, index) => {

            const x =
                left +
                (index /
                    (CHALLENGE_DAYS.length - 1))
                * chartW;


            ctx.fillText(
                day,
                x,
                height - 18
            );

        }
    );

}


/* =========================================================
   CUMULATIVE PROGRESS GRAPH
   ========================================================= */

function drawCumulativeChart() {

    const canvas =
        document.getElementById(
            "cumulativeChart"
        );


    const setup =
        prepareCanvas(canvas);


    if (!setup) return;


    const {
        ctx,
        width,
        height
    } = setup;


    ctx.clearRect(
        0,
        0,
        width,
        height
    );


    const left = 45;
    const right = 20;
    const top = 25;
    const bottom = 45;


    const chartW =
        width - left - right;


    const chartH =
        height - top - bottom;


    const max = 120;


    const colors = [
        "#ff0080",
        "#7c3aed",
        "#0072ff",
        "#00a884",
        "#ff9800"
    ];


    /* 120 hour target line */

    const targetY =
        top +
        chartH -
        (120 / max) *
        chartH;


    ctx.strokeStyle =
        "#ef4444";

    ctx.setLineDash([
        7,
        5
    ]);

    ctx.beginPath();

    ctx.moveTo(
        left,
        targetY
    );

    ctx.lineTo(
        width - right,
        targetY
    );

    ctx.stroke();

    ctx.setLineDash([]);


    ctx.fillStyle =
        "#ef4444";

    ctx.font =
        "bold 12px Arial";

    ctx.fillText(
        "120h Target",
        left + 5,
        targetY - 8
    );


    /* Candidate lines */

    CANDIDATES.forEach(
        (candidate, candidateIndex) => {

            let cumulative = 0;


            ctx.strokeStyle =
                colors[candidateIndex];

            ctx.lineWidth = 3;

            ctx.beginPath();


            CHALLENGE_DAYS.forEach(
                (day, dayIndex) => {

                    cumulative +=
                        studyData[
                            candidate
                        ][day];


                    const x =
                        left +
                        (dayIndex /
                            (CHALLENGE_DAYS.length - 1))
                        * chartW;


                    const y =
                        top +
                        chartH -
                        (Math.min(
                            cumulative,
                            max
                        ) / max) *
                        chartH;


                    if (dayIndex === 0) {

                        ctx.moveTo(
                            x,
                            y
                        );

                    } else {

                        ctx.lineTo(
                            x,
                            y
                        );

                    }

                }
            );


            ctx.stroke();

        }
    );


    /* Y labels */

    ctx.fillStyle =
        "#667085";

    ctx.font =
        "12px Arial";

    ctx.textAlign =
        "right";


    for (
        let value = 0;
        value <= 120;
        value += 20
    ) {

        const y =
            top +
            chartH -
            (value / max) *
            chartH;


        ctx.fillText(
            value + "h",
            left - 8,
            y + 4
        );

    }


    /* X labels */

    ctx.textAlign =
        "center";


    CHALLENGE_DAYS.forEach(
        (day, index) => {

            const x =
                left +
                (index /
                    (CHALLENGE_DAYS.length - 1))
                * chartW;


            ctx.fillText(
                day,
                x,
                height - 18
            );

        }
    );

}


/* =========================================================
   RENDER EVERYTHING
   ========================================================= */

function renderChallenge() {

    renderSummary();

    renderRanking();

    renderTargetProgress();

    renderSumiran();

    renderConsistency();

    renderFinalResult();

    drawChallengeProgressChart();

    drawCumulativeChart();

}


/* =========================================================
   INITIAL LOAD
   ========================================================= */

async function startChallenge() {

    console.log(
        "Loading Study Warriors Challenge..."
    );


    await loadChallengeStudyData();

    await loadChallengeSumiranData();


    renderChallenge();


    console.log(
        "Challenge loaded successfully."
    );

}


/* =========================================================
   AUTO REFRESH
   ========================================================= */

setInterval(
    async () => {

        await loadChallengeStudyData();

        await loadChallengeSumiranData();

        renderChallenge();

    },
    60000
);


/* =========================================================
   WINDOW RESIZE
   ========================================================= */

window.addEventListener(
    "resize",
    () => {

        drawChallengeProgressChart();

        drawCumulativeChart();

    }
);


/* =========================================================
   START
   ========================================================= */

startChallenge();

   })();
