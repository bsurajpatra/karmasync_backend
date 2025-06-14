const Todo = require('../models/Todo');

// Create a new todo
exports.createTodo = async (req, res) => {
  try {
    console.log('Create Todo Request:', {
      body: req.body,
      user: req.user,
      userId: req.user?._id
    });

    const todo = new Todo({
      ...req.body,
      userId: req.user._id
    });

    console.log('New Todo Object:', todo);

    await todo.save();
    console.log('Todo saved successfully:', todo);
    res.status(201).json(todo);
  } catch (error) {
    console.error('Error creating todo:', {
      error: error.message,
      stack: error.stack,
      validationErrors: error.errors
    });
    res.status(400).json({ message: error.message });
  }
};

// Get all todos for the logged-in user
exports.getTodos = async (req, res) => {
  try {
    console.log('Get Todos Request:', {
      userId: req.user?._id
    });

    const todos = await Todo.find({ userId: req.user._id })
      .sort({ createdAt: -1 });
    
    console.log('Found todos:', todos.length);
    res.json(todos);
  } catch (error) {
    console.error('Error fetching todos:', {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({ message: error.message });
  }
};

// Update a todo
exports.updateTodo = async (req, res) => {
  try {
    console.log('Update Todo Request:', {
      todoId: req.params.id,
      userId: req.user?._id,
      body: req.body
    });

    const todo = await Todo.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!todo) {
      console.log('Todo not found for update');
      return res.status(404).json({ message: 'Todo not found' });
    }
    
    console.log('Todo updated successfully:', todo);
    res.json(todo);
  } catch (error) {
    console.error('Error updating todo:', {
      error: error.message,
      stack: error.stack,
      validationErrors: error.errors
    });
    res.status(400).json({ message: error.message });
  }
};

// Delete a todo
exports.deleteTodo = async (req, res) => {
  try {
    console.log('Delete Todo Request:', {
      todoId: req.params.id,
      userId: req.user?._id
    });

    const todo = await Todo.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });
    
    if (!todo) {
      console.log('Todo not found for deletion');
      return res.status(404).json({ message: 'Todo not found' });
    }
    
    console.log('Todo deleted successfully:', todo);
    res.json({ message: 'Todo deleted successfully' });
  } catch (error) {
    console.error('Error deleting todo:', {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({ message: error.message });
  }
}; 