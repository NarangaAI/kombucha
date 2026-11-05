"""Serve the Wellness Kombucha site locally and forward product inquiries by email."""

import argparse
from collections import deque
from email.message import EmailMessage
from email.utils import formatdate, make_msgid
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from ipaddress import ip_address
import json
import os
from pathlib import Path
import re
import smtplib
import ssl
from threading import Lock
import time
from urllib.parse import urlsplit


DIST = Path(__file__).resolve().parent / "dist"
DEFAULT_INQUIRY_TO = "ceo@kombcha.co.kr"
PRODUCTS = {"전체 컬렉션", "망고맛", "레몬맛", "바나나맛", "딸기맛", "블루베리맛"}
PRODUCT_LABELS = {
    "전체 컬렉션": "Full Collection", "망고맛": "Mango", "레몬맛": "Lemon",
    "바나나맛": "Banana", "딸기맛": "Strawberry", "블루베리맛": "Blueberry",
}
LOCAL_PART = re.compile(r"[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+)*")
DOMAIN_LABEL = re.compile(r"[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?")
MAX_BODY = 32768


def valid_address(value):
    if len(value) > 254 or value.count("@") != 1:
        return False
    local, domain = value.split("@")
    return (len(local) <= 64 and bool(LOCAL_PART.fullmatch(local)) and "." in domain
            and all(DOMAIN_LABEL.fullmatch(label) for label in domain.split(".")))


def validate(payload):
    if not isinstance(payload, dict) or payload.get("website"):
        raise ValueError("invalid inquiry")
    fields = [payload.get(key) for key in ("email", "product", "message")]
    if not all(isinstance(value, str) for value in fields):
        raise ValueError("missing inquiry fields")
    email, product, message = (value.strip() for value in fields)
    if not valid_address(email) or product not in PRODUCTS or not 1 <= len(message) <= 4000:
        raise ValueError("invalid inquiry fields")
    if any(ord(char) < 32 and char not in "\n\r\t" for char in message):
        raise ValueError("invalid message content")
    message.encode("utf-8")  # Reject unpaired surrogates before composing email.
    return email, product, message


def mail_settings():
    to = os.environ.get("INQUIRY_TO", DEFAULT_INQUIRY_TO)
    keys = ("SMTP_FROM", "SMTP_HOST", "SMTP_USER", "SMTP_PASSWORD")
    sender, host, user, password = (os.environ.get(key, "") for key in keys)
    security = os.environ.get("SMTP_SECURITY", "ssl").lower()
    port = int(os.environ.get("SMTP_PORT", "587" if security == "starttls" else "465"))
    if not (valid_address(to) and valid_address(sender) and host and user and password
            and security in {"ssl", "starttls"} and 1 <= port <= 65535):
        raise ValueError("mail not configured")
    return to, sender, host, user, password, security, port


def deliver(settings, email, product, message):
    recipient, sender, host, user, password, security, port = settings
    mail = EmailMessage()
    mail["From"] = sender
    mail["To"] = recipient
    mail["Reply-To"] = email
    product_label = PRODUCT_LABELS[product]
    mail["Subject"] = f"[Wellness Kombucha] {product_label} Product Inquiry"
    mail["Date"] = formatdate(localtime=True)
    mail["Message-ID"] = make_msgid(domain=sender.split("@")[1])
    mail.set_content(f"Reply email: {email}\nProduct of interest: {product_label}\n\n{message}\n")
    context = ssl.create_default_context()
    if security == "ssl":
        client = smtplib.SMTP_SSL(host, port, timeout=12, context=context)
    else:
        client = smtplib.SMTP(host, port, timeout=12)
    try:
        if security == "starttls":
            client.starttls(context=context)
        client.login(user, password)
        client.send_message(mail, from_addr=sender, to_addrs=[recipient])
    finally:
        # Once DATA has been accepted, a failed QUIT must not prompt a duplicate retry.
        client.close()


class InquiryLimit:
    """Bound both the number of recent entries and outgoing email attempts."""
    def __init__(self):
        self.attempts = deque()
        self.lock = Lock()

    def admit(self, address):
        now = time.monotonic()
        with self.lock:
            while self.attempts and self.attempts[0][0] <= now - 600:
                self.attempts.popleft()
            if len(self.attempts) >= 80 or sum(ip == address for _, ip in self.attempts) >= 5:
                return False
            self.attempts.append((now, address))
            return True


class Site(SimpleHTTPRequestHandler):
    limit = InquiryLimit()
    timeout = 15

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(DIST), **kwargs)

    def list_directory(self, path):
        self.send_error(404)

    def reply(self, status, code=None):
        payload = {"ok": code is None}
        if code:
            payload["code"] = code
        self.json_response(status, payload)

    def json_response(self, status, payload):
        data = json.dumps(payload).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(data)))
        if status == 429:
            self.send_header("Retry-After", "600")
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self):
        if self.path != "/api/inquiries/status":
            return super().do_GET()
        try:
            mail_settings()
            available = True
        except ValueError:
            available = False
        self.json_response(200, {"available": available})

    def client_ip(self):
        peer = ip_address(self.client_address[0])
        if peer.is_loopback and os.environ.get("INQUIRY_TRUST_LOCAL_PROXY") == "1":
            try:
                return str(ip_address(self.headers.get("X-Real-IP", "")))
            except ValueError:
                pass
        return str(peer)

    def do_POST(self):
        if self.path != "/api/inquiries":
            return self.reply(404, "not_found")
        if self.headers.get_content_type() != "application/json":
            return self.reply(415, "invalid_format")
        origin = self.headers.get("Origin")
        if origin:
            try:
                same_host = urlsplit(origin).netloc.lower() == self.headers.get("Host", "").lower()
            except ValueError:
                same_host = False
            if not same_host:
                return self.reply(403, "cross_origin")
        try:
            count = int(self.headers.get("Content-Length", "0"))
            if not 1 <= count <= MAX_BODY:
                return self.reply(413, "invalid_size")
            email, product, message = validate(json.loads(self.rfile.read(count).decode("utf-8")))
        except (ValueError, RecursionError):
            return self.reply(400, "invalid_inquiry")
        try:
            settings = mail_settings()
        except ValueError:
            return self.reply(503, "mail_not_configured")
        if not self.limit.admit(self.client_ip()):
            return self.reply(429, "rate_limited")
        try:
            deliver(settings, email, product, message)
        except (OSError, smtplib.SMTPException, ValueError):
            return self.reply(503, "mail_unavailable")
        return self.reply(200)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--port", type=int, default=8418)
    args = parser.parse_args()
    with ThreadingHTTPServer(("127.0.0.1", args.port), Site) as server:
        print(f"Wellness Kombucha: http://127.0.0.1:{args.port}/", flush=True)
        server.serve_forever()
