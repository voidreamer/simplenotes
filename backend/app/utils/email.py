"""
SimpleNotes - Email Service
Send invites and notifications via AWS SES
"""

import boto3
from botocore.exceptions import ClientError
from typing import Optional

from app.utils.config import settings

ses_client = boto3.client("ses", region_name=settings.AWS_REGION)

def send_invite_email(to_email: str, inviter_name: str, household_name: str, invite_link: str) -> bool:
    """Send household invite email"""
    if not settings.SES_EMAIL:
        print("SES email not configured, skipping email send")
        return False

    subject = f"{inviter_name} invited you to join {household_name} on SimpleNotes"

    html_body = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0f0f23; color: #e2e8f0; padding: 40px 20px;">
        <div style="max-width: 480px; margin: 0 auto; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; padding: 40px; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
            <div style="text-align: center; margin-bottom: 32px;">
                <h1 style="font-size: 28px; font-weight: 700; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin: 0;">
                    SimpleNotes
                </h1>
            </div>

            <h2 style="font-size: 20px; font-weight: 600; color: #f1f5f9; margin-bottom: 16px;">
                You're Invited!
            </h2>

            <p style="color: #94a3b8; line-height: 1.6; margin-bottom: 24px;">
                <strong style="color: #e2e8f0;">{inviter_name}</strong> has invited you to join
                <strong style="color: #e2e8f0;">{household_name}</strong> on SimpleNotes.
            </p>

            <p style="color: #94a3b8; line-height: 1.6; margin-bottom: 32px;">
                Share shopping lists, checklists, and notes with your household. Stay organized together!
            </p>

            <div style="text-align: center; margin-bottom: 32px;">
                <a href="{invite_link}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                    Accept Invitation
                </a>
            </div>

            <p style="color: #64748b; font-size: 14px; text-align: center;">
                This invitation expires in 7 days.
            </p>

            <hr style="border: none; border-top: 1px solid #334155; margin: 32px 0;">

            <p style="color: #64748b; font-size: 12px; text-align: center; margin: 0;">
                SimpleNotes - Shared lists for your household
            </p>
        </div>
    </body>
    </html>
    """

    text_body = f"""
    You're Invited to SimpleNotes!

    {inviter_name} has invited you to join {household_name} on SimpleNotes.

    Share shopping lists, checklists, and notes with your household. Stay organized together!

    Accept your invitation: {invite_link}

    This invitation expires in 7 days.

    ---
    SimpleNotes - Shared lists for your household
    """

    try:
        ses_client.send_email(
            Source=settings.SES_EMAIL,
            Destination={"ToAddresses": [to_email]},
            Message={
                "Subject": {"Data": subject, "Charset": "UTF-8"},
                "Body": {
                    "Text": {"Data": text_body, "Charset": "UTF-8"},
                    "Html": {"Data": html_body, "Charset": "UTF-8"}
                }
            }
        )
        return True
    except ClientError as e:
        print(f"Failed to send email: {e}")
        return False

def send_welcome_email(to_email: str, name: str) -> bool:
    """Send welcome email to new users"""
    if not settings.SES_EMAIL:
        return False

    subject = f"Welcome to SimpleNotes, {name}!"

    html_body = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0f0f23; color: #e2e8f0; padding: 40px 20px;">
        <div style="max-width: 480px; margin: 0 auto; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; padding: 40px; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
            <div style="text-align: center; margin-bottom: 32px;">
                <h1 style="font-size: 28px; font-weight: 700; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin: 0;">
                    SimpleNotes
                </h1>
            </div>

            <h2 style="font-size: 20px; font-weight: 600; color: #f1f5f9; margin-bottom: 16px;">
                Welcome, {name}!
            </h2>

            <p style="color: #94a3b8; line-height: 1.6; margin-bottom: 24px;">
                Thank you for joining SimpleNotes! You're all set to start organizing your life.
            </p>

            <h3 style="font-size: 16px; font-weight: 600; color: #f1f5f9; margin-bottom: 12px;">
                Get Started:
            </h3>

            <ul style="color: #94a3b8; line-height: 1.8; padding-left: 20px; margin-bottom: 32px;">
                <li>Create your first household</li>
                <li>Invite family members to collaborate</li>
                <li>Add shopping lists and checklists</li>
                <li>Share notes with everyone</li>
            </ul>

            <div style="text-align: center; margin-bottom: 32px;">
                <a href="{settings.FRONTEND_URL}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                    Open SimpleNotes
                </a>
            </div>

            <hr style="border: none; border-top: 1px solid #334155; margin: 32px 0;">

            <p style="color: #64748b; font-size: 12px; text-align: center; margin: 0;">
                SimpleNotes - Shared lists for your household
            </p>
        </div>
    </body>
    </html>
    """

    try:
        ses_client.send_email(
            Source=settings.SES_EMAIL,
            Destination={"ToAddresses": [to_email]},
            Message={
                "Subject": {"Data": subject, "Charset": "UTF-8"},
                "Body": {
                    "Html": {"Data": html_body, "Charset": "UTF-8"}
                }
            }
        )
        return True
    except ClientError:
        return False
