# KUBICO Backend

Plataforma angolana de imóveis — arrendamento e venda.

## Stack
- **FastAPI** + **SQLAlchemy** + **PostgreSQL**
- **Alembic** para migrações
- **JWT** (access + refresh tokens)
- **S3/MinIO/Cloudflare R2** para imagens e vídeos (disco local em dev)
- **ProxyPay/Multicaixa Express** para pagamentos

## Arranque rápido (Docker)

```bash
cp backend/.env.example backend/.env
# editar backend/.env com as tuas chaves

docker-compose up --build
```

API disponível em: http://localhost:8000  
Docs: http://localhost:8000/docs

## Arranque local (sem Docker)

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# Criar base de dados PostgreSQL local
createdb kubico

# Configurar .env
cp .env.example .env

# Aplicar migrações
alembic upgrade head

# Iniciar servidor
uvicorn app.main:app --reload
```

## Estrutura

```
backend/
├── app/
│   ├── api/
│   │   ├── deps.py          # autenticação, dependências
│   │   └── routes/
│   │       ├── admin.py     # moderação admin
│   │       ├── alerts.py    # alertas de pesquisa
│   │       ├── auth.py      # login, registo, refresh
│   │       ├── favorites.py # favoritos
│   │       ├── leads.py     # interesse / contacto
│   │       ├── payments.py  # destaques e plano agente
│   │       ├── properties.py# CRUD imóveis + analytics
│   │       ├── reports.py   # denúncias
│   │       ├── uploads.py   # upload imagens/vídeos
│   │       ├── users.py     # perfil utilizador
│   │       └── verification.py # OTP email/SMS
│   ├── core/
│   │   ├── config.py        # settings via .env
│   │   ├── database.py      # SQLAlchemy engine
│   │   └── security.py      # JWT, hash senha
│   ├── crud/                # operações base de dados
│   ├── models/              # modelos SQLAlchemy
│   ├── schemas/             # schemas Pydantic
│   ├── utils/
│   │   ├── storage.py       # S3 / disco local
│   │   └── whatsapp.py      # link wa.me pré-formatado
│   └── main.py
├── alembic/                 # migrações
├── requirements.txt
├── Dockerfile
└── .env.example
```

## Endpoints principais

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/v1/auth/register` | Criar conta |
| POST | `/api/v1/auth/login` | Login (JWT) |
| GET | `/api/v1/properties/` | Pesquisar imóveis |
| POST | `/api/v1/properties/` | Publicar anúncio |
| GET | `/api/v1/properties/{id}` | Detalhe do imóvel |
| POST | `/api/v1/properties/{id}/interesse` | Mostrar interesse |
| GET | `/api/v1/properties/{id}/whatsapp-link` | Link WhatsApp |
| GET | `/api/v1/properties/{id}/analytics` | Analytics do anúncio |
| POST | `/api/v1/favorites/{id}/toggle` | Favoritar/desfavoritar |
| POST | `/api/v1/payments/destaque` | Comprar destaque |
| POST | `/api/v1/payments/plano-agente` | Subscrever plano agente |
| POST | `/api/v1/uploads/image` | Upload imagem |
| POST | `/api/v1/uploads/video` | Upload vídeo |

## Monetização
- **Destaque 7 dias**: 1 500 AOA
- **Destaque 15 dias**: 2 500 AOA  
- **Destaque 30 dias**: 4 000 AOA
- **Plano Agente mensal**: 8 000 AOA (anúncios ilimitados)

Pagamentos via referência Multicaixa (ProxyPay sandbox incluído).
