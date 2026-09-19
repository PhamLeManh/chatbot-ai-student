# Dockerfile cho ứng dụng AI Student Assistant NTU
FROM node:18-alpine

# Tạo thư mục làm việc
WORKDIR /app

# Sao chép package.json và cài đặt dependencies
COPY package*.json ./
RUN npm ci --only=production

# Sao chép mã nguồn
COPY . .

# Tạo thư mục uploads nếu chưa có
RUN mkdir -p uploads

# Khai báo cổng
EXPOSE 5000

# Biến môi trường mặc định
ENV NODE_ENV=production
ENV PORT=5000

# Khởi chạy server
CMD ["node", "server.js"]
