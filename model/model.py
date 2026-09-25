"""
Deep Learning Model Architectures for Network Intrusion Detection
==================================================================
Includes:
1. NIDS_MLP: Primary baseline deep feedforward neural network with Batch Normalization
   and Dropout for tabular network flow classification.
2. NIDS_CNN1D: 1D Convolutional Neural Network treating tabular network features
   as a 1D spatial sequence to capture local feature correlations.
3. NIDS_LSTM: Recurrent Neural Network comparison architecture.
"""

import torch
import torch.nn as nn
import torch.nn.functional as F


class NIDS_MLP(nn.Module):
    """
    Primary Multi-Layer Perceptron for Network Intrusion Detection.
    Architecture:
      Input (e.g. 122 dims) -> Linear(128) -> BatchNorm1d -> ReLU -> Dropout(0.3)
      -> Linear(64) -> BatchNorm1d -> ReLU -> Dropout(0.2)
      -> Linear(32) -> BatchNorm1d -> ReLU -> Dropout(0.1)
      -> Output Linear(num_classes)
    """
    def __init__(self, input_dim: int, num_classes: int = 5, dropout_rate: float = 0.3):
        super(NIDS_MLP, self).__init__()
        
        self.input_dim = input_dim
        self.num_classes = num_classes

        # Layer 1
        self.fc1 = nn.Linear(input_dim, 128)
        self.bn1 = nn.BatchNorm1d(128)
        self.drop1 = nn.Dropout(dropout_rate)

        # Layer 2
        self.fc2 = nn.Linear(128, 64)
        self.bn2 = nn.BatchNorm1d(64)
        self.drop2 = nn.Dropout(dropout_rate * 0.7)

        # Layer 3
        self.fc3 = nn.Linear(64, 32)
        self.bn3 = nn.BatchNorm1d(32)
        self.drop3 = nn.Dropout(dropout_rate * 0.4)

        # Output Layer (logits)
        self.out = nn.Linear(32, num_classes)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # Layer 1
        x = self.fc1(x)
        x = self.bn1(x)
        x = F.relu(x)
        x = self.drop1(x)

        # Layer 2
        x = self.fc2(x)
        x = self.bn2(x)
        x = F.relu(x)
        x = self.drop2(x)

        # Layer 3
        x = self.fc3(x)
        x = self.bn3(x)
        x = F.relu(x)
        x = self.drop3(x)

        # Raw logits for CrossEntropyLoss / Softmax
        return self.out(x)

    def predict_proba(self, x: torch.Tensor) -> torch.Tensor:
        """Returns normalized class probabilities."""
        self.eval()
        with torch.no_grad():
            logits = self.forward(x)
            return F.softmax(logits, dim=-1)


class NIDS_CNN1D(nn.Module):
    """
    1D-CNN Comparison Variant for NSL-KDD tabular sequence modeling.
    Extracts local n-gram patterns across adjacent network telemetry features.
    """
    def __init__(self, input_dim: int, num_classes: int = 5):
        super(NIDS_CNN1D, self).__init__()
        
        # Reshape (batch_size, input_dim) -> (batch_size, 1, input_dim)
        self.conv1 = nn.Conv1d(in_channels=1, out_channels=32, kernel_size=3, padding=1)
        self.bn1 = nn.BatchNorm1d(32)
        
        self.conv2 = nn.Conv1d(in_channels=32, out_channels=64, kernel_size=3, padding=1)
        self.bn2 = nn.BatchNorm1d(64)
        
        self.pool = nn.AdaptiveAvgPool1d(16)
        self.fc1 = nn.Linear(64 * 16, 64)
        self.drop = nn.Dropout(0.3)
        self.out = nn.Linear(64, num_classes)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # Add channel dimension: (B, D) -> (B, 1, D)
        if x.dim() == 2:
            x = x.unsqueeze(1)
            
        x = F.relu(self.bn1(self.conv1(x)))
        x = F.relu(self.bn2(self.conv2(x)))
        x = self.pool(x)
        
        x = x.view(x.size(0), -1)
        x = F.relu(self.fc1(x))
        x = self.drop(x)
        return self.out(x)


class NIDS_LSTM(nn.Module):
    """
    Bidirectional LSTM Comparison Variant.
    Treats partitioned feature sets as sequential states.
    """
    def __init__(self, input_dim: int, num_classes: int = 5, hidden_dim: int = 48):
        super(NIDS_LSTM, self).__init__()
        
        self.hidden_dim = hidden_dim
        # Project inputs to embeddings before LSTM sequence step
        self.lstm = nn.LSTM(
            input_size=1,
            hidden_size=hidden_dim,
            num_layers=1,
            batch_first=True,
            bidirectional=True
        )
        self.fc = nn.Linear(hidden_dim * 2, 32)
        self.drop = nn.Dropout(0.2)
        self.out = nn.Linear(32, num_classes)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # (B, D) -> (B, D, 1)
        if x.dim() == 2:
            x = x.unsqueeze(-1)
            
        lstm_out, _ = self.lstm(x)
        # Global temporal pooling
        pooled = torch.mean(lstm_out, dim=1)
        x = F.relu(self.fc(pooled))
        x = self.drop(x)
        return self.out(x)


def get_model(model_name: str, input_dim: int, num_classes: int = 5) -> nn.Module:
    """Model factory helper."""
    name = model_name.lower().strip()
    if name in ('mlp', 'feedforward'):
        return NIDS_MLP(input_dim=input_dim, num_classes=num_classes)
    elif name in ('cnn', '1dcnn', 'cnn1d'):
        return NIDS_CNN1D(input_dim=input_dim, num_classes=num_classes)
    elif name in ('lstm', 'rnn'):
        return NIDS_LSTM(input_dim=input_dim, num_classes=num_classes)
    else:
        raise ValueError(f"Unknown model name: {model_name}. Choose from 'mlp', 'cnn1d', 'lstm'.")
