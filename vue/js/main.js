Vue.component('task-card', {
    props: ['card', 'currentColumnIndex', 'isFirstColumnLocked'],
    template: `
    <div class="task-card">
        <h3>Задача: {{ card.title }}</h3>
        <p style="font-style: italic" ><b>Дата создания:</b> {{ card.createdDate }}</p>
        <p style="font-style: italic" ><b>Дедлайн:</b> {{ card.deadline }}</p>
        <ul v-if="card.tasks && card.tasks.length > 0">
            <li v-for="(task, index) in card.tasks" :key="index">
                <p>{{ task.text }}</p>
            </li>
        </ul>
        <p v-if="card.finalMoved && card.lastUpdated" style="font-weight: bold">Выполнено: {{ card.lastUpdated }}</p>
        <button class="DELITE" @click="$emit('delete-card', card.id)">Удалить</button>
    </div>
    `,
    data() {
        return {
            newTask: ''
        };
    },
    methods: {
        addTask() {
            if (this.newTask) {
                if (!this.card.tasks) {
                    this.card.tasks = []; // Инициализация tasks, если он undefined
                }
                this.card.tasks.push({ text: this.newTask, completed: false });
                this.newTask = '';
                this.saveTasks();
            }
        },
        saveTasks() {
            const cards = JSON.parse(localStorage.getItem('cards')) || [];
            const cardIndex = cards.findIndex(c => c.id === this.card.id); // Ищем карточку по id

            // Сохраняем актуальные данные с состоянием задач
            if (cardIndex !== -1) {
                cards[cardIndex] = {
                    ...this.card,
                    tasks: this.card.tasks.map(task => ({ ...task })) // Глубокая копия задач
                };
            } else {
                cards.push({
                    ...this.card,
                    tasks: this.card.tasks.map(task => ({ ...task }))
                });
            }

            localStorage.setItem('cards', JSON.stringify(cards));
        },
        checkCompletion() {
            if (this.card.tasks) {
                const totalTasks = this.card.tasks.length;
                const completedTasks = this.card.tasks.filter(task => task.completed).length;

                if (totalTasks > 0) {
                    const completionRate = (completedTasks / totalTasks) * 100;

                    // Перемещение карточки вперед
                    if (completionRate > 50 && completionRate <= 100) {
                        this.$emit('move-to-next', this.card, this.currentColumnIndex);
                    } else if (completionRate === 100) {
                        this.card.lastUpdated = new Date().toLocaleString(); // Установка времени последнего обновления
                        this.$emit('move-to-next', this.card, this.currentColumnIndex);
                    }

                    // Перемещение карточки назад
                    if (completionRate <= 50 && this.currentColumnIndex === 1) {
                        this.$emit('move-to-previous', this.card, this.currentColumnIndex);
                    }

                    this.saveTasks();
                }
            }
        }
    },
    mounted() {
        const cards = JSON.parse(localStorage.getItem('cards')) || [];
        const savedCard = cards.find(c => c.id === this.card.id); // Ищем сохранённую карточку по id

        if (savedCard && savedCard.tasks) {
            this.card.tasks = savedCard.tasks.map(task => ({ ...task })); // Глубокая копия задач
        } else {
            this.card.tasks = []; // Инициализация пустого массива задач
        }
    }
});

Vue.component('column1', {
    props: ['cards', 'isFirstColumnLocked'],
    template: `
    <div class="column">
        <h2>Запланированные задачи</h2>
        <task-card 
            v-for="(card, index) in cards" 
            :key="index" 
            :card="card"
            :currentColumnIndex="0"
            :isFirstColumnLocked="isFirstColumnLocked"
            @move-to-next="moveToNext"
            @move-to-previous="moveToPrevious"
            @delete-card="$emit('delete-card', $event)"
        ></task-card>
    </div>
    `,
    methods: {
        moveToNext(card, currentColumnIndex) {
            this.$emit('move-to-next', card, currentColumnIndex);
        },
        moveToPrevious(card, currentColumnIndex) {
            this.$emit('move-to-previous', card, currentColumnIndex);
        }
    }
});

Vue.component('column2', {
    props: ['cards'],
    template: `
    <div class="column">
        <h2>Задачи в работе</h2>
        <task-card 
            v-for="(card, index) in cards" 
            :key="index" 
            :card="card" 
            :currentColumnIndex="1"
            @move-to-next="moveToNext"
            @move-to-previous="moveToPrevious"
        ></task-card>
    </div>
    `,
    methods: {
        moveToNext(card, currentColumnIndex) {
            this.$emit('move-to-next', card, currentColumnIndex);
        },
        moveToPrevious(card, currentColumnIndex) {
            this.$emit('move-to-previous', card, currentColumnIndex);
        }
    }
});

Vue.component('column3', {
    props: ['cards'],
    template: `
    <div class="column">
        <h2>Тестирование</h2>
        <task-card 
            v-for="(card, index) in cards" 
            :key="index" 
            :card="card"
            :currentColumnIndex="2"
        ></task-card>
    </div>
    `
});

Vue.component('column4', {
    props: ['cards'],
    template: `
    <div class="column">
        <h2>Выполненные задачи</h2>
        <task-card 
            v-for="(card, index) in cards" 
            :key="index" 
            :card="card"
            :currentColumnIndex="3"
        ></task-card>
    </div>
    `
});

new Vue({
    el: '#app',
    data() {
        return {
            cards: [],
            newCardTitle: '',
            newTasks: [],
            searchQuery: '',
            isFirstColumnLocked: false,
            showModal: false,
            newTaskText: '',
            newCardDeadline: ''
        };
    },
    computed: {
        filteredCards() {
            const query = this.searchQuery.toLowerCase();
            return this.cards.filter(card => card.title.toLowerCase().includes(query));
        }
    },
    methods: {
        addCard() {
            if (this.newCardTitle.trim()) {
                const card = {
                    title: this.newCardTitle,
                    id: Date.now(),
                    tasks: this.newTasks.map(task => ({ text: task, completed: false })),
                    moved: false,
                    finalMoved: false,
                    lastUpdated: null,
                    createdDate: new Date().toLocaleString(),
                    deadline: this.newCardDeadline // Добавляем дедлайн
                };

                this.cards.push(card);
                this.newCardTitle = '';
                this.newTasks = [];
                this.saveCards();
                this.newCardDeadline = ''; // Сброс поля дедлайна
                this.showModal = false;
            } else {
                alert('Введите название карточки.');
            }
        },
        addNewTask() {
            if (this.newTaskText.trim()) {
                this.newTasks.push(this.newTaskText);
                this.newTaskText = '';
            }
        },
        saveCards() {
            localStorage.setItem('cards', JSON.stringify(this.cards));
        },
        deleteAllCards() {
            this.cards = [];
            localStorage.removeItem('cards');
        },
        deleteCard(cardId) {
            this.cards = this.cards.filter(card => card.id !== cardId);
            this.saveCards();
        },
        moveCardToNext(card, currentColumnIndex) {
            const cardIndex = this.cards.indexOf(card);

            if (cardIndex !== -1 && card.tasks) {
                const completedTasks = card.tasks.filter(task => task.completed).length;
                const totalTasks = card.tasks.length;

                if (completedTasks > totalTasks / 2 && currentColumnIndex < 2) {
                    card.moved = true;
                    if (completedTasks === totalTasks) {
                        card.finalMoved = true;
                        card.lastUpdated = new Date().toLocaleString();
                    }
                    this.saveCards();
                }
            }
        },
        moveCardToPrevious(card, currentColumnIndex) {
            const cardIndex = this.cards.indexOf(card);

            if (cardIndex !== -1 && card.tasks) {
                const completedTasks = card.tasks.filter(task => task.completed).length;
                const totalTasks = card.tasks.length;

                if (completedTasks <= totalTasks / 2 && currentColumnIndex > 0) {
                    card.moved = false;
                    if (currentColumnIndex === 2) {
                        card.finalMoved = false;
                        card.lastUpdated = null;
                    }
                    this.saveCards();
                }
            }
        }
    },
    mounted() {
        const savedCards = JSON.parse(localStorage.getItem('cards'));
        if (savedCards) {
            this.cards = savedCards;
        }
    },
    template: `
    <div class="app">
        <div class="navmenu">
            <button @click="showModal = true">Добавить карточку</button>
            <div v-if="showModal" class="modal-mask">
                <div class="modal-wrapper">
                    <div class="modal-container">
                        <div class="modal-header">
                            <span class="close" @click="showModal = false">&times;</span>
                            <h3>Создать новую карточку</h3>
                        </div>
                        <div class="modal-body">
                            <input 
                                type="text" 
                                v-model="newCardTitle" 
                                placeholder="Введите название карточки" 
                            />
                            <input 
                                type="datetime-local" 
                                v-model="newCardDeadline" 
                                placeholder="Установите дедлайн" 
                            />
                            <div>
                                <input 
                                    type="text" 
                                    v-model="newTaskText" 
                                    placeholder="Введите задачу" 
                                    @keyup.enter="addNewTask"
                                />
                                <button @click="addNewTask">Добавить задачу</button>
                            </div>
                            <ul>
                                <li v-for="(task, index) in newTasks" :key="index">{{ task }}</li>
                            </ul>
                        </div>
                        <div class="modal-footer">
                            <button @click="addCard">Создать</button>
                            <button @click="showModal = false">Отмена</button>
                        </div>
                    </div>
                </div>
            </div>
            <button class="DELITE" @click="deleteAllCards">Удалить все карточки</button>
            <input 
                type="text" 
                v-model="searchQuery" 
                placeholder="Поиск по названию" 
            />
        </div>
        <div class="tables">
            <column1 
                :cards="filteredCards.filter(card => !card.moved)" 
                :isFirstColumnLocked="isFirstColumnLocked" 
                @move-to-next="moveCardToNext"
                @move-to-previous="moveCardToPrevious"
                @delete-card="deleteCard"
            ></column1>
            <column2 
                :cards="filteredCards.filter(card => card.moved && !card.finalMoved)" 
                @move-to-next="moveCardToNext"
                @move-to-previous="moveCardToPrevious"
            ></column2>
            <column3 
                :cards="filteredCards.filter(card => card.moved && !card.finalMoved)" 
                @move-to-next="moveCardToNext"
                @move-to-previous="moveCardToPrevious"
            ></column3>
            <column4 
                :cards="filteredCards.filter(card => card.finalMoved)"
            ></column4>
        </div>
    </div>
    `
});