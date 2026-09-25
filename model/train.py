"""
PyTorch Training Script for NSL-KDD Network Intrusion Detection System
======================================================================
Features:
- Adam optimizer with lr=1e-3
- ReduceLROnPlateau learning rate scheduler
- Early Stopping with patience=5 on validation loss
- Class-weighted CrossEntropyLoss to address severe imbalance (U2R, R2L)
- Epoch-by-epoch tracking of Loss and Accuracy
- Saves best checkpoint to model.pth, preprocessor to scaler.pkl, and metadata to feature_meta.json
"""

import os
import sys
import json
import time
import argparse
import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import TensorDataset, DataLoader
from torch.optim.lr_scheduler import ReduceLROnPlateau

from data import (
    FEATURE_NAMES, NUMERICAL_FEATURES, CATEGORICAL_FEATURES,
    CLASS_LABELS, CLASS_TO_IDX, ATTACK_CATEGORIES,
    NSLKDDPreprocessor, compute_class_weights
)
from model import get_model, NIDS_MLP


class EarlyStopping:
    """Early stops training if validation loss doesn't improve after given patience."""
    def __init__(self, patience: int = 5, delta: float = 1e-4, checkpoint_path: str = 'model.pth'):
        self.patience = patience
        self.delta = delta
        self.checkpoint_path = checkpoint_path
        self.counter = 0
        self.best_loss = float('inf')
        self.early_stop = False

    def __call__(self, val_loss: float, model: nn.Module):
        if val_loss < self.best_loss - self.delta:
            self.best_loss = val_loss
            self.counter = 0
            torch.save(model.state_dict(), self.checkpoint_path)
            return True
        else:
            self.counter += 1
            if self.counter >= self.patience:
                self.early_stop = True
            return False


def train_epoch(model: nn.Module, loader: DataLoader, criterion: nn.Module, optimizer: torch.optim.Optimizer, device: torch.device):
    model.train()
    running_loss = 0.0
    correct = 0
    total = 0

    for x_batch, y_batch in loader:
        x_batch, y_batch = x_batch.to(device), y_batch.to(device)
        optimizer.zero_grad()
        
        logits = model(x_batch)
        loss = criterion(logits, y_batch)
        loss.backward()
        
        # Gradient clipping for numerical stability
        nn.utils.clip_grad_norm_(model.parameters(), max_norm=5.0)
        optimizer.step()

        running_loss += loss.item() * x_batch.size(0)
        preds = torch.argmax(logits, dim=1)
        correct += (preds == y_batch).sum().item()
        total += y_batch.size(0)

    epoch_loss = running_loss / max(total, 1)
    epoch_acc = correct / max(total, 1)
    return epoch_loss, epoch_acc


def validate_epoch(model: nn.Module, loader: DataLoader, criterion: nn.Module, device: torch.device):
    model.eval()
    running_loss = 0.0
    correct = 0
    total = 0

    with torch.no_grad():
        for x_batch, y_batch in loader:
            x_batch, y_batch = x_batch.to(device), y_batch.to(device)
            logits = model(x_batch)
            loss = criterion(logits, y_batch)

            running_loss += loss.item() * x_batch.size(0)
            preds = torch.argmax(logits, dim=1)
            correct += (preds == y_batch).sum().item()
            total += y_batch.size(0)

    epoch_loss = running_loss / max(total, 1)
    epoch_acc = correct / max(total, 1)
    return epoch_loss, epoch_acc


def run_training(
    x_train: np.ndarray,
    y_train: np.ndarray,
    x_val: np.ndarray,
    y_val: np.ndarray,
    model_type: str = 'mlp',
    epochs: int = 30,
    batch_size: int = 128,
    lr: float = 1e-3,
    output_dir: str = '.'
):
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    print(f"[*] Training on device: {device}")

    input_dim = x_train.shape[1]
    num_classes = len(CLASS_LABELS)

    # Convert to PyTorch Datasets
    train_dataset = TensorDataset(torch.from_numpy(x_train), torch.from_numpy(y_train).long())
    val_dataset = TensorDataset(torch.from_numpy(x_val), torch.from_numpy(y_val).long())

    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True, drop_last=False)
    val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False)

    # Instantiate model
    model = get_model(model_type, input_dim=input_dim, num_classes=num_classes).to(device)

    # Class-weighted CrossEntropyLoss
    class_weights = compute_class_weights(y_train, num_classes=num_classes)
    weights_tensor = torch.from_numpy(class_weights).float().to(device)
    criterion = nn.CrossEntropyLoss(weight=weights_tensor)

    optimizer = torch.optim.Adam(model.parameters(), lr=lr, weight_decay=1e-5)
    scheduler = ReduceLROnPlateau(optimizer, mode='min', factor=0.5, patience=2, verbose=True)

    checkpoint_path = os.path.join(output_dir, 'model.pth')
    early_stopping = EarlyStopping(patience=5, checkpoint_path=checkpoint_path)

    history = {
        'train_loss': [],
        'train_acc': [],
        'val_loss': [],
        'val_acc': [],
        'lr': []
    }

    print(f"[*] Starting training: {model_type.upper()} ({epochs} epochs max)...")
    for epoch in range(1, epochs + 1):
        t0 = time.time()
        train_loss, train_acc = train_epoch(model, train_loader, criterion, optimizer, device)
        val_loss, val_acc = validate_epoch(model, val_loader, criterion, device)
        scheduler.step(val_loss)
        
        current_lr = optimizer.param_groups[0]['lr']
        history['train_loss'].append(round(train_loss, 4))
        history['train_acc'].append(round(train_acc, 4))
        history['val_loss'].append(round(val_loss, 4))
        history['val_acc'].append(round(val_acc, 4))
        history['lr'].append(current_lr)

        elapsed = time.time() - t0
        saved = early_stopping(val_loss, model)
        save_indicator = " [Saved Checkpoint]" if saved else ""

        print(
            f"Epoch {epoch:02d}/{epochs:02d} [{elapsed:.1f}s] - "
            f"Train Loss: {train_loss:.4f}, Train Acc: {train_acc*100:.2f}% | "
            f"Val Loss: {val_loss:.4f}, Val Acc: {val_acc*100:.2f}%{save_indicator}"
        )

        if early_stopping.early_stop:
            print(f"[!] Early stopping triggered at epoch {epoch} (patience reached).")
            break

    # Save training history
    history_path = os.path.join(output_dir, 'training_history.json')
    with open(history_path, 'w') as f:
        json.dump(history, f, indent=2)
    print(f"[*] Training history saved to {history_path}")

    return model, history


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="Train NIDS PyTorch Model on NSL-KDD")
    parser.add_argument('--model', type=str, default='mlp', choices=['mlp', 'cnn1d', 'lstm'])
    parser.add_argument('--epochs', type=int, default=25)
    parser.add_argument('--batch-size', type=int, default=128)
    parser.add_argument('--lr', type=float, default=1e-3)
    args = parser.parse_args()

    print(f"=== NIDS Training Pipeline: {args.model.upper()} ===")
