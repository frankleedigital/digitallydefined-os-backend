#!/usr/bin/env python3
"""
Brevo IMAP Inbox Triage Script
Connects to Brevo IMAP and fetches recent emails for triage.
"""
import imaplib
import email
from email.header import decode_header
import os
import sys
import json
from datetime import datetime, timedelta

IMAP_HOST = "imap.brevo.com"
IMAP_PORT = 993
EMAIL_USER = "francesca@digitallydefined.online"

def decode_mime_words(s):
    if not s:
        return ""
    decoded = decode_header(s)
    return " ".join(
        t.decode(c or "utf-8") if isinstance(t, bytes) else t
        for t, c in decoded
    )

def get_email_body(msg):
    if msg.is_multipart():
        for part in msg.walk():
            ctype = part.get_content_type()
            cdispo = str(part.get("Content-Disposition", ""))
            if ctype == "text/plain" and "attachment" not in cdispo:
                try:
                    return part.get_payload(decode=True).decode("utf-8", errors="replace")
                except:
                    pass
    else:
        try:
            return msg.get_payload(decode=True).decode("utf-8", errors="replace")
        except:
            pass
    return ""

def triage_email(sender, subject, body, date_str):
    """Score an email for urgency."""
    sender_lower = sender.lower()
    subject_lower = subject.lower()
    body_lower = body[:500].lower()
    combined = f"{sender_lower} {subject_lower} {body_lower}"
    
    # Family indicators
    family_keywords = ["mom", "dad", "mother", "father", "sister", "brother", 
                       "family", "daughter", "son", "husband", "wife"]
    is_family = any(k in sender_lower for k in family_keywords) or \
                any(k in subject_lower for k in family_keywords)
    
    # Manager indicators
    manager_indicators = [
        "manager", "director", "executive", "ceo", "cto", "vp ", "head of",
        "boss", "supervisor"
    ]
    is_manager = any(k in sender_lower for k in manager_indicators)
    
    # Deadline indicators
    deadline_keywords = [
        "deadline", "due", "by ", "before ", "this week", "this month",
        "asap", "urgent", "immediately", "today", "tomorrow",
        "dead line", "time sensitive", "timesensitive"
    ]
    has_deadline = any(k in combined for k in deadline_keywords)
    
    # Reply needed indicators  
    reply_indicators = [
        "?", "please", "help", "could you", "can you", "would you",
        "let me know", "thoughts", "feedback", "review", "approve",
        "sign off", "decision", "confirm", "waiting on", "pending"
    ]
    needs_reply = any(k in combined for k in reply_indicators)
    
    # Direct questions
    has_question = "?" in subject or "?" in body[:500]
    
    # Score calculation
    score = 0
    reasons = []
    
    # Manager / family priority (high weight)
    if is_family:
        score += 80
        reasons.append("family_sender")
    if is_manager:
        score += 60
        reasons.append("manager_sender")
    
    # Deadline urgency
    if has_deadline:
        score += 50
        reasons.append("deadline_mentioned")
    
    # Direct questions / requests
    if has_question:
        score += 40
        reasons.append("direct_question")
    if needs_reply and not has_question:
        score += 25
        reasons.append("reply_suggested")
    
    # Urgent words
    urgent_words = ["urgent", "asap", "immediately", "critical", "emergency"]
    if any(w in combined for w in urgent_words):
        score += 30
        reasons.append("urgent_language")
    
    return score, reasons, {
        "is_family": is_family,
        "is_manager": is_manager,
        "has_deadline": has_deadline,
        "needs_reply": needs_reply,
        "has_question": has_question,
    }

def main():
    imap_pass = os.environ.get("BREVO_IMAP_PASSWORD", "")
    if not imap_pass:
        print("ERROR: BREVO_IMAP_PASSWORD environment variable not set")
        print("To connect Brevo inbox, set BREVO_IMAP_PASSWORD")
        print("Brevo IMAP: imap.brevo.com, port 993, SSL")
        sys.exit(1)
    
    try:
        mail = imaplib.IMAP4_SSL(IMAP_HOST, IMAP_PORT)
        mail.login(EMAIL_USER, imap_pass)
        mail.select("INBOX")
        
        # Search since last 2 days (since cron runs daily)
        since_date = (datetime.now() - timedelta(days=2)).strftime("%d-%b-%Y")
        print(f"Searching emails since: {since_date}")
        
        status, messages = mail.search(None, f'(SINCE {since_date})')
        email_ids = messages[0].split()
        print(f"Found {len(email_ids)} emails\n")
        
        results = {
            "needs_attention": [],
            "all_emails": [],
            "coverage": {
                "since_date": since_date,
                "total_found": len(email_ids),
                "scored": 0
            }
        }
        
        for eid in email_ids[:30]:
            status, msg_data = mail.fetch(eid, "(RFC822)")
            raw_email = msg_data[0][1]
            msg = email.message_from_bytes(raw_email)
            
            subject = decode_mime_words(msg["Subject"])
            sender = msg.get("From", "")
            date = msg.get("Date", "")
            body = get_email_body(msg)
            preview = (body[:300] + "...") if len(body) > 300 else body
            
            score, reasons, flags = triage_email(sender, subject, body, date)
            
            email_info = {
                "id": eid.decode(),
                "from": sender,
                "subject": subject,
                "date": date,
                "preview": preview,
                "score": score,
                "reasons": reasons,
                "flags": flags
            }
            
            results["all_emails"].append(email_info)
            
            # Surface if score >= 50 (clears the bar)
            if score >= 50:
                results["needs_attention"].append(email_info)
                results["coverage"]["scored"] += 1
            
            print(f"[{score:3d}] {sender[:40]:40s} | {subject[:50]:50s} | {', '.join(reasons)}")
        
        mail.close()
        mail.logout()
        
        print(f"\n=== TRIAGE RESULTS ===")
        print(f"Total emails found: {len(email_ids)}")
        print(f"Need attention (score >= 50): {len(results['needs_attention'])}")
        
        if results["needs_attention"]:
            print("\n--- NEEDS ATTENTION ---")
            for e in sorted(results["needs_attention"], key=lambda x: -x["score"]):
                print(f"\n  From: {e['from']}")
                print(f"  Subject: {e['subject']}")
                print(f"  Date: {e['date']}")
                print(f"  Score: {e['score']} - {', '.join(e['reasons'])}")
                print(f"  Preview: {e['preview'][:200]}")
        else:
            print("\nNo emails meeting the urgency threshold.")
        
        # Output JSON for pipeline
        print("\n=== JSON OUTPUT ===")
        print(json.dumps(results, indent=2, ensure_ascii=False))
        
    except imaplib.IMAP4.error as e:
        print(f"IMAP ERROR: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"ERROR: {type(e).__name__}: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
