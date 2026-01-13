# Wardrobe Backend API Documentation

**Version**: 1.0.0-mvp
**Base URL**: `http://localhost:5001`
**Content-Type**: `application/json` (except file uploads)

---

## Overview

The Wardrobe Backend API provides endpoints for:

- Garment image segmentation and analysis
- Outfit suggestion based on wardrobe metadata
- Virtual try-on compositing (low-res and high-res)
- User feedback collection

**Architecture**: Local-first MVP - all images are ephemeral and deleted after processing. No persistent cloud storage.

---

## Authentication

**MVP**: The system uses a Dual Token Strategy (JWT Access Token + Persistent Refresh Token). See `AUTH_GUIDE.md` for full implementation details and client-side integration guidelines.

### Register

#### `POST /api/v1/register`

Register a new user.

**Rate Limit**: 5 requests per minute

**Request** (application/json):

```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response** (201 Created):

```json
{
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "created_at": "2024-12-07T10:00:00Z",
    "is_active": true
  }
}
```

**Errors**:

- `400 Bad Request` - Missing email or password
- `409 Conflict` - Email already registered
- `500 Internal Server Error` - Database error

### Login

#### `POST /api/v1/login`

Authenticate user and receive access and refresh tokens.

**Rate Limit**: 10 requests per minute

**Request** (application/json):

```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response** (200 OK):

```json
{
  "access_token": "ey...",
  "expires_in": 900,
  "refresh_token": "def...",
  "refresh_expires_in": 2592000,
  "token_type": "Bearer"
}
```

**Errors**:

- `400 Bad Request` - Missing email or password
- `401 Unauthorized` - Invalid credentials

### Refresh Token

#### `POST /api/v1/token/refresh`

Obtain a new access token using a valid refresh token. Rotates the refresh token (returns a new one).

**Rate Limit**: 20 requests per minute

**Request** (application/json):

```json
{
  "refresh_token": "def..."
}
```

**Response** (200 OK):

```json
{
  "access_token": "ey...",
  "expires_in": 900,
  "refresh_token": "new_def...",
  "refresh_expires_in": 2592000,
  "token_type": "Bearer"
}
```

**Errors**:

- `400 Bad Request` - Missing refresh token
- `401 Unauthorized` - Invalid or expired refresh token

### Get Current User

#### `GET /api/v1/me`

Get profile information for the current authenticated user.

**Header**: `Authorization: Bearer <access_token>`

**Response** (200 OK):

```json
{
  "id": 1,
  "email": "user@example.com",
  "created_at": "2024-12-07T10:00:00Z",
  "is_active": true
}
```

### Logout

#### `POST /api/v1/logout`

Revoke the refresh token.

**Request** (application/json):

```json
{
  "refresh_token": "def..."
}
```

**Response** (200 OK):

```json
{
  "message": "Logged out successfully"
}
```

---

## Core Endpoints

### Health Check

#### `GET /health`

Check API health and configuration.

**Response** (200 OK):

```json
{
  "status": "healthy",
  "timestamp": "2024-12-07T10:00:00.000Z",
  "config": {
    "environment": "development",
    "rate_limit_enabled": true,
    "max_upload_size_mb": 3
  },
  "file_manager": {
    "tracked_files": 0,
    "oldest_age_seconds": 0,
    "temp_dir": "/tmp/wardrobe_temp",
    "ttl_minutes": 30
  }
}
```

---

## Garment Processing

### Segment Garment

#### `POST /process/segment`

Segment a garment image and extract metadata (colors, type).

**Request** (multipart/form-data):

```
image: <file>  (required) - Garment image (JPG, PNG, WEBP, max 3MB)
type_hint: <string> (optional) - Garment type hint ("top", "bottom", "shoes", etc.)
```

**cURL Example**:

```bash
curl -X POST http://localhost:5001/process/segment \
  -F "image=@shirt.jpg" \
  -F "type_hint=top"
```

**Response** (200 OK) - Phase 2 Implementation:

```json
{
  "mask_png": "base64_encoded_png_data...",
  "tags": {
    "colors": ["red", "white"],
    "color_hex": ["#FF0000", "#FFFFFF"],
    "garment_type": "top",
    "pattern": "solid"
  },
  "processing_time_ms": 1240
}
```

**Current Response** (501 Not Implemented - Phase 1):

```json
{
  "status": "not_implemented",
  "message": "Segmentation will be implemented in Phase 2",
  "type_hint": "top",
  "file_size": 245678,
  "mime_type": "image/jpeg"
}
```

**Errors**:

- `400 Bad Request` - No file provided or invalid file
- `413 Payload Too Large` - File exceeds max size
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Processing failed

---

### Create Thumbnail

#### `POST /process/thumbnail`

Generate a thumbnail collage from multiple garment images.

**Request** (multipart/form-data):

```
images[]: <file>  (required, multiple) - 2-10 garment images
layout_hint: <string> (optional) - "grid_2x3", "grid_3x2", etc.
```

**cURL Example**:

```bash
curl -X POST http://localhost:5001/process/thumbnail \
  -F "images[]=@shirt1.jpg" \
  -F "images[]=@shirt2.jpg" \
  -F "images[]=@pants.jpg" \
  -F "images[]=@shoes.jpg"
```

**Response** (200 OK) - Phase 2 Implementation:

```json
{
  "thumbnail_png": "base64_encoded_png_data...",
  "grid_size": [2, 3],
  "item_count": 6,
  "processing_time_ms": 450
}
```

**Current Response** (501 Not Implemented):

```json
{
  "status": "not_implemented",
  "message": "Thumbnail generation will be implemented in Phase 2",
  "file_count": 4
}
```

---

### Extract Garment (Gemini-based)

#### `POST /process/extract`

Extract a single garment from an image with transparent background using Google's Gemini AI.

**Requirements**:

- Requires `GOOGLE_STUDIO_KEY` environment variable to be set
- Uses Gemini API for AI-powered garment extraction

**Rate Limit**: 5 requests per minute (stricter due to API costs)

**Request** (multipart/form-data):

```
image: <file>  (required) - Image containing garment (worn by person or on hanger)
type_hint: <string> (optional) - "top", "bottom", "dress", "shoes" (helps extraction accuracy)
custom_prompt: <string> (optional) - Override default extraction prompt
```

**cURL Example**:

```bash
curl -X POST http://localhost:5001/process/extract \
  -F "image=@person_wearing_shirt.jpg" \
  -F "type_hint=top"
```

**Response** (200 OK) - S3 Upload Enabled (WITH METADATA) (Recommended):

```json
{
  "garment_url": "https://s3.amazonaws.com/bucket/extracted/abc123.png",
  "garment_key": "extracted/abc123.png",
  "wardrobe_item_id": "item_def456ghi789",
  "processing_time_ms": 3450,
  "model": "gemini-2.0-flash-exp",

  "metadata": {
    "title": "Blue Denim Button-Up Shirt",
    "description": "Light blue denim shirt with white buttons, long sleeves, button-down collar, and two chest pockets. Classic fit with slight texture in the fabric.",
    "category": "top",
    "subcategory": "shirt",
    "colors": ["light blue", "white"],
    "color_hex": ["#7BA5D6", "#FFFFFF"],
    "dominant_color": "light blue",
    "pattern": "solid",
    "fabric_type": "denim",
    "fabric_texture": "medium",
    "formality_level": "casual",
    "style_tags": ["classic", "versatile", "americana"],
    "occasion": ["casual", "work", "weekend"],
    "weather_suitability": ["warm", "mild"],
    "season": ["spring", "summer", "fall"],
    "mood": ["relaxed", "confident"],
    "works_well_with": ["jeans", "chinos", "shorts"],
    "layering_potential": ["can_be_layered_over", "can_be_worn_alone"],
    "confidence": {
      "category": 0.98,
      "colors": 0.95,
      "formality": 0.92,
      "style": 0.88
    }
  },

  "wardrobe_item": {
    "id": "item_abc123",
    "user_id": "user_456",
    "name": "Blue Denim Button-Up Shirt",
    "category": "top",
    "image_url": "https://s3.amazonaws.com/bucket/extracted/abc123.png",
    "created_at": "2024-12-16T10:00:00Z"
  }
}
```

**Response** (200 OK) - S3 Fallback (base64, NOT saved to wardrobe):

```json
{
  "garment_png": "iVBORw0KGgoAAAANSUhEUgAA...",
  "processing_time_ms": 3450,
  "model": "gemini-2.0-flash-exp"
}
```

**Behavior**:

- Extracts the primary garment from the image
- Removes person, background, hangers, and other objects
- Preserves all garment details (colors, patterns, textures, logos)
- Returns PNG with transparent background (alpha channel)
- If multiple garments present, extracts the most prominent one

**Errors**:

- `400 Bad Request` - No file provided, invalid file, or corrupted image
- `429 Too Many Requests` - Rate limit exceeded (Gemini API calls are limited)
- `503 Service Unavailable` - GOOGLE_STUDIO_KEY not configured or invalid API key
- `500 Internal Server Error` - Extraction failed or API error

**Notes**:

- Processing time typically 3-5 seconds depending on image complexity
- Uses Gemini's multimodal capabilities for accurate extraction AND metadata generation
- Output is always PNG format with RGBA (transparency support)
- Temp files are automatically cleaned up after processing
- **Persistence**: Successfully extracted garments are automatically saved to the authenticated user's wardrobe.

### Body Reference (User Uploaded)

#### `POST /bodies`

Upload a body reference image (selfie) for try-on.

**Authentication**: Required (Bearer token)

**Request** (multipart/form-data):

```
file: <file> (required) - Body image (JPG, PNG, WEBP)
```

**Response** (201 Created):

```json
{
  "message": "Body image uploaded successfully",
  "body": {
    "id": "body_123...",
    "user_id": "user_456...",
    "image_url": "https://s3.amazonaws.com/...",
    "created_at": "2024-12-16T12:00:00Z"
  }
}
```

#### `GET /bodies`

Get all body images for the authenticated user.

**Authentication**: Required (Bearer token)

**Response** (200 OK):

```json
{
  "count": 2,
  "items": [
    {
      "id": "body_123...",
      "user_id": "user_456...",
      "image_url": "https://s3.amazonaws.com/...",
      "created_at": "2024-12-16T12:00:00Z"
    }
  ]
}
```

#### `DELETE /bodies/<id>`

Delete a body reference image for the authenticated user.

**Authentication**: Required (Bearer token)

**Response** (200 OK):

```json
{
  "message": "Body deleted successfully",
  "id": "body_123..."
}
```

**Errors**:

- `401 Unauthorized` - Missing, invalid, or expired access token
- `403 Forbidden` - User does not own the body image
- `404 Not Found` - Body image with the given ID not found

### Get Wardrobe Items

#### `GET /wardrobe/items`

Retrieve all wardrobe items for the authenticated user.

**Authentication**: Required (Bearer token)

**Response** (200 OK):

```json
{
  "count": 5,
  "items": [
    {
      "id": "item_123...",
      "user_id": 1,
      "category": "top",
      "image_url": "https://s3.amazonaws.com/...",
      "name": "Blue Denim Button-Up Shirt",
      "created_at": "2024-12-16T10:00:00Z",
      "description": "Light blue denim shirt with white buttons...",
      "colors": ["light blue", "white"],
      "dominant_color": "light blue",
      "occasion": ["casual", "work"],
      "mood": ["relaxed", "confident"],
      "formality_level": "casual"
    }
  ]
}
```

### Update Wardrobe Item Attributes

#### `POST /wardrobe/items/<id>/attributes`

Manually override or refine AI-generated metadata for a wardrobe item.

**Authentication**: Required (Bearer token)

**Request** (application/json):

```json
{
  "name": "My Favorite Denim Shirt",
  "occasion": ["work", "date_night"],
  "mood": ["confident", "stylish"],
  "formality_level": "business_casual",
  "style_tags": ["go-to", "versatile"]
}
```

**Updatable Fields** (all optional):

- `name`, `description`
- `occasion`, `mood`, `weather_suitability`, `season`
- `formality_level`, `style_tags`
- `colors`, `color_hex`, `dominant_color`, `pattern`, `fabric_type`
- `works_well_with`, `layering_potential`

**Response** (200 OK):

```json
{
  "message": "Attributes updated successfully",
  "item": {
    "id": "item_123...",
    "user_id": "user_456",
    "name": "My Favorite Denim Shirt",
    "category": "top",
    "occasion": ["work", "date_night"],
    "mood": ["confident", "stylish"],
    "formality_level": "business_casual",
    "user_edited": true,
    "user_edits": {
      "fields_changed": ["name", "occasion", "mood", "formality_level"],
      "changed_at": "2024-12-16T11:30:00Z"
    }
  },
  "fields_changed": ["name", "occasion", "mood", "formality_level"]
}
```

**Errors**:

- `400 Bad Request` - No update data provided
- `401 Unauthorized` - Missing or invalid access token
- `404 Not Found` - Item not found or access denied

### Filter Wardrobe Items

#### `GET /wardrobe/filter`

Filter wardrobe items by metadata attributes for context-based outfit selection.

**Authentication**: Required (Bearer token)

**Query Parameters** (all optional):

- `category`: top | bottom | dress | shoes | outerwear | accessory
- `occasion`: work, casual, special_event, sports, weekend, date_night, formal_event, beach, outdoor
- `weather_suitability`: hot, warm, mild, cold, rainy
- `season`: spring, summer, fall, winter
- `mood`: confident, relaxed, bold, elegant, playful, professional, edgy, romantic, casual, sophisticated
- `formality_level`: casual, business_casual, formal, athletic

**cURL Example**:

```bash
curl "http://localhost:5001/wardrobe/filter?category=top&occasion=work&weather_suitability=cold" \
  -H "Authorization: Bearer <token>"
```

**Response** (200 OK):

```json
{
  "count": 3,
  "filters_applied": {
    "category": "top",
    "occasion": "work",
    "weather_suitability": "cold"
  },
  "items": [
    {
      "id": "item_123",
      "name": "Navy Wool Blazer",
      "category": "top",
      "formality_level": "business_casual",
      "occasion": ["work", "formal_event"],
      "weather_suitability": ["cold", "mild"],
      "mood": ["professional", "confident"]
    },
    {
      "id": "item_456",
      "name": "Gray Turtleneck Sweater",
      "category": "top",
      "formality_level": "casual",
      "occasion": ["work", "casual"],
      "weather_suitability": ["cold"],
      "mood": ["relaxed", "sophisticated"]
    }
  ]
}
```

**Errors**:

- `401 Unauthorized` - Missing or invalid access token
- `500 Internal Server Error` - Database query error

**Use Cases**:

- Find outfits for specific occasions ("What can I wear to work?")
- Weather-appropriate clothing ("Show me warm-weather tops")
- Mood-based selection ("I want to look bold today")
- Context-aware outfit building ("Casual weekend outfits for mild weather")

---

## Outfit Suggestions

### Suggest Outfits

#### `POST /suggest`

Generate outfit combinations based on wardrobe item metadata.

**Request** (application/json):

```json
{
  "items": [
    {
      "id": "item_001",
      "garment_type": "top",
      "colors": ["red", "white"],
      "tags": ["casual", "summer"]
    },
    {
      "id": "item_002",
      "garment_type": "bottom",
      "colors": ["blue"],
      "tags": ["denim", "casual"]
    }
  ],
  "context": {
    "weather": "sunny",
    "occasion": "casual",
    "style_pref": "minimalist"
  },
  "limit": 3
}
```

**cURL Example**:

```bash
curl -X POST http://localhost:5001/suggest \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {"id": "1", "garment_type": "top", "colors": ["red"]},
      {"id": "2", "garment_type": "bottom", "colors": ["blue"]}
    ],
    "context": {"occasion": "casual"},
    "limit": 3
  }'
```

**Response** (200 OK) - Phase 6 (Deferred):

```json
{
  "outfits": [
    {
      "items": ["item_001", "item_002", "item_003"],
      "score": 8.5,
      "reason_tags": [
        "color_harmony_complementary",
        "type_compatible",
        "occasion_match"
      ]
    }
  ]
}
```

**Current Response** (501 Not Implemented):

```json
{
  "status": "not_implemented",
  "message": "Outfit suggestion deferred to Phase 6 (post-MVP)",
  "received_items": 2
}
```

---

## Virtual Try-On

### Low-Res Try-On (Preview)

#### `POST /tryon/lowres`

Create a fast low-resolution composite preview.

**Authentication**: Required (Bearer token)

**Mode 1: Multipart File Upload** (backward compatible)

**Request** (multipart/form-data):

```
selfie: <file> (required) - User selfie image
garment: <file> (required) - Garment image
garment_mask: <file> (optional) - Pre-generated mask
garment_type: <string> (optional) - 'top', 'bottom', 'dress', 'shoes', 'accessory'
match_lighting: <boolean> (optional) - Match lighting (default: false)
```

**cURL Example**:

```bash
curl -X POST http://localhost:5001/tryon/lowres \
  -H "Authorization: Bearer <your_access_token>" \
  -F "selfie=@selfie.jpg" \
  -F "garment=@shirt.jpg" \
  -F "garment_mask=@shirt_mask.png" \
  -F "garment_type=top" \
  -F "match_lighting=true"
```

**Mode 2: JSON with IDs** (new)

**Request** (application/json):

```json
{
  "body_id": "body_123",
  "wardrobe_item_ids": ["item_456", "item_789"],
  "options": {
    "output_format": "png_base64",
    "match_lighting": false
  }
}
```

**Request Parameters**:

- `body_id` (string, required): Body reference ID from `/bodies`
- `wardrobe_item_ids` (array, required): 1-4 wardrobe item IDs (order matters - composited in array order)
- `options` (object, optional):
  - `output_format` (string): `"png_base64"` or `"s3_url"` (default: `"png_base64"`)
  - `match_lighting` (boolean): Match garment lighting to body (default: `false`)

**cURL Example (JSON mode)**:

```bash
curl -X POST http://localhost:5001/tryon/lowres \
  -H "Authorization: Bearer <your_access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "body_id": "body_123abc",
    "wardrobe_item_ids": ["item_456def"],
    "options": {
      "output_format": "png_base64",
      "match_lighting": true
    }
  }'
```

**Response** (200 OK):

```json
{
  "composite_png": "base64_encoded_png_data...",
  "quality_hint": "preview",
  "pose_detected": true,
  "warnings": [],
  "processing_time_ms": 2800
}
```

**Response (S3 mode)** (200 OK):

```json
{
  "composite_url": "https://s3.amazonaws.com/bucket/tryon/lowres/abc123.png",
  "composite_key": "tryon/lowres/abc123.png",
  "quality_hint": "preview",
  "pose_detected": true,
  "warnings": [
    "Lighting not matched - enable match_lighting for better quality"
  ],
  "processing_time_ms": 2800
}
```

**Errors**:

- `400 Bad Request` - Missing required fields, invalid IDs, or failed to fetch images
- `401 Unauthorized` - Missing, invalid, or expired access token
- `403 Forbidden` - Body or wardrobe item not owned by user
- `404 Not Found` - Body or wardrobe item not found
- `422 Unprocessable Entity` - Pose detection failed or incompatible pose
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Processing error
- `501 Not Implemented` - Missing dependencies (mediapipe, opencv, rembg)

---

### High-Res Try-On (Gemini API)

#### `POST /tryon/highres`

Create a high-resolution composite using Gemini generative API (async).

**Authentication**: Required (Bearer token)

**Important**: This endpoint requires explicit user opt-in as it sends images to external Gemini API.

**Mode 1: Multipart File Upload** (backward compatible)

**Request** (multipart/form-data):

```
selfie: <file> (required) - User selfie
garment_images[]: <file> (required, multiple) - Garments to composite
prompt_params: <json> (optional) - Additional prompt parameters
```

**cURL Example**:

```bash
curl -X POST http://localhost:5001/tryon/highres \
  -H "Authorization: Bearer <your_access_token>" \
  -F "selfie=@selfie.jpg" \
  -F "garment_images[]=@shirt.jpg" \
  -F "garment_images[]=@pants.jpg"
```

**Mode 2: JSON with IDs** (new)

**Request** (application/json):

```json
{
  "body_id": "body_123",
  "wardrobe_item_ids": ["item_456", "item_789"],
  "gemini_opt_in": true,
  "prompt_params": {
    "style": "realistic",
    "background": "keep_original"
  }
}
```

**Request Parameters**:

- `body_id` (string, required): Body reference ID from `/bodies`
- `wardrobe_item_ids` (array, required): 1-4 wardrobe item IDs (order matters)
- `gemini_opt_in` (boolean, required): Must be `true` - explicit consent for Gemini API
- `prompt_params` (object, optional): Additional Gemini parameters

**cURL Example (JSON mode)**:

```bash
curl -X POST http://localhost:5001/tryon/highres \
  -H "Authorization: Bearer <your_access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "body_id": "body_123abc",
    "wardrobe_item_ids": ["item_456def"],
    "gemini_opt_in": true,
    "prompt_params": {
      "style": "realistic",
      "background": "keep_original"
    }
  }'
```

**Response** (202 Accepted):

```json
{
  "job_id": "job_abc123def456",
  "status": "processing",
  "message": "Job started successfully"
}
```

**Errors**:

- `400 Bad Request` - Missing required fields, invalid IDs, `gemini_opt_in` not true, or failed to fetch images
- `401 Unauthorized` - Missing, invalid, or expired access token
- `403 Forbidden` - Body or wardrobe item not owned by user
- `404 Not Found` - Body or wardrobe item not found
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Failed to start Gemini job

---

### Get Try-On Result

#### `GET /tryon/result/<job_id>`

Poll for high-res try-on job result.

**Authentication**: Required (Bearer token)

**cURL Example**:

```bash
curl http://localhost:5001/tryon/result/job_abc123def456 \
  -H "Authorization: Bearer <your_access_token>"
```

**Response - Processing** (200 OK):

```json
{
  "job_id": "job_abc123def456",
  "status": "processing",
  "progress": 60,
  "message": "Generating composite..."
}
```

**Response - Completed** (200 OK):

```json
{
  "job_id": "job_abc123def456",
  "status": "completed",
  "result_png": "base64_encoded_png_data...",
  "resolution": [1080, 1920],
  "processing_time_ms": 42000
}
```

**Response - Failed** (200 OK):

```json
{
  "job_id": "job_abc123def456",
  "status": "failed",
  "error": "Gemini API timeout",
  "message": "Processing failed after 3 retries"
}
```

**Current Response** (501 Not Implemented):

```json
{
  "status": "not_implemented",
  "message": "Job polling will be implemented in Phase 4",
  "job_id": "job_abc123def456"
}
```

**Errors**:

- `404 Not Found` - Job ID not found or expired (TTL: 1 hour)

**Persistence**: Completed jobs with successful retrieval are automatically saved to the user's try-on history.

### Get Try-On History

#### `GET /tryon/images`

Retrieve all high-resolution try-on results for the authenticated user.

**Authentication**: Required (Bearer token)

**Response** (200 OK):

```json
{
  "count": 2,
  "items": [
    {
      "id": "tryon_123...",
      "job_id": "job_abc...",
      "user_id": 1,
      "image_url": "https://s3.amazonaws.com/...",
      "processing_time_ms": 42000,
      "created_at": "2024-12-16T12:00:00Z"
    }
  ]
}
```

---

## Feedback

### Submit Feedback

#### `POST /feedback`

Submit user feedback for outfit suggestions or try-ons.

**Request** (application/json):

```json
{
  "type": "like" | "dislike",
  "context": {
    "outfit_ids": ["item_001", "item_002"],
    "reason": "Great color combination"
  }
}
```

**cURL Example**:

```bash
curl -X POST http://localhost:5001/feedback \
  -H "Content-Type: application/json" \
  -d '{
    "type": "like",
    "context": {"outfit_ids": ["1", "2"], "reason": "Perfect match"}
  }'
```

**Response** (200 OK):

```json
{
  "status": "ok"
}
```

**Errors**:

- `400 Bad Request` - Invalid feedback type or missing data

---

## File Upload Requirements

### Allowed Formats

- **Extensions**: `.jpg`, `.jpeg`, `.png`, `.webp`
- **MIME Types**: `image/jpeg`
  , `image/png`, `image/webp`

### File Size Limits

- **Default**: 3MB per file
- **Maximum Request Size**: 16MB total (for multiple files)
- **Configurable**: Set `MAX_UPLOAD_SIZE_MB` environment variable

### Validation

All uploaded files are validated for:

1. **Extension** - Must be in allowed list
2. **MIME Type** - Detected using python-magic (not just extension)
3. **File Size** - Within limits
4. **Path Traversal** - Filename sanitized

**Invalid File Response** (400 Bad Request):

```json
{
  "error": "Invalid file",
  "details": [
    "File too large: 4.2MB (max: 3MB)",
    "Invalid MIME type: application/pdf"
  ]
}
```

---

## Error Responses

### Standard Error Format

All errors follow this format:

```json
{
  "error": "<Error Type>",
  "message": "<Human-readable message>",
  "details": [] // Optional array of specific issues
}
```

### Common HTTP Status Codes

| Code | Meaning               | Common Causes                          |
| ---- | --------------------- | -------------------------------------- |
| 200  | OK                    | Request successful                     |
| 202  | Accepted              | Async job created                      |
| 400  | Bad Request           | Invalid input, missing required fields |
| 404  | Not Found             | Endpoint or resource doesn't exist     |
| 413  | Payload Too Large     | File(s) exceed size limit              |
| 429  | Too Many Requests     | Rate limit exceeded                    |
| 500  | Internal Server Error | Server-side processing error           |
| 501  | Not Implemented       | Feature not yet implemented (MVP)      |

---

## Environment Configuration

### Required Variables

```bash
SECRET_KEY=<random-secret-key>  # Required in production
```

### Optional Variables

```bash
# Server
FLASK_ENV=development|production|testing
PORT=5001

# Upload Limits
MAX_UPLOAD_SIZE_MB=3
TEMP_DIR=/tmp/wardrobe_temp
TEMP_FILE_TTL_MINUTES=30

# Rate Limiting
RATE_LIMIT_PER_MINUTE=10
RATE_LIMIT_ENABLED=true

# Models
MODEL_INPUT_SIZE=320
MODEL_CACHE_DIR=models/weights
USE_REMBG=true

# Gemini API (Optional - Phase 4)
GOOGLE_STUDIO_KEY=<your-api-key>
GEMINI_MODEL=gemini-1.5-flash
GEMINI_TIMEOUT_SECONDS=60
GEMINI_JOB_TTL_HOURS=1

# CORS
CORS_ORIGINS=*

# Logging
LOG_LEVEL=INFO|DEBUG|WARNING|ERROR
```

---

## Implementation Phases

### ✅ Phase 1: Foundation (Complete)

- Blueprint architecture
- Ephemeral file management
- Image utilities
- Validation
- Rate limiting
- 85+ tests

### 🔄 Phase 2: Garment Processing (In Progress)

- Segmentation with rembg
- Color extraction
- Thumbnail generation
- **Endpoints**: `/process/segment`, `/process/thumbnail`

### ⏳ Phase 3: Low-Res Try-On (Pending)

- Affine transformations
- Alpha blending
- Exposure compensation
- **Endpoint**: `/tryon/lowres`

### ⏳ Phase 4: High-Res Try-On (Pending)

- Gemini API integration
- Async job management
- Job polling
- **Endpoints**: `/tryon/highres`, `/tryon/result/<job_id>`

### ⏸️ Phase 6: Deferred Features

- Outfit suggestion engine (`/suggest`)
- Advanced analytics
- ONNX optimization

---

## Example Workflows

### Workflow 1: Add Garment to Wardrobe

```bash
# 1. Upload and segment garment
curl -X POST http://localhost:5001/process/segment \
  -F "image=@new_shirt.jpg" \
  -F "type_hint=top"

# Response: mask_png, colors, type
# Client saves mask and metadata locally

# 2. (Optional) Generate thumbnail for multiple items
curl -X POST http://localhost:5001/process/thumbnail \
  -F "images[]=@shirt1.jpg" \
  -F "images[]=@shirt2.jpg" \
  -F "images[]=@pants.jpg"

# Response: thumbnail_png
# Client saves thumbnail locally
```

### Workflow 2: Virtual Try-On (File Upload)

```bash
# 1. Quick preview (low-res)
curl -X POST http://localhost:5001/tryon/lowres \
  -H "Authorization: Bearer <token>" \
  -F "selfie=@selfie.jpg" \
  -F "garment=@shirt.jpg" \
  -F "garment_type=top"

# Response: composite_png (immediate)

# 2. High-quality export (opt-in)
curl -X POST http://localhost:5001/tryon/highres \
  -H "Authorization: Bearer <token>" \
  -F "selfie=@selfie.jpg" \
  -F "garment_images[]=@shirt.jpg"

# Response: { job_id: "abc123", status: "processing" }

# 3. Poll for result
curl http://localhost:5001/tryon/result/abc123 \
  -H "Authorization: Bearer <token>"

# Response (when ready): { status: "completed", result_png: "..." }
```

### Workflow 3: ID-Based Try-On (Recommended)

```bash
# 1. Upload body reference (one-time)
curl -X POST http://localhost:5001/bodies \
  -H "Authorization: Bearer <token>" \
  -F "file=@my_selfie.jpg"

# Response: { body: { id: "body_abc123", image_url: "..." } }

# 2. Add garments to wardrobe (using Gemini extraction)
curl -X POST http://localhost:5001/process/extract \
  -H "Authorization: Bearer <token>" \
  -F "image=@shirt_photo.jpg" \
  -F "type_hint=top"

# Response: { garment_url: "...", ... }
# (Automatically saved to wardrobe)

# 3. List wardrobe items
curl http://localhost:5001/wardrobe/items \
  -H "Authorization: Bearer <token>"

# Response: { items: [{ id: "item_def456", category: "top", ... }] }

# 4. Try-on using IDs (low-res preview)
curl -X POST http://localhost:5001/tryon/lowres \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "body_id": "body_abc123",
    "wardrobe_item_ids": ["item_def456"]
  }'

# Response: { composite_png: "...", pose_detected: true, ... }

# 5. Try-on using IDs (high-res with Gemini)
curl -X POST http://localhost:5001/tryon/highres \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "body_id": "body_abc123",
    "wardrobe_item_ids": ["item_def456", "item_ghi789"],
    "gemini_opt_in": true
  }'

# Response: { job_id: "job_xyz", status: "processing" }

# 6. Poll for result
curl http://localhost:5001/tryon/result/job_xyz \
  -H "Authorization: Bearer <token>"

# Response (when ready): { status: "completed", result_png: "..." }
```

### Workflow 4: Outfit Suggestion

```bash
# Send wardrobe metadata (no images)
curl -X POST http://localhost:5001/suggest \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {"id": "1", "garment_type": "top", "colors": ["red"]},
      {"id": "2", "garment_type": "bottom", "colors": ["blue"]},
      {"id": "3", "garment_type": "shoes", "colors": ["white"]}
    ],
    "context": {"occasion": "casual", "weather": "sunny"},
    "limit": 3
  }'

# Response: ranked outfit combinations
```

---

## Security Considerations

### Implemented

- ✅ File extension validation
- ✅ MIME type verification (python-magic)
- ✅ File size limits
- ✅ Path traversal protection (filename sanitization)
- ✅ Rate limiting per IP
- ✅ CORS configuration
- ✅ Automatic file cleanup (ephemeral storage)

### Recommended for Production

- [ ] Add authentication (API keys or JWT)
- [ ] HTTPS/TLS encryption
- [ ] Input sanitization for JSON payloads
- [ ] Request ID tracking for debugging
- [ ] Structured logging with correlation IDs
- [ ] DDoS protection (Cloudflare, etc.)
- [ ] Network-level restrictions (firewall, VPC)

---

## Support & Troubleshooting

### Common Issues

**"Rate limit exceeded"**

- Wait for `retry_after` seconds
- Reduce request frequency
- Contact admin to increase limit

**"File too large"**

- Compress image before upload
- Check `max_upload_size_mb` in `/health`

**"Invalid MIME type"**

- Ensure file is actual image (not renamed)
- Use allowed formats: JPG, PNG, WEBP

**"Not Implemented (501)"**

- Feature is planned but not yet available
- Check `PROGRESS.md` for implementation timeline

### Getting Help

- Check `/health` endpoint for server status
- Review logs for detailed error messages
- Consult `IMPLEMENTATION_PLAN.md` for feature roadmap
- Open GitHub issue for bugs or feature requests

---

**Last Updated**: December 7, 2024
**API Version**: 1.0.0-mvp
