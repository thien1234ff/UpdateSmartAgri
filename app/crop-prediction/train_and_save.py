# train_and_save.py
import pickle
import pandas as pd
from sklearn.preprocessing import StandardScaler
from sklearn.tree import DecisionTreeClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.naive_bayes import GaussianNB
from sklearn.ensemble import RandomForestClassifier, StackingClassifier
from sklearn.svm import SVC
from sklearn.neural_network import MLPClassifier

# Load dataset
df = pd.read_csv("Agriculture_dataset.csv", usecols=lambda c: "Unnamed" not in c)

X = df[["N", "P", "K", "ph", "temperature", "humidity", "rainfall"]]
Y = df["label"]

# ----- models -----
base_models = [
    ('dt', DecisionTreeClassifier(criterion="entropy", max_depth=10, random_state=0)),
    ('lr', LogisticRegression(max_iter=2000, C=1.0, random_state=42)),
    ('nb', GaussianNB()),
    ('rf', RandomForestClassifier(n_estimators=100, criterion="entropy", random_state=0)),
    ('svm', SVC(kernel="linear", random_state=42, probability=True))
]
meta_learner = MLPClassifier(hidden_layer_sizes=(50,), max_iter=2000, random_state=42)

stacking_model = StackingClassifier(
    estimators=base_models,
    final_estimator=meta_learner,
    cv=10,
    stack_method="auto"
)

# ----- scaler -----
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# ----- train -----
stacking_model.fit(X_scaled, Y)

# ----- dump -----
with open("stacking_model.pkl", "wb") as f:
    pickle.dump(stacking_model, f)
with open("scaler.pkl", "wb") as f:
    pickle.dump(scaler, f)

print("✅ Model + scaler saved.")