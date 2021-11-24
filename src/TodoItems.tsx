import { useCallback, useState } from 'react';
import Card from '@material-ui/core/Card';
import CardHeader from '@material-ui/core/CardHeader';
import CardContent from '@material-ui/core/CardContent';
import Typography from '@material-ui/core/Typography';
import IconButton from '@material-ui/core/IconButton';
import Checkbox from '@material-ui/core/Checkbox';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import DeleteIcon from '@material-ui/icons/Delete';
import EditIcon from '@material-ui/icons/Edit';
import CancelIcon from '@material-ui/icons/Cancel';
import DoneIcon from '@material-ui/icons/Done';
import { makeStyles } from '@material-ui/core/styles';
import classnames from 'classnames';
import { motion } from 'framer-motion';
import { TodoItem, useTodoItems } from './TodoItemsContext';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { useForm, Controller } from 'react-hook-form';
import TextField from '@material-ui/core/TextField';

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
    };

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
    editedRoot: {
        margin: 24,
    }
});

export const TodoItemCard = function ({ item }: { item: TodoItem }) {
    const classes = useTodoItemCardStyles();
    const { dispatch } = useTodoItems();

    // Edit mode variable (off/on)
    const [isEdited, setIsEdited] = useState<boolean>(false);

    const handleDelete = useCallback(
        () => dispatch({ type: 'delete', data: { id: item.id } }),
        [item.id, dispatch],
    );

    const handleEdit = () => {
        setIsEdited(true);
    };

    const handleToggleDone = useCallback(
        () =>
            dispatch({
                type: 'toggleDone',
                data: { id: item.id },
            }),
        [item.id, dispatch],
    );

    if(isEdited) {
        return (
                <TodoItemEdit item={item} setIsEdited={setIsEdited} />
        );
    }

    return (
        <Card
            className={classnames(classes.root, {
                [classes.doneRoot]: item.done,
            })}
        >
            <CardHeader
                action={
                    <div>
                        <IconButton aria-label="edit" onClick={handleEdit}>
                            <EditIcon />
                        </IconButton>
                        <IconButton aria-label="delete" onClick={handleDelete}>
                            <DeleteIcon />
                        </IconButton>
                    </div>
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

const useTodoItemEditStyles = makeStyles({
    root: {
        marginTop: 24,
        marginBottom: 24,
        paddingLeft: 24,
        paddingRight: 24,
    }
});

// Item appearance when editing
export const TodoItemEdit = function({setIsEdited, item}: {setIsEdited: any, item: TodoItem}) {
    const classes = useTodoItemEditStyles();
    const { dispatch } = useTodoItems();
    
    const { control, handleSubmit, watch } = useForm();

    // Checking for obvious errors and updating an item
    const sendItemUpdate = (title="", details="") => {
        if(title === item.title && details === item.details) {
            return;
        }
        if(title === "") {
            return;
        }

        dispatch({
            type: 'edit',
            data: {
                id: item.id,
                title: title,
                details: details,
            },
        })

    };

    return (
        <Card className={classes.root}>
            <form
                onSubmit={handleSubmit((formData) => {
                    sendItemUpdate(formData.title, formData.details);
                    setIsEdited(false);
                })}
            >
                <Controller
                    name="title"
                    control={control}
                    defaultValue={item.title}
                    rules={{ required: true }}
                    render={({ field }) => (
                        <TextField
                            {...field}
                            label="TODO"
                            fullWidth={true}
                        />
                    )}
                />
                <Controller
                    name="details"
                    control={control}
                    defaultValue={item.details}
                    render={({ field }) => (
                        <TextField
                            {...field}
                            label="Details"
                            fullWidth={true}
                            multiline={true}
                        />
                    )}
                />
                <IconButton aria-label="submit" type="submit" disabled={watch('title') === '' }>
                    <DoneIcon />
                </IconButton>
                <IconButton aria-label="cancel" type="button" onClick={()=>setIsEdited(false)}>
                    <CancelIcon />
                </IconButton>
            </form>
        </Card>
    );
}