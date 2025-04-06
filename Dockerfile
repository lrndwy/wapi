FROM oven/bun:1-debian

WORKDIR /app

# Install Node.js 20
RUN apt-get update && \
    apt-get install -y curl gnupg && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y \
    nodejs \
    chromium \
    python3 \
    make \
    g++ \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Set environment variables untuk Puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

COPY package*.json ./

# Install dependencies
RUN bun install --production

COPY . .

# Update import di file yang menggunakan bcrypt
RUN find . -type f -name "*.ts" -exec sed -i 's/from "bcrypt"/from "bcryptjs"/g' {} + && \
    find . -type f -name "*.js" -exec sed -i 's/require("bcrypt")/require("bcryptjs")/g' {} +

# Generate Prisma client
RUN bunx prisma generate

# Buat direktori yang diperlukan
RUN mkdir -p .wwebjs_auth .wwebjs_cache whatsapp-sessions

# Set permissions
RUN chown -R 1000:1000 /app

# Gunakan non-root user
USER 1000:1000

CMD ["bun", "run", "dev"]