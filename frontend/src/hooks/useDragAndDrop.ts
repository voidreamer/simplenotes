import { useState, useCallback, useRef } from 'react';

interface UseDragAndDropOptions<T> {
  items: T[];
  onReorder: (items: T[]) => void;
  idKey?: keyof T;
}

interface DragState {
  isDragging: boolean;
  dragIndex: number | null;
  hoverIndex: number | null;
}

export function useDragAndDrop<T>({ items, onReorder, idKey = 'id' as keyof T }: UseDragAndDropOptions<T>) {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    dragIndex: null,
    hoverIndex: null,
  });

  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  const handleDragStart = useCallback((index: number) => {
    dragItem.current = index;
    setDragState({
      isDragging: true,
      dragIndex: index,
      hoverIndex: null,
    });
  }, []);

  const handleDragEnter = useCallback((index: number) => {
    dragOverItem.current = index;
    setDragState((prev) => ({
      ...prev,
      hoverIndex: index,
    }));
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDragEnd = useCallback(() => {
    if (dragItem.current !== null && dragOverItem.current !== null && dragItem.current !== dragOverItem.current) {
      const newItems = [...items];
      const draggedItem = newItems[dragItem.current];

      // Remove the dragged item
      newItems.splice(dragItem.current, 1);
      // Insert at new position
      newItems.splice(dragOverItem.current, 0, draggedItem);

      onReorder(newItems);
    }

    dragItem.current = null;
    dragOverItem.current = null;
    setDragState({
      isDragging: false,
      dragIndex: null,
      hoverIndex: null,
    });
  }, [items, onReorder]);

  const handleDragLeave = useCallback(() => {
    setDragState((prev) => ({
      ...prev,
      hoverIndex: null,
    }));
  }, []);

  const getDragHandleProps = useCallback((index: number) => ({
    draggable: true,
    onDragStart: () => handleDragStart(index),
    onDragEnter: () => handleDragEnter(index),
    onDragOver: handleDragOver,
    onDragEnd: handleDragEnd,
    onDragLeave: handleDragLeave,
  }), [handleDragStart, handleDragEnter, handleDragOver, handleDragEnd, handleDragLeave]);

  const getItemClassName = useCallback((index: number, baseClassName: string) => {
    const classes = [baseClassName];

    if (dragState.isDragging && dragState.dragIndex === index) {
      classes.push('dragging');
    }

    if (dragState.isDragging && dragState.hoverIndex === index && dragState.dragIndex !== index) {
      classes.push('dragOver');
    }

    return classes.join(' ');
  }, [dragState]);

  return {
    dragState,
    getDragHandleProps,
    getItemClassName,
  };
}
