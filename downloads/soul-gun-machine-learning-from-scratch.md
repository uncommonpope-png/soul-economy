---
name: machine-learning-from-scratch
description: Build a Machine Learning Library From Scratch
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
---# Build a Machine Learning Library From Scratch

## Mental Model
Machine learning is the science of computers learning patterns from data without being explicitly programmed for every case. You have inputs X, outputs y, and a model with parameters θ. The learning algorithm finds the θ that minimizes a loss function measuring the gap between predictions and ground truth. Every algorithm—linear regression, decision trees, SVMs, k-means—is a different way of searching the parameter space.

## Step 1: Linear Regression and Gradient Descent
The simplest model: `y = X·w + b`. Loss: mean squared error. Gradient descent updates: `w = w - lr * dL/dw`.

```python
"""Step 1: Linear regression with gradient descent."""
import numpy as np

class LinearRegression:
    def __init__(self, lr=0.01, epochs=1000):
        self.lr = lr
        self.epochs = epochs
        self.weights = None
        self.bias = None

    def fit(self, X, y):
        n_samples, n_features = X.shape
        self.weights = np.zeros(n_features)
        self.bias = 0

        for _ in range(self.epochs):
            y_pred = np.dot(X, self.weights) + self.bias
            dw = (1 / n_samples) * np.dot(X.T, (y_pred - y))
            db = (1 / n_samples) * np.sum(y_pred - y)
            self.weights -= self.lr * dw
            self.bias -= self.lr * db

    def predict(self, X):
        return np.dot(X, self.weights) + self.bias

# Test
X = np.array([[1], [2], [3], [4], [5]])
y = np.array([2, 4, 6, 8, 10])
model = LinearRegression(lr=0.01, epochs=1000)
model.fit(X, y)
print(f"Weight: {model.weights[0]:.4f}, Bias: {model.bias:.4f}")
print(f"Predictions: {model.predict(X)}")
```

## Step 2: Logistic Regression and Classification
For classification, use sigmoid + binary cross-entropy. Output is probability, threshold at 0.5.

```python
"""Step 2: Logistic regression for binary classification."""

def sigmoid(z):
    return 1 / (1 + np.exp(-np.clip(z, -500, 500)))

def sigmoid_backward(a):
    return a * (1 - a)

class LogisticRegression:
    def __init__(self, lr=0.1, epochs=1000):
        self.lr = lr
        self.epochs = epochs
        self.weights = None
        self.bias = None

    def fit(self, X, y):
        n_samples, n_features = X.shape
        self.weights = np.zeros(n_features)
        self.bias = 0

        for _ in range(self.epochs):
            linear = np.dot(X, self.weights) + self.bias
            a = sigmoid(linear)
            da = a - y
            dw = np.dot(X.T, da) / n_samples
            db = np.sum(da) / n_samples
            self.weights -= self.lr * dw
            self.bias -= self.lr * db

    def predict_proba(self, X):
        return sigmoid(np.dot(X, self.weights) + self.bias)

    def predict(self, X, threshold=0.5):
        return (self.predict_proba(X) >= threshold).astype(int)

# Test
X = np.array([[0, 0], [0, 1], [1, 0], [1, 1]])
y = np.array([0, 0, 0, 1])
model = LogisticRegression(lr=1.0, epochs=10000)
model.fit(X, y)
print(f"Predictions: {model.predict(X)}")
print(f"Probabilities: {model.predict_proba(X)}")
```

## Step 3: K-Means Clustering
Unsupervised grouping. Initialize k centroids, assign points to nearest centroid, recompute centroids, repeat until convergence.

```python
"""Step 3: K-means clustering."""

class KMeans:
    def __init__(self, k=3, max_iters=100):
        self.k = k
        self.max_iters = max_iters
        self.centroids = None

    def fit(self, X):
        n_samples = X.shape[0]
        idx = np.random.choice(n_samples, self.k, replace=False)
        self.centroids = X[idx]

        for _ in range(self.max_iters):
            distances = self._calc_distances(X)
            clusters = np.argmin(distances, axis=1)
            new_centroids = np.zeros_like(self.centroids)
            for i in range(self.k):
                mask = clusters == i
                if np.sum(mask) > 0:
                    new_centroids[i] = X[mask].mean(axis=0)
                else:
                    new_centroids[i] = X[np.random.choice(n_samples)]
            if np.allclose(self.centroids, new_centroids):
                break
            self.centroids = new_centroids
        return clusters

    def _calc_distances(self, X):
        distances = np.zeros((X.shape[0], self.k))
        for i, c in enumerate(self.centroids):
            distances[:, i] = np.linalg.norm(X - c, axis=1)
        return distances

# Test
from sklearn.datasets import make_blobs
X, _ = make_blobs(n_samples=150, centers=3, random_state=42)
kmeans = KMeans(k=3)
labels = kmeans.fit(X)
print(f"Cluster centers: {kmeans.centroids}")
```

## Step 4: Decision Tree
Split data on features that maximize information gain (reduce entropy). Recurse on resulting subsets.

```python
"""Step 4: Decision tree for classification."""

class DecisionTree:
    def __init__(self, max_depth=10, min_samples=2):
        self.max_depth = max_depth
        self.min_samples = min_samples
        self.tree = None

    def _entropy(self, y):
        if len(y) == 0:
            return 0
        p = np.bincount(y.astype(int), minlength=2) / len(y)
        p = p[p > 0]
        return -np.sum(p * np.log2(p))

    def _information_gain(self, X, y, threshold, feature):
        parent_entropy = self._entropy(y)
        left_mask = X[:, feature] <= threshold
        right_mask = ~left_mask
        n = len(y)
        nl, nr = np.sum(left_mask), np.sum(right_mask)
        e_l = self._entropy(y[left_mask]) if nl > 0 else 0
        e_r = self._entropy(y[right_mask]) if nr > 0 else 0
        return parent_entropy - (nl/n)*e_l - (nr/n)*e_r

    def _best_split(self, X, y):
        best_gain = -1
        best = None
        for feature in range(X.shape[1]):
            thresholds = np.unique(X[:, feature])
            for thresh in thresholds:
                gain = self._information_gain(X, y, thresh, feature)
                if gain > best_gain:
                    best_gain = gain
                    best = (feature, thresh)
        return best, best_gain

    def _build(self, X, y, depth=0):
        if depth >= self.max_depth or len(y) < self.min_samples:
            return np.bincount(y.astype(int)).argmax()
        feature, threshold = self._best_split(X, y)
        if feature is None:
            return np.bincount(y.astype(int)).argmax()
        left_mask = X[:, feature] <= threshold
        return {
            'feature': feature,
            'threshold': threshold,
            'left': self._build(X[left_mask], y[left_mask], depth+1),
            'right': self._build(X[~left_mask], y[~left_mask], depth+1),
        }

    def fit(self, X, y):
        self.tree = self._build(X, y)

    def _predict(self, x, node):
        if not isinstance(node, dict):
            return node
        if x[node['feature']] <= node['threshold']:
            return self._predict(x, node['left'])
        return self._predict(x, node['right'])

    def predict(self, X):
        return np.array([self._predict(x, self.tree) for x in X])

# Test
from sklearn.datasets import make_classification
X, y = make_classification(n_samples=100, n_features=4, random_state=42)
dt = DecisionTree(max_depth=5)
dt.fit(X, y)
print(f"Accuracy: {np.mean(dt.predict(X) == y):.2f}")
```

## Step 5: Model Evaluation Metrics
Accuracy, precision, recall, F1, confusion matrix, ROC-AUC.

```python
"""Step 5: Evaluation metrics."""

def accuracy(y_true, y_pred):
    return np.mean(y_true == y_pred)

def precision(y_true, y_pred, pos=1):
    tp = np.sum((y_pred == pos) & (y_true == pos))
    fp = np.sum((y_pred == pos) & (y_true != pos))
    return tp / (tp + fp) if (tp + fp) > 0 else 0

def recall(y_true, y_pred, pos=1):
    tp = np.sum((y_pred == pos) & (y_true == pos))
    fn = np.sum((y_pred != pos) & (y_true == pos))
    return tp / (tp + fn) if (tp + fn) > 0 else 0

def f1_score(y_true, y_pred, pos=1):
    p = precision(y_true, y_pred, pos)
    r = recall(y_true, y_pred, pos)
    return 2 * p * r / (p + r) if (p + r) > 0 else 0

def confusion_matrix(y_true, y_pred):
    classes = np.unique(y_true)
    n = len(classes)
    cm = np.zeros((n, n), dtype=int)
    for i, c in enumerate(classes):
        for j, k in enumerate(classes):
            cm[i, j] = np.sum((y_pred == c) & (y_true == k))
    return cm

# Test
y_true = np.array([1, 0, 1, 1, 0, 1, 0, 0, 1, 0])
y_pred = np.array([1, 0, 1, 0, 0, 1, 1, 0, 1, 0])
print(f"Accuracy:  {accuracy(y_true, y_pred):.2f}")
print(f"Precision: {precision(y_true, y_pred):.2f}")
print(f"Recall:    {recall(y_true, y_pred):.2f}")
print(f"F1:        {f1_score(y_true, y_pred):.2f}")
print(f"Confusion Matrix:\n{confusion_matrix(y_true, y_pred)}")
```

## Architecture
```
Data → Preprocessing → Model selection → Training → Evaluation → Deployment

Supervised:
  Linear/Logistic regression → Gradient descent → convex loss
  Decision trees → Information gain → recursive partition
  SVM → Max-margin hyperplane → kernel trick
  Neural networks → Backpropagation → gradient descent variants

Unsupervised:
  K-means → Lloyd's algorithm → centroid convergence
  PCA → Eigenvalue decomposition → variance maximization
  DBSCAN → Density-based → no need to specify k

Evaluation:
  Classification: Accuracy, Precision, Recall, F1, ROC-AUC
  Regression: MSE, MAE, R²
```

## Bridge to Production
- **Mini version**: NumPy on small datasets, single-threaded. Production ML (scikit-learn, PyTorch, JAX) uses vectorized operations, automatic differentiation, GPU acceleration, feature engineering, cross-validation, hyperparameter tuning, model serialization, monitoring for drift.
- **Production concerns**: Feature scaling, one-hot encoding, train/test split, cross-validation, hyperparameter optimization, model versioning, serving (REST API, batch inference), monitoring accuracy drift, A/B testing, data pipeline automation.

## Reference Tutorials
- [Machine Learning from Scratch ( unsupervised.io)](https://github.com/eriklindernoren/ML-From-Scratch)
- [ML from scratch (Amazon science)](https://github.com/susan-yy/machine_learning_from_scratch)
- [ML from scratch in Python (statwith鉴定)](https://github.com/VivekPy/machine_learning_from_scratch)
- [Mathematics for Machine Learning](https://mml-book.github.io/)
- [Andrew Ng's Machine Learning Course](https://www.coursera.org/learn/machine-learning)

## Checklist
- [ ] Step 1: Linear regression with gradient descent
- [ ] Step 2: Logistic regression for classification
- [ ] Step 3: K-means clustering
- [ ] Step 4: Decision tree
- [ ] Step 5: Evaluation metrics (accuracy, precision, recall, F1)
- [ ] Add: regularized regression (L1/L2)
- [ ] Add: gradient checking
