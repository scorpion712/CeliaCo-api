# Deploy Guide - CeliaCo API

## Prerequisites

- Node.js 18+ instalado
- Docker y Docker Compose (para desarrollo local)
- Cuenta en [Neon](https://neon.tech) (PostgreSQL cloud)
- Cuenta en algún proveedor de hosting (VPS, Railway, Render, etc.)

---

## Opción 1: Desarrollo Local con Neon

### 1. Crear proyecto en Neon

1. Ve a [neon.tech](https://neon.tech) y crea una cuenta
2. Crea un nuevo proyecto: **Create Project**
   - Name: `celiapos`
   - Region: selecciona la más cercana a tu ubicación
3. Una vez creado, ve a **Dashboard** → **Connection Details**
4. Copia la cadena de conexión. Será algo como:
   ```
   postgresql://user:password@ep-xxx.us-east-1.aws.neon.tech/celiapos?sslmode=require
   ```

### 2. Configurar variables de entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
# Database (Neon)
DATABASE_TYPE=postgresql
DATABASE_URL=ep-xxx.us-east-1.aws.neon.tech
DATABASE_PORT=5432
DATABASE_NAME=celiapos
DATABASE_USER=tu_usuario
DATABASE_PASSWORD=tu_password

# JWT
JWT_SECRET=una_clave_secreta_larga_y_segura
JWT_ACCESS_EXPIRATION=1h
JWT_REFRESH_SECRET=otra_clave_secreta
JWT_REFRESH_EXPIRATION=1d

# CORS
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# AFIP
CUIT=27375614060
PtoVta=1

# Firebase (configura las tuyas)
FIREBASE_API_KEY=tu_api_key
FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
FIREBASE_PROJECT_ID=tu_proyecto
FIREBASE_STORAGE_BUCKET=tu_proyecto.firebasestorage.app
FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
FIREBASE_APP_ID=tu_app_id

# Entorno
NODE_ENV=development
PORT=3000
```

### 3. Inicializar la base de datos

Neon crea la base de datos vacía. Ejecuta el script de inicialización:

```bash
# Opción A: Con Docker
docker compose -f docker-compose.postgresql.yml up -d postgres
docker exec -i pos-postgres psql -U postgres -d celiapos < db_scripts_postgres/init.sql

# Opción B: Directo con psql
PGPASSWORD=tu_password psql -h tu_host.neon.tech -U tu_usuario -d celiapos < db_scripts_postgres/init.sql
```

### 4. Iniciar la API

```bash
# Con Docker
docker compose -f docker-compose.postgresql.yml up -d api

# O sin Docker (desarrollo)
npm install
npm run dev
```

---

## Opción 2: Deploy en VPS (DigitalOcean, Hetzner, etc.)

### 1. Preparar el servidor

```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Instalar Docker Compose
sudo apt install docker-compose -y
```

### 2. Subir el proyecto al servidor

```bash
# Opción A: Git clone
git clone https://github.com/tu_usuario/celiapos.git
cd celiapos

# Opción B: SCP (desde tu máquina local)
scp -r ./api user@tu_servidor:/home/user/celiapos
```

### 3. Configurar variables de entorno en producción

En el servidor, crea el archivo `.env`:

```env
DATABASE_TYPE=postgresql
DATABASE_URL=tu_neon_host
DATABASE_PORT=5432
DATABASE_NAME=celiapos
DATABASE_USER=tu_usuario
DATABASE_PASSWORD=tu_password

JWT_SECRET=密码生成工具生成的随机字符串
JWT_ACCESS_EXPIRATION=1h
JWT_REFRESH_SECRET=另一个随机字符串
JWT_REFRESH_EXPIRATION=1d

ALLOWED_ORIGINS=https://tu-dominio.com
NODE_ENV=production
PORT=3000

CUIT=27375614060
PtoVta=1

# Firebase (production)
FIREBASE_API_KEY=xxx
FIREBASE_AUTH_DOMAIN=xxx.firebaseapp.com
FIREBASE_PROJECT_ID=xxx
FIREBASE_STORAGE_BUCKET=xxx.firebasestorage.app
FIREBASE_MESSAGING_SENDER_ID=xxx
FIREBASE_APP_ID=xxx
```

### 4. Configurar Nginx como reverse proxy

```bash
sudo apt install nginx certbot python3-certbot-nginx -y
```

Crea el archivo de configuración:

```bash
sudo nano /etc/nginx/sites-available/celiapos
```

Contenido:

```nginx
server {
    listen 80;
    server_name tu-dominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Habilitar el sitio
sudo ln -s /etc/nginx/sites-available/celiapos /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 5. Configurar SSL con Let's Encrypt

```bash
sudo certbot --nginx -d tu-dominio.com
```

### 6. Iniciar la aplicación

```bash
# Iniciar con Docker
docker compose -f docker-compose.postgresql.yml up -d

# Ver logs
docker compose -f docker-compose.postgresql.yml logs -f
```

### 7. Mantener la app iniciada después de reiniciar (opcional)

Crea un servicio systemd:

```bash
sudo nano /etc/systemd/system/celiapos.service
```

Contenido:

```ini
[Unit]
Description=CeliaCo API
After=network.target

[Service]
Type=oneshot
WorkingDirectory=/home/user/celiapos
ExecStart=/usr/bin/docker compose -f docker-compose.postgresql.yml up -d
ExecStop=/usr/bin/docker compose -f docker-compose.postgresql.yml down
RemainAfterExit=yes

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable celiapos
sudo systemctl start celiapos
```

---

## Opción 3: Deploy en Railway

### 1. Crear proyecto en Railway

1. Ve a [railway.app](https://railway.app) y conecta tu cuenta de GitHub
2. Crea un nuevo proyecto: **New Project** → **Deploy from GitHub repo**
3. Selecciona tu repositorio

### 2. Agregar base de datos Neon

1. En el dashboard de Railway, haz click en **New** → **Database** → **PostgreSQL**
2. O mejor: usa Neon directamente y configura la variable `DATABASE_URL`

### 3. Configurar variables en Railway

En la sección **Variables** del proyecto, agrega:

```
DATABASE_TYPE=postgresql
DATABASE_URL=postgresql://user:password@host.neon.tech/celiapos?sslmode=require
JWT_SECRET=random_string
JWT_ACCESS_EXPIRATION=1h
JWT_REFRESH_SECRET=another_random_string
JWT_REFRESH_EXPIRATION=1d
ALLOWED_ORIGINS=https://tu-proyecto.up.railway.app
NODE_ENV=production
PORT=3000
CUIT=27375614060
PtoVta=1
```

### 4. Deploy

Railway detectará automáticamente el `Dockerfile` y hará el build.

---

## Verificación del deploy

### Prueba la API

```bash
# Health check
curl https://tu-dominio.com/health

# O usando localhost
curl http://localhost:3000/health
```

### Revisar logs

```bash
# Docker
docker logs pos-api

# Railway
railway logs
```

---

## Troubleshooting

### Error de conexión a la base de datos

1. Verifica que la URL de Neon sea correcta
2. Asegúrate de tener `?sslmode=require` al final
3. Verifica que el usuario tenga permisos en Neon Dashboard → **Branches**

### Error de CORS

Edita `ALLOWED_ORIGINS` en tu `.env`:
```env
ALLOWED_ORIGINS=http://localhost:5173,https://tu-dominio.com
```

### La app no inicia

Revisa los logs:
```bash
docker compose logs api
```

---

## Estructura de archivos subidos al repo

```
api/
├── src/                 # Código fuente
├── db_scripts_postgres/ # Scripts de base de datos
├── docker-compose.*.yml # Configuración Docker
├── Dockerfile
├── package.json
├── tsconfig.json
├── .env.example        # Plantilla de variables
└── .gitignore
```

Archivos **no** subidos (en `.gitignore`):
- `.env` (contiene credenciales)
- `node_modules/`
- `dist/`
- `coverage/`
- `.atl/`, `openspec/`