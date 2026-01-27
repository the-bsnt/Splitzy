#! /bin/python3


import smtplib
from email.message import EmailMessage
import os


def send_notification(status):
    msg = EmailMessage()
    msg.set_content(f"The pipeline finished with status: {status}")
    msg["Subject"] = f"CI/CD Alert: {status}"
    msg["To"] = "rdx.trxaster@gmail.com"

    # Standard SMTP setup
    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as smtp:
        smtp.login("codexzbsnt@gmail.com", os.environ["EMAIL_PASS"])
        smtp.send_message(msg)


status = os.environ["STATUS"]
send_notification(status)
