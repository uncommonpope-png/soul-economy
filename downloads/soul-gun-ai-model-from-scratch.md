# Build an AI Model From Scratch

## Mental Model
An AI model is a function approximator. It takes inputs and produces outputs. The "learning" is just adjusting parameters to make the outputs match the training data. The core abstraction is: `model = function(inputs, parameters)`.

## Step 1: Linear Regression (The Simplest Model)
A linear regression model predicts `y = w*x + b`. The learning process is gradient descent: adjust `w` and `b` to minimize the error.

```python
import numpy as np

def linear_regression(X, y, learning_rate=0.01, epochs=1000):
    w, b = 0, 0
    for _ in range(epochs):
        y_pred = w * X + b
        dw = (2/len(X)) * np.sum(X * (y_pred - y))
        db = (2/len(X)) * np.sum(y_pred - y)
        w -= learning_rate * dw
        b -= learning_rate * db
    return w, b

# Test it
X = np.array([1, 2, 3, 4, 5])
y = np.array([2, 4, 6, 8, 10])
w, b = linear_regression(X, y)
assert abs(w - 2) < 0.1 and abs(b) < 0.1
```

## Step 2: Neural Network (One Hidden Layer)
A neural network adds non-linearity with activation functions. The forward pass is: `h = relu(X*W1 + b1)`, `y = h*W2 + b2`.

```python
import numpy as np

def relu(x):
    return np.maximum(0, x)

def neural_network(X, y, hidden_size=4, learning_rate=0.01, epochs=1000):
    input_size = X.shape[1]
    output_size = y.shape[1]
    W1 = np.random.randn(input_size, hidden_size)
    b1 = np.zeros(hidden_size)
    W2 = np.random.randn(hidden_size, output_size)
    b2 = np.zeros(output_size)

    for _ in range(epochs):
        # Forward pass
        h = relu(np.dot(X, W1) + b1)
        y_pred = np.dot(h, W2) + b2

        # Backward pass
        dW2 = np.dot(h.T, (y_pred - y))
        db2 = np.sum(y_pred - y, axis=0)
        dh = np.dot((y_pred - y), W2.T)
        dh[h <= 0] = 0  # ReLU derivative
        dW1 = np.dot(X.T, dh)
        db1 = np.sum(dh, axis=0)

        # Update
        W1 -= learning_rate * dW1
        b1 -= learning_rate * db1
        W2 -= learning_rate * dW2
        b2 -= learning_rate * db2

    return W1, b1, W2, b2

# Test it
X = np.array([[0, 0], [0, 1], [1, 0], [1, 1]])
y = np.array([[0], [1], [1], [0]])
W1, b1, W2, b2 = neural_network(X, y)
```

## Step 3: Convolutional Neural Network (CNN)
CNNs add spatial locality with convolutional layers. The forward pass is: `conv → relu → pool → fc`.

```python
import numpy as np

def conv2d(X, kernel, stride=1, padding=0):
    X_padded = np.pad(X, ((padding, padding), (padding, padding), (0, 0)), mode='constant')
    out_h = (X_padded.shape[0] - kernel.shape[0]) // stride + 1
    out_w = (X_padded.shape[1] - kernel.shape[1]) // stride + 1
    out = np.zeros((out_h, out_w, kernel.shape[2]))
    for i in range(out_h):
        for j in range(out_w):
            for k in range(kernel.shape[2]):
                out[i, j, k] = np.sum(X_padded[i*stride:i*stride+kernel.shape[0], j*stride:j*stride+kernel.shape[1], :] * kernel[:, :, k])
    return out

# Test it
X = np.random.randn(32, 32, 3)  # 32x32 RGB image
kernel = np.random.randn(3, 3, 3)  # 3x3 kernel
out = conv2d(X, kernel)
assert out.shape == (30, 30, 3)
```

## Step 4: Transformer (Self-Attention)
Transformers use self-attention to model relationships between tokens. The forward pass is: `QKV → attention → output`.

```python
import numpy as np

def softmax(x):
    e_x = np.exp(x - np.max(x))
    return e_x / e_x.sum(axis=1, keepdims=True)

def transformer(X, d_model=64, num_heads=4):
    # Project to Q, K, V
    Wq = np.random.randn(d_model, d_model)
    Wk = np.random.randn(d_model, d_model)
    Wv = np.random.randn(d_model, d_model)
    Q = np.dot(X, Wq)
    K = np.dot(X, Wk)
    V = np.dot(X, Wv)

    # Split heads
    Q = np.split(Q, num_heads, axis=-1)
    K = np.split(K, num_heads, axis=-1)
    V = np.split(V, num_heads, axis=-1)

    # Scaled dot-product attention
    attention = []
    for q, k, v in zip(Q, K, V):
        scores = np.dot(q, k.T) / np.sqrt(d_model // num_heads)
        attention.append(np.dot(softmax(scores), v))

    # Concatenate heads
    out = np.concatenate(attention, axis=-1)
    return out

# Test it
X = np.random.randn(10, 64)  # 10 tokens, 64-dim embeddings
out = transformer(X)
assert out.shape == (10, 64)
```

## Architecture
```
AI Model Stack:
  Linear Regression → Neural Network → CNN → Transformer
  Each layer adds complexity:
    - Linear: y = w*x + b
    - NN: h = relu(X*W1 + b1), y = h*W2 + b2
    - CNN: conv → relu → pool → fc
    - Transformer: QKV → attention → output
```

## Bridge to Production
- **Mini version**: NumPy, no GPU, no optimizations. Production models use: mixed precision, distributed training, quantization, pruning, model parallelism, data parallelism, pipeline parallelism.
- **Production concerns**: GPU acceleration, automatic differentiation, learning rate scheduling, dropout, batch normalization, residual connections, attention mechanisms, large language models, diffusion models, reinforcement learning.

## Reference Tutorials
- [Neural Networks from Scratch in Python](https://www.codeproject.com/Articles/1232953/Neural-Networks-from-Scratch-in-Python)
- [Building a Transformer from Scratch](https://www.youtube.com/watch?v=U0s0f995w14)
- [Convolutional Neural Networks from Scratch](https://www.youtube.com/watch?v=Lakz2MoHy6o)
- [Linear Regression from Scratch](https://www.youtube.com/watch?v=JMUxmLyrhSk)
