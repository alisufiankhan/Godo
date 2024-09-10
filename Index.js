const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.navbar-menu');

hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navMenu.classList.toggle('active');
});

// To-Do List functionality
const todoForm = document.getElementById('todo-form');
const todoInput = document.getElementById('todo-input');
const todoList = document.getElementById('todo-list');
const voiceInputBtn = document.getElementById('voice-input');

let todos = JSON.parse(localStorage.getItem('todos')) || [];
let weeklyProgress = JSON.parse(localStorage.getItem('weeklyProgress')) || {};

function renderTodos() {
    todoList.innerHTML = '';
    todos.forEach((todo, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span class="${todo.completed ? 'completed' : ''}">${todo.text}</span>
            <button class="delete-btn" data-index="${index}" title="Delete"><i class="fas fa-trash-alt"></i></button>
            <button class="edit-btn" data-index="${index}" title="Edit"><i class="fas fa-edit"></i></button>
            <button class="complete-btn" data-index="${index}" title="${todo.completed ? 'Undo' : 'Complete'}">
                <i class="fas ${todo.completed ? 'fa-undo' : 'fa-check'}"></i>
            </button>
        `;
        todoList.appendChild(li);
    });
    updateLocalStorage();
    updateProgressReport();
}

function updateLocalStorage() {
    localStorage.setItem('todos', JSON.stringify(todos));
    localStorage.setItem('weeklyProgress', JSON.stringify(weeklyProgress));
}

todoForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const todoText = todoInput.value.trim();
    if (todoText) {
        todos.push({ text: todoText, completed: false, createdDate: new Date().toISOString() });
        todoInput.value = '';
        renderTodos();
    }
});

todoList.addEventListener('click', (e) => {
    const button = e.target.closest('button');
    if (!button) return;

    const index = button.dataset.index;
    
    if (button.classList.contains('delete-btn')) {
        todos.splice(index, 1);
        renderTodos();
    } else if (button.classList.contains('edit-btn')) {
        const newText = prompt('Edit task:', todos[index].text);
        if (newText !== null) {
            todos[index].text = newText.trim();
            renderTodos();
        }
    } else if (button.classList.contains('complete-btn')) {
        todos[index].completed = !todos[index].completed;
        todos[index].completedDate = todos[index].completed ? new Date().toISOString() : null;
        renderTodos();
    }
});

voiceInputBtn.addEventListener('click', () => {
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = 'en-US';
    recognition.start();
    recognition.onresult = (event) => {
        const voiceText = event.results[0][0].transcript;
        todoInput.value = voiceText;
    };
});

// Progress Report functionality
function updateProgressReport() {
    const progressReport = document.getElementById('progress-report');
    const today = moment().format('dddd');
    const completedToday = todos.filter(todo => todo.completed && moment(todo.completedDate).isSame(moment(), 'day')).length;
    const totalToday = todos.filter(todo => moment(todo.createdDate).isSame(moment(), 'day')).length;
    const percentageToday = totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0;

    weeklyProgress[today] = percentageToday;

    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    let progressHTML = '';

    daysOfWeek.forEach(day => {
        const percentage = weeklyProgress[day] || 0;
        progressHTML += `
            <div class="progress-interval">
                <span>${day}</span>
                <div class="progress-bar-container">
                    <div class="progress-bar" style="width: ${percentage}%;"></div>
                    <div class="progress-text">${percentage}%</div>
                </div>
            </div>
        `;
    });

    progressReport.innerHTML = progressHTML;
    updateLocalStorage();
}

function checkNewDay() {
    const lastChecked = localStorage.getItem('lastChecked');
    const today = moment().format('YYYY-MM-DD');

    if (lastChecked !== today) {
        // It's a new day, save yesterday's progress
        const yesterday = moment().subtract(1, 'day').format('dddd');
        if (weeklyProgress[yesterday]) {
            weeklyProgress[yesterday] = weeklyProgress[yesterday];
        }

        // Clear today's todos
        todos = todos.filter(todo => !moment(todo.createdDate).isSame(moment(), 'day'));
        updateLocalStorage();
    }

    localStorage.setItem('lastChecked', today);
}

// Check for a new day and update progress on page load
checkNewDay();
updateProgressReport();

// Update progress report every hour
setInterval(updateProgressReport, 60 * 60 * 1000);

// Alarm functionality
const alarmTimeInput = document.getElementById('alarm-time');
const setAlarmBtn = document.getElementById('set-alarm');
const alarmList = document.getElementById('alarm-list');
let alarms = JSON.parse(localStorage.getItem('alarms')) || [];

function saveAlarms() {
    localStorage.setItem('alarms', JSON.stringify(alarms));
}

setAlarmBtn.addEventListener('click', () => {
    const alarmTime = alarmTimeInput.value;
    if (alarmTime) {
        const now = moment();
        const alarm = moment(alarmTime, 'HH:mm');
        if (alarm.isBefore(now)) {
            alarm.add(1, 'day');
        }
        const alarmId = Date.now(); // Use timestamp as unique ID
        alarms.push({ id: alarmId, time: alarm.format() }); // Store as formatted string
        saveAlarms();
        renderAlarms();
        setAlarm(alarmId, alarm);
    }
});

function renderAlarms() {
    alarmList.innerHTML = '';
    alarms.forEach(alarm => {
        const alarmMoment = moment(alarm.time);
        const alarmElement = document.createElement('div');
        alarmElement.className = 'alarm-item';
        alarmElement.innerHTML = `
            <span>Alarm set for ${alarmMoment.format('HH:mm')}</span>
            <button class="delete-alarm" data-id="${alarm.id}">
                <i class="fas fa-trash-alt"></i>
            </button>
        `;
        alarmList.appendChild(alarmElement);
    });
}

function removeAlarm(id) {
    alarms = alarms.filter(alarm => alarm.id !== id);
    saveAlarms();
    renderAlarms();
}

function playAlarmSound() {
    const audio = new Audio("Alarm.flac");
    audio.play().then(() => {
        setTimeout(() => {
            audio.pause();
            audio.currentTime = 0;
        }, 5000); // Play for 5 seconds
    }).catch(error => {
        console.error('Failed to play alarm sound:', error);
    });
}

function setAlarm(id, time) {
    const now = moment();
    const duration = moment.duration(time.diff(now));
    const milliseconds = duration.asMilliseconds();

    if (milliseconds > 0) {
        setTimeout(() => {
            playAlarmSound();
            removeAlarm(id);
        }, milliseconds);
    } else {
        removeAlarm(id);
    }
}

function setAlarms() {
    alarms.forEach(alarm => {
        const alarmMoment = moment(alarm.time);
        setAlarm(alarm.id, alarmMoment);
    });
}

// Call this function when the page loads
function initAlarms() {
    renderAlarms();
    setAlarms();
}

// Call initAlarms when the page loads
window.addEventListener('load', initAlarms);

alarmList.addEventListener('click', (e) => {
    if (e.target.closest('.delete-alarm')) {
        const alarmId = parseInt(e.target.closest('.delete-alarm').dataset.id);
        removeAlarm(alarmId);
    }
});

// Initial render
renderTodos();
updateProgressReport();

// Update button styles
const buttons = document.querySelectorAll('button');

const quotes = [
    "Believe you can and you're halfway there.",
    "Success is not final, failure is not fatal.",
    "The only way to do great work is to love what you do.",
    "Strive not to be a success, but rather to be of value.",
    "The future belongs to those who believe in the beauty of their dreams.",
    "Don't watch the clock; do what it does. Keep going.",
    "The secret of getting ahead is getting started.",
    "Your time is limited, don't waste it living someone else's life.",
    "The best way to predict the future is to create it.",
    "Success is not in what you have, but who you are.",
    "The harder you work for something, the greater you'll feel when you achieve it.",
    "Dream big and dare to fail.",
    "The only limit to our realization of tomorrow will be our doubts of today.",
    "Do what you can, with what you have, where you are.",
    "Believe in yourself and all that you are.",
    "The way to get started is to quit talking and begin doing.",
    "Your life does not get better by chance, it gets better by change.",
    "The only person you are destined to become is the person you decide to be.",
    "Don't let yesterday take up too much of today.",
    "You are never too old to set another goal or to dream a new dream."
];

function displayRandomQuote() {
    const quoteElement = document.getElementById('quote');
    const randomIndex = Math.floor(Math.random() * quotes.length);
    quoteElement.textContent = quotes[randomIndex];
}

displayRandomQuote();
setInterval(displayRandomQuote, 86400000); 


// Function to update the visitor counter every second
function updateCounter() {
    // Using the countapi.xyz service to get the visitor count
    fetch('https://api.countapi.xyz/hit/https://alisufiankhan.github.io/Godo/visits')
        .then(response => response.json())
        .then(data => {
            // Update the counter in the DOM
            document.getElementById('visitor-count').innerText = data.value;
        })
        .catch(error => console.log('Error fetching data:', error));
}

// Call the function every second (1000 ms)
setInterval(updateCounter, 1000);

// Call it immediately when the page loads
updateCounter();
