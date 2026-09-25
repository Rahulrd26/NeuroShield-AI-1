"""
NSL-KDD Dataset Preprocessing and Loading Module
================================================
This module handles:
1. NSL-KDD 41-feature schema definition.
2. Attack taxonomy mapping (43 specific attack types mapped to 5 high-level classes:
   Normal, DoS, Probe, R2L, U2R).
3. Categorical encoding (One-Hot Encoding for protocol_type, service, flag).
4. Numerical normalization (StandardScaler / MinMaxScaler).
5. Class imbalance computation and loss weights calculation.
6. Stratified train/val split (~85/15) from KDDTrain+ and evaluation on KDDTest+.
"""

import os
import json
import pickle
import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.model_selection import train_test_split

# 41 standard features in NSL-KDD + label + difficulty level
FEATURE_NAMES = [
    'duration', 'protocol_type', 'service', 'flag', 'src_bytes',
    'dst_bytes', 'land', 'wrong_fragment', 'urgent', 'hot',
    'num_failed_logins', 'logged_in', 'num_compromised', 'root_shell',
    'su_attempted', 'num_root', 'num_file_creations', 'num_shells',
    'num_access_files', 'num_outbound_cmds', 'is_host_login',
    'is_guest_login', 'count', 'srv_count', 'serror_rate',
    'srv_serror_rate', 'rerror_rate', 'srv_rerror_rate', 'same_srv_rate',
    'diff_srv_rate', 'srv_diff_host_rate', 'dst_host_count',
    'dst_host_srv_count', 'dst_host_same_srv_rate',
    'dst_host_diff_srv_rate', 'dst_host_same_src_port_rate',
    'dst_host_srv_diff_host_rate', 'dst_host_serror_rate',
    'dst_host_srv_serror_rate', 'dst_host_rerror_rate',
    'dst_host_srv_rerror_rate', 'attack_type', 'difficulty_level'
]

CATEGORICAL_FEATURES = ['protocol_type', 'service', 'flag']

NUMERICAL_FEATURES = [
    'duration', 'src_bytes', 'dst_bytes', 'land', 'wrong_fragment', 'urgent',
    'hot', 'num_failed_logins', 'logged_in', 'num_compromised', 'root_shell',
    'su_attempted', 'num_root', 'num_file_creations', 'num_shells',
    'num_access_files', 'num_outbound_cmds', 'is_host_login', 'is_guest_login',
    'count', 'srv_count', 'serror_rate', 'srv_serror_rate', 'rerror_rate',
    'srv_rerror_rate', 'same_srv_rate', 'diff_srv_rate', 'srv_diff_host_rate',
    'dst_host_count', 'dst_host_srv_count', 'dst_host_same_srv_rate',
    'dst_host_diff_srv_rate', 'dst_host_same_src_port_rate',
    'dst_host_srv_diff_host_rate', 'dst_host_serror_rate',
    'dst_host_srv_serror_rate', 'dst_host_rerror_rate',
    'dst_host_srv_rerror_rate'
]

# Attack taxonomy: Maps 43 fine-grained attack types to 5 canonical categories
ATTACK_CATEGORIES = {
    # Normal traffic
    'normal': 'Normal',
    
    # Denial of Service (DoS) attacks
    'neptune': 'DoS', 'smurf': 'DoS', 'back': 'DoS', 'teardrop': 'DoS',
    'pod': 'DoS', 'land': 'DoS', 'apache2': 'DoS', 'udpstorm': 'DoS',
    'processtable': 'DoS', 'mailbomb': 'DoS',
    
    # Surveillance / Probe attacks
    'satan': 'Probe', 'ipsweep': 'Probe', 'portsweep': 'Probe', 'nmap': 'Probe',
    'saint': 'Probe', 'mscan': 'Probe',
    
    # Remote to Local (R2L) unauthorized access attacks
    'warezclient': 'R2L', 'guess_passwd': 'R2L', 'warezmaster': 'R2L',
    'imap': 'R2L', 'ftp_write': 'R2L', 'multihop': 'R2L', 'phf': 'R2L',
    'spy': 'R2L', 'sendmail': 'R2L', 'named': 'R2L', 'snmpgetattack': 'R2L',
    'snmpguess': 'R2L', 'xlock': 'R2L', 'xsnoop': 'R2L', 'worm': 'R2L',
    
    # User to Root (U2R) privilege escalation attacks
    'buffer_overflow': 'U2R', 'rootkit': 'U2R', 'loadmodule': 'U2R',
    'perl': 'U2R', 'sqlattack': 'U2R', 'xterm': 'U2R', 'ps': 'U2R', 'httptunnel': 'R2L'
}

# Attacks intentionally present in KDDTest+ but absent from KDDTrain+
# Used to rigorously evaluate zero-day attack generalization
UNSEEN_ATTACKS = [
    'apache2', 'httptunnel', 'mailbomb', 'mscan', 'named', 'ps',
    'saint', 'sendmail', 'snmpgetattack', 'snmpguess', 'sqlattack',
    'udpstorm', 'xlock', 'xsnoop', 'xterm'
]

CLASS_LABELS = ['Normal', 'DoS', 'Probe', 'R2L', 'U2R']
CLASS_TO_IDX = {cls: idx for idx, cls in enumerate(CLASS_LABELS)}
IDX_TO_CLASS = {idx: cls for idx, cls in enumerate(CLASS_LABELS)}


class NSLKDDPreprocessor:
    """
    Standard preprocessing pipeline fitted on training data
    and reused consistently for inference and testing.
    """
    def __init__(self):
        self.scaler = StandardScaler()
        self.encoder = OneHotEncoder(sparse_output=False, handle_unknown='ignore')
        self.fitted_feature_names = []
        self.is_fitted = False

    def fit(self, df: pd.DataFrame):
        # 1. Fit OneHotEncoder on categorical features
        self.encoder.fit(df[CATEGORICAL_FEATURES])
        cat_feature_names = list(self.encoder.get_feature_names_out(CATEGORICAL_FEATURES))
        
        # 2. Fit StandardScaler on numerical features
        self.scaler.fit(df[NUMERICAL_FEATURES])
        
        # 3. Store unified feature order
        self.fitted_feature_names = NUMERICAL_FEATURES + cat_feature_names
        self.is_fitted = True
        return self

    def transform(self, df: pd.DataFrame) -> np.ndarray:
        if not self.is_fitted:
            raise ValueError("Preprocessor has not been fitted yet!")
        
        # Ensure numerical features are present and cast to float
        num_vals = self.scaler.transform(df[NUMERICAL_FEATURES].astype(float))
        
        # Encode categorical features
        cat_vals = self.encoder.transform(df[CATEGORICAL_FEATURES])
        
        # Stack numerical + categorical
        return np.hstack([num_vals, cat_vals]).astype(np.float32)

    def fit_transform(self, df: pd.DataFrame) -> np.ndarray:
        return self.fit(df).transform(df)

    def save(self, filepath: str):
        """Save preprocessor state for deployment."""
        with open(filepath, 'wb') as f:
            pickle.dump({
                'scaler': self.scaler,
                'encoder': self.encoder,
                'fitted_feature_names': self.fitted_feature_names,
                'numerical_features': NUMERICAL_FEATURES,
                'categorical_features': CATEGORICAL_FEATURES,
                'class_labels': CLASS_LABELS,
                'class_to_idx': CLASS_TO_IDX
            }, f)

    @classmethod
    def load(cls, filepath: str):
        with open(filepath, 'rb') as f:
            data = pickle.load(f)
        obj = cls()
        obj.scaler = data['scaler']
        obj.encoder = data['encoder']
        obj.fitted_feature_names = data['fitted_feature_names']
        obj.is_fitted = True
        return obj


def map_attack_category(attack_str: str) -> str:
    """Map raw attack label string to 5-class category."""
    clean = str(attack_str).strip().lower().rstrip('.')
    return ATTACK_CATEGORIES.get(clean, 'Attack')


def compute_class_weights(y_train: np.ndarray, num_classes: int = 5) -> np.ndarray:
    """
    Compute balanced inverse frequency class weights to mitigate severe
    class imbalance (e.g., U2R and R2L under-representation).
    Formula: weight[c] = total_samples / (num_classes * count[c])
    """
    counts = np.bincount(y_train, minlength=num_classes)
    total = len(y_train)
    weights = np.zeros(num_classes, dtype=np.float32)
    for c in range(num_classes):
        weights[c] = total / (num_classes * max(counts[c], 1))
    # Soft dampening with square root to prevent excessive variance
    weights = np.sqrt(weights)
    weights /= weights.mean()
    return weights
