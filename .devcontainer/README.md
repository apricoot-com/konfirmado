# 🐳 Dev Container Setup

Complete development environment with PostgreSQL, Mailhog, and MinIO.

## 🚀 Quick Start

### Prerequisites

1. **Install Docker Desktop**
   - [Windows/Mac](https://www.docker.com/products/docker-desktop)
   - Linux: `sudo apt install docker.io docker-compose`

2. **Install VS Code Extension**
   - Install "Dev Containers" extension
   - Extension ID: `ms-vscode-remote.remote-containers`

### Setup Steps

1. **Open in VS Code**
   ```bash
   code .
   ```

2. **Reopen in Container**
   - VS Code will prompt: "Reopen in Container"
   - Click "Reopen in Container"
   - Or: Press `F1` → "Dev Containers: Reopen in Container"

3. **Wait for Build**
   - First time: ~5-10 minutes (downloads images)
   - Subsequent times: ~30 seconds

4. **Setup Environment**
   ```bash
   # Copy environment file
   cp .env.devcontainer.example .env.local
   
   # Setup database
   pnpm prisma db push
   
   # Start development server
   pnpm dev
   ```

## 📦 What's Included

### Services

| Service | Port | URL | Credentials |
|---------|------|-----|-------------|
| **Next.js App** | 3000 | http://localhost:3000 | - |
| **PostgreSQL** | 5432 | `postgresql://konfirmado:dev_password@db:5432/konfirmado_dev` | konfirmado / dev_password |
| **Mailhog UI** | 8025 | http://localhost:8025 | - |
| **Mailhog SMTP** | 1025 | localhost:1025 | - |
| **MinIO Console** | 9001 | http://localhost:9001 | minioadmin / minioadmin |
| **MinIO API** | 9000 | http://localhost:9000 | - |

### VS Code Extensions (Auto-installed)

- ✅ ESLint
- ✅ Prettier
- ✅ Tailwind CSS IntelliSense
- ✅ Prisma
- ✅ Docker
- ✅ Code Spell Checker

## 🔧 Usage

### Database

```bash
# Run migrations
pnpm prisma db push

# Open Prisma Studio
pnpm prisma studio

# Reset database
pnpm prisma db push --force-reset

# Connect with psql
psql postgresql://konfirmado:dev_password@db:5432/konfirmado_dev
```

### Email Testing (Mailhog)

All emails are caught by Mailhog:

1. Open http://localhost:8025
2. Send an email from your app
3. See it appear in Mailhog UI
4. No emails are actually sent!

**Perfect for testing:**
- Registration emails
- Password reset
- Booking confirmations
- Cancellation notifications

### File Storage (MinIO)

MinIO provides S3-compatible storage:

1. **Console:** http://localhost:9001
   - Login: `minioadmin` / `minioadmin`
   - Browse uploaded files
   - Manage buckets

2. **Bucket:** `konfirmado-uploads` (auto-created)

3. **Upload files:** Works like Vercel Blob
   - Files stored in MinIO
   - Accessible at: `http://localhost:9000/konfirmado-uploads/filename`

## 🛠️ Common Tasks

### Start Development

```bash
pnpm dev
```

### Run Tests

```bash
pnpm test
```

### Build for Production

```bash
pnpm build
```

### Database Commands

```bash
# Generate Prisma Client
pnpm prisma generate

# View data
pnpm prisma studio

# Seed database (if you have a seed script)
pnpm prisma db seed
```

### View Logs

```bash
# View all service logs
docker-compose -f .devcontainer/docker-compose.yml logs

# View specific service
docker-compose -f .devcontainer/docker-compose.yml logs db
docker-compose -f .devcontainer/docker-compose.yml logs mailhog
docker-compose -f .devcontainer/docker-compose.yml logs minio
```

## 🐛 Troubleshooting

### Container won't start

```bash
# Rebuild container
F1 → "Dev Containers: Rebuild Container"

# Or from terminal
docker-compose -f .devcontainer/docker-compose.yml down
docker-compose -f .devcontainer/docker-compose.yml up --build
```

### Database connection issues

```bash
# Check if PostgreSQL is running
docker-compose -f .devcontainer/docker-compose.yml ps

# Check database logs
docker-compose -f .devcontainer/docker-compose.yml logs db

# Restart database
docker-compose -f .devcontainer/docker-compose.yml restart db
```

### Port already in use

```bash
# Find what's using the port
lsof -i :3000
lsof -i :5432

# Kill the process or change ports in docker-compose.yml
```

### Node modules issues

```bash
# Rebuild node_modules
rm -rf node_modules
pnpm install

# Or rebuild container
F1 → "Dev Containers: Rebuild Container"
```

### Mailhog not receiving emails

Check your `.env.local`:
```env
RESEND_API_KEY=""  # Must be empty!
```

Emails only go to Mailhog when `RESEND_API_KEY` is not set.

### MinIO bucket not created

```bash
# Manually create bucket
docker exec -it konfirmado-minio-1 mc mb /data/konfirmado-uploads
docker exec -it konfirmado-minio-1 mc anonymous set public /data/konfirmado-uploads
```

## 🔄 Switching Between Dev Container and Local

### Use Dev Container when:
- ✅ Testing email flows
- ✅ Testing file uploads
- ✅ Working with database
- ✅ Onboarding new developers
- ✅ Ensuring consistent environment

### Use Local when:
- ✅ Quick UI changes
- ✅ Better performance needed
- ✅ Using external services (Vercel Blob, Resend)

### To switch:

**To Local:**
```bash
F1 → "Dev Containers: Reopen Folder Locally"
```

**To Container:**
```bash
F1 → "Dev Containers: Reopen in Container"
```

## 📊 Resource Usage

**First build:**
- Time: ~5-10 minutes
- Disk: ~2GB

**Running:**
- RAM: ~1.5GB
- CPU: Low (idle)

**Subsequent starts:**
- Time: ~30 seconds

## 🔐 Security Notes

⚠️ **Dev Container credentials are for LOCAL DEVELOPMENT ONLY**

- Database password: `dev_password`
- MinIO credentials: `minioadmin` / `minioadmin`
- Secrets: All use "dev-" prefix

**Never use these in production!**

## 🎯 Next Steps

1. ✅ Container is running
2. ✅ Services are accessible
3. ✅ Database is ready
4. ✅ Start coding!

**Happy coding! 🚀**

---

## 📚 Additional Resources

- [VS Code Dev Containers](https://code.visualstudio.com/docs/devcontainers/containers)
- [Docker Compose](https://docs.docker.com/compose/)
- [PostgreSQL](https://www.postgresql.org/docs/)
- [Mailhog](https://github.com/mailhog/MailHog)
- [MinIO](https://min.io/docs/minio/linux/index.html)
