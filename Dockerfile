FROM electronuserland/builder:wine

# Configurar directorio de trabajo
WORKDIR /project

# Copiar archivos del proyecto
COPY package*.json ./
COPY frontend/package*.json ./frontend/
COPY backend/package*.json ./backend/

# Instalar dependencias
RUN npm install
RUN cd frontend && npm install
RUN cd backend && npm install

# Copiar el resto de los archivos
COPY . .

# Construir la aplicación
RUN npm run build

# Generar el ejecutable para Windows
RUN npx electron-builder --win --publish=never

# Crear punto de montaje para extraer archivos
VOLUME ["/project/release"]
