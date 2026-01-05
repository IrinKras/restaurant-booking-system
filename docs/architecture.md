# Архитектура на системата

## Обща архитектура
Системата използва трислойна архитектура:
- **Presentation Layer** (Frontend)
- **Business Logic Layer** (Backend API)
- **Data Layer** (Database)

## Frontend
- Framework: React.js
- UI Library: Material-UI
- State Management: Redux
- API Communication: Axios

## Backend
- Runtime: Node.js
- Framework: Express.js
- Authentication: JWT
- Validation: Joi

## База данни
- СУБД: PostgreSQL
- ORM: Sequelize

## Основни компоненти

### 1. Booking Service
- Управление на резервации
- Проверка за наличност
- Валидация на данни

### 2. Email Service
- Изпращане на потвърждения
- Напомняния

### 3. Admin Service
- CRUD операции за резервации
- Отчети и статистики

## API Endpoints
```
GET    /api/availability?date=YYYY-MM-DD
POST   /api/bookings
GET    /api/bookings/:id
PUT    /api/bookings/:id
DELETE /api/bookings/:id
GET    /api/admin/reports
```
