import {
    createContext,
    ReactNode,
    useContext,
    useEffect,
    useReducer,
} from 'react';

export interface TodoItem {
    id: string;
    title: string;
    details?: string;
    done: boolean;
}

interface TodoItemsState {
    todoItems: TodoItem[];
}

interface TodoItemsAction {
    type: 'loadState' | 'add' | 'delete' | 'toggleDone' | 'onDragEnd' | 'edit';
    data: any;
}

const TodoItemsContext = createContext<
    (TodoItemsState & { dispatch: (action: TodoItemsAction) => void }) | null
>(null);

const defaultState = { todoItems: [] };
const localStorageKey = 'todoListState';

export const TodoItemsContextProvider = ({
    children,
}: {
    children?: ReactNode;
}) => {
    const [state, dispatch] = useReducer(todoItemsReducer, defaultState);

    // Getting LocalStorage
    const loadLacalStorage = () => {
        const savedState = localStorage.getItem(localStorageKey);

        if (savedState) {
            try {
                dispatch({ type: 'loadState', data: JSON.parse(savedState) });
            } catch {}
        }
    };

    // Updating state on every change LocalStorage
    useEffect(() => {
        window.addEventListener('storage', (event) => {
            if (event.storageArea !== localStorage) {
                return;
            };

            loadLacalStorage();
        });

    }, []);

    // First load LocalStorage 
    useEffect(() => {
        loadLacalStorage();
    }, []);

    useEffect(() => {
        localStorage.setItem(localStorageKey, JSON.stringify(state));
    }, [state]);

    return (
        <TodoItemsContext.Provider value={{ ...state, dispatch }}>
            {children}
        </TodoItemsContext.Provider>
    );
};

export const useTodoItems = () => {
    const todoItemsContext = useContext(TodoItemsContext);

    if (!todoItemsContext) {
        throw new Error(
            'useTodoItems hook should only be used inside TodoItemsContextProvider',
        );
    }

    return todoItemsContext;
};

function todoItemsReducer(state: TodoItemsState, action: TodoItemsAction) {
    switch (action.type) {
        case 'loadState': {
            return action.data;
        }
        case 'add':
            return {
                ...state,
                todoItems: [
                    { id: generateId(), done: false, ...action.data.todoItem },
                    ...state.todoItems,
                ],
            };
        case 'delete':
            return {
                ...state,
                todoItems: state.todoItems.filter(
                    ({ id }) => id !== action.data.id,
                ),
            };
        case 'toggleDone':
            const itemIndex = state.todoItems.findIndex(
                ({ id }) => id === action.data.id,
            );
            const item = state.todoItems[itemIndex];

            return {
                ...state,
                todoItems: [
                    ...state.todoItems.slice(0, itemIndex),
                    { ...item, done: !item.done },
                    ...state.todoItems.slice(itemIndex + 1),
                ],
            };
        case 'onDragEnd':
            const tempList = Array.from(state.todoItems);
            const [reorderedList] = tempList.splice(action.data.sourceIndex, 1);
            tempList.splice(action.data.destinationIndex, 0, reorderedList);

            return {
                ...state,
                todoItems: [...tempList],
            };
        case 'edit':
            const title = action.data.title;
            const details = action.data.details;

            const editedItemIndex = state.todoItems.findIndex(
                ({ id }) => id === action.data.id,
            );
            const editedItem = state.todoItems[editedItemIndex];

            return {
                ...state,
                todoItems: [
                    ...state.todoItems.slice(0, editedItemIndex),
                    { ...editedItem, title: title, details:details },
                    ...state.todoItems.slice(editedItemIndex + 1),
                ],
            };
        default:
            throw new Error();
    }
}

function generateId() {
    return `${Date.now().toString(36)}-${Math.floor(
        Math.random() * 1e16,
    ).toString(36)}`;
}