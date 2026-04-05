# ClinicQ Backend Architecture Decision

## RECOMMENDED: Node.js/Express Backend

### Why Node.js over FastAPI:
1. **MongoDB Integration**: Already implemented with proper models
2. **Authentication**: Complete JWT middleware
3. **Real-time**: Socket.IO properly configured
4. **Frontend Compatibility**: Matches expected API patterns
5. **Team Skills**: JavaScript/TypeScript consistency

### Action Required:
1. DELETE the `backend/` (FastAPI) directory
2. Complete missing endpoints in `backend-node/`
3. Update frontend API calls to match Node.js patterns

### Missing Endpoints to Implement:
- GET /api/doctor/me
- PUT /api/users/:id  
- POST /api/admin/verify-clinic
- GET /api/admin/pending-clinics
- PUT /api/clinics/:id (update clinic)
- GET /api/clinics/:id (get single clinic)
- Queue management endpoints
- Emergency request endpoints
