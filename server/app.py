import os
import shutil
import pickle
import numpy as np
from scipy.signal import medfilt
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from sklearn.metrics import accuracy_score, f1_score
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import StratifiedKFold
from sklearn.feature_selection import mutual_info_classif
from scipy.signal import butter, filtfilt, iirnotch
from fastapi import FastAPI, File, UploadFile

app = FastAPI()

origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

def get_data(ds_number, selected_gestures, channels, ds_filename):    
    gestures = {}
    
    filename = ""

    if ds_number == 0 and ds_filename:
        filename = os.path.join(UPLOAD_DIR, ds_filename)
    else:
        filename = f'static/datasets/ds{ds_number}_gestures.pkl'
    
    with open(filename, 'rb') as f:
        gestures = pickle.load(f)

    keys = list(gestures.keys())

    if len(selected_gestures):
        for g in keys:
            if g != 0 and g not in selected_gestures:
                del gestures[g]

    if len(channels):
        for g in gestures.keys():
            for sample in gestures[g]:
                sample = sample[:, channels]

    return gestures

def calculate_rms(window):
    """
    Calculate the RMS value for each channel in a window and the average RMS.

    Parameters:
    - window: NumPy array of shape (window_length, num_channels), the signal data in the window.

    Returns:
    - rms_per_channel: RMS values for each individual channel.
    - rms_avg: RMS value of the averaged signal across all channels.
    """
    
    rms_per_channel = np.sqrt(np.mean(np.square(window), axis=0))

    rms_avg = np.mean(rms_per_channel)

    return rms_per_channel, rms_avg

def calculate_tmi(n_channels, gestures):

    if n_channels == 0:
        n_channels = gestures[0][0].shape[1]

    features = []
    labels = []

    for g in gestures.keys():
        for sample in gestures[g]:
            feature_set = []
            window_len = (len(sample) // 3)
            windows = [sample[window_len * i:window_len * (i + 1)] for i in range(3)]
            for w in windows:
                rms_per_channel, rms_avg = calculate_rms(w)
                rms_per_channel = rms_per_channel / rms_avg
                feature_set.extend(rms_per_channel)
            features.append(feature_set)
            labels.append(g)

    multivariate_tmi = mutual_info_classif(features, labels)

    components_per_channel = np.array([multivariate_tmi[ch::n_channels] for ch in range(n_channels)])

    channel_importance = components_per_channel.sum(axis=1)

    ranked_channels = np.argsort(channel_importance)

    return ranked_channels

def train_model(electrodes_sorted, gestures, optimize_further):

    best_accuracy = 0
    best_f1 = 0
    best_model = None

    if optimize_further:
        l_start = 2
        l_end = min(21, len(electrodes_sorted))
    else:
        l_start = len(electrodes_sorted) - 1
        l_end = len(electrodes_sorted)

    for z in range(l_start, l_end):

        print(f"Training for top {z}...")

        model = RandomForestClassifier(max_depth=30, random_state=42)

        selected_channels = electrodes_sorted[-z:]

        class_map = {
            v: i for i, v in enumerate(gestures.keys())
        }

        features = []
        labels = []

        # for user in gestures.keys():
        for g in gestures.keys():
            for sample in gestures[g]:
                feature_set = []
                window_len = (len(sample) // 3)
                windows = [sample[window_len * i:window_len * (i + 1), selected_channels] for i in range(3)]
                for w in windows:
                    rms_per_channel, rms_avg = calculate_rms(w)
                    rms_per_channel = rms_per_channel / rms_avg
                    feature_set.extend(rms_per_channel)
                features.append(feature_set)
                labels.append(class_map[g])

        features = np.array(features)
        labels = np.array(labels)

        skf = StratifiedKFold(n_splits=4, shuffle=True, random_state=42)

        accuracy = []
        f1 = []

        for train_index, val_index in skf.split(features, labels):
            X_train, X_test = features[train_index], features[val_index]
            y_train, y_test = labels[train_index], labels[val_index]
        
            model.fit(X_train, y_train)
            y_pred = model.predict(X_test)
            
            accuracy_cv = accuracy_score(y_test, y_pred)
            f1_cv = f1_score(y_test, y_pred, average="macro")

            accuracy.append(accuracy_cv)
            f1.append(f1_cv)
        
        accuracy = np.mean(accuracy)
        f1 = np.mean(f1)

        best_model = model
        best_channels = selected_channels
        best_accuracy = accuracy
        best_f1 = f1
        
    return best_model, best_channels, best_accuracy, best_f1    

def bandpass_filter(data, fs, lowcut=20, highcut=450, order=4):
    """
    Apply a Butterworth band-pass filter.
    """
    nyq = 0.5 * fs
    low = lowcut / nyq
    high = highcut / nyq
    b, a = butter(order, [low, high], btype='band')
    return filtfilt(b, a, data, axis=0)

def notch_filter(data, fs, notch_freq=50, Q=50):
    """
    Apply a digital IIR notch filter to remove power-line noise.
    """
    # Normalize notch frequency
    nyq = 0.5 * fs
    w0 = notch_freq / nyq  # normalized frequency
    b, a = iirnotch(w0, Q)
    return filtfilt(b, a, data, axis=0)

def compute_rms(signal):
    """Computes RMS for a given signal window."""
    return np.sqrt(np.mean(np.square(signal), axis=0))

def segment_gesture(data, rest_rms, window_size=150, median_filter_size=3):
    """Segments the gesture based on RMS thresholding."""

    num_samples, num_channels = data.shape
    num_windows = num_samples // window_size 

    # Compute RMS for each window
    rms_values = np.array([
        compute_rms(data[i * window_size: (i + 1) * window_size]) - rest_rms
        for i in range(num_windows)
    ])

    rms_values_filtered = np.array([
        medfilt(i, median_filter_size)
        for i in rms_values
    ])

    summarized_rms = np.sum(rms_values_filtered, axis=1)

    threshold = np.mean(summarized_rms)

    active_windows = summarized_rms > threshold
    
    # Fill gaps (set inactive windows as active if neighbors are active)
    for i in range(1, len(active_windows) - 1):
        if not active_windows[i] and active_windows[i - 1] and active_windows[i + 1]:
            active_windows[i] = True
    
    # Find longest contiguous active segment
    max_length, best_start, current_length, current_start = 0, 0, 0, None
    for i, active in enumerate(active_windows):
        if active:
            if current_start is None:
                current_start = i
            current_length += 1
        else:
            if current_length > max_length:
                max_length, best_start = current_length, current_start
            current_length, current_start = 0, None
    
    if current_length > max_length:
        max_length, best_start = current_length, current_start
    
    # Extract segment indices
    segment_start, segment_end = best_start * window_size, (best_start + max_length) * window_size
    return segment_start, segment_end

def preprocess(sample, fs):
    sample_ = np.array(sample)
    sample_ = notch_filter(sample_, fs)
    sample_ = bandpass_filter(sample_, fs)
    return sample_

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    file_location = f"{UPLOAD_DIR}/{file.filename}"
    with open(file_location, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    return {"filename": file.filename, "message": "File uploaded successfully"}

@app.websocket("/ws/train_model")
async def ws_train_model(websocket: WebSocket):
    ds_mapping = {"CSL-HDEMG": 1, "DELTA": 2, "GrabMyo": 3, "PutEMG": 4, "Hyser": 5, "Nizamis et al.": 6}

    await websocket.accept()

    # Receive first message (contains parameters)
    data = await websocket.receive_json()

    ds = data.get("ds", 0) # selected dataset (mandatory)
    ds_number = ds_mapping[ds] # map dataset name to number
    selected_gestures = data.get("selected_gestures", []) # array of gesture numbers from the dataset
    no_of_channels = data.get("no_of_channels", 0) # maximum number of channels
    no_of_channels = int(no_of_channels)
    area_no_of_channels = data.get("area_no_of_channels", []) # channels in the selected region 
    fs = data.get("fs", 0) # sampling frequency of custom dataset (mandatory, if ds_number == 0)
    apply_preprocess = data.get("apply_preprocess", True) # apply preprocessing for custom dataset 
    ds_filename = data.get('ds_filename', None) # custom dataset file (mandatory, if ds_number == 0)
    optimize_further = data.get("optimize_toggle", False) # optimize further (optional)

    error_msg = ""

    if ds_number == 0:
        if fs == 0: 
            error_msg = "sampling rate missing!"
        if not ds_filename:
            error_msg = "filename missing!"

    if len(error_msg):
        await websocket.send_json({"error": error_msg})
        await websocket.close()

    if len(area_no_of_channels):
        channels = area_no_of_channels
    else:
        channels = []

    gestures = get_data(ds_number, selected_gestures, channels, ds_filename)

    if ds_number == 0 and apply_preprocess != "False":
        for sample in gestures[0]:
            sample = preprocess(sample, fs)
        
        rest_avg_rms = np.mean([compute_rms(iter) for iter in gestures[0]], axis=0)

        for g in gestures.keys():
            for sample in gestures[g]:
                sample = preprocess(sample, fs)
                if g != 0:
                    start, end = segment_gesture(sample, rest_avg_rms)
                    sample = sample[start:end]
    
    electrodes_sorted = calculate_tmi(len(channels), gestures)

    if (no_of_channels != 0 and not optimize_further) or (no_of_channels != 0 and len(area_no_of_channels) == 0):
        electrodes_sorted = electrodes_sorted[-no_of_channels:]

    best_model, best_channels, best_accuracy, best_f1 = train_model(electrodes_sorted, gestures, optimize_further)

    if len(channels):
        channel_map = {
            i: v for i, v in enumerate(channels) 
        }
        best_channels = [channel_map[channel] for channel in best_channels]

    await websocket.send_json({"best_channels": list(best_channels), "accuracy": float(best_accuracy), "f1": float(best_f1)})

    await websocket.close()
