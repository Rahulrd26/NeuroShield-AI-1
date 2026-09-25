"""
NSL-KDD Evaluation and Benchmark Module
=======================================
Computes:
1. Multi-class metrics: Accuracy, Precision, Recall, F1-score (Macro, Weighted, Per-Class).
2. Binary Detection Metrics: Attack Recall (Priority metric!), Attack Precision, F1, False Alarm Rate (FAR).
3. 5x5 Multi-class Confusion Matrix and 2x2 Binary Confusion Matrix.
4. One-vs-Rest ROC-AUC curves and area scores.
5. Zero-Day / Novel Unseen Attacks generalization evaluation on KDDTest+.
"""

import os
import json
import numpy as np
import torch
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    confusion_matrix, roc_auc_score, roc_curve
)

from data import CLASS_LABELS, UNSEEN_ATTACKS


def evaluate_nids_model(model: torch.nn.Module, x_test: np.ndarray, y_test: np.ndarray, attack_names: list = None):
    """
    Evaluates model on test data, producing comprehensive metrics.
    """
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    model.eval()
    model.to(device)

    with torch.no_grad():
        x_tensor = torch.from_numpy(x_test).float().to(device)
        logits = model(x_tensor)
        probs = torch.softmax(logits, dim=-1).cpu().numpy()
        preds = np.argmax(probs, axis=1)

    # 1. Multi-Class Metrics
    acc = accuracy_score(y_test, preds)
    macro_prec = precision_score(y_test, preds, average='macro', zero_division=0)
    macro_rec = recall_score(y_test, preds, average='macro', zero_division=0)
    macro_f1 = f1_score(y_test, preds, average='macro', zero_division=0)
    weighted_f1 = f1_score(y_test, preds, average='weighted', zero_division=0)

    # Per-Class Metrics
    per_class = {}
    for idx, cls_name in enumerate(CLASS_LABELS):
        binary_true = (y_test == idx).astype(int)
        binary_pred = (preds == idx).astype(int)
        p = precision_score(binary_true, binary_pred, zero_division=0)
        r = recall_score(binary_true, binary_pred, zero_division=0)
        f = f1_score(binary_true, binary_pred, zero_division=0)
        support = int(np.sum(binary_true))
        per_class[cls_name] = {
            'precision': round(float(p), 4),
            'recall': round(float(r), 4),
            'f1': round(float(f), 4),
            'support': support
        }

    # 2. Binary Evaluation (Normal: 0, Attack: 1)
    # Crucial security priority: Attack Recall must be maximized to prevent breaches
    y_test_bin = (y_test > 0).astype(int)
    preds_bin = (preds > 0).astype(int)
    probs_attack_bin = 1.0 - probs[:, 0]

    bin_acc = accuracy_score(y_test_bin, preds_bin)
    bin_rec = recall_score(y_test_bin, preds_bin, zero_division=0)  # Attack Recall
    bin_prec = precision_score(y_test_bin, preds_bin, zero_division=0)
    bin_f1 = f1_score(y_test_bin, preds_bin, zero_division=0)
    
    # False Alarm Rate (FAR) = FP / (FP + TN)
    cm_bin = confusion_matrix(y_test_bin, preds_bin)
    tn, fp, fn, tp = cm_bin.ravel()
    far = fp / max((fp + tn), 1)

    # ROC-AUC
    bin_roc_auc = roc_auc_score(y_test_bin, probs_attack_bin)
    fpr, tpr, thresholds = roc_curve(y_test_bin, probs_attack_bin)

    # 3. 5x5 Multi-class Confusion Matrix
    cm_multi = confusion_matrix(y_test, preds, labels=list(range(len(CLASS_LABELS))))

    # 4. Generalization on Novel / Unseen Attacks
    unseen_eval = {}
    if attack_names is not None:
        for unseen_atk in UNSEEN_ATTACKS:
            indices = [i for i, name in enumerate(attack_names) if str(name).strip().lower() == unseen_atk]
            if indices:
                sub_y_bin = y_test_bin[indices]
                sub_pred_bin = preds_bin[indices]
                detected_cnt = int(np.sum(sub_pred_bin == 1))
                total_cnt = len(indices)
                unseen_eval[unseen_atk] = {
                    'total': total_cnt,
                    'detected_as_attack': detected_cnt,
                    'detection_rate': round(detected_cnt / max(total_cnt, 1), 4)
                }

    results = {
        'overall': {
            'accuracy': round(float(acc), 4),
            'macro_f1': round(float(macro_f1), 4),
            'weighted_f1': round(float(weighted_f1), 4),
            'macro_precision': round(float(macro_prec), 4),
            'macro_recall': round(float(macro_rec), 4)
        },
        'binary_security_priority': {
            'attack_recall': round(float(bin_rec), 4),  # PRIORITY METRIC
            'attack_precision': round(float(bin_prec), 4),
            'binary_f1': round(float(bin_f1), 4),
            'binary_accuracy': round(float(bin_acc), 4),
            'false_alarm_rate': round(float(far), 4),
            'roc_auc': round(float(bin_roc_auc), 4),
            'confusion_matrix': {
                'true_negative_normal': int(tn),
                'false_positive_alarm': int(fp),
                'false_negative_missed': int(fn),
                'true_positive_detected': int(tp)
            }
        },
        'per_class': per_class,
        'confusion_matrix_5x5': {
            'labels': CLASS_LABELS,
            'matrix': cm_multi.tolist()
        },
        'roc_curve': {
            'fpr': [round(float(x), 4) for x in fpr[::max(1, len(fpr)//50)]],
            'tpr': [round(float(x), 4) for x in tpr[::max(1, len(tpr)//50)]],
            'auc': round(float(bin_roc_auc), 4)
        },
        'unseen_attacks_generalization': unseen_eval
    }

    return results
