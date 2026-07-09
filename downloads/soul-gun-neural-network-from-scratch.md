---
name: neural-network-from-scratch
description: Build a Neural Network From Scratch
domain: computer-science
language: python
stars: "0"
topics: ["computer-science", "from-scratch", "build-your-own-x", "education"]
version: 0.1.0
author: profit-prime
input_schema:
  type: object
  properties: {}
  required: []
output_schema:
  type: object
  properties: {}
  required: []
---# Build a Neural Network From Scratch

---
name: neural-network-from-scratch
description: Use when user wants to understand how neural networks work, build one from scratch, or learn about backpropagation, gradient descent, and activation functions. Triggers on: "build neural network", "backpropagation", "gradient descent", "deep learning".
---

## The Mental Model
A neural network learns by gradient descent. You have a function f(X) = y. You compute how much each weight contributes to the error (the gradient). Then you adjust each weight in the direction that reduces the error, scaled by the learning rate (like steering a car—you correct gradually, not by instantly snapping to the right heading).

## Step 1: Structure and Forward Pass
A network is layers of neurons. Each neuron computes: `output = activation(dot(weights, inputs) + bias)`. Layers are matrices.

```python
import numpy as np

class Layer:
    def __init__(self, input_size, output_size):
        self.weights = np.random.randn(input_size, output_size) * 0.01
        self.bias = np.zeros((1, output_size))

    def forward(self, X):
        self.input = X
        self.output = np.dot(X, self.weights) + self.bias
        return self.output

class Activation:
    def relu(self, Z):
        self.input = Z
        return np.maximum(0, Z)

    def relu_backward(self, dA):
        return dA * (self.input > 0)

class Network:
    def __init__(self, layer_sizes):
        self.layers = []
        for i in range(len(layer_sizes) - 1):
            self.layers.append(Layer(layer_sizes[i], layer_sizes[i+1]))
            self.layers.append(Activation())

    def forward(self, X):
        for layer in self.layers:
            X = layer.forward(X)
        return X
```

## Step 2: Loss Function (Cross-Entropy)
For classification, cross-entropy loss measures the difference between predicted probabilities and ground truth.

```python
def cross_entropy(y_true, y_pred):
    epsilon = 1e-15
    y_pred = np.clip(y_pred, epsilon, 1 - epsilon)
    return -np.mean(y_true * np.log(y_pred))

def softmax(Z):
    exp_Z = np.exp(Z - np.max(Z, axis=1, keepdims=True))
    return exp_Z / np.sum(exp_Z, axis=1, keepdims=True)
```

## Step 3: Backpropagation (The Chain Rule)
This is where it clicks.derivatives chain through the network. For each layer, compute dL/dW = dL/dy * dy/dz * dz/dW.

```python
def backward(self, dA):
    m = self.input.shape[0]
    dZ = dA * self.activation.backward()
    dW = np.dot(self.input.T, dZ) / m
    dB = np.sum(dZ, axis=0, keepdims=True) / m
    dA_prev = np.dot(dZ, self.weights.T)
    self.dW = dW
    self.dB = dB
    return dA_prev

# For softmax + cross-entropy, the gradient is simply (y_pred - y_true)
def softmax_cross_entropy_backward(y_pred, y_true):
    return (y_pred - y_true) / y_pred.shape[0]
```

## Step 4: Gradient Descent Update
Take the gradients and update the weights: `W = W - learning_rate * dW`.

```python
def update(self, learning_rate):
    for layer in self.layers:
        if hasattr(layer, 'weights'):
            layer.weights -= learning_rate * layer.dW
            layer.bias -= learning_rate * layer.dB
```

## Step 5: Training Loop
Epochs: one pass through the data. Mini-batch SGD: update after each batch.

```python
def train(self, X, y, epochs=100, batch_size=32, learning_rate=0.01):
    n_samples = X.shape[0]
    for epoch in range(epochs):
        indices = np.random.permutation(n_samples)
        X_shuffled = X[indices]
        y_shuffled = y[indices]

        for i in range(0, n_samples, batch_size):
            X_batch = X_shuffled[i:i+batch_size]
            y_batch = y_shuffled[i:i+batch_size]

            y_pred = self.forward(X_batch)
            dA = softmax_cross_entropy_backward(y_pred, y_batch)
            # Backward pass through all layers in reverse
            for layer in reversed(self.layers):
                dA = layer.backward(dA)
            self.update(learning_rate)

        if epoch % 10 == 0:
            print(f"Epoch {epoch}, Loss: {cross_entropy(y_batch, y_pred):.4f}")
```
At each step, the key insight is gradient descent: compute the loss, propagate gradients backward through each layer using the chain rule, and nudge weights in the direction that reduces prediction error. Mini-batch SGD introduces noise that actually helps generalization rather than hurting it.

## Step 6: Learning Rate Scheduling
Training dynamics improve with learning rate decay:

```python
class LRSchedule:
    def step(self, epoch):
        pass

class StepDecay(LRSchedule):
    def __init__(self, initial_lr, drop_every, drop_rate):
        self.lr = initial_lr
        self.drop_every = drop_every
        self.drop_rate = drop_rate

    def step(self, epoch):
        self.lr = self.lr * (self.drop_rate ** (epoch // self.drop_every))
        return self.lr

class CosineAnnealing(LRSchedule):
    def __init__(self, initial_lr, T_max):
        self.lr = initial_lr
        self.T_max = T_max

    def step(self, epoch):
        self.lr = initial_lr * (1 + math.cos(math.pi * epoch / self.T_max)) / 2
        return self.lr

# Usage in training loop:
scheduler = StepDecay(0.01, drop_every=30, drop_rate=0.5)
for epoch in range(100):
    lr = scheduler.step(epoch)
    train(X, y, epochs=1, batch_size=32, learning_rate=lr)
```

## Architecture
```
Forward pass:
  X → Layer (dot + bias) → Activation → ... → output

Loss:
  y_true, y_pred → cross_entropy(y_true, y_pred)

Backward pass:
  dL/dy → dL/dz_last → dL/dz_prev → ... → dL/dW, dL/dB

Update:
  W := W - lr * dW
  B := B - lr * dB
```

## Bridge to Production
- **Mini version**: Simple MLP, NumPy, batch SGD. Real deep learning frameworks (PyTorch, JAX) have automatic differentiation, CUDA kernels, distributed training, mixed precision, learning rate schedules, dropout, batch normalization, residual connections, attention mechanisms, and layers of optimizing compilers.
- **Production concerns**: GPU acceleration, automatic gradient computation, learning rate scheduling, early stopping, regularization (L2, dropout), gradient clipping, numerical stability, distributed data parallel, mixed precision training, model checkpointing, hyperparameter tuning.

## Reference Tutorials
- [A Neural Network in 11 lines (Andrej Karpathy)](https://karpathy.github.io/2021/03/27/forward-pass/)
- [Neural Networks: Zero to Hero (Andrej Karpathy YouTube)](https://www.youtube.com/playlist?list=PLAqhIrjkxbuWI23v9cThsA9GvCAUhRvKZ)
- [Make a Neural Network in Python (deephconomics)](https://www.youtube.com/watch?v=WXPMwkNaT40)
- [Deep Learning from Scratch in Rust](https://github.com/saurabhshri/neural-network-from-scratch)
- [Neural Network from Scratch (Python Engineer)](https://www.youtube.com/watch?v=Wo7nQ9qCNTU)
