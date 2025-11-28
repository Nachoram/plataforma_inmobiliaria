/**
 * VirtualizedList.tsx
 *
 * Componente de virtualización para listas grandes
 * Optimizado para rendimiento con listas de documentos
 */

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  forwardRef,
  useImperativeHandle
} from 'react';

interface VirtualizedListItem {
  id: string;
  height?: number;
  [key: string]: any;
}

interface VirtualizedListProps<T extends VirtualizedListItem> {
  items: T[];
  itemHeight?: number | ((item: T, index: number) => number);
  containerHeight: number;
  renderItem: (item: T, index: number, style: React.CSSProperties) => React.ReactNode;
  overscan?: number;
  className?: string;
  onScroll?: (scrollTop: number, scrollHeight: number) => void;
  onEndReached?: () => void;
  endThreshold?: number;
  estimatedItemHeight?: number;
}

interface VirtualizedListRef {
  scrollToIndex: (index: number, align?: 'start' | 'center' | 'end') => void;
  scrollToTop: () => void;
  scrollToBottom: () => void;
  getVisibleRange: () => { start: number; end: number };
}

const DEFAULT_OVERSCAN = 5;
const DEFAULT_END_THRESHOLD = 50;

function VirtualizedListInner<T extends VirtualizedListItem>(
  {
    items,
    itemHeight = 50,
    containerHeight,
    renderItem,
    overscan = DEFAULT_OVERSCAN,
    className = '',
    onScroll,
    onEndReached,
    endThreshold = DEFAULT_END_THRESHOLD,
    estimatedItemHeight = 50
  }: VirtualizedListProps<T>,
  ref: React.Ref<VirtualizedListRef>
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [heights, setHeights] = useState<Map<string, number>>(new Map());

  // Calcular alturas acumuladas
  const heightsArray = useMemo(() => {
    const result: number[] = [];
    let accumulatedHeight = 0;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const height = typeof itemHeight === 'function'
        ? itemHeight(item, i)
        : (heights.get(item.id) || itemHeight);

      result.push(accumulatedHeight);
      accumulatedHeight += height;
    }

    return result;
  }, [items, itemHeight, heights]);

  // Calcular total height
  const totalHeight = heightsArray.length > 0
    ? heightsArray[heightsArray.length - 1] + (
        typeof itemHeight === 'function'
          ? estimatedItemHeight
          : itemHeight
      )
    : 0;

  // Calcular rango visible
  const visibleRange = useMemo(() => {
    const startY = scrollTop;
    const endY = scrollTop + containerHeight;

    let startIndex = 0;
    let endIndex = items.length - 1;

    // Encontrar índice inicial
    for (let i = 0; i < heightsArray.length; i++) {
      if (heightsArray[i] >= startY - (overscan * estimatedItemHeight)) {
        startIndex = Math.max(0, i - overscan);
        break;
      }
    }

    // Encontrar índice final
    for (let i = startIndex; i < heightsArray.length; i++) {
      const itemTop = heightsArray[i];
      const itemHeightValue = typeof itemHeight === 'function'
        ? estimatedItemHeight
        : itemHeight;

      if (itemTop > endY + (overscan * itemHeightValue)) {
        endIndex = Math.min(items.length - 1, i + overscan);
        break;
      }
    }

    return { start: startIndex, end: endIndex };
  }, [scrollTop, containerHeight, heightsArray, items.length, overscan, itemHeight, estimatedItemHeight]);

  // Items visibles
  const visibleItems = useMemo(() => {
    const result: Array<{ item: T; index: number; style: React.CSSProperties }> = [];

    for (let i = visibleRange.start; i <= visibleRange.end && i < items.length; i++) {
      const item = items[i];
      const top = heightsArray[i] || 0;

      result.push({
        item,
        index: i,
        style: {
          position: 'absolute',
          top: top,
          left: 0,
          right: 0,
          height: typeof itemHeight === 'function'
            ? itemHeight(item, i)
            : (heights.get(item.id) || itemHeight)
        }
      });
    }

    return result;
  }, [visibleRange, items, heightsArray, itemHeight, heights]);

  // Manejar scroll
  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const newScrollTop = event.currentTarget.scrollTop;
    setScrollTop(newScrollTop);

    onScroll?.(newScrollTop, totalHeight);

    // Detectar si llegó al final
    if (onEndReached && totalHeight - newScrollTop - containerHeight < endThreshold) {
      onEndReached();
    }
  }, [totalHeight, containerHeight, endThreshold, onScroll, onEndReached]);

  // Actualizar altura de item cuando cambia
  const updateItemHeight = useCallback((itemId: string, height: number) => {
    setHeights(prev => new Map(prev.set(itemId, height)));
  }, []);

  // Exponer métodos al ref
  useImperativeHandle(ref, () => ({
    scrollToIndex: (index: number, align: 'start' | 'center' | 'end' = 'start') => {
      if (!containerRef.current || index < 0 || index >= items.length) return;

      const itemTop = heightsArray[index] || 0;
      const itemHeightValue = typeof itemHeight === 'function'
        ? estimatedItemHeight
        : itemHeight;

      let scrollTop = itemTop;

      switch (align) {
        case 'center':
          scrollTop = itemTop - (containerHeight / 2) + (itemHeightValue / 2);
          break;
        case 'end':
          scrollTop = itemTop - containerHeight + itemHeightValue;
          break;
      }

      containerRef.current.scrollTo({
        top: Math.max(0, scrollTop),
        behavior: 'smooth'
      });
    },

    scrollToTop: () => {
      containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    },

    scrollToBottom: () => {
      containerRef.current?.scrollTo({ top: totalHeight - containerHeight, behavior: 'smooth' });
    },

    getVisibleRange: () => visibleRange
  }), [heightsArray, itemHeight, estimatedItemHeight, containerHeight, totalHeight, visibleRange, items.length]);

  // Efecto para manejar cambios en items
  useEffect(() => {
    // Reset scroll si los items cambian significativamente
    if (containerRef.current && scrollTop > totalHeight - containerHeight) {
      containerRef.current.scrollTop = Math.max(0, totalHeight - containerHeight);
    }
  }, [items.length, totalHeight, containerHeight, scrollTop]);

  return (
    <div
      ref={containerRef}
      className={`virtualized-list ${className}`}
      style={{
        height: containerHeight,
        overflow: 'auto',
        position: 'relative'
      }}
      onScroll={handleScroll}
    >
      {/* Espaciador para el total height */}
      <div style={{ height: totalHeight, position: 'relative' }}>
        {/* Items visibles */}
        {visibleItems.map(({ item, index, style }) => (
          <div key={item.id} style={style}>
            {renderItem(item, index, style)}
          </div>
        ))}
      </div>
    </div>
  );
}

export const VirtualizedList = forwardRef(VirtualizedListInner) as <T extends VirtualizedListItem>(
  props: VirtualizedListProps<T> & { ref?: React.Ref<VirtualizedListRef> }
) => React.ReactElement;

/**
 * Hook personalizado para usar VirtualizedList
 */
export const useVirtualizedList = <T extends VirtualizedListItem>(
  items: T[],
  options: {
    containerHeight: number;
    itemHeight?: number | ((item: T, index: number) => number);
    overscan?: number;
  }
) => {
  const listRef = useRef<VirtualizedListRef>(null);

  const scrollToIndex = useCallback((index: number, align?: 'start' | 'center' | 'end') => {
    listRef.current?.scrollToIndex(index, align);
  }, []);

  const scrollToTop = useCallback(() => {
    listRef.current?.scrollToTop();
  }, []);

  const scrollToBottom = useCallback(() => {
    listRef.current?.scrollToBottom();
  }, []);

  const getVisibleRange = useCallback(() => {
    return listRef.current?.getVisibleRange() || { start: 0, end: 0 };
  }, []);

  const renderList = useCallback((renderItem: VirtualizedListProps<T>['renderItem']) => (
    <VirtualizedList
      ref={listRef}
      items={items}
      containerHeight={options.containerHeight}
      itemHeight={options.itemHeight}
      overscan={options.overscan}
      renderItem={renderItem}
    />
  ), [items, options]);

  return {
    listRef,
    scrollToIndex,
    scrollToTop,
    scrollToBottom,
    getVisibleRange,
    renderList
  };
};

// Componente de ejemplo para documentos
interface DocumentItem extends VirtualizedListItem {
  id: string;
  fileName: string;
  fileSize: number;
  uploadDate: string;
  status: 'uploaded' | 'processing' | 'error';
}

export const DocumentVirtualizedList: React.FC<{
  documents: DocumentItem[];
  containerHeight: number;
  onDocumentClick?: (document: DocumentItem) => void;
}> = ({ documents, containerHeight, onDocumentClick }) => {
  const { renderList } = useVirtualizedList(documents, {
    containerHeight,
    itemHeight: 80, // Fixed height for documents
    overscan: 3
  });

  return renderList((document, index, style) => (
    <div
      key={document.id}
      className="flex items-center p-4 border-b border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
      onClick={() => onDocumentClick?.(document)}
      style={style}
    >
      <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-900 truncate">
          {document.fileName}
        </div>
        <div className="text-sm text-gray-500">
          {(document.fileSize / 1024 / 1024).toFixed(2)} MB • {new Date(document.uploadDate).toLocaleDateString()}
        </div>
      </div>

      <div className="flex-shrink-0 ml-4">
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          document.status === 'uploaded'
            ? 'bg-green-100 text-green-800'
            : document.status === 'processing'
            ? 'bg-yellow-100 text-yellow-800'
            : 'bg-red-100 text-red-800'
        }`}>
          {document.status === 'uploaded' ? 'Subido' :
           document.status === 'processing' ? 'Procesando' : 'Error'}
        </span>
      </div>
    </div>
  ));
};

export default VirtualizedList;



