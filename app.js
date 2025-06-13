$(document).ready(function () {
    // Настройка toastr для уведомлений
    toastr.options = {
        closeButton: true,
        progressBar: true,
        positionClass: 'toast-bottom-right',
        timeOut: '2000',
    };

    // Инициализация Bootstrap tooltips
    $('[data-bs-toggle="tooltip"]').tooltip();

    // Инициализация приложения
    loadTasks();
    updateCounters();
    updateLastUpdate();

    // Включение валидации форм Bootstrap
    const forms = document.querySelectorAll('.needs-validation');
    Array.from(forms).forEach((form) => {
        form.addEventListener(
            'submit',
            (event) => {
                if (!form.checkValidity()) {
                    event.preventDefault();
                    event.stopPropagation();
                }
                form.classList.add('was-validated');
            },
            false
        );
    });

    // Обработчик отправки формы для добавления задачи
    $('#todo-form').on('submit', function (e) {
        e.preventDefault();

        const todoInput = $('#todo-input');
        const taskText = todoInput.val().trim();
        const priority = $('#priority-select').val();

        if (taskText) {
            addTask(taskText, false, priority);
            todoInput.val('');
            $('#priority-select').val('none');

            // Сброс валидации формы
            $(this).removeClass('was-validated');

            // Уведомление с использованием toastr
            toastr.success('Задача добавлена');

            updateCounters();
            applyCurrentFilter();
        }
    });

    // Обработчик для очистки завершенных задач
    $('#clear-completed').on('click', function () {
        // Анимация с использованием jQuery
        $('.todo-item.completed').fadeOut(300, function () {
            $(this).remove();
            saveTasks();
            updateCounters();
            checkEmptyList();

            // Уведомление
            toastr.info('Завершенные задачи удалены');
        });
    });

    // Обработчик для очистки всех задач
    $('#clear-all').on('click', function () {
        // Используем Bootstrap модальное окно для подтверждения
        const confirmDelete = confirm(
            'Вы уверены, что хотите удалить все задачи?'
        );

        if (confirmDelete) {
            // Анимация с использованием jQuery
            $('#todo-list')
                .children()
                .fadeOut(300, function () {
                    $('#todo-list').empty();
                    saveTasks();
                    updateCounters();
                    checkEmptyList();

                    // Уведомление
                    toastr.warning('Все задачи удалены');
                });
        }
    });

    // Делегирование событий для динамически созданных элементов
    $('#todo-list').on('click', '.todo-check', function () {
        const listItem = $(this).closest('.todo-item');

        // Анимация с использованием jQuery UI
        if (!listItem.hasClass('completed')) {
            listItem.effect('highlight', {}, 500);
        }

        listItem.toggleClass('completed');
        saveTasks();
        updateCounters();
        applyCurrentFilter();
    });

    $('#todo-list').on('click', '.todo-delete', function () {
        const listItem = $(this).closest('.todo-item');

        // Анимация с использованием jQuery
        listItem.slideUp(300, function () {
            $(this).remove();
            saveTasks();
            updateCounters();
            checkEmptyList();

            // Уведомление
            toastr.error('Задача удалена');
        });
    });

    $('#todo-list').on('click', '.todo-priority', function () {
        const listItem = $(this).closest('.todo-item');

        // Циклическое изменение приоритета
        if (listItem.hasClass('priority-high')) {
            listItem.removeClass('priority-high');
            $(this)
                .attr('title', 'Без приоритета')
                .tooltip('dispose')
                .tooltip();
        } else if (listItem.hasClass('priority-medium')) {
            listItem.removeClass('priority-medium').addClass('priority-high');
            $(this)
                .attr('title', 'Высокий приоритет')
                .tooltip('dispose')
                .tooltip();
        } else if (listItem.hasClass('priority-low')) {
            listItem.removeClass('priority-low').addClass('priority-medium');
            $(this)
                .attr('title', 'Средний приоритет')
                .tooltip('dispose')
                .tooltip();
        } else {
            listItem.addClass('priority-low');
            $(this)
                .attr('title', 'Низкий приоритет')
                .tooltip('dispose')
                .tooltip();
        }

        // Анимация с использованием jQuery UI
        listItem.effect('highlight', {}, 500);

        saveTasks();
    });

    // Обработчик для редактирования задачи
    $('#todo-list').on('click', '.todo-edit', function () {
        const listItem = $(this).closest('.todo-item');
        const taskText = listItem.find('.todo-text').text();
        let priority = 'none';

        if (listItem.hasClass('priority-high')) {
            priority = 'priority-high';
        } else if (listItem.hasClass('priority-medium')) {
            priority = 'priority-medium';
        } else if (listItem.hasClass('priority-low')) {
            priority = 'priority-low';
        }

        const dueDate = listItem.data('due-date') || '';

        // Заполняем модальное окно
        $('#edit-task-text').val(taskText);
        $('#edit-priority').val(priority);
        $('#edit-due-date').val(dueDate);

        // Сохраняем ссылку на редактируемый элемент
        $('#save-edit').data('item', listItem);

        // Открываем модальное окно с помощью Bootstrap
        const editModal = new bootstrap.Modal(
            document.getElementById('editTaskModal')
        );
        editModal.show();
    });

    // Обработчик для сохранения отредактированной задачи
    $('#save-edit').on('click', function () {
        const listItem = $(this).data('item');
        const newText = $('#edit-task-text').val().trim();
        const newPriority = $('#edit-priority').val();
        const newDueDate = $('#edit-due-date').val();

        if (newText) {
            // Обновляем текст задачи
            listItem.find('.todo-text').text(newText);

            // Обновляем приоритет
            listItem.removeClass('priority-high priority-medium priority-low');
            if (newPriority !== 'none') {
                listItem.addClass(newPriority);
            }

            // Обновляем срок выполнения
            listItem.data('due-date', newDueDate);
            if (newDueDate) {
                const formattedDate = new Date(newDueDate).toLocaleDateString();
                listItem.find('.due-date').text(formattedDate);
                listItem.find('.due-date-container').show();
            } else {
                listItem.find('.due-date-container').hide();
            }

            // Анимация с использованием jQuery UI
            listItem.effect('highlight', {}, 500);

            // Сохраняем изменения
            saveTasks();

            // Закрываем модальное окно
            bootstrap.Modal.getInstance(
                document.getElementById('editTaskModal')
            ).hide();

            // Уведомление
            toastr.success('Задача обновлена');
        }
    });

    // Обработчики для фильтров
    $('#filter-all').on('change', function () {
        if ($(this).is(':checked')) {
            applyFilter('all');
        }
    });

    $('#filter-active').on('change', function () {
        if ($(this).is(':checked')) {
            applyFilter('active');
        }
    });

    $('#filter-completed').on('change', function () {
        if ($(this).is(':checked')) {
            applyFilter('completed');
        }
    });

    // Обработчики для сортировки
    $('#sort-alpha').on('click', function () {
        sortTasks('alpha');
        toastr.info('Задачи отсортированы по алфавиту');
    });

    $('#sort-priority').on('click', function () {
        sortTasks('priority');
        toastr.info('Задачи отсортированы по приоритету');
    });

    // Обработчик для переключения темы
    $('#toggle-theme').on('click', function () {
        $('body').toggleClass('dark-mode');

        if ($('body').hasClass('dark-mode')) {
            $(this).html('<i class="bi bi-sun me-2"></i>Светлая тема');
            localStorage.setItem('theme', 'dark');
            toastr.info('Темная тема включена');
        } else {
            $(this).html('<i class="bi bi-moon me-2"></i>Темная тема');
            localStorage.setItem('theme', 'light');
            toastr.info('Светлая тема включена');
        }
    });

    // Функция для добавления новой задачи
    function addTask(text, completed = false, priority = 'none', dueDate = '') {
        const todoItem = $(`
            <li class="list-group-item todo-item d-flex align-items-center ${
                completed ? 'completed' : ''
            } ${priority}">
                <div class="form-check">
                    <input type="checkbox" class="form-check-input todo-check" ${
                        completed ? 'checked' : ''
                    }>
                </div>
                <span class="todo-text">${text}</span>
                <small class="text-muted ms-2 due-date-container" ${
                    !dueDate ? 'style="display:none"' : ''
                }>
                    <i class="bi bi-calendar"></i> <span class="due-date">${
                        dueDate ? new Date(dueDate).toLocaleDateString() : ''
                    }</span>
                </small>
                <div class="ms-auto">
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-primary todo-priority" data-bs-toggle="tooltip" title="Изменить приоритет">
                            <i class="bi bi-flag"></i>
                        </button>
                        <button class="btn btn-outline-secondary todo-edit" data-bs-toggle="tooltip" title="Редактировать">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-outline-danger todo-delete" data-bs-toggle="tooltip" title="Удалить">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </div>
            </li>
        `);

        // Сохраняем срок выполнения в data-атрибуте
        if (dueDate) {
            todoItem.data('due-date', dueDate);
        }

        // Добавляем с анимацией
        todoItem.hide().appendTo('#todo-list').slideDown(300);

        // Инициализируем tooltips для новых кнопок
        todoItem.find('[data-bs-toggle="tooltip"]').tooltip();

        saveTasks();
        checkEmptyList();
        applyCurrentFilter();
    }

    // Функция для сохранения задач в localStorage
    function saveTasks() {
        const tasks = [];

        $('.todo-item').each(function () {
            const $this = $(this);
            let priority = 'none';

            if ($this.hasClass('priority-high')) {
                priority = 'priority-high';
            } else if ($this.hasClass('priority-medium')) {
                priority = 'priority-medium';
            } else if ($this.hasClass('priority-low')) {
                priority = 'priority-low';
            }

            tasks.push({
                text: $this.find('.todo-text').text(),
                completed: $this.hasClass('completed'),
                priority: priority,
                dueDate: $this.data('due-date') || '',
            });
        });

        localStorage.setItem('todos', JSON.stringify(tasks));
        updateLastUpdate();
    }

    // Функция для загрузки задач из localStorage
    function loadTasks() {
        const savedTasks = localStorage.getItem('todos');

        if (savedTasks) {
            const tasks = JSON.parse(savedTasks);

            if (tasks.length > 0) {
                tasks.forEach((task) => {
                    addTask(
                        task.text,
                        task.completed,
                        task.priority,
                        task.dueDate
                    );
                });
            } else {
                checkEmptyList();
            }
        } else {
            checkEmptyList();
        }

        // Загружаем тему
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            $('body').addClass('dark-mode');
            $('#toggle-theme').html(
                '<i class="bi bi-sun me-2"></i>Светлая тема'
            );
        }

        // Инициализируем сортировку с помощью jQuery UI
        $('#todo-list').sortable({
            axis: 'y',
            cursor: 'grabbing',
            update: function () {
                saveTasks();
                toastr.info('Порядок задач изменен');
            },
        });
    }

    // Функция для обновления счетчиков задач
    function updateCounters() {
        const totalTasks = $('.todo-item').length;
        const completedTasks = $('.todo-item.completed').length;
        const remainingTasks = totalTasks - completedTasks;

        $('#tasks-counter').text(remainingTasks);
        $('#completed-counter').text(completedTasks);
        $('#total-counter').text(totalTasks);

        // Обновляем прогресс-бар
        const progressPercent =
            totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
        $('#progress-bar').css('width', progressPercent + '%');

        // Меняем цвет прогресс-бара в зависимости от прогресса
        if (progressPercent < 30) {
            $('#progress-bar')
                .removeClass('bg-warning bg-success')
                .addClass('bg-danger');
        } else if (progressPercent < 70) {
            $('#progress-bar')
                .removeClass('bg-danger bg-success')
                .addClass('bg-warning');
        } else {
            $('#progress-bar')
                .removeClass('bg-danger bg-warning')
                .addClass('bg-success');
        }
    }

    // Функция для проверки пустого списка
    function checkEmptyList() {
        if ($('.todo-item').length === 0) {
            $('#todo-list').html(`
                <div class="text-center py-4 empty-list">
                    <i class="bi bi-check2-all fs-1 text-muted"></i>
                    <p class="mt-2 text-muted">Список задач пуст</p>
                </div>
            `);
        } else {
            $('.empty-list').remove();
        }
    }

    // Функция для применения фильтра
    function applyFilter(filter) {
        switch (filter) {
            case 'active':
                $('.todo-item').hide();
                $('.todo-item:not(.completed)').show();
                break;
            case 'completed':
                $('.todo-item').hide();
                $('.todo-item.completed').show();
                break;
            default: // 'all'
                $('.todo-item').show();
                break;
        }
    }

    // Функция для определения текущего фильтра
    function applyCurrentFilter() {
        if ($('#filter-active').is(':checked')) {
            applyFilter('active');
        } else if ($('#filter-completed').is(':checked')) {
            applyFilter('completed');
        } else {
            applyFilter('all');
        }
    }

    // Функция для сортировки задач
    function sortTasks(type) {
        const list = $('#todo-list');
        const items = list.children('.todo-item').get();

        items.sort(function (a, b) {
            if (type === 'alpha') {
                const textA = $(a).find('.todo-text').text().toLowerCase();
                const textB = $(b).find('.todo-text').text().toLowerCase();
                return textA.localeCompare(textB);
            } else if (type === 'priority') {
                const priorityOrder = {
                    'priority-high': 1,
                    'priority-medium': 2,
                    'priority-low': 3,
                    '': 4,
                };

                let priorityA = '';
                if ($(a).hasClass('priority-high')) priorityA = 'priority-high';
                else if ($(a).hasClass('priority-medium'))
                    priorityA = 'priority-medium';
                else if ($(a).hasClass('priority-low'))
                    priorityA = 'priority-low';

                let priorityB = '';
                if ($(b).hasClass('priority-high')) priorityB = 'priority-high';
                else if ($(b).hasClass('priority-medium'))
                    priorityB = 'priority-medium';
                else if ($(b).hasClass('priority-low'))
                    priorityB = 'priority-low';

                return priorityOrder[priorityA] - priorityOrder[priorityB];
            }
        });

        // Анимация с использованием jQuery UI
        $.each(items, function (i, item) {
            list.append(item);
            $(item).effect('highlight', {}, 500);
        });

        saveTasks();
    }

    // Функция для обновления времени последнего обновления
    function updateLastUpdate() {
        const now = new Date();
        const formattedDate =
            now.toLocaleTimeString() + ' ' + now.toLocaleDateString();
        $('#last-update').text(formattedDate);
    }
});

