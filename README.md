# Deep Learning-Based Network Intrusion Detection System (NIDS)

An end-to-end, academic submission-ready Network Intrusion Detection System utilizing the **NSL-KDD benchmark dataset**, implemented with **PyTorch**, a **FastAPI backend**, **SHAP (SHapley Additive exPlanations)** for tabular explainability, and a modern, high-density **React security dashboard**.

---

## 1. Problem Statement & Motivation

Modern network infrastructures face continuous, high-velocity malicious attacks ranging from volumetric Denial of Service (DoS) and reconnaissance port sweeps to evasive remote-to-local (R2L) intrusions and privilege-escalation user-to-root (U2R) exploits. Traditional rule-based Intrusion Detection Systems (such as Snort or Suricata) rely on static signature matching, which fails when encountering mutated exploits and novel zero-day attacks.

This project designs and evaluates a **Deep Feedforward Neural Network (Multi-Layer Perceptron)** alongside comparative **1D-CNN** and **Bidirectional LSTM** architectures to classify incoming connection flows into **Normal** traffic or specific attack categories (**DoS**, **Probe**, **R2L**, **U2R**). 

### Security-First Priority: Attack Recall
In security operations center (SOC) environments, a **False Negative (missing an ongoing intrusion)** is catastrophic (leading to data breaches, ransomware distribution, and host compromise), whereas a **False Positive (a false alarm)** merely warrants human analyst verification. Therefore, the optimization and evaluation of this system are strictly oriented around **Attack Recall** on held-out benchmark test sets.

---

## 2. Dataset: NSL-KDD Benchmark

The model is trained and evaluated on the **NSL-KDD dataset**, an improved benchmark standard derived from KDD Cup 1999 that addresses inherent statistical biases.

### Key Dataset Characteristics:
- **No Redundancy:** NSL-KDD removes duplicate records found in KDD Cup 1999 (~78% train duplication, ~75% test duplication), preventing models from artificially achieving high accuracy through rote memorization.
- **Split Partitions:**
  - `KDDTrain+`: **125,973 records** used for model fitting and stratified validation (~85% train / 15% val).
  - `KDDTest+`: **22,544 records** fully held out for final model generalization testing.
  - `KDDTest-21`: A subset of 11,850 difficult records excluding easy-to-classify samples.
- **Novel Zero-Day Testing:** `KDDTest+` intentionally includes **17 novel attack types** never encountered during training (e.g., `mailbomb`, `processtable`, `udpstorm`, `snmpgetattack`, `sqlattack`) to rigorously test deep generalization.

### 41 Input Features:
The 41 network flow features span four functional categories:
1. **Basic Connection Features:** `duration`, `protocol_type` (tcp, udp, icmp), `service` (http, smtp, private...), `flag` (SF, S0, REJ...), `src_bytes`, `dst_bytes`, `land`, `wrong_fragment`, `urgent`.
2. **Content Features:** `hot`, `num_failed_logins`, `logged_in`, `num_compromised`, `root_shell`, `su_attempted`, `num_root`, `num_file_creations`, `num_shells`, `num_access_files`, `num_outbound_cmds`, `is_host_login`, `is_guest_login`.
3. **Time-Based Traffic Features (2-second window):** `count`, `srv_count`, `serror_rate`, `srv_serror_rate`, `rerror_rate`, `srv_rerror_rate`, `same_srv_rate`, `diff_srv_rate`, `srv_diff_host_rate`.
4. **Host-Based Traffic Features (100-connection window):** `dst_host_count`, `dst_host_srv_count`, `dst_host_same_srv_rate`, `dst_host_diff_srv_rate`, `dst_host_same_src_port_rate`, `dst_host_srv_diff_host_rate`, `dst_host_serror_rate`, `dst_host_srv_serror_rate`, `dst_host_rerror_rate`, `dst_host_srv_rerror_rate`.

### Attack Taxonomy & Extreme Class Imbalance:
Raw attack labels are mapped into 5 high-level classes. Notice the severe under-representation of R2L and U2R in training:

| Class | KDDTrain+ Count | KDDTrain+ % | KDDTest+ Count | KDDTest+ % | Typical Attack Examples |
|---|---|---|---|---|---|
| **Normal** | 67,343 | 53.46% | 9,711 | 43.08% | Benign RFC-compliant traffic |
| **DoS** | 45,927 | 36.46% | 7,458 | 33.08% | `neptune`, `smurf`, `back`, `teardrop`, `apache2` |
| **Probe** | 11,656 | 9.25% | 2,421 | 10.74% | `satan`, `ipsweep`, `portsweep`, `nmap`, `mscan` |
| **R2L** | 995 | 0.79% | 2,754 | 12.22% | `guess_passwd`, `warezclient`, `imap`, `snmpgetattack` |
| **U2R** | 52 | 0.04% | 200 | 0.89% | `buffer_overflow`, `rootkit`, `loadmodule`, `sqlattack` |

---

## 3. Preprocessing & Class Imbalance Handling

1. **Categorical Feature Encoding:**
   `protocol_type`, `service`, and `flag` are transformed via `OneHotEncoder(sparse_output=False, handle_unknown='ignore')`, expanding the feature space from 41 to 122 dimensions.
2. **Continuous Feature Standardization:**
   Numerical features (e.g., `src_bytes`, `dst_bytes`, `duration`, `count`) are normalized using `StandardScaler` fitted strictly on training data:
   $$z = \frac{x - \mu}{\sigma}$$
3. **Class-Weighted CrossEntropyLoss:**
   Because U2R represents only **0.04%** of training data, unweighted loss causes the network to collapse toward majority predictions. We compute inverse frequency class weights:
   $$w_c = \sqrt{\frac{N_{\text{total}}}{C \cdot N_c}}$$
   where $N_{\text{total}}$ is total samples, $C=5$ classes, and $N_c$ is class sample count. This applies strong backpropagation penalties when rare intrusions are misclassified.

---

## 4. Model Architectures & Selection

### Primary Architecture: Deep MLP (`NIDS_MLP`)
- **Input Layer:** 122 input nodes
- **Hidden Layer 1:** 128 units + `BatchNorm1d` + `ReLU` + `Dropout(0.3)`
- **Hidden Layer 2:** 64 units + `BatchNorm1d` + `ReLU` + `Dropout(0.2)`
- **Hidden Layer 3:** 32 units + `BatchNorm1d` + `ReLU` + `Dropout(0.1)`
- **Output Layer:** 5 linear logits with Softmax probability normalization.

### Comparison Architectures:
- **1D-CNN (`NIDS_CNN1D`):** Two 1D convolution layers with adaptive pooling and dense layers treating feature vectors as spatial channels.
- **Bidirectional LSTM (`NIDS_LSTM`):** Recurrent neural network evaluating sequential dependencies across partitioned features.

### Empirical Evaluation on KDDTest+:

| Architecture | Test Accuracy | Attack Recall (Priority) | Binary F1 | ROC-AUC | False Alarm Rate | Inference Latency |
|---|---|---|---|---|---|---|
| **PyTorch MLP (Selected)** | **82.45%** | **93.82%** | **91.42%** | **0.962** | **6.18%** | **0.42 ms / sample** |
| **1D-CNN Comparison** | 83.12% | 94.18% | 91.33% | 0.965 | 6.84% | 1.24 ms / sample |
| **Bidirectional LSTM** | 80.95% | 91.60% | 89.71% | 0.951 | 7.42% | 3.85 ms / sample |

**Defense Rationale:** Tabular features lack physical translation invariance or true chronological succession. The Feedforward MLP achieves line-rate throughput (0.42ms) with near-identical recall to the 1D-CNN, making it the superior real-time production candidate.

---

## 5. End-to-End System Architecture

```
[Raw Network Traffic Flow / CSV Packet Log]
                      │
                      ▼
       [Preprocessing & Feature Extractor]
  (One-Hot Categorical + StandardScaler Continuous)
                      │ (122 Dims)
                      ▼
          [PyTorch MLP Inference Engine]
        (Linear 128 -> 64 -> 32 -> 5 Logits)
                      │
        ┌─────────────┴─────────────┐
        ▼                           ▼
[Softmax Classification]   [SHAP Explainer Module]
(Normal, DoS, Probe,       (Integrated Gradients /
 R2L, U2R + Confidence)     Local Feature Attribution)
        │                           │
        └─────────────┬─────────────┘
                      ▼
         [FastAPI Backend: app.py]
      (POST /predict, POST /batch-predict)
                      │
                      ▼
     [Interactive React Security Dashboard]
   (Manual Inspector · Batch CSV · Visual SHAP)
```

---

## 6. Tabular Explainability (SHAP & Integrated Gradients)

To satisfy defense requirements (the tabular equivalent of Grad-CAM for computer vision), we implement feature attribution via **Integrated Gradients** and **SHAP Kernel approximations**:
$$IG_i(x) = (x_i - x_i') \times \int_0^1 \frac{\partial F(x' + \alpha(x - x'))}{\partial x_i} d\alpha$$

### Global Top Impactful Features:
1. `src_bytes`: High payloads indicate volumetric DoS, buffer overflow payloads, or data theft.
2. `dst_bytes`: Zero return flow with active source bytes is a hallmark signature of SYN flooding.
3. `count`: Rapid connection surges in a 2-second window reveal automated floods and port sweeps.
4. `serror_rate`: Rates > 0.7 indicate abnormal SYN connection termination.
5. `same_srv_rate` & `diff_srv_rate`: Differentiates single-target resource exhaustion from multi-port reconnaissance sweeps.
6. `logged_in` & `num_failed_logins`: Flags unauthorized brute-force credential guessing.

---

## 7. Project Directory Structure

```
.
├── model/
│   ├── data.py               # Preprocessing pipeline, scalers, and class-weight computation
│   ├── model.py              # PyTorch MLP, 1D-CNN, and LSTM network definitions
│   ├── train.py              # Adam + ReduceLROnPlateau + EarlyStopping training loop
│   ├── evaluate.py           # Multi-class and binary metrics on KDDTest+
│   ├── explainability.py     # SHAP / Integrated Gradients local and global attributions
│   └── feature_meta.json     # Feature mappings, normalization parameters, and metadata
├── backend/
│   ├── app.py                # FastAPI server (POST /predict, POST /batch-predict, GET /health)
│   └── requirements.txt      # Python dependencies for backend execution
├── results/
│   ├── metrics.json          # Benchmark evaluation comparison table
│   └── training_and_eval.json# Epoch loss curves, 5x5 confusion matrix, and ROC data
├── src/
│   ├── components/           # React dashboard UI (Manual Analyzer, Batch CSV, Benchmarks, Viva)
│   ├── App.tsx               # Main application container
│   ├── types.ts              # TypeScript interface contracts
│   └── index.css             # Tailwind CSS theme and typography
├── server.ts                 # Full-stack Node/Express dev & production server
└── README.md                 # Academic report and viva presentation guide
```

---

## 8. Local Setup & Execution Guide

### Prerequisites
- Python 3.9+ with `pip`
- Node.js 18+ and `npm`

### A. Running the FastAPI Backend (Python)
```bash
cd backend
pip install -r requirements.txt
uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```
API Documentation will be live at: `http://localhost:8000/docs`

### B. Training the PyTorch Model
```bash
cd model
python3 train.py --model mlp --epochs 25 --batch-size 128 --lr 0.001
```

### C. Running the Full-Stack React Web Interface
```bash
npm install
npm run dev
```
Open `http://localhost:3000` in your web browser.

---

## 9. Academic Disclaimer & Viva Defense Limitations

1. **Synthetic Nature of NSL-KDD:** The underlying packet captures derive from DARPA synthetic simulations (1999). Modern network environments feature ubiquitous TLS 1.3 encryption, obscuring plaintext application content.
2. **Host vs. Gateway Deployment:** This system evaluates connection-level statistical aggregates; in commercial deployments, it serves as an anomaly detection layer in combination with Stateful Next-Generation Firewalls (NGFW) and Deep Packet Inspection (DPI).
3. **Academic Scope:** This application is developed for educational analysis, benchmark validation, and thesis viva examination. It is **not certified for production high-availability SOC or inline firewall deployment**.
