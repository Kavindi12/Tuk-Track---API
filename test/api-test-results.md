## Test 1 - Health Check
- Endpoint: GET /health
- Expected: {"status":"ok"}
- Result: PASS 

## Test 2 - Admin Login
- Endpoint: POST /api/auth/login
- Body: {"email":"admin@police.lk","password":"admin123"}
- Expected: 200 with JWT token
- Result: PASS 
