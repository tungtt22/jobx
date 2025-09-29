# JobX.vn

A job portal application built with Next.js and MongoDB.

## MongoDB Setup

1. Create a `.env.local` file in the root directory
2. Add your MongoDB connection string:
   ```
   MONGODB_URI=mongodb://localhost:27017/jobxvn
   ```
   For production, use MongoDB Atlas connection string:
   ```
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/jobxvn?retryWrites=true&w=majority
   ```

## Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Structure

### Collections

1. `jobs`
   - `_id`: ObjectId
   - `title`: string
   - `company`: string
   - `location`: string
   - `description`: string
   - `createdAt`: Date
   - `updatedAt`: Date

2. `users`
   - `_id`: ObjectId
   - `email`: string (unique)
   - `name`: string
   - `createdAt`: Date
   - `updatedAt`: Date

### Indexes
- Jobs collection has text indexes on title, company, and description
- Users collection has a unique index on email

## API Routes

### Jobs
- `GET /api/jobs` - Get all jobs (supports pagination and search)
- `POST /api/jobs` - Create a new job
- `PUT /api/jobs/:id` - Update a job
- `DELETE /api/jobs/:id` - Delete a job

### Users
- `GET /api/users/me` - Get current user
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user