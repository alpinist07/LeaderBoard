const classStructure = {
    1: 5, 2: 5, 3: 7, 4: 6, 5: 6, 6: 7
};

let currentClassKey = null;
let activeListener = null;

document.addEventListener('DOMContentLoaded', () => {
    // UI를 먼저 설정합니다.
    populateGradeSelector();
    document.getElementById('grade-select').addEventListener('change', handleGradeChange);
    document.getElementById('class-select').addEventListener('change', handleClassChange);
    
    // 문제가 되었던 initializeAllLeaderboards() 함수 호출을 삭제했습니다.
});

function populateGradeSelector() {
    const gradeSelect = document.getElementById('grade-select');
    for (const grade in classStructure) {
        gradeSelect.innerHTML += `<option value="${grade}">${grade}학년</option>`;
    }
}

function handleGradeChange() {
    const grade = document.getElementById('grade-select').value;
    const classSelect = document.getElementById('class-select');

    if (activeListener) activeListener();
    classSelect.innerHTML = '<option value="">-- 반 선택 --</option>';
    document.getElementById('leaderboard-container').innerHTML = '';
    document.getElementById('add-score-section').style.display = 'none';
    currentClassKey = null;

    if (grade) {
        const classCount = classStructure[grade];
        for (let i = 1; i <= classCount; i++) {
            classSelect.innerHTML += `<option value="${i}">${i}반</option>`;
        }
    }
}

function handleClassChange() {
    const grade = document.getElementById('grade-select').value;
    const className = document.getElementById('class-select').value;

    if (activeListener) activeListener();

    if (grade && className) {
        currentClassKey = `${grade}-${className}`;
        document.getElementById('add-score-section').style.display = 'block';

        // Firestore에서 해당 반의 데이터를 실시간으로 감지합니다.
        activeListener = db.collection('leaderboards').doc(currentClassKey).onSnapshot(doc => {
            if (doc.exists) {
                // 문서가 존재하면, players 데이터를 가져옵니다. 없으면 빈 배열로 처리합니다.
                const players = doc.data().players || [];
                renderSingleLeaderboard(currentClassKey, players);
            } else {
                // 문서가 존재하지 않으면, 빈 리더보드를 표시하고,
                // 다음에 점수를 등록할 때 자동으로 문서가 생성됩니다.
                renderSingleLeaderboard(currentClassKey, []);
            }
        }, error => console.error("데이터 불러오기 오류:", error));
    } else {
        document.getElementById('leaderboard-container').innerHTML = '';
        document.getElementById('add-score-section').style.display = 'none';
        currentClassKey = null;
    }
}

async function addScore() {
    if (!currentClassKey) return alert("먼저 리더보드를 선택해주세요.");

    const nameInput = document.getElementById('player-name-input');
    const scoreInput = document.getElementById('player-score-input');
    const name = nameInput.value.trim();
    const score = parseFloat(scoreInput.value);

    if (!name || isNaN(score)) return alert('이름과 점수를 올바르게 입력해주세요.');

    const docRef = db.collection('leaderboards').doc(currentClassKey);
    try {
        await db.runTransaction(async transaction => {
            const doc = await transaction.get(docRef);
            // 문서가 없으면 새로 만들고, 있으면 기존 데이터를 가져옵니다.
            const players = doc.exists ? doc.data().players || [] : [];
            const existingPlayerIndex = players.findIndex(p => p.name === name);

            if (existingPlayerIndex > -1) {
                players[existingPlayerIndex].score = score;
            } else {
                players.push({ name, score });
            }
            
            // 데이터가 존재하든 안하든 set으로 덮어씁니다.
            // 이렇게 하면 문서가 없을 때 자동으로 생성됩니다.
            transaction.set(docRef, { players });
        });
        nameInput.value = '';
        scoreInput.value = '';
        nameInput.focus();
    } catch (e) {
        console.error("점수 등록 실패: ", e);
    }
}

async function resetLeaderboard(classKey) {
    const password = prompt("데이터를 초기화하려면 비밀번호를 입력하세요.");
    if (password === '2025') {
        if (confirm(`정말로 ${classKey.replace('-', '학년 ')}반의 모든 기록을 삭제하시겠습니까?`)) {
            await db.collection('leaderboards').doc(classKey).update({ players: [] });
            alert("데이터가 초기화되었습니다.");
        }
    } else if (password !== null) {
        alert("비밀번호가 틀렸습니다.");
    }
}

function renderSingleLeaderboard(classKey, players) {
    const container = document.getElementById('leaderboard-container');
    const [grade, className] = classKey.split('-');

    players.sort((a, b) => b.score - a.score);

    let playerListHTML;
    if (players.length === 0) {
        playerListHTML = '<div class="status-message">아직 점수가 없어요! 첫 번째 점수를 등록해보세요!</div>';
    } else {
        let rank = 1;
        playerListHTML = players.map((player, index) => {
            if (index > 0 && players[index - 1].score > player.score) {
                rank = index + 1;
            }
            return renderPlayer(player, rank);
        }).join('');
    }

    container.innerHTML = `
        <div class="card" id="leaderboard-display-area">
            <div class="leaderboard-header">
                <h3><i class="fas fa-award"></i> ${grade}학년 ${className}반 명예의 전당</h3>
                <button class="btn secondary" onclick="resetLeaderboard('${classKey}')"><i class="fas fa-trash-alt"></i> 초기화</button>
            </div>
            <div class="leaderboard-container">${playerListHTML}</div>
        </div>`;
}

function renderPlayer(player, rank) {
    let rankClass = 'other';
    if (rank === 1) rankClass = 'gold';
    else if (rank === 2) rankClass = 'silver';
    else if (rank === 3) rankClass = 'bronze';

    const emojis = ['😊', '😄', '😁', '😆', '😎', '😍', '🤩', '🥳', '👍', '💯'];
    const avatarEmoji = emojis[Math.floor(Math.random() * emojis.length)];

    return `
        <div class="leaderboard-item">
            <div class="rank ${rankClass}">${rank}위</div>
            <div class="player-avatar">${avatarEmoji}</div>
            <div class="player-name">${escapeHtml(player.name)}</div>
            <div class="player-score"><i class="fas fa-star"></i> ${player.score.toLocaleString()}점</div>
        </div>`;
}

function escapeHtml(unsafe) {
    return unsafe.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}
