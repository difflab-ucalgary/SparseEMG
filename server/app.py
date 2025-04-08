import os
import shutil
import pickle
import numpy as np
from scipy.signal import medfilt
from fastapi import FastAPI, WebSocket
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from scipy.signal import butter, filtfilt, iirnotch
from sklearn.model_selection import StratifiedKFold, cross_val_predict
from sklearn.metrics import accuracy_score, f1_score, confusion_matrix


# classifiers
import xgboost as xgb
from sklearn.svm import SVC
from sklearn.naive_bayes import GaussianNB
from sklearn.neighbors import KNeighborsClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier

# metrics
import shap
from sklearn.inspection import permutation_importance
from sklearn.feature_selection import mutual_info_classif

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

np.random.seed(42)

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

    class_map = {
        v: i for i, v in enumerate(gestures.keys())
    }

    gestures_mapped = {}

    for g in gestures.keys():
        gestures_mapped[class_map[g]] = gestures[g]

    if len(channels):
        gestures_mapped = {g: [sample[:, channels] for sample in gestures_mapped[g]] for g in gestures_mapped.keys()}

    return gestures_mapped, class_map

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

def calculate_features(gestures, channels=None):
    features = []
    labels = []

    for g in gestures.keys():

        for sample in gestures[g]:
            feature_set = []
            window_len = (len(sample) // 3)
            if channels is None:
                windows = [sample[window_len * i:window_len * (i + 1)] for i in range(3)]
            else:
                windows = [sample[window_len * i:window_len * (i + 1), channels] for i in range(3)]
            for w in windows:
                rms_per_channel, rms_avg = calculate_rms(w)
                rms_per_channel = rms_per_channel / rms_avg
                feature_set.extend(rms_per_channel)
            features.append(feature_set)
            labels.append(g)

    features = np.array(features)
    labels = np.array(labels)

    return features, labels

def get_classifier(model_name):
    if model_name == "SVC":
        model = SVC()
    elif model_name == "Logistic Regression": 
        model = LogisticRegression(max_iter=5000)
    elif model_name == "KNN":
        model = KNeighborsClassifier()
    elif model_name == "Naive Bayes": 
        model = GaussianNB()
    elif model_name == "XGB": 
        model = xgb.XGBClassifier(random_state=42)
    else:
        model = RandomForestClassifier(max_depth=30, random_state=42)
    return model

def baseline_normalization_arv(gesture_signal, rest_mean_global, rest_arv_global):
    """Normalize the gesture signal using ARV of the rest signal."""
    normalized_signal = (gesture_signal - rest_mean_global) / (rest_arv_global + 1e-8)  # Avoid division by zero
    return normalized_signal

def compute_arv(signal):
    """Compute Average Rectified Value (ARV) along the time axis."""
    return np.mean(np.abs(signal), axis=0)

def compute_max_abs(signal):
    """Compute Maximum Absolute Value (Max-Abs) along the time axis."""
    return np.max(np.abs(signal), axis=0)

def aggregate_rest_signals(rest_signals):
    """Aggregate multiple rest signals by computing their mean, RMS, ARV, and Max-Abs."""
    rest_means = np.array([np.mean(rest, axis=0) for rest in rest_signals])  # Mean per rest trial
    rest_arv = np.array([compute_arv(rest) for rest in rest_signals])  # ARV per rest trial
    
    # Compute global rest statistics
    rest_mean_global = np.mean(rest_means, axis=0)  # Global mean
    rest_arv_global = np.mean(rest_arv, axis=0)  # ARV over all rest trials
    
    return rest_mean_global, rest_arv_global

def find_intersection_with_indices(arrays, threshold=1.0):
    """
    Finds the intersection of arrays and returns the intersected items 
    with their indices in each array based on a threshold.

    Args:
        arrays (list of np.ndarray): A list of numpy arrays.
        threshold (float): A value between 0 and 1 representing the minimum 
                           percentage of arrays that must contain an item 
                           for it to be included in the result.

    Returns:
        list: A list of tuples where each tuple contains an intersected item
              and its indices in each array.
    """
    # if not arrays or len(arrays) < 2:
    #     return []  # No intersection possible

    num_arrays = len(arrays)
    min_occurrences = int(threshold * num_arrays)

    # Find all items and their occurrences across arrays
    item_occurrences = {}
    for i, array in enumerate(arrays):
        unique_items = np.unique(array)
        for item in unique_items:
            if item not in item_occurrences:
                item_occurrences[item] = []
            item_occurrences[item].append(i)

    # Filter items based on the threshold
    filtered_items = {item: indices for item, indices in item_occurrences.items() if len(indices) >= min_occurrences}

    # Collect indices of filtered items
    result = []
    for item, array_indices in filtered_items.items():
        indices = []
        for i in array_indices:
            indices.append(np.where(arrays[i] == item)[0][0])
        result.append((item, indices))

    return result

def find_intersection(arrays, threshold=1.0):
    """
    Finds the intersection of arrays based on a threshold.

    Args:
        arrays (list of np.ndarray): A list of numpy arrays.
        threshold (float): A value between 0 and 1 representing the minimum 
                           percentage of arrays that must contain an item 
                           for it to be included in the result.

    Returns:
        list: A list of intersected items.
    """
    # if not arrays or len(arrays) < 2:
        # return []  # No intersection possible

    num_arrays = len(arrays)
    min_occurrences = int(threshold * num_arrays)

    # Find all items and their occurrences across arrays
    item_occurrences = {}
    for i, array in enumerate(arrays):
        unique_items = np.unique(array)
        for item in unique_items:
            if item not in item_occurrences:
                item_occurrences[item] = []
            item_occurrences[item].append(i)

    # Filter items based on the threshold
    filtered_items = [item for item, indices in item_occurrences.items() if len(indices) >= min_occurrences]

    return filtered_items

def arrange_by_max_occurrence(intersection_with_indices):
    """
    Arranges intersected items based on their most frequent index across arrays.

    Args:
        intersection_with_indices (list): Output of find_intersection_with_indices.

    Returns:
        list: A list of items arranged relative to their most frequent index.
    """
    # Create a dictionary to store items and their most frequent index
    frequency_dict = {}
    for item, indices in intersection_with_indices:
        # Count occurrences of each index
        index_counts = {}
        for idx in indices:
            index_counts[idx] = index_counts.get(idx, 0) + 1
        # Find the index with the maximum occurrences
        max_index = max(index_counts, key=index_counts.get)
        frequency_dict[item] = max_index

    # Sort items based on their most frequent index
    sorted_items = sorted(frequency_dict.items(), key=lambda x: x[1])

    # Extract the sorted items
    result = [item for item, _ in sorted_items]
    return result

def calculate_rms_rankings(gestures):

    rest_mean_global, rest_arv_global = aggregate_rest_signals(gestures[0])

    ranked_channels = {}

    for g in gestures.keys():
        gestures_cleaned = []
        for gesture_signal in gestures[g]:
            cleaned_signal = baseline_normalization_arv(gesture_signal, rest_mean_global, rest_arv_global)
            gestures_cleaned.append(cleaned_signal)

        ranked_channels[g] = np.array([
            np.sqrt(np.mean(np.square(sample), axis=0)) for sample in gestures_cleaned
        ]).mean(axis=0)

        ranked_channels[g] = np.argsort(ranked_channels[g])

    ranked_channels = arrange_by_max_occurrence(find_intersection_with_indices(np.array(
        [ranked_channels[a] for a in gestures.keys()]
    )))

    return ranked_channels

def calculate_tmi_rankings(n_channels, gestures):

    if n_channels == 0:
        n_channels = gestures[0][0].shape[1]

    features, labels = calculate_features(gestures)

    multivariate_tmi = mutual_info_classif(features, labels)

    components_per_channel = np.array([multivariate_tmi[ch::n_channels] for ch in range(n_channels)])

    channel_importance = components_per_channel.sum(axis=1)

    ranked_channels = np.argsort(channel_importance)

    return ranked_channels

def calculate_pi_rankings(model_name, n_channels, gestures):
     
    if n_channels == 0:
        n_channels = gestures[0][0].shape[1]
        
    features, labels = calculate_features(gestures)

    skf = StratifiedKFold(n_splits=4, shuffle=True, random_state=42)

    model = get_classifier(model_name)

    importances = []

    for train_index, val_index in skf.split(features, labels):
        X_train, X_val = features[train_index], features[val_index]
        y_train, y_val = labels[train_index], labels[val_index]

        # Train the model
        model.fit(X_train, y_train)
        
        # Compute permutation importance on the validation set
        result = permutation_importance(model, X_val, y_val, random_state=42)
        
        # Store the importance values for this fold
        importances.append(result.importances_mean)

    importances = np.mean(importances, axis=0)

    components_per_channel = np.array([importances[ch::n_channels] for ch in range(n_channels)])

    # Sum across features for each channel
    channel_importance = components_per_channel.sum(axis=1)  # Shape: (n_components, num_channels)

    ranked_channels = np.argsort(channel_importance)

    return ranked_channels

def calculate_shap_rankings(model_name, n_channels, gestures): 

    features, labels = calculate_features(gestures)

    skf = StratifiedKFold(n_splits=4, shuffle=True, random_state=42)

    model = get_classifier(model_name)

    importances = []

    for train_index, val_index in skf.split(features, labels):
        X_train, X_val = features[train_index], features[val_index]
        y_train, y_val = labels[train_index], labels[val_index]

        model.fit(X_train, y_train)

        explainer = shap.KernelExplainer(model.predict_proba, shap.kmeans(X_train, 50))
        shap_values = explainer(X_val)

        shap_array = np.abs(shap_values.values).mean(axis=0)  # Average across samples
        shap_matrix = np.array([np.mean(shap_array, axis=1)[ch::n_channels] for ch in range(n_channels)])

        # Aggregate importance per channel by summing over features
        channel_importance = shap_matrix.sum(axis=1)  # Sum across all features for each channel

        importances.append(channel_importance)

    importances = np.mean(importances, axis=0)

    # Rank channels by importance
    ranked_channels = np.argsort(channel_importance)  # Sort in descending order

    return ranked_channels

def train_model(electrodes_sorted, gestures, optimize_further, model_name):

    best_accuracy = 0
    best_f1 = 0
    best_model = None
    best_cm = None

    if optimize_further:
        l_start = 2
        l_end = min(21, len(electrodes_sorted))
    else:
        l_start = len(electrodes_sorted)
        l_end = len(electrodes_sorted) + 1

    for z in range(l_start, l_end):

        print(f"Training for top {z}...")

        model = get_classifier(model_name)

        selected_channels = electrodes_sorted[-z:]

        features, labels = calculate_features(gestures, selected_channels)

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
        y_pred = cross_val_predict(best_model, features, labels, cv=4)
        best_cm = confusion_matrix(labels, y_pred)
        
    return best_model, best_channels, best_accuracy, best_f1, best_cm 

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
    classifier = data.get("classifier", "Random Forest") # selected classifier
    metric = data.get("metric", "Mutual Information") # selected metric
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
    
    gestures, class_map = get_data(ds_number, selected_gestures, channels, ds_filename)

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

    if metric == "RMS":
        electrodes_sorted = calculate_rms_rankings(gestures)
    elif metric == "Mutual Information":
        electrodes_sorted = calculate_tmi_rankings(no_of_channels, gestures)
    elif metric == "SHAP": 
        electrodes_sorted = calculate_shap_rankings(classifier, no_of_channels, gestures)
    else:
        electrodes_sorted = calculate_pi_rankings(classifier, no_of_channels, gestures)

    if (no_of_channels != 0 and not optimize_further) or (no_of_channels != 0 and len(area_no_of_channels) == 0):
        electrodes_sorted = electrodes_sorted[-no_of_channels:]

    best_model, best_channels, best_accuracy, best_f1, best_cm = train_model(electrodes_sorted, gestures, optimize_further, classifier)

    if len(channels):
        channel_map = {
            i: v for i, v in enumerate(channels) 
        }
        best_channels = [channel_map[channel] for channel in best_channels]

    await websocket.send_json({"best_channels": best_channels.tolist(), "accuracy": float(best_accuracy), "f1": float(best_f1), "cm": best_cm.tolist()})

    await websocket.close()
