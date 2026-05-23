import { Injectable, signal, computed, effect } from '@angular/core';
import { Todo, FilterType, SortType, DeletedTodo, Priority } from '../models/todo.model';

@Injectable({
  providedIn: 'root'
})
export class TodoService {
  private readonly STORAGE_KEY = 'angular-todo-app';
  private readonly UNDO_TIMEOUT = 5000; // 5 seconds to undo
  
  // State signals
  private todosSignal = signal<Todo[]>([]);
  private filterSignal = signal<FilterType>('all');
  private sortSignal = signal<SortType>('created');
  private searchQuerySignal = signal<string>('');
  private deletedTodoSignal = signal<DeletedTodo | null>(null);
  
  // Public readonly signals
  public todos = this.todosSignal.asReadonly();
  public currentFilter = this.filterSignal.asReadonly();
  public currentSort = this.sortSignal.asReadonly();
  public searchQuery = this.searchQuerySignal.asReadonly();
  public deletedTodo = this.deletedTodoSignal.asReadonly();
  
  // Computed: filtered, searched, sorted todos
  public processedTodos = computed(() => {
    let todos = this.todosSignal();
    
    // Apply search filter
    const query = this.searchQuerySignal().toLowerCase().trim();
    if (query) {
      todos = todos.filter(todo => todo.title.toLowerCase().includes(query));
    }
    
    // Apply status filter
    const filter = this.filterSignal();
    switch (filter) {
      case 'active':
        todos = todos.filter(todo => !todo.completed);
        break;
      case 'completed':
        todos = todos.filter(todo => todo.completed);
        break;
    }
    
    // Apply sorting
    const sort = this.sortSignal();
    todos = [...todos].sort((a, b) => {
      switch (sort) {
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        case 'dueDate':
          if (!a.dueDate && !b.dueDate) return 0;
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return a.dueDate.localeCompare(b.dueDate);
        default: // created
          return b.createdAt - a.createdAt;
      }
    });
    
    return todos;
  });
  
  constructor() {
    this.loadFromStorage();
    
    // Save todos to localStorage on change
    effect(() => {
      const todos = this.todosSignal();
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(todos));
    });
    
    // Auto-clear deleted todo after timeout
    effect(() => {
      const deleted = this.deletedTodoSignal();
      if (deleted) {
        setTimeout(() => {
          if (this.deletedTodoSignal()?.timestamp === deleted.timestamp) {
            this.clearDeletedTodo();
          }
        }, this.UNDO_TIMEOUT);
      }
    });
  }
  
  private loadFromStorage(): void {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      try {
        const todos: Todo[] = JSON.parse(stored);
        this.todosSignal.set(todos);
      } catch (error) {
        console.error('Error loading todos', error);
        this.todosSignal.set([]);
      }
    }
  }
  
  addTodo(title: string, priority: Priority = 'medium', dueDate: string | null = null): void {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;
    
    const newTodo: Todo = {
      id: Date.now(),
      title: trimmedTitle,
      completed: false,
      createdAt: Date.now(),
      priority,
      dueDate
    };
    
    this.todosSignal.update(todos => [newTodo, ...todos]);
  }
  
  updateTodo(id: number, updates: Partial<Omit<Todo, 'id' | 'createdAt'>>): void {
    this.todosSignal.update(todos =>
      todos.map(todo => todo.id === id ? { ...todo, ...updates } : todo)
    );
  }
  
  toggleTodo(id: number): void {
    this.todosSignal.update(todos =>
      todos.map(todo =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  }
  
  deleteTodo(id: number): void {
    const todoToDelete = this.todosSignal().find(t => t.id === id);
    if (todoToDelete) {
      // Store for undo
      this.deletedTodoSignal.set({ todo: todoToDelete, timestamp: Date.now() });
      // Remove from list
      this.todosSignal.update(todos => todos.filter(todo => todo.id !== id));
    }
  }
  
  undoDelete(): void {
    const deleted = this.deletedTodoSignal();
    if (deleted) {
      this.todosSignal.update(todos => [deleted.todo, ...todos]);
      this.clearDeletedTodo();
    }
  }
  
  clearDeletedTodo(): void {
    this.deletedTodoSignal.set(null);
  }
  
  clearCompleted(): void {
    this.todosSignal.update(todos => todos.filter(todo => !todo.completed));
  }
  
  setFilter(filter: FilterType): void {
    this.filterSignal.set(filter);
  }
  
  setSort(sort: SortType): void {
    this.sortSignal.set(sort);
  }
  
  setSearchQuery(query: string): void {
    this.searchQuerySignal.set(query);
  }
  
  getRemainingCount(): number {
    return this.todosSignal().filter(todo => !todo.completed).length;
  }
  
  getStats() {
    const todos = this.todosSignal();
    return {
      total: todos.length,
      active: todos.filter(t => !t.completed).length,
      completed: todos.filter(t => t.completed).length,
      highPriority: todos.filter(t => t.priority === 'high' && !t.completed).length
    };
  }
}