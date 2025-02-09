Vue.component('task-card', {
    props: ['card', 'currentColumnIndex', 'isFirstColumnLocked', 'fromColumnIndex'],
    template: `
    <div class="task-card">
        <p>{{ getPriorityText(card.isPriority) }}</p>
        <h2>Задача: {{ card.title }}</h2>
        <h3>Дата создания:{{ card.createdDate }}</h3>
        <h4>Описание задачи:</h4>
        <ul v-if="card.tasks && card.tasks.length > 0">
            <li v-for="(task, index) in card.tasks" :key="index">
                <input :disabled="currentColumnIndex === 3 || (isAnyPriorityCardActive && !card.isPriority)" type="checkbox" v-model="task.completed" @change="saveTasks()" />
                    {{ task.text }}
            </li>
        </ul>
        <div v-if="currentColumnIndex !== 3">
            <button :disabled="isAnyPriorityCardActive && !card.isPriority" class="EDIT" @click="$emit('edit-card', card.id)">Редактировать</button>
            <button v-if="currentColumnIndex === 0" :disabled="isAnyPriorityCardActive && !card.isPriority" class="DELITE" @click="$emit('delete-card', card.id)">Удалить</button>
            <button v-if="currentColumnIndex === 2" @click="returnToPrevious" :disabled="isAnyPriorityCardActive && !card.isPriority">Переместить назад</button>
            <button v-if="currentColumnIndex !== 3 || card.returnReason || !allTasksCompleted" :disabled="!allTasksCompleted || (isAnyPriorityCardActive && !card.isPriority)" @click="moveToNext">Переместить вперед</button>
            <div v-if="shouldShowReturnReason && currentColumnIndex < 2">
                Введите причину возврата:
                <input v-model="returnReason" placeholder="Причина возврата" :disabled="isAnyPriorityCardActive && !card.isPriority" />
                <button @click="submitReturnReason" :disabled="isAnyPriorityCardActive && !card.isPriority">Сохранить причину</button>
            </div>
        </div>
        <h3>Дедлайн: {{ card.deadline }}</h3>
        <h3 v-if="card.finalMoved && card.lastUpdated" style="font-weight: bold">Выполнено: {{ card.lastUpdated }}</h3>
        <p v-if="card.returnReason && currentColumnIndex !== 3" style="color: red;">Причина возврата: {{ card.returnReason }}</p>
        <h4 v-if="currentColumnIndex !== 3">Последнее обновление: {{ card.lastUpdated }}</h4>
        <h3 v-if="card.finalMoved && card.lastUpdated" style="font-weight: bold">
            <span v-if="card.isOverdue" style="color: red;">(Просрочено)</span>
            <span v-else style="color: green;">(Выполнено в срок)</span>
        </h3>
    </div>
    `,
    data() {
        return {
            newTask: '',
            returnReason: ''
        };
    },
    computed: {
        shouldShowReturnReason() {
            return this.card.shouldShowReturnReason;
        },
        allTasksCompleted() {
            return this.card.tasks.every(task => task.completed);
        },
        isAnyPriorityCardActive() {
            return this.cards && this.cards.some(card => card.isPriority && !card.finalMoved);
        },
        isMoveDisabled() {
            const higherPriorityExists = this.allCards && this.allCards.some(c =>
                c.priority < this.card.priority && currentColumnIndex !==3
            );

            return higherPriorityExists;
        }
    },
    methods: {
        addTask() {
            if (this.newTask) {
                if (!this.card.tasks) {
                    this.card.tasks = [];
                }
                this.card.tasks.push({ text: this.newTask, completed: false });
                this.newTask = '';
                this.saveTasks();
            }
        },
        removeTask(index) {
            this.card.tasks.splice(index, 1);
            this.saveTasks();
        },
        saveTasks() {
            const cards = JSON.parse(localStorage.getItem('cards')) || [];
            const cardIndex = cards.findIndex(c => c.id === this.card.id);
            if (cardIndex !== -1) {
                cards[cardIndex] = {
                    ...this.card,
                    tasks: this.card.tasks.map(task => ({ ...task }))
                };
            } else {
                cards.push({
                    ...this.card,
                    tasks: this.card.tasks.map(task => ({ ...task }))
                });
            }
            localStorage.setItem('cards', JSON.stringify(cards));
        },
        moveToNext(card) {
            this.card.lastUpdated = new Date().toLocaleString();
            this.$emit('move-to-next', this.card, this.currentColumnIndex);
        },
        returnToPrevious(card) {
            this.card.lastUpdated = new Date().toLocaleString();
            this.$emit('move-to-previous', this.card, this.currentColumnIndex);
        },
        submitReturnReason() {
            this.card.returnReason = this.returnReason;
            this.returnReason = '';
            this.card.shouldShowReturnReason = false;
            this.saveTasks();
        },
        getPriorityText(priority) {
            return priority ? "Приоритетная карточка " : "Обычная карточка";
        },
    },
    mounted() {
        const cards = JSON.parse(localStorage.getItem('cards')) || [];
        const savedCard = cards.find(c => c.id === this.card.id);
        if (savedCard && savedCard.tasks) {
            this.card.tasks = savedCard.tasks.map(task => ({ ...task }));
        } else {
            this.card.tasks = [];
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
            @delete-card="$emit('delete-card', $event)"
            @edit-card="$emit('edit-card', $event)"
        ></task-card>
    </div>
    `,
    methods: {
        moveToNext(card, currentColumnIndex) {
            this.$emit('move-to-next', card, currentColumnIndex);
        },
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
            @edit-card="$emit('edit-card', $event)"
        ></task-card>
    </div>
    `,
    methods: {
        moveToNext(card, currentColumnIndex) {
            this.$emit('move-to-next', card, currentColumnIndex);
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
            @edit-card="$emit('edit-card', $event)"
            @move-to-next="moveToNext"
            @move-to-previous="returnToPrevious"
        ></task-card>
    </div>
    `,
    methods: {
        moveToNext(card, currentColumnIndex) {
            this.$emit('move-to-next', card, currentColumnIndex);
        },
        returnToPrevious(card, currentColumnIndex) {
            this.$emit('move-to-previous', card, currentColumnIndex);
        }
    }
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
            newCardDeadline: '',
            editingCardId: null,
            editingCardTitle: "",
            editingCardDeadline: "",
            editingCardTasks: [],
            isEditMode: false,
            editingCardIsPriority: false
        };
    },
    computed: {
        filteredCards() {
            const query = this.searchQuery.toLowerCase();
            return this.cards.filter(card => card.title.toLowerCase().includes(query));
        },
        isAnyPriorityCardActive() {
            return this.cards.some(card => card.isPriority && !card.finalMoved);
        }
    },
    methods: {
        setPriority(card) {
            const columnIndex = this.columns.findIndex(column => column.cards.includes(card));

            if (columnIndex === 2) {
                card.isPriority = false;
                this.priorityCard = null;
            } else {
                if (this.priorityCard === card) {
                    card.isPriority = false;
                    this.priorityCard = null;
                } else {
                    if (this.priorityCard) {
                        this.priorityCard.isPriority = false;
                    }
                    card.isPriority = true;
                    this.priorityCard = card;
                }
            }

            this.saveCards();
        },
        addCard() {
            if (this.newCardTitle.trim()) {
                const card = {
                    title: this.newCardTitle,
                    id: Date.now(),
                    tasks: this.newTasks.map(task => ({text: task, completed: false})),
                    moved: false,
                    finalMoved: false,
                    lastUpdated: null,
                    tested: false,
                    createdDate: new Date().toLocaleString(),
                    deadline: this.newCardDeadline,
                    isPriority: this.editingCardIsPriority // Устанавливаем приоритет
                };

                this.cards.push(card);
                this.newCardTitle = '';
                this.newTasks = [];
                this.saveCards();
                this.newCardDeadline = '';
                this.showModal = false;
                this.editingCardIsPriority = false; // Сбрасываем приоритет после создания
            } else {
                alert('Введите название карточки.');
            }
        },
        addNewTask() {
            if (this.newTaskText.trim()) {
                if (this.isEditMode) {
                    this.editingCardTasks.push(this.newTaskText);
                } else {
                    this.newTasks.push(this.newTaskText);
                }
                this.newTaskText = '';
            }
        },
        removeTask(index) {
            if (this.isEditMode) {
                this.editingCardTasks.splice(index, 1);
            } else {
                this.newTasks.splice(index, 1);
            }
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
            if (this.isAnyPriorityCardActive && !card.isPriority) {
                alert('Перемещение заблокировано. Сначала завершите приоритетную задачу.');
                return;
            }

            const cardIndex = this.cards.indexOf(card);
            if (cardIndex !== -1 && currentColumnIndex < 3) {
                if (currentColumnIndex === 0) {
                    this.cards[cardIndex].moved = true;
                } else if (currentColumnIndex === 1) {
                    this.cards[cardIndex].tested = true;
                } else if (currentColumnIndex === 2) {
                    this.cards[cardIndex].finalMoved = true;
                    this.cards[cardIndex].finalCompletion = new Date().toLocaleString();
                    const deadlineDate = new Date(this.cards[cardIndex].deadline);
                    const currentDate = new Date();
                    this.cards[cardIndex].isOverdue = deadlineDate < currentDate;
                }
                this.saveCards();
            }
        },
        moveCardToPrevious(card, currentColumnIndex) {
            // Проверяем, есть ли активные приоритетные карточки
            if (this.isAnyPriorityCardActive && !card.isPriority) {
                alert('Перемещение назад заблокировано. Сначала завершите приоритетную задачу.');
                return;
            }

            const cardIndex = this.cards.indexOf(card);

            // Убеждаемся, что карточка существует и находится не в первой колонке
            if (cardIndex !== -1 && currentColumnIndex > 0) {
                if (currentColumnIndex === 2) {
                    // Если карточка в третьей колонке ("Тестирование")
                    this.cards[cardIndex].tested = false; // Сбрасываем флаг тестирования
                    this.cards[cardIndex].shouldShowReturnReason = true; // Показываем поле для причины возврата
                } else if (currentColumnIndex === 1) {
                    // Если карточка во второй колонке ("Задачи в работе")
                    this.cards[cardIndex].moved = false; // Сбрасываем флаг перемещения
                    this.cards[cardIndex].shouldShowReturnReason = false; // Скрываем поле для причины возврата
                }

                // Сохраняем изменения
                this.saveCards();
            }
        },
        saveCards() {
            localStorage.setItem('cards', JSON.stringify(this.cards));
        },
        editCard(cardId) {
            if (this.isAnyPriorityCardActive && !this.cards.find(card => card.id === cardId)?.isPriority) {
                alert('Редактирование заблокировано. Сначала завершите приоритетную задачу.');
                return;
            }
            const cardToEdit = this.cards.find(card => card.id === cardId);
            if (cardToEdit) {
                this.editingCardId = cardToEdit.id;
                this.editingCardTitle = cardToEdit.title;
                this.editingCardDeadline = cardToEdit.deadline;
                this.editingCardTasks = cardToEdit.tasks.map(task => task.text);
                this.showModal = true;
                this.isEditMode = true;
                this.lastUpdated = new Date().toLocaleString();
                this.editingCardIsPriority = cardToEdit.isPriority;
            }
        },
        updateCard() {
            const cardIndex = this.cards.findIndex(card => card.id === this.editingCardId);
            if (cardIndex !== -1) {
                const existingTasksMap = {};
                this.cards[cardIndex].tasks.forEach(task => {
                    existingTasksMap[task.text] = task.completed;
                });

                this.cards[cardIndex].tasks = this.editingCardTasks.map(taskText => {
                    return {
                        text: taskText,
                        completed: existingTasksMap[taskText] ?? false
                    };
                });

                this.cards[cardIndex].title = this.editingCardTitle;
                this.cards[cardIndex].deadline = this.editingCardDeadline;
                this.cards[cardIndex].lastUpdated = new Date().toLocaleString();
                this.cards[cardIndex].isPriority = this.editingCardIsPriority; // Сохраняем приоритет

                this.saveCards();
                this.resetEditingState();
            }
        },
        resetEditingState() {
            this.editingCardId = null;
            this.editingCardTitle = '';
            this.editingCardDeadline = '';
            this.showModal = false;
            this.isEditMode = false;
        },
        handleSubmit() {
            if (this.isEditMode) {
                if (this.validateEditCard()) {
                    this.updateCard();
                }
            } else {
                if (this.validateNewCard()) {
                    this.addCard();
                }
            }
        },
        validateEditCard() {
            return this.editingCardTitle && this.editingCardDeadline;
        },
        validateNewCard() {
            return this.newCardTitle && this.newCardDeadline;
        },
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
                            <h3>{{ isEditMode ? 'Редактировать карточку' : 'Создать новую карточку' }}</h3>
                        </div>
                        <div class="modal-body">
                            <label>
                                <input type="checkbox" v-model="editingCardIsPriority" />
                                Установить приоритет
                            </label>
                            <div v-if="isEditMode">
                                <input 
                                    type="text" 
                                    v-model="editingCardTitle" 
                                    placeholder="Введите название карточки" 
                                />
                                <input 
                                    type="datetime-local" 
                                    v-model="editingCardDeadline" 
                                    placeholder="Установите дедлайн" 
                                />
                            </div>
                            <div v-else>
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
                            </div>
                            <div>
                                <input 
                                    type="text" 
                                    v-model="newTaskText" 
                                    placeholder="Введите задачу" 
                                    @keyup.enter="addNewTask"
                                />
                                <button @click="addNewTask">Добавить задачу</button>
                            </div>
                            <h3>Существующие задачи:</h3>
                            <ul>
                                <li v-for="(task, index) in (isEditMode ? editingCardTasks : newTasks)" :key="index">
                                    {{ task }}
                                    <button @click="removeTask(index)">Удалить</button>
                                </li>
                            </ul>
                        </div>
                        <div class="modal-footer">
                            <button @click="handleSubmit">
                                {{ isEditMode ? 'Сохранить изменения' : 'Создать' }}
                            </button>
                            <button @click="resetEditingState">Отмена</button>
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
                @delete-card="deleteCard"
                @edit-card="editCard"
                @move-to-previous="moveCardToPrevious"
            ></column1>
            <column2 
                :cards="filteredCards.filter(card => card.moved && !card.tested)" 
                @move-to-next="moveCardToNext"
                @edit-card="editCard"
                @move-to-previous="moveCardToPrevious"
            ></column2>
            <column3 
                :cards="filteredCards.filter(card => card.tested && !card.finalMoved)" 
                @move-to-next="moveCardToNext"
                @move-to-previous="moveCardToPrevious"
                @edit-card="editCard"
            ></column3>
            <column4 
                :cards="filteredCards.filter(card => card.finalMoved)"
            ></column4>
        </div>
    </div>
    `
});