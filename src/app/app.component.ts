import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TodoService } from './services/todo.service';
import { FilterType, SortType, Priority } from './models/todo.model';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  public todoService = inject(TodoService);
  
  // Form fields
  newTodoTitle = '';
  newTodoPriority: Priority = 'medium';
  newTodoDueDate: string = '';
  
  // Editing state
  editingTodoId: number | null = null;
  editingTitle = '';
  
  // Computed values
  remainingCount = computed(() => this.todoService.getRemainingCount());
  stats = computed(() => this.todoService.getStats());
  
  addTodo(): void {
    if (this.newTodoTitle.trim()) {
      this.todoService.addTodo(
        this.newTodoTitle,
        this.newTodoPriority,
        this.newTodoDueDate || null
      );
      this.newTodoTitle = '';
      this.newTodoPriority = 'medium';
      this.newTodoDueDate = '';
    }
  }
  
  startEdit(todo: any): void {
    this.editingTodoId = todo.id;
    this.editingTitle = todo.title;
  }
  
  saveEdit(id: number): void {
    if (this.editingTitle.trim()) {
      this.todoService.updateTodo(id, { title: this.editingTitle.trim() });
    }
    this.cancelEdit();
  }
  
  cancelEdit(): void {
    this.editingTodoId = null;
    this.editingTitle = '';
  }
  
  updatePriority(id: number, priority: Priority): void {
    this.todoService.updateTodo(id, { priority });
  }
  
  updateDueDate(id: number, dueDate: string): void {
    this.todoService.updateTodo(id, { dueDate: dueDate || null });
  }
  
  toggleTodo(id: number): void {
    this.todoService.toggleTodo(id);
  }
  
  deleteTodo(id: number): void {
    this.todoService.deleteTodo(id);
  }
  
  undoDelete(): void {
    this.todoService.undoDelete();
  }
  
  clearCompleted(): void {
    this.todoService.clearCompleted();
  }
  
  setFilter(filter: FilterType): void {
    this.todoService.setFilter(filter);
  }
  
  setSort(sort: SortType): void {
    this.todoService.setSort(sort);
  }
  
  isFilterActive(filter: FilterType): boolean {
    return this.todoService.currentFilter() === filter;
  }
  
  isSortActive(sort: SortType): boolean {
    return this.todoService.currentSort() === sort;
  }
  
  getPriorityClass(priority: Priority): string {
    return `priority-${priority}`;
  }
  
  formatDueDate(dueDate: string | null): string {
    if (!dueDate) return '';
    const date = new Date(dueDate);
    return date.toLocaleDateString();
  }
  
  isDueDatePast(dueDate: string | null): boolean {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  }
}