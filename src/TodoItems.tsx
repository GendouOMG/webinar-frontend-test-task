import { useCallback } from 'react';
import Card from '@material-ui/core/Card';
import CardHeader from '@material-ui/core/CardHeader';
import CardContent from '@material-ui/core/CardContent';
import Typography from '@material-ui/core/Typography';
import IconButton from '@material-ui/core/IconButton';
import Checkbox from '@material-ui/core/Checkbox';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import DeleteIcon from '@material-ui/icons/Delete';
import { makeStyles } from '@material-ui/core/styles';
import classnames from 'classnames';
import { motion } from 'framer-motion';
import { TodoItem, useTodoItems } from './TodoItemsContext';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';

const spring = {
    type: 'spring',
    damping: 25,
    stiffness: 120,
    duration: 0.25,
};

const useTodoItemListStyles = makeStyles({
    root: {
        display: 'flex',
        flexDirection: 'column',
        listStyle: 'none',
        padding: 0,
    },
    item: {
        position: "static",
    }
});

export const TodoItemsList = function () {
    const { todoItems } = useTodoItems();
    const { dispatch } = useTodoItems();

    const classes = useTodoItemListStyles();

    const sortedItems = todoItems.slice().sort((a, b) => {
        if (a.done && !b.done) {
            return 1;
        }

        if (!a.done && b.done) {
            return -1;
        }

        return 0;
    });

    // The indices of the dragged elements in the initial array are determined and passed to the handler.
    const handleOnDragEnd = ({ destination, source }: DropResult) => {
        if(!destination || destination.index === source.index) {
            return;
        }
        const sourceIndex = source.index;
        const destinationIndex = destination.index;

        const sourceId = sortedItems[sourceIndex].id;
        const destinationId = sortedItems[destinationIndex].id;

        const originSourceIndex = todoItems.findIndex(
            item => item.id === sourceId
        );
        const originDestinationIndex = todoItems.findIndex(
            item => item.id === destinationId
        );

        dispatch({
            type: 'onDragEnd',
            data: {
                sourceIndex: originSourceIndex,
                destinationIndex: originDestinationIndex,
            },
        })
    }

    // Lots of levels of react-beautiful-dnd ... Putting it in a separate component will add a bit of complexity to the logic.
    return (
        <DragDropContext onDragEnd={handleOnDragEnd}>
            <Droppable droppableId='droppable-list'>
                {(provided: any) => (
                    <ul className={classes.root} {...provided.droppableProps} ref={provided.innerRef}>
                        {sortedItems.map((item, index) => (
                            <Draggable key={item.id} draggableId={item.id} index={index}>
                                {(provided: any) => (
                                    <motion.li
                                        transition={spring}
                                        layout={false}
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        {...provided.dragHandleProps}
                                    >
                                        <TodoItemCard item={item} />
                                    </motion.li>
                                )}
                            </Draggable>
                        ))}
                        {provided.placeholder}
                    </ul>
                )}
            </Droppable>
        </DragDropContext>
    );
};

const useTodoItemCardStyles = makeStyles({
    root: {
        marginTop: 24,
        marginBottom: 24,
    },
    doneRoot: {
        textDecoration: 'line-through',
        color: '#888888',
    },
});

export const TodoItemCard = function ({ item }: { item: TodoItem }) {
    const classes = useTodoItemCardStyles();
    const { dispatch } = useTodoItems();

    const handleDelete = useCallback(
        () => dispatch({ type: 'delete', data: { id: item.id } }),
        [item.id, dispatch],
    );

    const handleToggleDone = useCallback(
        () =>
            dispatch({
                type: 'toggleDone',
                data: { id: item.id },
            }),
        [item.id, dispatch],
    );

    return (
        <Card
            className={classnames(classes.root, {
                [classes.doneRoot]: item.done,
            })}
        >
            <CardHeader
                action={
                    <IconButton aria-label="delete" onClick={handleDelete}>
                        <DeleteIcon />
                    </IconButton>
                }
                title={
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={item.done}
                                onChange={handleToggleDone}
                                name={`checked-${item.id}`}
                                color="primary"
                            />
                        }
                        label={item.title}
                    />
                }
            />
            {item.details ? (
                <CardContent>
                    <Typography variant="body2" component="p">
                        {item.details}
                    </Typography>
                </CardContent>
            ) : null}
        </Card>
    );
};
