"""
SimpleNotes - Attachments Routes
Handle encrypted file attachments with presigned S3 URLs
"""

import boto3
import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, field_validator
from typing import Optional, List

from app.utils.auth import get_current_user
from app.utils.database import (
    get_household,
    get_list,
    add_attachment_to_list,
    remove_attachment_from_list,
    get_attachment,
    update_attachment_status,
)
from app.utils.config import settings

router = APIRouter()

# Initialize S3 client
s3_client = boto3.client("s3", region_name=settings.AWS_REGION)

# Constants
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
MAX_ATTACHMENTS_PER_LIST = 10
MAX_TOTAL_SIZE_PER_LIST = 50 * 1024 * 1024  # 50MB
PRESIGNED_URL_EXPIRY = 3600  # 1 hour


# ============================================
# Request/Response Models
# ============================================

class UploadUrlRequest(BaseModel):
    """Request for presigned upload URL"""
    filename: str  # Encrypted filename (base64)
    size: int
    mime_type: str

    @field_validator("size")
    @classmethod
    def validate_size(cls, v: int) -> int:
        if v <= 0:
            raise ValueError("File size must be positive")
        if v > MAX_FILE_SIZE:
            raise ValueError(f"File size exceeds maximum of {MAX_FILE_SIZE // (1024 * 1024)}MB")
        return v

    @field_validator("filename")
    @classmethod
    def validate_filename(cls, v: str) -> str:
        if len(v) > 2000:
            raise ValueError("Filename too long")
        return v

    @field_validator("mime_type")
    @classmethod
    def validate_mime_type(cls, v: str) -> str:
        if len(v) > 255:
            raise ValueError("MIME type too long")
        return v


class AttachmentMetadata(BaseModel):
    """Attachment metadata"""
    id: str
    filename: str  # Encrypted
    size: int
    mime_type: str
    s3_key: str
    uploaded_by: str
    created_at: str
    status: str = "confirmed"


class UploadUrlResponse(BaseModel):
    """Response with presigned upload URL"""
    upload_url: str
    attachment_id: str
    s3_key: str


class DownloadUrlResponse(BaseModel):
    """Response with presigned download URL"""
    download_url: str
    attachment: AttachmentMetadata


# ============================================
# Helper Functions
# ============================================

def verify_household_membership(household_id: str, user_id: str) -> dict:
    """Verify user is a member of the household"""
    household = get_household(household_id)
    if not household:
        raise HTTPException(status_code=404, detail="Household not found")
    if user_id not in household.get("members", []):
        raise HTTPException(status_code=403, detail="Not a member of this household")
    return household


def verify_list_access(list_id: str, household_id: str, user_id: str) -> dict:
    """Verify user has access to the list"""
    verify_household_membership(household_id, user_id)
    list_item = get_list(list_id, household_id)
    if not list_item:
        raise HTTPException(status_code=404, detail="List not found")
    return list_item


def check_attachment_limits(list_item: dict, new_size: int):
    """Check if adding new attachment would exceed limits"""
    attachments = list_item.get("attachments", [])
    confirmed = [a for a in attachments if a.get("status") == "confirmed"]

    if len(confirmed) >= MAX_ATTACHMENTS_PER_LIST:
        raise HTTPException(
            status_code=400,
            detail=f"Maximum {MAX_ATTACHMENTS_PER_LIST} attachments per note allowed"
        )

    total_size = sum(a.get("size", 0) for a in confirmed) + new_size
    if total_size > MAX_TOTAL_SIZE_PER_LIST:
        raise HTTPException(
            status_code=400,
            detail=f"Total attachments size would exceed {MAX_TOTAL_SIZE_PER_LIST // (1024 * 1024)}MB limit"
        )


# ============================================
# Endpoints
# ============================================

@router.post("/{list_id}/attachments/upload-url", response_model=UploadUrlResponse)
async def get_upload_url(
    list_id: str,
    data: UploadUrlRequest,
    household_id: str = Query(..., description="Household ID"),
    user: dict = Depends(get_current_user)
):
    """
    Get a presigned URL for uploading an encrypted attachment.
    The file should be encrypted client-side before upload.
    """
    if not settings.ATTACHMENTS_BUCKET:
        raise HTTPException(status_code=503, detail="Attachments not configured")

    list_item = verify_list_access(list_id, household_id, user["user_id"])
    check_attachment_limits(list_item, data.size)

    # Generate attachment ID and S3 key
    attachment_id = str(uuid.uuid4())
    s3_key = f"{household_id}/{list_id}/{attachment_id}"

    # Store pending attachment metadata
    attachment = {
        "id": attachment_id,
        "filename": data.filename,
        "size": data.size,
        "mime_type": data.mime_type,
        "s3_key": s3_key,
        "uploaded_by": user["user_id"],
        "created_at": datetime.utcnow().isoformat(),
        "status": "pending"
    }

    success = add_attachment_to_list(list_id, household_id, attachment)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to create attachment")

    # Generate presigned PUT URL
    try:
        upload_url = s3_client.generate_presigned_url(
            "put_object",
            Params={
                "Bucket": settings.ATTACHMENTS_BUCKET,
                "Key": s3_key,
                "ContentType": "application/octet-stream",
                "ContentLength": data.size,
            },
            ExpiresIn=PRESIGNED_URL_EXPIRY,
        )
    except Exception as e:
        remove_attachment_from_list(list_id, household_id, attachment_id)
        raise HTTPException(status_code=500, detail=f"Failed to generate upload URL: {str(e)}")

    return UploadUrlResponse(
        upload_url=upload_url,
        attachment_id=attachment_id,
        s3_key=s3_key
    )


@router.post("/{list_id}/attachments/{attachment_id}/confirm")
async def confirm_upload(
    list_id: str,
    attachment_id: str,
    household_id: str = Query(..., description="Household ID"),
    user: dict = Depends(get_current_user)
):
    """
    Confirm that an attachment upload completed successfully.
    Changes status from 'pending' to 'confirmed'.
    """
    verify_list_access(list_id, household_id, user["user_id"])

    attachment = get_attachment(list_id, household_id, attachment_id)
    if not attachment:
        raise HTTPException(status_code=404, detail="Attachment not found")

    if attachment.get("status") == "confirmed":
        return {"message": "Attachment already confirmed"}

    # Verify file exists in S3
    if settings.ATTACHMENTS_BUCKET:
        try:
            s3_client.head_object(
                Bucket=settings.ATTACHMENTS_BUCKET,
                Key=attachment["s3_key"]
            )
        except s3_client.exceptions.ClientError:
            remove_attachment_from_list(list_id, household_id, attachment_id)
            raise HTTPException(status_code=400, detail="Upload not completed")

    success = update_attachment_status(list_id, household_id, attachment_id, "confirmed")
    if not success:
        raise HTTPException(status_code=500, detail="Failed to confirm attachment")

    return {"message": "Attachment confirmed"}


@router.get("/{list_id}/attachments/{attachment_id}/url", response_model=DownloadUrlResponse)
async def get_download_url(
    list_id: str,
    attachment_id: str,
    household_id: str = Query(..., description="Household ID"),
    user: dict = Depends(get_current_user)
):
    """
    Get a presigned URL for downloading an encrypted attachment.
    The file must be decrypted client-side after download.
    """
    if not settings.ATTACHMENTS_BUCKET:
        raise HTTPException(status_code=503, detail="Attachments not configured")

    verify_list_access(list_id, household_id, user["user_id"])

    attachment = get_attachment(list_id, household_id, attachment_id)
    if not attachment:
        raise HTTPException(status_code=404, detail="Attachment not found")

    if attachment.get("status") != "confirmed":
        raise HTTPException(status_code=400, detail="Attachment not yet uploaded")

    # Generate presigned GET URL
    try:
        download_url = s3_client.generate_presigned_url(
            "get_object",
            Params={
                "Bucket": settings.ATTACHMENTS_BUCKET,
                "Key": attachment["s3_key"],
            },
            ExpiresIn=PRESIGNED_URL_EXPIRY,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate download URL: {str(e)}")

    return DownloadUrlResponse(
        download_url=download_url,
        attachment=AttachmentMetadata(**attachment)
    )


@router.delete("/{list_id}/attachments/{attachment_id}")
async def delete_attachment(
    list_id: str,
    attachment_id: str,
    household_id: str = Query(..., description="Household ID"),
    user: dict = Depends(get_current_user)
):
    """
    Delete an attachment from a note.
    Removes from both S3 and DynamoDB.
    """
    verify_list_access(list_id, household_id, user["user_id"])

    attachment = get_attachment(list_id, household_id, attachment_id)
    if not attachment:
        raise HTTPException(status_code=404, detail="Attachment not found")

    # Delete from S3
    if settings.ATTACHMENTS_BUCKET:
        try:
            s3_client.delete_object(
                Bucket=settings.ATTACHMENTS_BUCKET,
                Key=attachment["s3_key"]
            )
        except Exception as e:
            print(f"Warning: Failed to delete from S3: {e}")

    # Remove from DynamoDB
    success = remove_attachment_from_list(list_id, household_id, attachment_id)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to delete attachment")

    return {"message": "Attachment deleted"}


@router.get("/{list_id}/attachments", response_model=List[AttachmentMetadata])
async def list_attachments(
    list_id: str,
    household_id: str = Query(..., description="Household ID"),
    user: dict = Depends(get_current_user)
):
    """
    List all confirmed attachments for a note.
    """
    list_item = verify_list_access(list_id, household_id, user["user_id"])

    attachments = list_item.get("attachments", [])
    confirmed = [a for a in attachments if a.get("status") == "confirmed"]

    return [AttachmentMetadata(**a) for a in confirmed]
