# API Endpoints Documentation

## Base URL

- **Development**: `http://localhost:3000/api`
- **Production**: `https://your-domain.com/api`

---

## Authentication Endpoints

### Register User

- **POST** `/auth/register`
- **Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "password123",
    "firstName": "John",
    "lastName": "Doe"
  }
  ```
- **Response**: User object + success message

### Login

- **POST** `/auth/login`
- **Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```
- **Response**: User object + tokens (sets httpOnly cookies)

### Refresh Token

- **POST** `/auth/refresh-token`
- **Cookies Required**: `refreshToken`
- **Response**: New access token (updates cookie)

### Logout

- **POST** `/auth/logout`
- **Response**: Success message (clears cookies)

### Get Current User

- **GET** `/auth/user`
- **Auth Required**: Yes
- **Response**: Current user object

---

## Configuration Endpoints

### Get Google Maps API Key

- **GET** `/config/maps`
- **Response**:
  ```json
  {
    "apiKey": "google-maps-api-key"
  }
  ```

### Get Street View Image

- **GET** `/streetview?address={address}&size={size}`
- **Query Params**:
  - `address` (required): Full address
  - `size` (optional): Image size (default: 400x300)
- **Response**: Image binary

---

## Loan Application Endpoints

### Create Loan Application

- **POST** `/applications`
- **Body**: Loan application data (validated with Zod)
- **Response**: Created application object

### Get All Loan Applications

- **GET** `/applications`
- **Response**: Array of applications

### Get Loan Application by ID

- **GET** `/applications/:id`
- **Response**: Application object

### Update Application Status

- **PATCH** `/applications/:id/status`
- **Body**:
  ```json
  {
    "status": "approved"
  }
  ```
- **Response**: Updated application

### Update Loan Application

- **PATCH** `/applications/:id`
- **Body**: Partial application data
- **Response**: Updated application

---

## Property Endpoints

### ATTOM Search (Property Lookup)

- **GET** `/property/search?address={address}`
- **Query Params**: `address` (required)
- **Response**: ATTOM property data

### ATTOM Radius Search

- **GET** `/property/radius?lat={lat}&lng={lng}&radius={radius}`
- **Query Params**:
  - `lat` (required)
  - `lng` (required)
  - `radius` (optional, default: 1)
  - `minbeds`, `maxbeds`, `propertytype` (optional)
- **Response**: Properties within radius

### Get All Properties

- **GET** `/properties`
- **Response**: Array of all properties

### Get Property by ID

- **GET** `/properties/:id`
- **Response**: Property object

### Update Property

- **PUT** `/properties/:id`
- **Body**: Partial property data
- **Response**: Updated property

### Import Properties from Excel

- **POST** `/properties/import`
- **Body**:
  ```json
  {
    "filePath": "attached_assets/properties.xlsx"
  }
  ```
- **Response**: Import results

### Enrich Properties with ATTOM (Batch)

- **POST** `/properties/enrich`
- **Body**:
  ```json
  {
    "force": false
  }
  ```
- **Response**: Enrichment status

### Enrich Single Property with ATTOM

- **POST** `/properties/:id/enrich`
- **Response**: Updated property with ATTOM data

### Enrich Single Property with Rentcast

- **POST** `/properties/:id/enrich-rentcast`
- **Response**: Updated property with Rentcast data
- **Note**: Limited to 10 properties total

### Enrich Properties with Rentcast (Batch)

- **POST** `/properties/enrich-rentcast-batch`
- **Response**: Batch enrichment status
- **Note**: Respects 10-property limit

---

## Property Listing Endpoints

### Create Listing

- **POST** `/listings`
- **Body**: Listing data
- **Response**: Created listing

### Get All Listings (Marketplace)

- **GET** `/listings`
- **Response**: Array of active listings with property data

### Get My Listings

- **GET** `/listings/my`
- **Response**: User's listings with properties and offers

### Get Listing by ID

- **GET** `/listings/:id`
- **Response**: Listing with property and offers

### Update Listing

- **PATCH** `/listings/:id`
- **Body**: Partial listing data
- **Response**: Updated listing

### Delete Listing

- **DELETE** `/listings/:id`
- **Response**: Success message

---

## Watchlist Endpoints

### Get User Watchlist

- **GET** `/watchlist`
- **Response**: Watchlist items with listings and properties

### Add to Watchlist

- **POST** `/watchlist`
- **Body**:
  ```json
  {
    "listingId": "listing-uuid"
  }
  ```
- **Response**: Created watchlist item

### Remove from Watchlist

- **DELETE** `/watchlist/:listingId`
- **Response**: Success message

### Check if in Watchlist

- **GET** `/watchlist/check/:listingId`
- **Response**:
  ```json
  {
    "isWatched": true
  }
  ```

---

## Offer Endpoints

### Create Offer

- **POST** `/offers`
- **Body**:
  ```json
  {
    "listingId": "listing-uuid",
    "offerAmount": 250000,
    "message": "Interested in purchasing"
  }
  ```
- **Response**: Created offer

### Get My Offers

- **GET** `/offers/my`
- **Response**: User's offers with listings and properties

### Get Offers for Listing

- **GET** `/listings/:listingId/offers`
- **Response**: Array of offers for the listing

### Update Offer

- **PATCH** `/offers/:id`
- **Body**: Partial offer data (e.g., status)
- **Response**: Updated offer

---

## Property Alert Endpoints

### Get All Alerts

- **GET** `/alerts`
- **Response**: User's property alerts

### Create Alert

- **POST** `/alerts`
- **Body**: Alert criteria (validated with Zod)
- **Response**: Created alert

### Get Alert by ID

- **GET** `/alerts/:id`
- **Response**: Alert object

### Update Alert

- **PATCH** `/alerts/:id`
- **Body**: Partial alert data
- **Response**: Updated alert

### Delete Alert

- **DELETE** `/alerts/:id`
- **Response**: 204 No Content

---

## General Notes

### Authentication

- Most endpoints require authentication via JWT cookies
- Access token: 7 days validity
- Refresh token: 30 days validity
- Tokens are httpOnly cookies for security

### Error Responses

All errors follow this format:

```json
{
  "success": false,
  "type": "ERROR_TYPE",
  "error": "Error message"
}
```

### Success Responses

Most endpoints return:

```json
{
  "success": true,
  "message": "Success message",
  "data": { ... }
}
```

### CORS

- Development: Allows localhost:3000, 3001, 5173
- Production: Configure via `ALLOWED_ORIGINS` env variable

### Environment Variables Required

- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Access token secret
- `JWT_REFRESH_SECRET` - Refresh token secret
- `ATTOM_API_KEY` - ATTOM property data API key
- `RENTCAST_API_KEY` - Rentcast API key
- `GOOGLE_MAPS_API_KEY` - Google Maps API key
- `COOKIE_DOMAIN` - Domain for cookies (production only)
- `ALLOWED_ORIGINS` - Comma-separated CORS origins (production)
