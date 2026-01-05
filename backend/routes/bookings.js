// Backend Routes - Booking Management
// Файл: backend/routes/bookings.js

const express = require('express');
const router = express.Router();

// Временна база данни в паметта (за демонстрация)
let bookings = [];
let nextId = 1;

/**
 * GET /api/bookings
 * Връща всички резервации
 */
router.get('/', (req, res) => {
  res.json({
    success: true,
    data: bookings,
    count: bookings.length
  });
});

/**
 * GET /api/bookings/:id
 * Връща конкретна резервация по ID
 */
router.get('/:id', (req, res) => {
  const booking = bookings.find(b => b.id === parseInt(req.params.id));
  
  if (!booking) {
    return res.status(404).json({
      success: false,
      message: 'Резервацията не е намерена'
    });
  }
  
  res.json({
    success: true,
    data: booking
  });
});

/**
 * POST /api/bookings
 * Създава нова резервация
 */
router.post('/', (req, res) => {
  const { date, time, guests, name, email, phone } = req.body;
  
  // Валидация
  if (!date || !time || !guests || !name || !email || !phone) {
    return res.status(400).json({
      success: false,
      message: 'Всички полета са задължителни'
    });
  }
  
  // Проверка за валиден брой гости
  if (guests < 1 || guests > 10) {
    return res.status(400).json({
      success: false,
      message: 'Броят гости трябва да е между 1 и 10'
    });
  }
  
  // Създаване на резервация
  const newBooking = {
    id: nextId++,
    date,
    time,
    guests,
    name,
    email,
    phone,
    status: 'confirmed',
    createdAt: new Date().toISOString()
  };
  
  bookings.push(newBooking);
  
  res.status(201).json({
    success: true,
    message: 'Резервацията е създадена успешно',
    data: newBooking
  });
});

/**
 * PUT /api/bookings/:id
 * Актуализира съществуваща резервация
 */
router.put('/:id', (req, res) => {
  const booking = bookings.find(b => b.id === parseInt(req.params.id));
  
  if (!booking) {
    return res.status(404).json({
      success: false,
      message: 'Резервацията не е намерена'
    });
  }
  
  const { date, time, guests, name, email, phone, status } = req.body;
  
  // Актуализация
  if (date) booking.date = date;
  if (time) booking.time = time;
  if (guests) booking.guests = guests;
  if (name) booking.name = name;
  if (email) booking.email = email;
  if (phone) booking.phone = phone;
  if (status) booking.status = status;
  
  booking.updatedAt = new Date().toISOString();
  
  res.json({
    success: true,
    message: 'Резервацията е актуализирана',
    data: booking
  });
});

/**
 * DELETE /api/bookings/:id
 * Изтрива резервация
 */
router.delete('/:id', (req, res) => {
  const index = bookings.findIndex(b => b.id === parseInt(req.params.id));
  
  if (index === -1) {
    return res.status(404).json({
      success: false,
      message: 'Резервацията не е намерена'
    });
  }
  
  bookings.splice(index, 1);
  
  res.json({
    success: true,
    message: 'Резервацията е изтрита успешно'
  });
});

/**
 * GET /api/availability
 * Проверка за свободни маси за дадена дата
 */
router.get('/check/availability', (req, res) => {
  const { date, time } = req.query;
  
  if (!date || !time) {
    return res.status(400).json({
      success: false,
      message: 'Дата и час са задължителни'
    });
  }
  
  // Проверка за заети маси в този час
  const existingBookings = bookings.filter(b => 
    b.date === date && b.time === time && b.status === 'confirmed'
  );
  
  const totalTables = 15;
  const occupiedTables = existingBookings.length;
  const availableTables = totalTables - occupiedTables;
  
  res.json({
    success: true,
    data: {
      date,
      time,
      totalTables,
      occupiedTables,
      availableTables,
      isAvailable: availableTables > 0
    }
  });
});

module.exports = router;
