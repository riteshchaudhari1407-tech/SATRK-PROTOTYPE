"""
ML Detection Service
----------------------
A lightweight, self-contained TF-IDF + Logistic Regression classifier
trained in-process on a curated synthetic dataset of scam vs.
legitimate messages. It runs entirely offline (no downloads, no GPU)
and starts in well under a second, giving a genuine learned signal
that complements the deterministic rule engine — the final risk score
is an ensemble of both (see risk_engine_service.py).
"""

import logging

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression

logger = logging.getLogger("satrk.ml_detection")

# ---------------------------------------------------------------------------
# Synthetic training corpus.
# label 1 = scam / fraud pattern, label 0 = legitimate / benign message.
# Intentionally covers several distinct scam families so the model
# generalizes beyond the rule engine's exact phrasing.
# ---------------------------------------------------------------------------
_TRAINING_DATA = [
    # --- Digital arrest / authority impersonation (label 1) ---
    ("This is Inspector Rajesh from CBI. Your Aadhaar has been linked to a money laundering case. You are under digital arrest and cannot contact anyone.", 1),
    ("RBI has flagged your bank account for suspicious transactions. Stay on this video call, do not disconnect, or a non-bailable warrant will be issued.", 1),
    ("Cyber Crime cell Mumbai here. A parcel with your name contains illegal drugs and fake passports. Join the video call immediately for verification.", 1),
    ("Your mobile number is linked to 17 cybercrime complaints. Do not tell anyone about this call. Stay online until the officer verifies your identity.", 1),
    ("This is SI Verma. FIR has been filed against you. You are under house arrest until further investigation, keep your camera on at all times.", 1),
    ("TRAI has suspended your SIM due to illegal activity. Contact the cyber cell within 1 hour or face legal action and arrest.", 1),
    ("Enforcement Directorate is investigating your bank account for money laundering. Transfer funds to a safe government account for verification.", 1),
    ("Income Tax Department: your PAN card is linked to tax evasion. Pay the fine immediately to avoid arrest warrant.", 1),
    ("Do not disconnect this call. This is a top secret investigation by the Narcotics Control Bureau regarding a parcel booked in your name.", 1),
    ("Police station duty officer here, a non-bailable warrant has been issued in your name, share your Aadhaar number for verification immediately.", 1),
    # --- Financial / OTP / UPI phishing (label 1) ---
    ("Your bank account will be frozen in 24 hours. Share your OTP now to complete KYC verification and avoid account suspension.", 1),
    ("Congratulations! You have won Rs 25,00,000 in the lucky draw. Pay a small processing fee to claim your prize before it expires.", 1),
    ("Your electricity connection will be disconnected tonight. Click here to pay the pending bill immediately: bit.ly/payelec", 1),
    ("Your parcel is on hold at customs. Pay a small customs duty via UPI to release your package today.", 1),
    ("Dear customer, your KYC has expired. Update immediately by sharing your card number and OTP or your account will be blocked.", 1),
    ("URGENT: Verify your identity by clicking this link within 30 minutes or your UPI account will be permanently deactivated.", 1),
    ("We noticed unusual login activity. Install AnyDesk so our support team can secure your account remotely right now.", 1),
    ("Your loan EMI is overdue. Pay the penalty immediately via the link below or legal action will be taken against you.", 1),
    ("Refundable security deposit of Rs 5000 required to process your work from home job offer. Pay now to confirm your slot.", 1),
    ("This is your bank's fraud department. Please share your debit card number, expiry and OTP to block a suspicious transaction.", 1),
    # --- Sextortion / harassment style (label 1) ---
    ("We have recorded your video call. Pay us immediately or we will send this video to all your contacts.", 1),
    ("Your photos have been leaked to our team. Transfer money now or we upload everything publicly within an hour.", 1),
    # --- Generic urgency + threat combos (label 1) ---
    ("Final notice: failure to comply with this verification within 30 minutes will result in immediate legal action and arrest.", 1),
    ("This is your last warning. Non-compliance will lead to your case being escalated to court and a warrant will be issued.", 1),
    # --- Legitimate / benign messages (label 0) ---
    ("Hey, are we still on for lunch tomorrow at 1pm? Let me know if the timing works.", 0),
    ("Your package could not be delivered today. Please reschedule delivery at your convenience through the courier app.", 0),
    ("Hi mom, running 10 minutes late, there's traffic on the highway. See you soon.", 0),
    ("Reminder: your dentist appointment is scheduled for Thursday at 4pm. Reply to confirm or reschedule.", 0),
    ("Thanks for the quick turnaround on the report, really appreciate it. Let's sync tomorrow morning.", 0),
    ("Your electricity bill of Rs 1240 for this month is now available. You can view and pay it anytime from the official app.", 0),
    ("The team meeting has been moved to 3pm today. Please update your calendar accordingly.", 0),
    ("Congratulations on completing the course! Your certificate has been emailed to your registered address.", 0),
    ("Your Amazon order has been shipped and will arrive by Friday. Track your order from the app.", 0),
    ("Can you send me the invoice for last month's consulting work when you get a chance?", 0),
    ("Reminder from your bank: your credit card statement has been generated and is available for download in the app.", 0),
    ("Happy birthday! Hope you have a wonderful day, let's catch up over the weekend.", 0),
    ("The CBI released its annual crime report today, showing a slight decline in cyber fraud cases nationally.", 0),
    ("RBI increased the repo rate by 25 basis points in its latest monetary policy review.", 0),
    ("Please find attached the minutes of yesterday's meeting for your review.", 0),
    ("Your flight PNR has been confirmed. Check-in opens 48 hours before departure.", 0),
    ("Just checking in — did you get a chance to look at the document I shared yesterday?", 0),
    ("Your OTP for logging into your account is 482913. Do not share this with anyone.", 0),
    ("This is a reminder that your gym membership renews next week.", 0),
    ("Your water bill payment of Rs 340 was successful. Thank you for using our services.", 0),
]


class MLDetectionService:
    """TF-IDF + Logistic Regression scam classifier trained at process
    startup on an embedded synthetic dataset."""

    def __init__(self):
        texts = [t for t, _ in _TRAINING_DATA]
        labels = [label for _, label in _TRAINING_DATA]

        self.vectorizer = TfidfVectorizer(
            ngram_range=(1, 2),
            min_df=1,
            max_features=4000,
            sublinear_tf=True,
        )

        matrix = self.vectorizer.fit_transform(texts)

        self.model = LogisticRegression(
            max_iter=1000,
            class_weight="balanced",
            C=2.0,
        )

        self.model.fit(matrix, labels)

        logger.info(
            "ML detection model trained on %d samples.", len(_TRAINING_DATA)
        )

    def predict(self, cleaned_text: str) -> float:
        """Return a scam probability scaled to 0-100."""
        if not cleaned_text.strip():
            return 0.0

        vector = self.vectorizer.transform([cleaned_text])
        proba = self.model.predict_proba(vector)[0]

        # class order follows self.model.classes_ (sorted: [0, 1])
        scam_index = list(self.model.classes_).index(1)
        scam_probability = proba[scam_index]

        return round(float(scam_probability) * 100, 2)
